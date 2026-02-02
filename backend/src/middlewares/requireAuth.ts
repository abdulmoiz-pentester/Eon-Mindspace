import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Define SamlUser interface locally if not imported
interface SamlUser {
  nameID: string;
  email?: string;
  sessionIndex?: string;
  [key: string]: any;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface User extends SamlUser {}
  }
}

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  console.log('🔐 [DEBUG] requireAuth called');
  console.log('🔐 [DEBUG] Request path:', req.path);
  console.log('🔐 [DEBUG] Cookies:', req.cookies);
  console.log('🔐 [DEBUG] JWT cookie exists:', !!req.cookies.jwt);
  
  const token = req.cookies.jwt;
  
  // If user has JWT, verify it and set user on request
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      (req as any).user = decoded;
      console.log('✅ JWT verified, user authenticated via token');
    } catch (err) {
      console.error('❌ JWT verification failed:', err);
      // Clear invalid JWT cookie
      res.clearCookie('jwt');
    }
  }
  
  // If user is authenticated via session but doesn't have JWT, create one
  if (req.isAuthenticated && req.isAuthenticated() && req.user && !req.cookies.jwt) {
    const user = req.user as SamlUser;
    const newToken = jwt.sign(
      {
        userId: user.nameID,
        email: user.email || user.nameID,
        sessionId: req.sessionID,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    res.cookie('jwt', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });
    console.log('🔐 Auto-generated JWT for session user');
    
    // Also set user on request from session
    (req as any).user = {
      userId: user.nameID,
      email: user.email || user.nameID,
      sessionId: req.sessionID,
    };
  }
  
  next();
};

export default requireAuth;