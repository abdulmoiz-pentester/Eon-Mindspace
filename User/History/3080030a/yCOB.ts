import { Request, Response, NextFunction } from 'express';
import { SessionService } from '../services/session.services';

const sessionService = new SessionService();

export interface AuthenticatedRequest extends Request {
  user?: any;
}

/**
 * AWS SSO Authentication Guard
 * Protects routes that require authentication
 */
export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const session = sessionService.getSessionFromRequest(req);
  
  if (!session) {
    // API requests get 401, web requests get redirect
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(401).json({
        error: 'Authentication required',
        loginUrl: '/auth/sso/login'
      });
    }
    
    // Store the original URL for redirect after login
    const returnTo = encodeURIComponent(req.originalUrl);
    return res.redirect(`/auth/sso/login?returnTo=${returnTo}`);
  }
  
  // Add user info to request
  req.user = {
    email: session.email,
    name: session.name,
    company: session.company,
    groups: session.groups,
    domain: session.domain
  };
  
  next();
};

/**
 * Optional auth - adds user if exists, but doesn't require it
 */
export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
  
  next();
};

/**
 * Company domain guard - ensures user is from allowed company
 */
export const requireCompanyDomain = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // In production, this would check against configured domains
  const allowedDomains = process.env.ALLOWED_DOMAINS?.split(',') || ['company.com'];
  const userDomain = req.user.domain;
  
  if (!allowedDomains.some(domain => userDomain === domain || userDomain.endsWith(`.${domain}`))) {
    return res.status(403).json({
      error: 'Access denied',
      message: `Domain ${userDomain} is not authorized`
    });
  }
  
  next();
};