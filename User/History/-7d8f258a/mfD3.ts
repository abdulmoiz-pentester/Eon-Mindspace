import { Request, Response } from 'express';
import { SAMLService } from '../services/saml.services';
import { SessionService } from '../services/session.services';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import passport from 'passport';
import { samlStrategy } from '../config/passport';

const samlService = new SAMLService();
const sessionService = new SessionService();
const ENABLE_SAML = process.env.ENABLE_SAML === 'true' || process.env.NODE_ENV === 'production';

export class AuthController {
  /**
   * Login endpoint - chooses between SAML and local dev
   */
  async login(req: Request, res: Response) {
    try {
      const returnTo = req.query.returnTo as string || '/chat';
      
      if (ENABLE_SAML && samlStrategy) {
        // SAML login
        console.log('Initiating SAML login');
        req.session.returnTo = returnTo;
        
        // Use passport-saml for authentication
        passport.authenticate('saml', {
          failureRedirect: '/auth/login?error=saml_failed',
          failureFlash: false
        })(req, res);
      } else {
        // Development/local login
        const loginUrl = await samlService.generateLoginRequest(returnTo);
        console.log('Redirecting to development login');
        res.redirect(loginUrl);
      }
    } catch (error) {
      console.error('Login initiation failed:', error);
      res.status(500).json({ 
        error: 'Failed to initiate login',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  /**
   * SAML Callback endpoint
   */
  samlCallback(req: Request, res: Response, next: any) {
    if (!ENABLE_SAML || !samlStrategy) {
      return res.status(400).json({ error: 'SAML authentication is not enabled' });
    }
    
    passport.authenticate('saml', {
      failureRedirect: '/auth/login?error=saml_auth_failed',
      failureFlash: false
    }, (err: any, user: any, info: any) => {
      if (err) {
        console.error('SAML authentication error:', err);
        return res.redirect('/auth/login?error=' + encodeURIComponent(err.message));
      }
      
      if (!user) {
        return res.redirect('/auth/login?error=authentication_failed');
      }
      
      // Log the user in
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error('Login error:', loginErr);
          return res.redirect('/auth/login?error=session_error');
        }
        
        // Also create our own session
        const { token, expiresAt } = sessionService.createSession(user);
        sessionService.setSessionCookie(res, token, expiresAt);
        
        // Set user info cookie for frontend
        res.cookie('user_info', JSON.stringify({
          email: user.email,
          name: user.name,
          company: user.company
        }), {
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          expires: expiresAt
        });
        
        // Redirect to original destination
        const returnTo = req.session.returnTo || '/chat';
        delete req.session.returnTo;
        
        // If frontend is on different domain
        if (process.env.FRONTEND_URL && !returnTo.startsWith('http')) {
          const frontendUrl = process.env.FRONTEND_URL + returnTo;
          return res.redirect(frontendUrl);
        }
        
        res.redirect(returnTo);
      });
    })(req, res, next);
  }
  
  /**
   * SAML Metadata endpoint
   */
  getSamlMetadata(req: Request, res: Response) {
    try {
      if (!ENABLE_SAML || !samlStrategy) {
        return res.status(400).json({ error: 'SAML is not enabled' });
      }
      
      // Generate metadata using passport-saml
      const metadata = samlStrategy.generateServiceProviderMetadata(
        process.env.SAML_PUBLIC_CERT || '',
        process.env.SAML_PUBLIC_CERT || '' // Use same cert for signing and encryption
      );
      
      res.type('application/xml');
      res.send(metadata);
    } catch (error) {
      console.error('Failed to generate metadata:', error);
      res.status(500).json({ error: 'Failed to generate metadata' });
    }
  }
  
  /**
   * Original ACS endpoint (kept for backward compatibility)
   */
  async acs(req: Request, res: Response) {
    try {
      // If SAML is enabled, use the new callback
      if (ENABLE_SAML) {
        return this.samlCallback(req, res, () => {});
      }
      
      // Original implementation for backward compatibility
      const { SAMLResponse, RelayState } = req.body;
      
      if (!SAMLResponse) {
        return res.status(400).json({ error: 'No SAML response provided' });
      }
      
      const userInfo = await samlService.processResponse(SAMLResponse);
      const { token, expiresAt } = sessionService.createSession(userInfo);
      sessionService.setSessionCookie(res, token, expiresAt);
      
      res.cookie('user_info', JSON.stringify({
        email: userInfo.email,
        name: userInfo.name,
        company: userInfo.company
      }), {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: expiresAt
      });
      
      const redirectTo = RelayState || '/chat';
      if (process.env.FRONTEND_URL && !redirectTo.startsWith('http')) {
        const frontendUrl = process.env.FRONTEND_URL + redirectTo;
        return res.redirect(frontendUrl);
      }
      
      res.redirect(redirectTo);
      
    } catch (error) {
      console.error('ACS processing failed:', error);
      const errorMessage = encodeURIComponent(
        error instanceof Error ? error.message : 'Authentication failed'
      );
      
      if (process.env.FRONTEND_URL) {
        res.redirect(`${process.env.FRONTEND_URL}/login?error=${errorMessage}`);
      } else {
        res.status(401).send(`
          <html>
            <body>
              <h1>Authentication Failed</h1>
              <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
              <a href="/auth/sso/login">Try again</a>
            </body>
          </html>
        `);
      }
    }
  }
  
  /**
   * Get current session info
   */
  getSession(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    res.json({
      authenticated: true,
      user: req.user,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Logout - clears session
   */
  logout(req: Request, res: Response) {
    req.logout((err) => {
      if (err) console.error('Logout error:', err);
    });
    
    sessionService.clearSessionCookie(res);
    res.clearCookie('user_info');
    
    // SAML Single Logout if enabled
    if (ENABLE_SAML && samlStrategy) {
      // You can implement SLO here if your IdP supports it
      console.log('SAML logout - session cleared locally');
    }
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  }
  
  /**
   * Get SAML metadata for AWS SSO configuration
   */
  getMetadata(req: Request, res: Response) {
    try {
      if (ENABLE_SAML) {
        return this.getSamlMetadata(req, res);
      }
      
      const metadata = samlService.generateMetadata();
      res.type('application/xml');
      res.send(metadata);
    } catch (error) {
      console.error('Failed to generate metadata:', error);
      res.status(500).json({ error: 'Failed to generate metadata' });
    }
  }
  
  /**
   * Health check endpoint
   */
  health(req: Request, res: Response) {
    res.json({
      status: 'ok',
      service: 'auth',
      timestamp: new Date().toISOString(),
      samlEnabled: ENABLE_SAML
    });
  }
  
  /**
   * Development login (for testing without AWS SSO)
   */
  devLogin(req: Request, res: Response) {
    if (process.env.NODE_ENV !== 'development' && !process.env.ALLOW_DEV_LOGIN) {
      return res.status(403).json({ error: 'Development only endpoint' });
    }
    
    const { email = 'developer@company.com', name = 'Developer' } = req.body;
    
    const mockUserInfo = {
      email,
      name,
      firstName: name.split(' ')[0],
      lastName: name.split(' ').slice(1).join(' '),
      company: 'Development',
      groups: ['developers'],
      samlSessionIndex: 'dev-session-' + Date.now(),
      domain: email.split('@')[1] || 'company.com'
    };
    
    const { token, expiresAt } = sessionService.createSession(mockUserInfo);
    sessionService.setSessionCookie(res, token, expiresAt);
    
    // Also set passport user if SAML is enabled
    if (ENABLE_SAML) {
      req.login(mockUserInfo, (err) => {
        if (err) console.error('Passport dev login error:', err);
      });
    }
    
    res.json({
      success: true,
      message: 'Development login successful',
      user: mockUserInfo
    });
  }
  
  /**
   * Check if user is authenticated
   */
  checkAuth(req: AuthenticatedRequest, res: Response) {
    if (req.user) {
      res.json({
        authenticated: true,
        user: req.user
      });
    } else {
      res.json({
        authenticated: false,
        loginUrl: '/auth/login'
      });
    }
  }
}