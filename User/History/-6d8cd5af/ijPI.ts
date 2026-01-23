import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { requireAuth, optionalAuth } from '../middlewares/authMiddleware';

const router = Router();
const authController = new AuthController();

// Public routes
router.get('/login', (req, res) => authController.login(req, res));
router.post('/acs', (req, res) => authController.acs(req, res));
router.get('/metadata', (req, res) => authController.getMetadata(req, res));
router.get('/health', (req, res) => authController.health(req, res));

// SAML-specific routes
router.post('/saml/callback', (req, res, next) => authController.samlCallback(req, res, next));
router.get('/saml/metadata', (req, res) => authController.getSamlMetadata(req, res));

// Development routes
router.post('/auth/dev/login', (req, res) => authController.devLogin(req, res));

// Protected routes
router.get('/session', requireAuth, (req, res) => authController.getSession(req, res));
router.post('/logout', requireAuth, (req, res) => authController.logout(req, res));
router.get('/check', optionalAuth, (req, res) => authController.checkAuth(req, res));

export default router;