import { Request, Response, NextFunction } from 'express';
import { SessionService } from '../services/session.services';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { SAMLService } from '../services/saml.services';


// Create instances
const sessionService = new SessionService();
const samlService = new SAMLService(); // Create instance of SAMLService
const ENABLE_SAML = process.env.ENABLE_SAML === 'true';

// Add TypeScript declaration for session
declare module 'express-session' {
  interface SessionData {
    returnTo?: string;
  }
}

// Add TypeScript declaration for session
declare module 'express-session' {
  interface SessionData {
    returnTo?: string;
  }
}

export class AuthController {
  /**
   * Initiate SAML login - FIXED VERSION
   */
 async login(req: Request, res: Response) {
  try {
    console.log('=== LOGIN REQUEST ===');
    
    const returnTo = (req.query.returnTo as string) || '/';
    
    if (ENABLE_SAML) {
      console.log('🔐 Initiating SAML login to Keycloak');
      
      // Store returnTo in session
      if (req.session) {
        req.session.returnTo = returnTo;
      }
      
      // Use SAMLService to generate proper SAML login URL
      const loginUrl = await samlService.generateLoginUrl(returnTo);
      
      console.log('✅ Generated SAML login URL');
      console.log('Redirecting to Keycloak');
      
      return res.redirect(loginUrl);
      
    } else {
      console.log('🔧 SAML not available, using dev login');
      return res.redirect(`/auth/dev/login?returnTo=${encodeURIComponent(returnTo)}`);
    }
  } catch (error) {
    console.error('❌ Login initiation failed:', error);
    res.status(500).json({ 
      error: 'Failed to initiate login',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
  /**
   * SAML Callback endpoint - FIXED VERSION
   */
  async samlCallback(req: Request, res: Response) {
  try {
    console.log('=== SAML CALLBACK ===');
    console.log('Method:', req.method);
    console.log('Body:', req.body);
    
    if (!ENABLE_SAML) {
      console.error('❌ SAML not enabled');
      return res.status(400).json({ error: 'SAML authentication is not enabled' });
    }
    
    const { SAMLResponse, RelayState } = req.body;
    
    if (!SAMLResponse) {
      console.error('❌ No SAMLResponse in request body');
      return res.status(400).json({ error: 'No SAML response provided' });
    }
    
    console.log('📥 Processing SAML response from Keycloak...');
    
    // Process SAML response using SAMLService
    const samlUser = await samlService.processResponse(SAMLResponse, RelayState);
    
    // Extract user information from SAML response
    const userInfo = this.extractUserInfo(samlUser);
    
    console.log('✅ SAML authentication successful for:', userInfo.email);
    
    // Create session token
    const { token, expiresAt } = sessionService.createSession(userInfo);
    
    // Set session cookie
    sessionService.setSessionCookie(res, token, expiresAt);
    
    // Set user info cookie for frontend
    res.cookie('user_info', JSON.stringify({
      email: userInfo.email,
      name: userInfo.name,
      firstName: userInfo.firstName,
      lastName: userInfo.lastName,
      company: userInfo.company
    }), {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      httpOnly: false
    });
    
    // Determine where to redirect
    let redirectTo = '/';
    
    // Priority: 1. RelayState from SAML response, 2. session.returnTo
    if (RelayState) {
      redirectTo = RelayState;
      console.log('📌 Using RelayState from SAML response:', redirectTo);
    } else if (req.session?.returnTo) {
      redirectTo = req.session.returnTo;
      console.log('📌 Using returnTo from session:', redirectTo);
      delete req.session.returnTo;
    }
    
    console.log('🔀 Final redirect to:', redirectTo);
    
    // Redirect to frontend or directly
    const frontendUrl = process.env.FRONTEND_URL;
    if (frontendUrl && !redirectTo.startsWith('http')) {
      const normalizedPath = redirectTo.startsWith('/') ? redirectTo : `/${redirectTo}`;
      const finalUrl = `${frontendUrl}${normalizedPath}`;
      console.log('🚀 Redirecting to frontend:', finalUrl);
      return res.redirect(finalUrl);
    }
    
    return res.redirect(redirectTo);
    
  } catch (error) {
    console.error('❌ SAML callback failed:', error);
    const errorMsg = encodeURIComponent(
      error instanceof Error ? error.message : 'Authentication failed'
    );
    return res.redirect(`/auth/login?error=${errorMsg}`);
  }
}

/**
 * Extract user information from SAML response
 */
private extractUserInfo(samlUser: any): any {
  console.log('Raw SAML user:', JSON.stringify(samlUser, null, 2));
  
  // SAML2-JS returns user info in samlUser.user
  const user = samlUser.user || {};
  const attributes = user.attributes || {};
  
  // Extract email
  const email = user.name_id || 
               attributes.email || 
               attributes.mail ||
               attributes['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ||
               'unknown@example.com';
  
  // Extract name
  const name = attributes.name ||
              attributes.displayName ||
              attributes['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
              email.split('@')[0];
  
  // Extract first and last names
  const firstName = attributes.firstName ||
                   attributes.givenName ||
                   attributes['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'] ||
                   name.split(' ')[0];
  
  const lastName = attributes.lastName ||
                  attributes.sn ||
                  attributes['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'] ||
                  name.split(' ').slice(1).join(' ') ||
                  '';
  
  return {
    id: user.name_id || `saml-${Date.now()}`,
    email,
    name,
    firstName,
    lastName,
    company: this.extractCompanyFromEmail(email),
    groups: attributes.groups || [],
    sessionIndex: user.session_index || ''
  };
}

/**
 * Extract company name from email domain
 */
private extractCompanyFromEmail(email: string): string {
  const domain = email.split('@')[1] || '';
  const domainParts = domain.split('.');
  
  if (domainParts.length >= 2) {
    return domainParts[domainParts.length - 2]
      .charAt(0).toUpperCase() + 
      domainParts[domainParts.length - 2].slice(1);
  }
  
  return domain || 'Eon Health';
}
  
  /**
   * Get SAML metadata
   */
 getMetadata(req: Request, res: Response) {
  try {
    console.log('=== METADATA REQUEST ===');
    
    if (!ENABLE_SAML) {
      return res.status(400).json({ error: 'SAML is not enabled' });
    }
    
    console.log('📋 Generating SAML metadata for Keycloak...');
    
    // Use SAMLService to generate metadata
    const metadata = samlService.generateMetadata();
    
    console.log('✅ Metadata generated successfully');
    
    res.type('application/xml');
    res.setHeader('Content-Disposition', 'inline; filename="metadata.xml"');
    res.send(metadata);
    
  } catch (error) {
    console.error('❌ Failed to generate metadata:', error);
    res.status(500).json({ 
      error: 'Failed to generate metadata',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
  
  /**
   * Development login
   */
  devLogin(req: Request, res: Response) {
    console.log('=== DEV LOGIN ===');
    
    const allowDev = process.env.ALLOW_DEV_LOGIN === 'true' || 
                    process.env.NODE_ENV === 'development';
    
    if (!allowDev) {
      return res.status(403).json({ error: 'Development only endpoint' });
    }
    
    const email = req.query.email as string || 'developer@eonhealth.com';
    const name = req.query.name as string || 'Developer';
    const returnTo = req.query.returnTo as string || '/';
    
    console.log('Dev login with:', { email, name, returnTo });
    
    const mockUserInfo = {
      id: `dev-${Date.now()}`,
      email: email,
      name: name,
      firstName: name.split(' ')[0],
      lastName: name.split(' ').slice(1).join(' ') || '',
      company: 'Eon Health',
      groups: ['developers'],
      domain: email.split('@')[1] || 'eonhealth.com'
    };
    
    // Create session
    const { token, expiresAt } = sessionService.createSession(mockUserInfo);
    sessionService.setSessionCookie(res, token, expiresAt);
    
    // Set user info cookie
    res.cookie('user_info', JSON.stringify({
      email: mockUserInfo.email,
      name: mockUserInfo.name,
      firstName: mockUserInfo.firstName,
      lastName: mockUserInfo.lastName,
      company: mockUserInfo.company
    }), {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      httpOnly: false
    });
    
    console.log('✅ Dev session created for:', email);
    
    // Redirect
    const frontendUrl = process.env.FRONTEND_URL;
    if (frontendUrl && !returnTo.startsWith('http')) {
      const finalUrl = `${frontendUrl}${returnTo.startsWith('/') ? returnTo : '/' + returnTo}`;
      return res.redirect(finalUrl);
    }
    
    res.redirect(returnTo);
  }
  
  /**
   * Get current session info
   */
  getSession(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ 
        authenticated: false,
        message: 'Not authenticated' 
      });
    }
    
    res.json({
      authenticated: true,
      user: req.user,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Logout
   */
  logout(req: Request, res: Response) {
    console.log('=== LOGOUT ===');
    
    // Clear cookies
    sessionService.clearSessionCookie(res);
    res.clearCookie('user_info');
    
    // Passport logout
    req.logout((err) => {
      if (err) console.error('Logout error:', err);
    });
    
    // Destroy session
    if (req.session) {
      req.session.destroy((err) => {
        if (err) console.error('Session destruction error:', err);
      });
    }
    
    console.log('✅ Logout successful');
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  }
  
  /**
   * Health check
   */
  health(req: Request, res: Response) {
    res.json({
      status: 'ok',
      samlEnabled: ENABLE_SAML,
      samlConfigured: !!process.env.SAML_ENTRY_POINT,
      environment: process.env.NODE_ENV
    });
  }
  
  /**
   * Check auth status
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