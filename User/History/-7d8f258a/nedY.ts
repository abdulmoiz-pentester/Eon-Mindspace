import { Request, Response } from 'express';
import { SAMLService } from '../services/saml.services';
import { SessionService } from '../services/session.services';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const samlService = new SAMLService();
const sessionService = new SessionService();

export class AuthController {
  /**
   * Initiate AWS SSO login
   * Redirects user to AWS SSO login page
   */
  async login(req: Request, res: Response) {
    try {
      const returnTo = req.query.returnTo as string || '/chat';
      const loginUrl = await samlService.generateLoginRequest(returnTo);
      
      console.log('Redirecting to AWS SSO:', loginUrl);
      res.redirect(loginUrl);
    } catch (error) {
      console.error('Login initiation failed:', error);
      res.status(500).json({ 
        error: 'Failed to initiate login',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  /**
   * Assertion Consumer Service (ACS)
   * AWS SSO redirects here after successful login
   */
  async acs(req: Request, res: Response) {
    try {
      const { SAMLResponse, RelayState } = req.body;
      
      if (!SAMLResponse) {
        return res.status(400).json({ error: 'No SAML response provided' });
      }
      
      // Process SAML response
      const userInfo = await samlService.processResponse(SAMLResponse);
      
      // Create session
      const { token, expiresAt } = sessionService.createSession(userInfo);
      
      // Set session cookie
      sessionService.setSessionCookie(res, token, expiresAt);
      
      // Also set a non-httpOnly cookie for frontend (optional)
      res.cookie('user_info', JSON.stringify({
        email: userInfo.email,
        name: userInfo.name,
        company: userInfo.company
      }), {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: expiresAt
      });
      
      // Redirect to original destination or chat
      const redirectTo = RelayState || '/chat';
      
      // If frontend is on different domain, redirect there
      if (process.env.FRONTEND_URL && !redirectTo.startsWith('http')) {
        const frontendUrl = process.env.FRONTEND_URL + redirectTo;
        return res.redirect(frontendUrl);
      }
      
      res.redirect(redirectTo);
      
    } catch (error) {
      console.error('ACS processing failed:', error);
      
      // Redirect to error page or login
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
    sessionService.clearSessionCookie(res);
    res.clearCookie('user_info');
    
    // TODO: Implement SAML Single Logout if needed
    // For now, just redirect to login
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
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Development login (for testing without AWS SSO)
   */
  devLogin(req: Request, res: Response) {
    if (process.env.NODE_ENV !== 'development') {
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
    
    res.json({
      success: true,
      message: 'Development login successful',
      user: mockUserInfo
    });
  }
}