import passport from 'passport';
import { Strategy as SamlStrategy } from 'passport-saml';
import awsConfig from './aws';
import { getAWSSSOConfig } from './aws.sso.config';

// Check if SAML is enabled
const ENABLE_SAML = process.env.ENABLE_SAML === 'true' || process.env.NODE_ENV === 'production';

let samlStrategy: SamlStrategy | null = null;

if (ENABLE_SAML && awsConfig.saml?.entryPoint) {
  const config = getAWSSSOConfig();
  
  samlStrategy = new SamlStrategy(
    {
      path: '/auth/saml/callback',
      entryPoint: awsConfig.saml.entryPoint || config.sso.entryPoint,
      issuer: awsConfig.saml.issuer || config.app.entityId,
      cert: awsConfig.saml.cert || config.sso.cert,
      privateKey: awsConfig.saml?.privateKey || config.app.privateKey,
      signatureAlgorithm: 'sha256',
      acceptedClockSkewMs: 60000, // 1 minute
      identifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
      authnRequestBinding: 'HTTP-POST',
      disableRequestedAuthnContext: false,
    },
    (profile: any, done: any) => {
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
      } catch (error) {
        console.error('Error processing SAML profile:', error);
        return done(error);
      }
    }
  );

  // Serialize/Deserialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user);
  });

  passport.deserializeUser((user: any, done) => {
    done(null, user);
  });

  passport.use(samlStrategy);
} else if (ENABLE_SAML) {
  console.warn('SAML enabled but no configuration found. Please set SAML environment variables.');
}

export { samlStrategy };
export default passport;