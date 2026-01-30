import { Router } from 'express';
import authController, { AuthRequest } from '../controllers/authController';
import jwt from 'jsonwebtoken';

const router = Router();

// ==================== Unprotected SAML Routes ====================
router.get('/saml/login', (req, res, next) => authController.login(req as AuthRequest, res, next));
router.post('/saml/callback', (req, res, next) => authController.callback(req as AuthRequest, res, next));
router.get('/saml/logout', (req, res) =>
authController.logout(req as AuthRequest, res)
);


// ==================== Unprotected Dev Routes ====================
router.get('/dev/login', (req, res) => {
  const token = jwt.sign(
    { userId: 'dev-user', email: 'dev@example.com', sessionId: 'dev-session' },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );

  res.cookie('jwt', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  });

  const returnTo = req.query.returnTo || '/';
  res.redirect(`http://localhost:8081${returnTo}`);
});

router.post('/dev/logout', (req, res) => {
  res.clearCookie('jwt');
  res.clearCookie('connect.sid');
  res.redirect('http://localhost:8081/login');
});

// ==================== Protected Routes ====================
router.use(authController.requireAuth);

router.get('/check', (req, res) => authController.checkAuth(req as any, res));
router.get('/user', (req, res) => authController.getCurrentUser(req as any, res));



export default router;
