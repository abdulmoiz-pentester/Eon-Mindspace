import passport from 'passport';
import { Strategy as SamlStrategy, Profile, VerifiedCallback } from 'passport-saml';

console.log('🔐 [DEBUG] Loading SAML strategy...');

// Simple type for callback functions
type DoneFunction = (error: any, user?: any) => void;

// Serialize/Deserialize User
passport.serializeUser((user: any, done: DoneFunction) => {
  console.log('🔐 [DEBUG] Serialize user called');
  console.log('🔐 [DEBUG] User to serialize:', user);
  console.log('🔐 [DEBUG] User nameID:', user?.nameID);
  console.log('🔐 [DEBUG] User email:', user?.email);
  done(null, user);
});

passport.deserializeUser((user: any, done: DoneFunction) => {
  console.log('🔐 [DEBUG] Deserialize user called');
  console.log('🔐 [DEBUG] User to deserialize:', user);
  done(null, user);
});

// Configure SAML strategy
const samlConfig = {
  entryPoint: process.env.AWS_SSO_ENTRY_POINT!,
  issuer: process.env.AWS_SSO_ISSUER!,
  callbackUrl: process.env.SAML_CALLBACK_URL!,
  cert: process.env.AWS_SSO_CERTIFICATE!.replace(/\\n/g, "\n"),
  validateInResponseTo: false,
  wantAssertionsSigned: true,
  wantAuthnResponseSigned: true,
  acceptedClockSkewMs: parseInt(
    process.env.SAML_ACCEPTED_CLOCK_SKEW_MS || "10000"
  ),
};

// Create and register SAML strategy
try {
  const samlStrategy = new SamlStrategy(
    samlConfig,
    (profile: Profile | null | undefined, done: VerifiedCallback) => {
      console.log('🔐 [DEBUG] SAML verify function called');

      if (!profile) {
        console.error('❌ [DEBUG] No profile found');
        return done(new Error('No profile found'));
      }

      console.log('✅ [DEBUG] Profile object:', profile);
      console.log('✅ [DEBUG] Profile nameID:', profile.nameID);
      console.log('✅ [DEBUG] Profile nameIDFormat:', profile.nameIDFormat);
      console.log('✅ [DEBUG] Profile attributes:', profile.attributes);

      try {
        const xml = profile.getAssertionXml ? profile.getAssertionXml() : 'N/A';
        console.log('✅ [DEBUG] Raw SAML Assertion XML (truncated):', xml?.substring(0, 300) + '...');
      } catch (e) {
        console.error('❌ [DEBUG] Could not get assertion XML:', e);
      }

      console.log('🔍 [DEBUG] InResponseTo:', (profile as any).inResponseTo);

      return done(null, profile);
    }
  );

  // Type assertion to fix the passport.use issue
  (passport as any).use('saml', samlStrategy as any);
  console.log('✅ [DEBUG] SAML strategy registered successfully');
  
  // Log all registered strategies
  console.log('🔍 [DEBUG] Registered strategies:', Object.keys((passport as any)._strategies || {}));
  
} catch (error) {
  console.error('❌ [DEBUG] Failed to create SAML strategy:', error);
}

export { passport };