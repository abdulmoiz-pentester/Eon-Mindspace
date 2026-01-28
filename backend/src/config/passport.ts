import passport from 'passport';
import { Strategy as SamlStrategy, Profile, VerifiedCallback } from 'passport-saml';

// Simple type for callback functions
type DoneFunction = (error: any, user?: any) => void;

// Type the user parameter as 'any' to avoid conflicts
passport.serializeUser((user: any, done: DoneFunction) => {
  done(null, user);
});

passport.deserializeUser((user: any, done: DoneFunction) => {
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

export const samlStrategy = new SamlStrategy(
  samlConfig,
  (profile: Profile | null | undefined, done: VerifiedCallback) => {
    if (!profile) {
      return done(new Error('No profile found'));
    }
    return done(null, profile);
  }
);

passport.use('saml', samlStrategy);

export { passport };