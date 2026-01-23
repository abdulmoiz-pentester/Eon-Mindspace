import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { optionalAuth } from '../middlewares/authMiddleware';

const router = Router();
const authController = new AuthController();

// SAML endpoints
router.get('/sso/login', authController.login.bind(authController));
router.post('/sso/acs', authController.acs.bind(authController));
router.get('/sso/metadata', authController.getMetadata.bind(authController));
router.post('/sso/logout', authController.logout.bind(authController));

// Session management
router.get('/session', optionalAuth, authController.getSession.bind(authController));

// Health check
router.get('/health', authController.health.bind(authController));

// Development endpoints
router.post('/dev/login', authController.devLogin.bind(authController));

export default router;