"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class AuthController {
    // ==================== LOGIN ====================
    async login(req, res, next) {
        console.log('🔐 Login endpoint called');
        // If user already has valid JWT, redirect to frontend
        const token = req.cookies.jwt;
        if (token) {
            try {
                jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                console.log('✅ User already has valid JWT, redirecting to /');
                return res.redirect(process.env.FRONTEND_URL);
            }
            catch (error) {
                console.log('⚠️ Invalid JWT, proceeding with SAML');
            }
        }
        // Start SAML authentication
        passport_1.default.authenticate('saml', {
            failureRedirect: '/login-failed',
        })(req, res, next);
    }
    // ==================== CALLBACK ====================
    callback(req, res, next) {
        console.log('🔐 SAML callback received');
        passport_1.default.authenticate('saml', {
            failureRedirect: `${process.env.FRONTEND_URL}/login`
        })(req, res, async () => {
            if (!req.user) {
                console.error('❌ No user after SAML auth');
                return res.redirect(`${process.env.FRONTEND_URL}/login`);
            }
            const user = req.user;
            // Create JWT token
            const token = jsonwebtoken_1.default.sign({
                userId: user.nameID,
                email: user.email || user.nameID,
                sessionId: req.sessionID,
            }, process.env.JWT_SECRET, { expiresIn: '24h' });
            console.log('🔐 Setting JWT cookie...');
            // Set JWT cookie - SIMPLIFIED VERSION
            res.cookie('jwt', token, {
                httpOnly: false, // TEMPORARY: set to true in production
                secure: false, // false for localhost
                sameSite: 'lax', // lax is better for redirects
                maxAge: 24 * 60 * 60 * 1000,
                path: '/',
                // NO domain - let browser default
            });
            console.log('✅ Cookie set, redirecting to frontend');
            // IMPORTANT: Use JavaScript redirect to ensure cookies are set
            const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Redirecting...</title>
          <script>
            // Cookies should be set by now
            console.log('Cookies after backend set:', document.cookie);
            // Redirect to frontend
            window.location.href = '${process.env.FRONTEND_URL}';
          </script>
        </head>
        <body>
          <p>Redirecting to application...</p>
        </body>
      </html>
    `;
            res.send(html);
        });
    }
    // ==================== CHECK AUTH ====================
    checkAuth(req, res) {
        // NO CACHING - always fresh response
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        const token = req.cookies.jwt;
        if (!token) {
            return res.json({ authenticated: false });
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            res.json({
                authenticated: true,
                user: decoded,
                timestamp: Date.now()
            });
        }
        catch (error) {
            res.json({ authenticated: false });
        }
    }
    // ==================== GET CURRENT USER ====================
    getCurrentUser(req, res) {
        const token = req.cookies.jwt;
        if (!token) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            res.json({
                user: decoded,
                authenticated: true,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            res.status(401).json({
                error: 'Invalid token',
                authenticated: false
            });
        }
    }
    // ==================== LOGOUT ====================
    logout(req, res) {
        console.log('🚪 Logout requested');
        // Clear JWT cookie
        res.clearCookie('jwt', {
            path: '/',
            domain: 'localhost'
        });
        // Destroy session
        req.session.destroy((err) => {
            if (err) {
                console.error('❌ Session destroy error:', err);
            }
            console.log('✅ Session destroyed');
            // Check if we should redirect to SSO logout
            const ssoLogoutUrl = process.env.SAML_LOGOUT_URL;
            if (ssoLogoutUrl && process.env.ENABLE_SAML === 'true') {
                console.log('🔗 Redirecting to SSO logout');
                return res.redirect(ssoLogoutUrl);
            }
            else {
                // Redirect to frontend login page
                console.log('🔗 Redirecting to frontend login');
                return res.redirect(`${process.env.FRONTEND_URL}/login`);
            }
        });
    }
    // ==================== AUTH MIDDLEWARE ====================
    requireAuth(req, res, next) {
        const token = req.cookies.jwt;
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            next();
        }
        catch (error) {
            res.status(401).json({ error: 'Invalid token' });
        }
    }
}
exports.default = new AuthController();
