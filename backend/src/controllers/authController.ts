import { Request, Response, NextFunction } from 'express';
import passport from 'passport';

class AuthController {
  login(req: Request, res: Response, next: NextFunction) {
    passport.authenticate('saml', {
      failureRedirect: '/login',
    })(req, res, next);
  }

 callback(req: Request, res: Response, next: NextFunction) {
  passport.authenticate('saml', { failureRedirect: '/' })(
    req,
    res,
    () => {
      // 🔴 THIS REDIRECT IS REQUIRED
      res.redirect('http://localhost:8080/'); // or /dashboard
    }
  );
}

  logout(req: Request, res: Response) {
  req.logout(err => {
    if (err) {
      return res.status(500).send('Logout error');
    }

    // 🔥 Destroy session completely
    req.session.destroy(() => {
      // 🔥 Clear session cookie
      res.clearCookie('connect.sid');

      // Redirect to frontend or login
      res.redirect('localhost:8080/login');
    });
  });
}

  dashboard(req: Request, res: Response) {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.redirect('/');
    }
    res.send(`Hello ${(req.user as any)?.nameID}! <a href="/auth/saml/logout">Logout</a>`);
  }
}

export default new AuthController();
