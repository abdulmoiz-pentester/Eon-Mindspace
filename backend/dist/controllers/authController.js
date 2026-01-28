"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
class AuthController {
    login(req, res, next) {
        passport_1.default.authenticate('saml', {
            failureRedirect: '/login',
        })(req, res, next);
    }
    callback(req, res, next) {
        passport_1.default.authenticate('saml', { failureRedirect: '/' })(req, res, () => {
            // 🔴 THIS REDIRECT IS REQUIRED
            res.redirect('http://localhost:8080/'); // or /dashboard
        });
    }
    logout(req, res) {
        req.logout(err => {
            if (err) {
                return res.status(500).send('Logout error');
            }
            // 🔥 Destroy session completely
            req.session.destroy(() => {
                // 🔥 Clear session cookie
                res.clearCookie('connect.sid');
                // Redirect to frontend or login
                res.redirect('localhost:8080/login');
            });
        });
    }
    dashboard(req, res) {
        if (!req.isAuthenticated || !req.isAuthenticated()) {
            return res.redirect('/');
        }
        res.send(`Hello ${req.user?.nameID}! <a href="/auth/saml/logout">Logout</a>`);
    }
}
exports.default = new AuthController();
