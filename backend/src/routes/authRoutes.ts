import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { requireAuth, optionalAuth } from '../middlewares/authMiddleware';

const router = Router();
const authController = new AuthController();

// IMPORTANT: Since app.ts has app.use('/auth', authRoutes),
// all routes here are automatically prefixed with /auth

// =================== PUBLIC ROUTES ===================
// SAML Login initiation
router.get('/login', (req, res) => authController.login(req, res));

// SAML Callback (Keycloak posts here)
router.post('/saml/callback', (req, res) => authController.samlCallback(req, res));

// SAML Metadata (for Keycloak configuration)
router.get('/metadata', (req, res) => authController.getMetadata(req, res));

// Health check
router.get('/health', (req, res) => authController.health(req, res));

// =================== DEV/DEBUG ROUTES ===================
// Development login (bypass SAML)
router.get('/dev/login', (req, res) => authController.devLogin(req, res));

// =================== PROTECTED ROUTES ===================
// Get current session (requires authentication)
router.get('/session', requireAuth, (req, res) => authController.getSession(req, res));

// Logout (requires authentication)
router.post('/logout', requireAuth, (req, res) => authController.logout(req, res));

// Check auth status (optional auth - returns status)
router.get('/check', optionalAuth, (req, res) => authController.checkAuth(req, res));

export default router;