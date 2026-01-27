"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
const authController = new authController_1.AuthController();
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
router.get('/session', authMiddleware_1.requireAuth, (req, res) => authController.getSession(req, res));
// Logout (requires authentication)
router.post('/logout', authMiddleware_1.requireAuth, (req, res) => authController.logout(req, res));
// Check auth status (optional auth - returns status)
router.get('/check', authMiddleware_1.optionalAuth, (req, res) => authController.checkAuth(req, res));
exports.default = router;
