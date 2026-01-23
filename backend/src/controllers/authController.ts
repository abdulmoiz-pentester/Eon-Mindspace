import { Request, Response } from 'express';
import { SAMLService } from '../services/saml.services';
import { SessionService } from '../services/session.services';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import passport from 'passport';
import { samlStrategy } from '../config/passport';

// Create instances
const sessionService = new SessionService();
const ENABLE_SAML = process.env.ENABLE_SAML === 'true' || process.env.NODE_ENV === 'production';

// Mock SAMLService if it doesn't exist yet
let samlService: any;
try {
  const SAMLModule = require('../services/saml.services');
  samlService = new SAMLModule.SAMLService();
} catch (error) {
  samlService = {
    generateLoginRequest: async (returnTo: string) => `/auth/dev/login?returnTo=${returnTo}`,
    processResponse: async (samlResponse: string) => ({
      email: 'test@example.com',
      name: 'Test User',
      company: 'Test Company'
    }),
    generateMetadata: () => '<xml>Metadata</xml>'
  };
}

export class AuthController {
  /**
   * Initiate AWS SSO login
   */
  async login(req: Request, res: Response) {
    try {
      const returnTo = req.query.returnTo as string || '/';
      
      if (ENABLE_SAML && samlStrategy) {
        // SAML login
        console.log('Initiating SAML login');
        (req as any).session = (req as any).session || {};
        (req as any).session.returnTo = returnTo;
        
        passport.authenticate('saml', {
          failureRedirect: '/auth/login?error=saml_failed',
          failureFlash: false
        })(req, res);
      } else {
        // Development/local login
        const loginUrl = await samlService.generateLoginRequest(returnTo);
        console.log('Redirecting to:', loginUrl);
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
      
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error('Login error:', loginErr);
          return res.redirect('/auth/login?error=session_error');
        }
        
        // Create session
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
        const returnTo = (req as any).session?.returnTo || '/chat';
        if ((req as any).session) {
          delete (req as any).session.returnTo;
        }
        
        if (process.env.FRONTEND_URL && !returnTo.startsWith('http')) {
          const frontendUrl = process.env.FRONTEND_URL + returnTo;
          return res.redirect(frontendUrl);
        }
        
        res.redirect(returnTo);
      });
    })(req, res, next);
  }
  
  /**
   * Original ACS endpoint (backward compatibility)
   */
  async acs(req: Request, res: Response) {
    try {
      if (ENABLE_SAML) {
        return this.samlCallback(req, res, () => {});
      }
      
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
              <a href="/auth/login">Try again</a>
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
    if ((req as any).logout) {
      (req as any).logout((err: any) => {
        if (err) console.error('Passport logout error:', err);
      });
    }
    
    sessionService.clearSessionCookie(res);
    res.clearCookie('user_info');
    
    if ((req as any).session) {
      (req as any).session.destroy((err: any) => {
        if (err) console.error('Session destruction error:', err);
      });
    }
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  }
  
  /**
   * Get SAML metadata
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
   * SAML Metadata endpoint
   */
  getSamlMetadata(req: Request, res: Response) {
    try {
      if (!ENABLE_SAML || !samlStrategy) {
        return res.status(400).json({ error: 'SAML is not enabled' });
      }
      
      const metadata = samlStrategy.generateServiceProviderMetadata(
        process.env.SAML_PUBLIC_CERT || '',
        process.env.SAML_PUBLIC_CERT || ''
      );
      
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
    
    const { email = 'developer@company.com', name = 'Developer', returnTo = '/chat' } = req.query;
    
    const mockUserInfo = {
      email: email as string,
      name: name as string,
      firstName: (name as string).split(' ')[0],
      lastName: (name as string).split(' ').slice(1).join(' '),
      company: 'Development',
      groups: ['developers'],
      samlSessionIndex: 'dev-session-' + Date.now(),
      domain: (email as string).split('@')[1] || 'company.com'
    };
    
    const { token, expiresAt } = sessionService.createSession(mockUserInfo);
    sessionService.setSessionCookie(res, token, expiresAt);
    
    if (ENABLE_SAML && (req as any).login) {
      (req as any).login(mockUserInfo, (err: any) => {
        if (err) console.error('Passport dev login error:', err);
      });
    }
    
    const redirectUrl = returnTo as string;
    if (process.env.FRONTEND_URL && !redirectUrl.startsWith('http')) {
      const frontendUrl = process.env.FRONTEND_URL + redirectUrl;
      return res.redirect(frontendUrl);
    }
    
    res.redirect(redirectUrl);
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


export default AuthController;