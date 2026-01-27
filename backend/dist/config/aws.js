"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Default configuration - IMPORTANT: Make sure this loads Keycloak values
const awsConfig = {
    region: process.env.AWS_REGION || 'us-east-1',
    // For development (local SSO)
    ssoStartUrl: process.env.AWS_SSO_START_URL,
    ssoRegion: process.env.AWS_SSO_REGION,
    ssoAccountId: process.env.AWS_SSO_ACCOUNT_ID,
    ssoRoleName: process.env.AWS_SSO_ROLE_NAME,
    // For SAML (Keycloak OR AWS SSO)
    saml: process.env.SAML_ENTRY_POINT ? {
        entryPoint: process.env.SAML_ENTRY_POINT,
        issuer: process.env.SAML_ISSUER || 'urn:keycloak',
        cert: process.env.SAML_IDP_CERT || '',
        callbackUrl: process.env.SAML_CALLBACK_URL || 'http://localhost:5000/auth/saml/callback',
        audience: process.env.SAML_AUDIENCE || 'urn:keycloak',
        privateKey: process.env.SAML_PRIVATE_KEY || '',
        publicCert: process.env.SAML_PUBLIC_CERT || '',
    } : undefined
};
exports.default = awsConfig;
