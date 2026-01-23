export interface AWSSSOConfig {
  // AWS SSO SAML Configuration (provided by your AWS admin)
  sso: {
    entryPoint: string;          // AWS SSO SAML login URL
    issuer: string;              // Entity ID from AWS SSO
    cert: string;                // Certificate from AWS SSO metadata
    callbackUrl: string;         // Your ACS URL
  };
  
  // Your Application Configuration
  app: {
    entityId: string;            // Your app's entity ID
    privateKey: string;          // Your private key (optional for dev)
    certificate: string;         // Your certificate (optional for dev)
    audience: string;            // Expected audience (usually entityId)
  };
  
  // Session Configuration
  session: {
    secret: string;
    maxAge: number;
    cookieName: string;
  };
}

// Default development configuration
export const getAWSSSOConfig = (): AWSSSOConfig => {
  return {
    sso: {
      entryPoint: process.env.AWS_SSO_ENTRY_POINT || 
                 'https://secure-login.awsapps.com/start/#/',
      issuer: process.env.AWS_SSO_ISSUER || 
             'urn:amazon:webservices',
      cert: process.env.AWS_SSO_CERTIFICATE || '',
      callbackUrl: process.env.AWS_SSO_CALLBACK_URL || 
                  'http://localhost:5000/auth/sso/acs'
    },
    app: {
      entityId: process.env.APP_ENTITY_ID || 
               'http://localhost:5000/auth/sso/metadata',
      privateKey: process.env.SAML_PRIVATE_KEY || '',
      certificate: process.env.SAML_CERTIFICATE || '',
      audience: process.env.SAML_AUDIENCE || 
               'urn:amazon:webservices'
    },
    session: {
      secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
      maxAge: parseInt(process.env.SESSION_MAX_AGE || '86400000'), // 24 hours
      cookieName: process.env.SESSION_COOKIE_NAME || 'eon_session'
    }
  };
};

// Company domain validation
export const allowedDomains = [
  process.env.COMPANY_DOMAIN || 'eonhealth.com',
  // Add other allowed domains
];