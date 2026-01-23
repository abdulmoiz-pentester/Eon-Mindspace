import { fromSSO } from '@aws-sdk/credential-provider-sso';

export interface AWSSSOConfig {
  region: string;
  ssoStartUrl?: string;
  ssoRegion?: string;
  ssoAccountId?: string;
  ssoRoleName?: string;
  
  // SAML Configuration
  saml?: {
    entryPoint: string;
    issuer: string;
    cert: string;
    callbackUrl: string;
    audience?: string;
    privateKey?: string;
    publicCert?: string;
  };
}

// Helper to get AWS credentials based on environment
export const getAWSCredentials = async () => {
  if (process.env.NODE_ENV === 'development' && !process.env.ENABLE_SAML) {
    // Use local SSO profile
    return fromSSO({
      profile: process.env.AWS_PROFILE || 'default'
    })();
  }
  // In production/SAML mode, credentials come from session
  throw new Error('AWS credentials should be retrieved from user session');
};

// Default configuration
const awsConfig: AWSSSOConfig = {
  region: process.env.AWS_REGION || 'us-west-2 ',
  
  // For development (local SSO)
  ssoStartUrl: process.env.AWS_SSO_START_URL,
  ssoRegion: process.env.AWS_SSO_REGION,
  ssoAccountId: process.env.AWS_SSO_ACCOUNT_ID,
  ssoRoleName: process.env.AWS_SSO_ROLE_NAME,
  
  // For production SAML
  saml: process.env.ENABLE_SAML ? {
    entryPoint: process.env.SAML_ENTRY_POINT || '',
    issuer: process.env.SAML_ISSUER || 'urn:amazon:webservices',
    cert: process.env.SAML_IDP_CERT || '',
    callbackUrl: process.env.SAML_CALLBACK_URL || `${process.env.APP_URL}/auth/saml/callback`,
    audience: process.env.SAML_AUDIENCE || 'urn:amazon:webservices',
    privateKey: process.env.SAML_PRIVATE_KEY || '',
    publicCert: process.env.SAML_PUBLIC_CERT || '',
  } : undefined
};

export default awsConfig;