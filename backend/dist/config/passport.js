"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.samlStrategy = void 0;
const passport_1 = __importDefault(require("passport"));
const passport_saml_1 = require("passport-saml");
const aws_1 = __importDefault(require("./aws"));
const aws_sso_config_1 = require("./aws.sso.config");
// Check if SAML is enabled
const ENABLE_SAML = process.env.ENABLE_SAML === 'true' || process.env.NODE_ENV === 'production';
let samlStrategy = null;
exports.samlStrategy = samlStrategy;
if (ENABLE_SAML && aws_1.default.saml?.entryPoint) {
    const config = (0, aws_sso_config_1.getAWSSSOConfig)();
    exports.samlStrategy = samlStrategy = new passport_saml_1.Strategy({
        path: '/auth/saml/callback',
        entryPoint: aws_1.default.saml.entryPoint || config.sso.entryPoint,
        issuer: aws_1.default.saml.issuer || config.app.entityId,
        cert: aws_1.default.saml.cert || config.sso.cert,
        privateKey: aws_1.default.saml?.privateKey || config.app.privateKey,
        signatureAlgorithm: 'sha256',
        acceptedClockSkewMs: 60000, // 1 minute
        identifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
        authnRequestBinding: 'HTTP-POST',
        disableRequestedAuthnContext: false,
    }, (profile, done) => {
        try {
            console.log('SAML Profile received:', profile);
            // Extract user information from SAML response
            const user = {
                id: profile.nameID || profile.nameid,
                email: profile.email ||
                    profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ||
                    profile.nameID,
                name: profile.name ||
                    profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
                    profile.displayName,
                firstName: profile.firstName ||
                    profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'],
                lastName: profile.lastName ||
                    profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'],
                company: profile.company ||
                    profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/company'],
                groups: profile.groups ||
                    profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/groups'] || [],
                // Extract AWS roles if present
                awsRoles: profile['https://aws.amazon.com/SAML/Attributes/Role'] ||
                    profile['http://schemas.amazonaws.com/SAML/Attributes/Role'] || [],
                sessionNotOnOrAfter: profile.sessionNotOnOrAfter,
            };
            console.log('SAML User extracted:', { id: user.id, email: user.email });
            return done(null, user);
        }
        catch (error) {
            console.error('Error processing SAML profile:', error);
            return done(error);
        }
    });
    // Serialize/Deserialize user for session
    passport_1.default.serializeUser((user, done) => {
        done(null, user);
    });
    passport_1.default.deserializeUser((user, done) => {
        done(null, user);
    });
    passport_1.default.use(samlStrategy);
}
else if (ENABLE_SAML) {
    console.warn('SAML enabled but no configuration found. Please set SAML environment variables.');
}
exports.default = passport_1.default;
