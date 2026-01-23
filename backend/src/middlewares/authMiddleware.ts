import { Request, Response, NextFunction } from 'express';
import { SessionService } from '../services/session.services';

// Create session service instance with fallback
let sessionService: SessionService;

try {
  sessionService = new SessionService();
} catch (error) {
  console.warn('Failed to initialize SessionService:', error);
  // Create mock service
  sessionService = {
    getSessionFromRequest: (req: Request) => {
      // Check for session cookie
      const token = req.cookies?.session_token || req.headers.authorization?.replace('Bearer ', '');
      if (!token) return null;
      
      // In real implementation, validate token and get session data
      // For now, return mock data
      return {
        email: 'test@example.com',
        name: 'Test User',
        company: 'Test Company',
        groups: ['users'],
        domain: 'example.com'
      };
    }
  } as any;
}

const ENABLE_SAML = process.env.ENABLE_SAML === 'true' || process.env.NODE_ENV === 'production';

export interface AuthenticatedRequest extends Request {
  user?: any;
  awsCredentials?: any;
}

/**
 * Authentication Guard - works with both SAML and session-based auth
 */
export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Check Passport authentication first (for SAML)
  if (ENABLE_SAML && (req as any).isAuthenticated && (req as any).isAuthenticated()) {
    req.user = req.user || (req as any).passport?.user;
  }
  
  // Check session cookie (for backward compatibility)
  if (!req.user) {
    const session = sessionService.getSessionFromRequest(req);
    if (session) {
      req.user = {
        email: session.email,
        name: session.name,
        company: session.company,
        groups: session.groups,
        domain: session.domain
      };
    }
  }
  
  if (!req.user) {
    // API requests get 401, web requests get redirect
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(401).json({
        error: 'Authentication required',
        loginUrl: '/auth/login'
      });
    }
    
    // Store the original URL for redirect after login
    const returnTo = encodeURIComponent(req.originalUrl);
    return res.redirect(`/auth/login?returnTo=${returnTo}`);
  }
  
  next();
};

/**
 * Company domain guard - ensures user is from allowed company
 */
export const requireCompanyDomain = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const allowedDomains = process.env.ALLOWED_DOMAINS?.split(',') || ['company.com'];
  const userDomain = req.user.domain || req.user.email?.split('@')[1];
  
  if (!userDomain || !allowedDomains.some(domain => 
    userDomain === domain || userDomain.endsWith(`.${domain}`))) {
    return res.status(403).json({
      error: 'Access denied',
      message: `Domain ${userDomain} is not authorized`
    });
  }
  
  next();
};

/**
 * Optional auth - adds user if exists, but doesn't require it
 */
export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Check Passport authentication first
  if (ENABLE_SAML && (req as any).isAuthenticated && (req as any).isAuthenticated()) {
    req.user = req.user || (req as any).passport?.user;
  }
  
  // Check session cookie
  if (!req.user) {
    const session = sessionService.getSessionFromRequest(req);
    if (session) {
      req.user = {
        email: session.email,
        name: session.name,
        company: session.company,
        groups: session.groups,
        domain: session.domain
      };
    }
  }
  
  next();
};

/**
 * AWS Credentials middleware - gets credentials from session
 */
export const requireAWSCredentials = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Check if AWS credentials are in session (from SAML)
    if (req.user?.awsRoles?.length > 0) {
      // TODO: Implement AWS credentials extraction from SAML roles
      // For now, we'll use the local AWS profile
      console.log('AWS Roles available:', req.user.awsRoles);
    }
    
    // Check if we have AWS credentials in session
    if ((req as any).session?.awsCredentials) {
      req.awsCredentials = (req as any).session.awsCredentials;
      return next();
    }
    
    // For development, use local AWS profile
    if (process.env.NODE_ENV === 'development' && !ENABLE_SAML) {
      // Local AWS credentials will be used by AWS SDK
      return next();
    }
    
    // No AWS credentials available
    res.status(403).json({
      error: 'AWS credentials required',
      message: 'Please authenticate with AWS SSO'
    });
  } catch (error) {
    console.error('AWS credentials error:', error);
    next(error);
  }
};

/**
 * Simple auth check - returns boolean if user is authenticated
 */
export const isAuthenticated = (req: AuthenticatedRequest): boolean => {
  // Check Passport authentication
  if (ENABLE_SAML && (req as any).isAuthenticated && (req as any).isAuthenticated()) {
    return true;
  }
  
  // Check session
  const session = sessionService.getSessionFromRequest(req);
  return !!session;
};