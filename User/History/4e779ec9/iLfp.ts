import passport from 'passport';
import { Strategy as SamlStrategy } from 'passport-saml';
import fs from 'fs';
import path from 'path';
import awsConfig from './aws';

export const samlStrategy = new SamlStrategy(
  {
    path: '/auth/saml/callback',
    entryPoint: awsConfig.saml.entryPoint,
    issuer: awsConfig.saml.issuer,
    cert: awsConfig.saml.cert,
    signatureAlgorithm: 'sha256',
    acceptedClockSkewMs: 0,
    identifierFormat: null,
    authnRequestBinding: 'HTTP-POST',
    disableRequestedAuthnContext: true,
  },
  (profile: any, done: any) => {
    // Extract user information from SAML response
    const user = {
      id: profile.nameID,
      email: profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
      name: profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'],
      roles: profile['http://schemas.amazonaws.com/SAML/Attributes/Role'],
      sessionNotOnOrAfter: profile.sessionNotOnOrAfter,
      // AWS Temporary credentials from SAML assertion
      awsCredentials: {
        sessionToken: profile.SessionToken,
        accessKeyId: profile.AccessKeyId,
        secretAccessKey: profile.SecretAccessKey,
        expiration: profile.Expiration,
      }
    };
    
    return done(null, user);
  }
);

export default passport;