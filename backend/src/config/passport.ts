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
  entryPoint: 'https://fujifish.github.io/samling/samling.html',
  issuer: 'eon-mindspace-app',
  callbackUrl: process.env.SAML_CALLBACK_URL || 'http://localhost:5000/auth/saml/callback',
  
   cert: `-----BEGIN CERTIFICATE-----
MIIDCTCCAnKgAwIBAgIBATANBgkqhkiG9w0BAQUFADBvMRQwEgYDVQQDEwtjYXBy
aXphLmNvbTELMAkGA1UEBhMCVVMxETAPBgNVBAgTCFZpcmdpbmlhMRMwEQYDVQQH
EwpCbGFja3NidXJnMRAwDgYDVQQKEwdTYW1saW5nMRAwDgYDVQQLEwdTYW1saW5n
MB4XDTI2MDEyODIxNTY1MFoXDTI3MDEyODIxNTY1MFowbzEUMBIGA1UEAxMLY2Fw
cml6YS5jb20xCzAJBgNVBAYTAlVTMREwDwYDVQQIEwhWaXJnaW5pYTETMBEGA1UE
BxMKQmxhY2tzYnVyZzEQMA4GA1UEChMHU2FtbGluZzEQMA4GA1UECxMHU2FtbGlu
ZzCBnzANBgkqhkiG9w0BAQEFAAOBjQAwgYkCgYEAt6yZuqV7QG7TQTiYPQuWFhMj
AqwiopjWhhoSVoH/w8eTc3Zk54T/VDmtSyi1cYrhbYeedGtcjvIFpZ7tUUEceTpH
qHC0BS72helGePOQyUSsRwRc6xD8tOkHC5og6CEqZrkny2Mh/EcZy66Gjr6S7KJK
3h1aLVrdZoAH3KiUXFECAwEAAaOBtDCBsTAMBgNVHRMEBTADAQH/MAsGA1UdDwQE
AwIC9DA7BgNVHSUENDAyBggrBgEFBQcDAQYIKwYBBQUHAwIGCCsGAQUFBwMDBggr
BgEFBQcDBAYIKwYBBQUHAwgwEQYJYIZIAYb4QgEBBAQDAgD3MCUGA1UdEQQeMByG
Gmh0dHA6Ly9jYXByaXphLmNvbS9zYW1saW5nMB0GA1UdDgQWBBTgS9HebSsGpxJO
55XuZN7sa0hh/zANBgkqhkiG9w0BAQUFAAOBgQCfNbIyf63k514z7+zJES8ZvMJB
pf8Q2yt4MxBYa0olFagOAhSFrCfYAMxRd6lzZv6rQUK9guPgjAAnuB51rUAF9LIt
eLSYmFKl6ug8onchyWNQ84BT+km04i75pig9p07jWucfEo9OdFzKmgrfnHNOgIxh
OyrEhPg4jiuAeHBc2g==
-----END CERTIFICATE-----`,
  validateInResponseTo: false,
  disableRequestedAuthnContext: true,
  wantAssertionsSigned: false,    // Ensure this is false
  wantAuthnResponseSigned: false, // Ensure this is false
 signatureValidation: false,
skipRequestCompression: true,
disableRequestAcsUrl: false,
  
  // ADD THIS:
  acceptedClockSkewMs: -1,
};

// Create and register SAML strategy
try {
  const samlStrategy = new SamlStrategy(
    samlConfig,
    (profile: Profile | null | undefined, done: VerifiedCallback) => {
      console.log('🔐 [DEBUG] SAML verify function called');
      console.log('🔐 [DEBUG] Profile received:', profile);
      
      if (!profile) {
        console.error('❌ [DEBUG] No profile found');
        return done(new Error('No profile found'));
      }
      
      console.log('✅ [DEBUG] SAML User authenticated successfully');
      console.log('✅ [DEBUG] Profile nameID:', profile.nameID);
      console.log('✅ [DEBUG] Profile nameIDFormat:', profile.nameIDFormat);
      console.log('✅ [DEBUG] Profile attributes:', profile.attributes);
      console.log('✅ [DEBUG] Profile getAssertionXml:', typeof profile.getAssertionXml);
      
      return done(null, profile);
    }
  );

  passport.use('saml', samlStrategy);
  console.log('✅ [DEBUG] SAML strategy registered successfully');
  
  // Log all registered strategies
  console.log('🔍 [DEBUG] Registered strategies:', Object.keys(passport.strategies || {}));
  
} catch (error) {
  console.error('❌ [DEBUG] Failed to create SAML strategy:', error);
}

export { passport };