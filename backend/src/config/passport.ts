import passport from 'passport';
import { Strategy as SamlStrategy } from 'passport-saml';

// Check if SAML is enabled
const ENABLE_SAML = process.env.ENABLE_SAML === 'true';
const SAML_ENTRY_POINT = process.env.SAML_ENTRY_POINT;

export let samlStrategy: SamlStrategy | null = null;

if (ENABLE_SAML && SAML_ENTRY_POINT) {
  console.log('🚀 Initializing SAML Strategy for Keycloak');
  console.log('Entry Point:', SAML_ENTRY_POINT);
  
  try {
    samlStrategy = new SamlStrategy(
      {
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
        wantAssertionsSigned: false,  // Keycloak compatibility
        disableRequestedAuthnContext: true,  // Keycloak compatibility
        validateInResponseTo: false,
        // Add entity ID (your app's identifier)
        audience: process.env.SAML_AUDIENCE || 'urn:keycloak'
      },
      (profile: any, done: any) => {
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
          
        } catch (error) {
          console.error('❌ Error processing SAML profile:', error);
          return done(error);
        }
      }
    );

    // Setup passport
    passport.serializeUser((user: any, done) => {
      done(null, user);
    });

    passport.deserializeUser((user: any, done) => {
      done(null, user);
    });

    passport.use(samlStrategy);
    
    console.log('✅ SAML Strategy initialized successfully');
    
  } catch (error) {
    console.error('❌ Failed to initialize SAML strategy:', error);
    samlStrategy = null;
  }
} else {
  console.log(ENABLE_SAML ? '⚠️ SAML enabled but no entry point' : '🔧 SAML disabled');
}


export default passport;