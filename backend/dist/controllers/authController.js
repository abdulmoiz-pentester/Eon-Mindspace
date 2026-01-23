"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const session_services_1 = require("../services/session.services");
const passport_1 = __importDefault(require("passport"));
const passport_2 = require("../config/passport");
// Create instances
const sessionService = new session_services_1.SessionService();
const ENABLE_SAML = process.env.ENABLE_SAML === 'true' || process.env.NODE_ENV === 'production';
// Mock SAMLService if it doesn't exist yet
let samlService;
try {
    const SAMLModule = require('../services/saml.services');
    samlService = new SAMLModule.SAMLService();
}
catch (error) {
    samlService = {
        generateLoginRequest: async (returnTo) => `/auth/dev/login?returnTo=${returnTo}`,
        processResponse: async (samlResponse) => ({
            email: 'test@example.com',
            name: 'Test User',
            company: 'Test Company'
        }),
        generateMetadata: () => '<xml>Metadata</xml>'
    };
}
class AuthController {
    /**
     * Initiate AWS SSO login
     */
    async login(req, res) {
        try {
            const returnTo = req.query.returnTo || '/';
            if (ENABLE_SAML && passport_2.samlStrategy) {
                // SAML login
                console.log('Initiating SAML login');
                req.session = req.session || {};
                req.session.returnTo = returnTo;
                passport_1.default.authenticate('saml', {
                    failureRedirect: '/auth/login?error=saml_failed',
                    failureFlash: false
                })(req, res);
            }
            else {
                // Development/local login
                const loginUrl = await samlService.generateLoginRequest(returnTo);
                console.log('Redirecting to:', loginUrl);
                res.redirect(loginUrl);
            }
        }
        catch (error) {
            console.error('Login initiation failed:', error);
            res.status(500).json({
                error: 'Failed to initiate login',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    /**
     * SAML Callback endpoint
     */
    samlCallback(req, res, next) {
        if (!ENABLE_SAML || !passport_2.samlStrategy) {
            return res.status(400).json({ error: 'SAML authentication is not enabled' });
        }
        passport_1.default.authenticate('saml', {
            failureRedirect: '/auth/login?error=saml_auth_failed',
            failureFlash: false
        }, (err, user, info) => {
            if (err) {
                console.error('SAML authentication error:', err);
                return res.redirect('/auth/login?error=' + encodeURIComponent(err.message));
            }
            if (!user) {
                return res.redirect('/auth/login?error=authentication_failed');
            }
            req.login(user, (loginErr) => {
                if (loginErr) {
                    console.error('Login error:', loginErr);
                    return res.redirect('/auth/login?error=session_error');
                }
                // Create session
                const { token, expiresAt } = sessionService.createSession(user);
                sessionService.setSessionCookie(res, token, expiresAt);
                // Set user info cookie for frontend
                res.cookie('user_info', JSON.stringify({
                    email: user.email,
                    name: user.name,
                    company: user.company
                }), {
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    expires: expiresAt
                });
                // Redirect to original destination
                const returnTo = req.session?.returnTo || '/chat';
                if (req.session) {
                    delete req.session.returnTo;
                }
                if (process.env.FRONTEND_URL && !returnTo.startsWith('http')) {
                    const frontendUrl = process.env.FRONTEND_URL + returnTo;
                    return res.redirect(frontendUrl);
                }
                res.redirect(returnTo);
            });
        })(req, res, next);
    }
    /**
     * Original ACS endpoint (backward compatibility)
     */
    async acs(req, res) {
        try {
            if (ENABLE_SAML) {
                return this.samlCallback(req, res, () => { });
            }
            const { SAMLResponse, RelayState } = req.body;
            if (!SAMLResponse) {
                return res.status(400).json({ error: 'No SAML response provided' });
            }
            const userInfo = await samlService.processResponse(SAMLResponse);
            const { token, expiresAt } = sessionService.createSession(userInfo);
            sessionService.setSessionCookie(res, token, expiresAt);
            res.cookie('user_info', JSON.stringify({
                email: userInfo.email,
                name: userInfo.name,
                company: userInfo.company
            }), {
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                expires: expiresAt
            });
            const redirectTo = RelayState || '/chat';
            if (process.env.FRONTEND_URL && !redirectTo.startsWith('http')) {
                const frontendUrl = process.env.FRONTEND_URL + redirectTo;
                return res.redirect(frontendUrl);
            }
            res.redirect(redirectTo);
        }
        catch (error) {
            console.error('ACS processing failed:', error);
            const errorMessage = encodeURIComponent(error instanceof Error ? error.message : 'Authentication failed');
            if (process.env.FRONTEND_URL) {
                res.redirect(`${process.env.FRONTEND_URL}/login?error=${errorMessage}`);
            }
            else {
                res.status(401).send(`
          <html>
            <body>
              <h1>Authentication Failed</h1>
              <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
              <a href="/auth/login">Try again</a>
            </body>
          </html>
        `);
            }
        }
    }
    /**
     * Get current session info
     */
    getSession(req, res) {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        res.json({
            authenticated: true,
            user: req.user,
            timestamp: new Date().toISOString()
        });
    }
    /**
     * Logout - clears session
     */
    logout(req, res) {
        if (req.logout) {
            req.logout((err) => {
                if (err)
                    console.error('Passport logout error:', err);
            });
        }
        sessionService.clearSessionCookie(res);
        res.clearCookie('user_info');
        if (req.session) {
            req.session.destroy((err) => {
                if (err)
                    console.error('Session destruction error:', err);
            });
        }
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    }
    /**
     * Get SAML metadata
     */
    getMetadata(req, res) {
        try {
            if (ENABLE_SAML) {
                return this.getSamlMetadata(req, res);
            }
            const metadata = samlService.generateMetadata();
            res.type('application/xml');
            res.send(metadata);
        }
        catch (error) {
            console.error('Failed to generate metadata:', error);
            res.status(500).json({ error: 'Failed to generate metadata' });
        }
    }
    /**
     * SAML Metadata endpoint
     */
    getSamlMetadata(req, res) {
        try {
            if (!ENABLE_SAML || !passport_2.samlStrategy) {
                return res.status(400).json({ error: 'SAML is not enabled' });
            }
            const metadata = passport_2.samlStrategy.generateServiceProviderMetadata(process.env.SAML_PUBLIC_CERT || '', process.env.SAML_PUBLIC_CERT || '');
            res.type('application/xml');
            res.send(metadata);
        }
        catch (error) {
            console.error('Failed to generate metadata:', error);
            res.status(500).json({ error: 'Failed to generate metadata' });
        }
    }
    /**
     * Health check endpoint
     */
    health(req, res) {
        res.json({
            status: 'ok',
            service: 'auth',
            timestamp: new Date().toISOString(),
            samlEnabled: ENABLE_SAML
        });
    }
    /**
     * Development login (for testing without AWS SSO)
     */
    devLogin(req, res) {
        if (process.env.NODE_ENV !== 'development' && !process.env.ALLOW_DEV_LOGIN) {
            return res.status(403).json({ error: 'Development only endpoint' });
        }
        const { email = 'developer@company.com', name = 'Developer', returnTo = '/chat' } = req.query;
        const mockUserInfo = {
            email: email,
            name: name,
            firstName: name.split(' ')[0],
            lastName: name.split(' ').slice(1).join(' '),
            company: 'Development',
            groups: ['developers'],
            samlSessionIndex: 'dev-session-' + Date.now(),
            domain: email.split('@')[1] || 'company.com'
        };
        const { token, expiresAt } = sessionService.createSession(mockUserInfo);
        sessionService.setSessionCookie(res, token, expiresAt);
        if (ENABLE_SAML && req.login) {
            req.login(mockUserInfo, (err) => {
                if (err)
                    console.error('Passport dev login error:', err);
            });
        }
        const redirectUrl = returnTo;
        if (process.env.FRONTEND_URL && !redirectUrl.startsWith('http')) {
            const frontendUrl = process.env.FRONTEND_URL + redirectUrl;
            return res.redirect(frontendUrl);
        }
        res.redirect(redirectUrl);
    }
    /**
     * Check if user is authenticated
     */
    checkAuth(req, res) {
        if (req.user) {
            res.json({
                authenticated: true,
                user: req.user
            });
        }
        else {
            res.json({
                authenticated: false,
                loginUrl: '/auth/login'
            });
        }
    }
}
exports.AuthController = AuthController;
exports.default = AuthController;
