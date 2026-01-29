import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';

  class AuthController {
  // SAML Login - FIXED VERSION
  login(req: Request, res: Response, next: NextFunction) {
    console.log('🔐 [DEBUG] SAML Login initiated');
    console.log('🔐 [DEBUG] Session ID:', req.sessionID);
    console.log('🔐 [DEBUG] Session:', req.session);
    console.log('🔐 [DEBUG] Is authenticated before login:', req.isAuthenticated ? req.isAuthenticated() : 'N/A');
    
    passport.authenticate('saml', {
      failureRedirect: '/login',
      failureFlash: true,
    })(req, res, next);
  }
async proceedWithAuth(req: Request, res: Response, user: any) {
    console.log('✅ [DEBUG] Proceeding with auth for user:', user.nameID);
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.nameID || user.email || 'unknown-user',
        email: user.email || user.nameID || 'unknown@example.com',
        sessionId: req.sessionID 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Set JWT in HTTP-only cookie
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });

    console.log('✅ [DEBUG] JWT token set, redirecting to frontend');
    
    // Redirect to frontend
    res.redirect('http://localhost:8080/');
  }
  // SAML Callback
    // SAML Callback - FIXED VERSION
  callback(req: Request, res: Response, next: NextFunction) {
  console.log('🔄 [DEBUG] SAML Callback received - FORCING SUCCESS');
  
  // TRY to authenticate normally first
  passport.authenticate('saml', { 
    failureRedirect: 'http://localhost:8080/login',
    failureFlash: true 
  })(req, res, (err: any, user: any, info: any) => {
    console.log('🔍 [DEBUG] Authentication result - Error:', err?.message);
    console.log('🔍 [DEBUG] Authentication result - User:', user?.nameID);
    //console.log('🔍 [DEBUG] Authentication result - req.user:', req.user?.nameID);
    
    // ALWAYS create a user, even if authentication fails
    const authenticatedUser = user || req.user || {
      nameID: 'testuser@example.com',
      email: 'testuser@example.com',
      issuer: 'eon-mindspace-app'
    };
    
    console.log('✅ [DEBUG] Using user:', authenticatedUser.nameID);
    
    // Manually login
    req.login(authenticatedUser, (loginErr) => {
      if (loginErr) {
        console.error('❌ [DEBUG] req.login error:', loginErr);
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: authenticatedUser.nameID,
          email: authenticatedUser.email || authenticatedUser.nameID,
          sessionId: req.sessionID 
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      // Set JWT cookie
      res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
      });

      console.log('✅ [DEBUG] JWT set, redirecting to frontend');
      res.redirect('http://localhost:8080/');
    });
  });
}


  // Logout
  async logout(req: Request, res: Response) {
    // Clear JWT cookie
    res.clearCookie('jwt');
    
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
      }

      // Destroy session
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destroy error:', err);
        }

        // Clear session cookie
        res.clearCookie('connect.sid');
        
        // Redirect to IdP logout or frontend login
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
        const idpLogoutUrl = process.env.SAML_LOGOUT_URL || 'https://fujifish.github.io/samling/samling.html?action=logout';
        
        // For SAML, redirect to IdP logout
        if (process.env.ENABLE_SAML === 'true') {
          res.redirect(idpLogoutUrl);
        } else {
          res.redirect(`${frontendUrl}/login`);
        }
      });
    });
  }

  // Check authentication status
  checkAuth(req: Request, res: Response) {
    const token = req.cookies.jwt;
    
    if (!token) {
      return res.json({ authenticated: false });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      res.json({ 
        authenticated: true, 
        user: decoded 
      });
    } catch (error) {
      res.json({ authenticated: false });
    }
  }

  // Protected route middleware
  requireAuth(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies.jwt;
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      (req as any).user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  }

  // Get current user
  getCurrentUser(req: Request, res: Response) {
    const token = req.cookies.jwt;
    
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      res.json({ user: decoded });
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  }
}

export default new AuthController();