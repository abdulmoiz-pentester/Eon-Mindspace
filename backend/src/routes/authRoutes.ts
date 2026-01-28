import { Router } from 'express';
import authController from '../controllers/authController';

const router = Router();

router.get('/saml/login', authController.login);
router.post('/saml/callback', authController.callback);
router.post('/saml/logout', authController.logout);
router.get("/me", (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ authenticated: false });
  }

  res.json({
    authenticated: true,
    user: req.user,
  });
});

export default router;
