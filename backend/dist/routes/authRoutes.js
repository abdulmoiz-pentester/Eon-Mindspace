"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = __importDefault(require("../controllers/authController"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = (0, express_1.Router)();
// ==================== Unprotected SAML Routes ====================
router.get('/saml/login', (req, res, next) => authController_1.default.login(req, res, next));
router.post('/saml/callback', (req, res, next) => authController_1.default.callback(req, res, next));
router.get('/saml/logout', (req, res) => authController_1.default.logout(req, res));
// ==================== Development Routes ====================
router.get('/dev/login', (req, res) => {
    const token = jsonwebtoken_1.default.sign({ userId: 'dev-user', email: 'dev@example.com', sessionId: 'dev-session' }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
    res.cookie('jwt', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
    });
    const returnTo = req.query.returnTo || '/';
    res.redirect(`${process.env.FRONTEND_URL}${returnTo}`);
});
router.post('/dev/logout', (req, res) => {
    res.clearCookie('jwt');
    res.clearCookie('connect.sid');
    res.redirect(`${process.env.FRONTEND_URL}/login`);
});
// ==================== Protected Routes ====================
router.use(authController_1.default.requireAuth);
router.get('/check', (req, res) => authController_1.default.checkAuth(req, res));
router.get('/user', (req, res) => authController_1.default.getCurrentUser(req, res));
exports.default = router;
