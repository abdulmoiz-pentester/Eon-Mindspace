"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const session_services_1 = require("../services/session.services");
const saml_services_1 = require("../services/saml.services");
// Create instances
const sessionService = new session_services_1.SessionService();
const samlService = new saml_services_1.SAMLService(); // Create instance of SAMLService
const ENABLE_SAML = process.env.ENABLE_SAML === 'true';
class AuthController {
    /**
     * Initiate SAML login - FIXED VERSION
     */
    async login(req, res) {
        try {
            const returnTo = req.query.returnTo || '/';
            console.log('=== LOGIN INIT ===');
            console.log('Query returnTo:', returnTo);
            console.log('SAML Enabled:', ENABLE_SAML);
            if (ENABLE_SAML) {
                if (req.session)
                    req.session.returnTo = returnTo;
                console.log('Session returnTo set:', req.session?.returnTo);
                // Generate POST binding login form
                console.log('Generating SAML login form...');
                const formHtml = await samlService.generateLoginForm(returnTo);
                console.log('SAML login form generated successfully');
                // Force no caching
                res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
                res.setHeader('Pragma', 'no-cache');
                res.setHeader('Expires', '0');
                res.setHeader('Surrogate-Control', 'no-store');
                res.send(formHtml); // renders auto-submitting form
            }
            else {
                res.redirect(`/auth/dev/login?returnTo=${encodeURIComponent(returnTo)}`);
            }
        }
        catch (error) {
            console.error('❌ Login initiation failed:', error);
            res.status(500).json({ error: 'Failed to initiate login' });
        }
    }
    /**
     * SAML Callback endpoint - FIXED VERSION
     */
    async samlCallback(req, res) {
        try {
            console.log('=== SAML CALLBACK HIT ===');
            console.log('HTTP Method:', req.method);
            console.log('Request Body:', req.body);
            console.log('Session Data:', req.session);
            if (!ENABLE_SAML) {
                console.error('SAML authentication is not enabled');
                return res.status(400).json({ error: 'SAML not enabled' });
            }
            const { SAMLResponse, RelayState } = req.body;
            if (!SAMLResponse) {
                console.error('❌ No SAMLResponse in request body');
                return res.status(400).json({ error: 'No SAML response provided' });
            }
            console.log('Processing SAMLResponse...');
            const samlUser = await samlService.processResponse(SAMLResponse, RelayState);
            console.log('Raw SAML user returned:', JSON.stringify(samlUser, null, 2));
            const userInfo = this.extractUserInfo(samlUser);
            console.log('Extracted user info:', userInfo);
            const { token, expiresAt } = sessionService.createSession(userInfo);
            sessionService.setSessionCookie(res, token, expiresAt);
            console.log('Session cookie set:', token);
            res.cookie('user_info', JSON.stringify({
                email: userInfo.email,
                name: userInfo.name,
                firstName: userInfo.firstName,
                lastName: userInfo.lastName,
                company: userInfo.company
            }), {
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                expires: expiresAt,
                httpOnly: false
            });
            // Determine where to redirect
            let redirectTo = RelayState || req.session?.returnTo || '/';
            console.log('Redirect target before normalization:', redirectTo);
            if (req.session?.returnTo)
                delete req.session.returnTo;
            const frontendUrl = process.env.FRONTEND_URL;
            if (frontendUrl && !redirectTo.startsWith('http')) {
                const normalizedPath = redirectTo.startsWith('/') ? redirectTo : `/${redirectTo}`;
                redirectTo = `${frontendUrl}${normalizedPath}`;
            }
            console.log('Final redirect URL:', redirectTo);
            res.redirect(redirectTo);
        }
        catch (error) {
            console.error('❌ SAML callback failed:', error);
            const errorMsg = encodeURIComponent(error instanceof Error ? error.message : 'Authentication failed');
            res.redirect(`/auth/login?error=${errorMsg}`);
        }
    }
    /**
     * Extract user information from SAML response
     */
    extractUserInfo(samlUser) {
        console.log('Raw SAML user:', JSON.stringify(samlUser, null, 2));
        // SAML2-JS returns user info in samlUser.user
        const user = samlUser.user || {};
        const attributes = user.attributes || {};
        // Extract email
        const email = user.name_id ||
            attributes.email ||
            attributes.mail ||
            attributes['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ||
            'unknown@example.com';
        // Extract name
        const name = attributes.name ||
            attributes.displayName ||
            attributes['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
            email.split('@')[0];
        // Extract first and last names
        const firstName = attributes.firstName ||
            attributes.givenName ||
            attributes['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'] ||
            name.split(' ')[0];
        const lastName = attributes.lastName ||
            attributes.sn ||
            attributes['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'] ||
            name.split(' ').slice(1).join(' ') ||
            '';
        return {
            id: user.name_id || `saml-${Date.now()}`,
            email,
            name,
            firstName,
            lastName,
            company: this.extractCompanyFromEmail(email),
            groups: attributes.groups || [],
            sessionIndex: user.session_index || ''
        };
    }
    /**
     * Extract company name from email domain
     */
    extractCompanyFromEmail(email) {
        const domain = email.split('@')[1] || '';
        const domainParts = domain.split('.');
        if (domainParts.length >= 2) {
            return domainParts[domainParts.length - 2]
                .charAt(0).toUpperCase() +
                domainParts[domainParts.length - 2].slice(1);
        }
        return domain || 'Eon Health';
    }
    /**
     * Get SAML metadata
     */
    getMetadata(req, res) {
        try {
            console.log('=== METADATA REQUEST ===');
            if (!ENABLE_SAML) {
                return res.status(400).json({ error: 'SAML is not enabled' });
            }
            console.log('📋 Generating SAML metadata for Keycloak...');
            // Use SAMLService to generate metadata
            const metadata = samlService.generateMetadata();
            console.log('✅ Metadata generated successfully');
            res.type('application/xml');
            res.setHeader('Content-Disposition', 'inline; filename="metadata.xml"');
            res.send(metadata);
        }
        catch (error) {
            console.error('❌ Failed to generate metadata:', error);
            res.status(500).json({
                error: 'Failed to generate metadata',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    /**
     * Development login
     */
    devLogin(req, res) {
        console.log('=== DEV LOGIN ===');
        const allowDev = process.env.ALLOW_DEV_LOGIN === 'true' ||
            process.env.NODE_ENV === 'development';
        if (!allowDev) {
            return res.status(403).json({ error: 'Development only endpoint' });
        }
        const email = req.query.email || 'developer@eonhealth.com';
        const name = req.query.name || 'Developer';
        const returnTo = req.query.returnTo || '/';
        console.log('Dev login with:', { email, name, returnTo });
        const mockUserInfo = {
            id: `dev-${Date.now()}`,
            email: email,
            name: name,
            firstName: name.split(' ')[0],
            lastName: name.split(' ').slice(1).join(' ') || '',
            company: 'Eon Health',
            groups: ['developers'],
            domain: email.split('@')[1] || 'eonhealth.com'
        };
        // Create session
        const { token, expiresAt } = sessionService.createSession(mockUserInfo);
        sessionService.setSessionCookie(res, token, expiresAt);
        // Set user info cookie
        res.cookie('user_info', JSON.stringify({
            email: mockUserInfo.email,
            name: mockUserInfo.name,
            firstName: mockUserInfo.firstName,
            lastName: mockUserInfo.lastName,
            company: mockUserInfo.company
        }), {
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            expires: expiresAt,
            httpOnly: false
        });
        console.log('✅ Dev session created for:', email);
        // Redirect
        const frontendUrl = process.env.FRONTEND_URL;
        if (frontendUrl && !returnTo.startsWith('http')) {
            const finalUrl = `${frontendUrl}${returnTo.startsWith('/') ? returnTo : '/' + returnTo}`;
            return res.redirect(finalUrl);
        }
        res.redirect(returnTo);
    }
    /**
     * Get current session info
     */
    getSession(req, res) {
        if (!req.user) {
            return res.status(401).json({
                authenticated: false,
                message: 'Not authenticated'
            });
        }
        res.json({
            authenticated: true,
            user: req.user,
            timestamp: new Date().toISOString()
        });
    }
    /**
     * Logout
     */
    logout(req, res) {
        console.log('=== LOGOUT ===');
        // Clear cookies
        sessionService.clearSessionCookie(res);
        res.clearCookie('user_info');
        // Passport logout
        req.logout((err) => {
            if (err)
                console.error('Logout error:', err);
        });
        // Destroy session
        if (req.session) {
            req.session.destroy((err) => {
                if (err)
                    console.error('Session destruction error:', err);
            });
        }
        console.log('✅ Logout successful');
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    }
    /**
     * Health check
     */
    health(req, res) {
        res.json({
            status: 'ok',
            samlEnabled: ENABLE_SAML,
            samlConfigured: !!process.env.SAML_ENTRY_POINT,
            environment: process.env.NODE_ENV
        });
    }
    /**
     * Check auth status
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
