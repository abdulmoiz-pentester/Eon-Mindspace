import { Router } from 'express';
import authController from '../controllers/authController';
import jwt from 'jsonwebtoken';

const router = Router();

// SAML Routes
router.get('/saml/login', authController.login);
router.post('/saml/callback', authController.callback);
router.post('/saml/logout', authController.logout);

// Auth Check Routes
router.get('/check', authController.checkAuth);
router.get('/user', authController.getCurrentUser);

// Development login (for testing without SAML)
router.get('/dev/login', (req, res) => {
  // For development/testing only
  const token = jwt.sign(
    { 
      userId: 'dev-user',
      email: 'dev@example.com',
      sessionId: 'dev-session'
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );

  res.cookie('jwt', token, {
    httpOnly: true,
    secure: false, // false for dev
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  });

  const returnTo = req.query.returnTo || '/';
  res.redirect(`http://localhost:8080${returnTo}`);
});

// Dev logout
router.post('/dev/logout', (req, res) => {
  res.clearCookie('jwt');
  res.clearCookie('connect.sid');
  res.redirect('http://localhost:8080/login');
});


export default router;