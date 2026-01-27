"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.samlStrategy = void 0;
const passport_1 = __importDefault(require("passport"));
const passport_saml_1 = require("passport-saml");
// Check if SAML is enabled
const ENABLE_SAML = process.env.ENABLE_SAML === 'true';
const SAML_ENTRY_POINT = process.env.SAML_ENTRY_POINT;
exports.samlStrategy = null;
if (ENABLE_SAML && SAML_ENTRY_POINT) {
    console.log('🚀 Initializing SAML Strategy for Keycloak');
    console.log('Entry Point:', SAML_ENTRY_POINT);
    try {
        exports.samlStrategy = new passport_saml_1.Strategy({
            // IMPORTANT: These must match Keycloak configuration
            path: '/auth/saml/callback',
            entryPoint: SAML_ENTRY_POINT,
            issuer: process.env.SAML_ISSUER || 'urn:keycloak',
            cert: process.env.SAML_IDP_CERT || '',
            callbackUrl: process.env.SAML_CALLBACK_URL || 'http://localhost:5000/auth/saml/callback',
            signatureAlgorithm: 'sha256',
            acceptedClockSkewMs: 60000,
            identifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
            authnRequestBinding: 'HTTP-Redirect',
            wantAssertionsSigned: false, // Keycloak compatibility
            disableRequestedAuthnContext: true, // Keycloak compatibility
            validateInResponseTo: false,
            // Add entity ID (your app's identifier)
            audience: process.env.SAML_AUDIENCE || 'urn:keycloak'
        }, (profile, done) => {
            try {
                console.log('🎯 SAML Profile received from Keycloak');
                // Debug: Log all profile attributes
                console.log('Profile attributes:');
                for (const key in profile) {
                    if (profile.hasOwnProperty(key)) {
                        console.log(`  ${key}:`, profile[key]);
                    }
                }
                // Extract user information
                const email = profile.email ||
                    profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ||
                    profile.nameID ||
                    'unknown@example.com';
                const name = profile.name ||
                    profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
                    profile.displayName ||
                    email.split('@')[0];
                const user = {
                    id: profile.nameID || `saml-${Date.now()}`,
                    email: email,
                    name: name,
                    firstName: profile.firstName ||
                        profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'] ||
                        name.split(' ')[0] ||
                        '',
                    lastName: profile.lastName ||
                        profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'] ||
                        name.split(' ').slice(1).join(' ') ||
                        '',
                    company: profile.company ||
                        profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/company'] ||
                        'Eon Health',
                    groups: profile.groups ||
                        profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/groups'] ||
                        [],
                    sessionIndex: profile.sessionIndex,
                    nameID: profile.nameID
                };
                console.log('✅ Extracted user:', user.email);
                return done(null, user);
            }
            catch (error) {
                console.error('❌ Error processing SAML profile:', error);
                return done(error);
            }
        });
        // Setup passport
        passport_1.default.serializeUser((user, done) => {
            done(null, user);
        });
        passport_1.default.deserializeUser((user, done) => {
            done(null, user);
        });
        passport_1.default.use(exports.samlStrategy);
        console.log('✅ SAML Strategy initialized successfully');
    }
    catch (error) {
        console.error('❌ Failed to initialize SAML strategy:', error);
        exports.samlStrategy = null;
    }
}
else {
    console.log(ENABLE_SAML ? '⚠️ SAML enabled but no entry point' : '🔧 SAML disabled');
}
exports.default = passport_1.default;
