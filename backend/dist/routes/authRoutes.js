"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
const authController = new authController_1.AuthController();
// Public routes
router.get('/login', (req, res) => authController.login(req, res));
router.post('/acs', (req, res) => authController.acs(req, res));
router.get('/metadata', (req, res) => authController.getMetadata(req, res));
router.get('/health', (req, res) => authController.health(req, res));
// SAML-specific routes
router.post('/saml/callback', (req, res, next) => authController.samlCallback(req, res, next));
router.get('/saml/metadata', (req, res) => authController.getSamlMetadata(req, res));
// Development routes
router.post('/dev/login', (req, res) => authController.devLogin(req, res));
router.get('/dev/login', (req, res) => authController.devLogin(req, res));
// Protected routes
router.get('/session', authMiddleware_1.requireAuth, (req, res) => authController.getSession(req, res));
router.post('/logout', authMiddleware_1.requireAuth, (req, res) => authController.logout(req, res));
router.get('/check', authMiddleware_1.optionalAuth, (req, res) => authController.checkAuth(req, res));
exports.default = router;
