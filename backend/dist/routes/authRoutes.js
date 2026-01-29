"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = __importDefault(require("../controllers/authController"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = (0, express_1.Router)();
// SAML Routes
router.get('/saml/login', authController_1.default.login);
router.post('/saml/callback', authController_1.default.callback);
router.post('/saml/logout', authController_1.default.logout);
// Auth Check Routes
router.get('/check', authController_1.default.checkAuth);
router.get('/user', authController_1.default.getCurrentUser);
// Development login (for testing without SAML)
router.get('/dev/login', (req, res) => {
    // For development/testing only
    const token = jsonwebtoken_1.default.sign({
        userId: 'dev-user',
        email: 'dev@example.com',
        sessionId: 'dev-session'
    }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
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
exports.default = router;
