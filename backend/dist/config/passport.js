"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.passport = exports.samlStrategy = void 0;
const passport_1 = __importDefault(require("passport"));
exports.passport = passport_1.default;
const passport_saml_1 = require("passport-saml");
// Type the user parameter as 'any' to avoid conflicts
passport_1.default.serializeUser((user, done) => {
    done(null, user);
});
passport_1.default.deserializeUser((user, done) => {
    done(null, user);
});
// Configure SAML strategy
const samlConfig = {
    entryPoint: 'https://fujifish.github.io/samling/samling.html',
    issuer: 'your-app',
    callbackUrl: process.env.SAML_CALLBACK_URL || 'http://localhost:5000/auth/saml/callback',
    cert: `-----BEGIN CERTIFICATE-----
MIICpzCCAY8CBgGb+d/1UzANBgkqhkiG9w0BAQsFADAXMRUwEwYDVQQDDAxFT04t
U2VjdXJpdHkwHhcNMjYwMTI2MTAzNDIyWhcNMzYwMTI2MTAzNjAyWjAXMRUwEwYD
VQQDDAxFT04tU2VjdXJpdHkwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIB
AQ...
-----END CERTIFICATE-----`,
    validateInResponseTo: false,
    disableRequestedAuthnContext: true,
};
exports.samlStrategy = new passport_saml_1.Strategy(samlConfig, (profile, done) => {
    if (!profile) {
        return done(new Error('No profile found'));
    }
    return done(null, profile);
});
passport_1.default.use('saml', exports.samlStrategy);
