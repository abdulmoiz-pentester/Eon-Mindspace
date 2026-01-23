import { Request, Response, NextFunction } from 'express';
import { STSClient, AssumeRoleWithSAMLCommand } from '@aws-sdk/client-sts';
import awsConfig from '../config/aws';

interface UserSession {
  id: string;
  email: string;
  name: string;
  roles: string[];
  awsCredentials?: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken: string;
    expiration: Date;
  };
}

// Service to get AWS credentials from SAML assertion
export const getCredentialsFromSAML = async (
  samlAssertion: string,
  roleArn: string,
  principalArn: string
) => {
  const stsClient = new STSClient({ 
    region: awsConfig.region 
  });
  
  const command = new AssumeRoleWithSAMLCommand({
    RoleArn: roleArn,
    PrincipalArn: principalArn,
    SAMLAssertion: samlAssertion,
    DurationSeconds: 3600, // 1 hour
  });
  
  try {
    const response = await stsClient.send(command);
    
    if (!response.Credentials) {
      throw new Error('No credentials returned from AWS STS');
    }
    
    return {
      accessKeyId: response.Credentials.AccessKeyId!,
      secretAccessKey: response.Credentials.SecretAccessKey!,
      sessionToken: response.Credentials.SessionToken!,
      expiration: response.Credentials.Expiration!,
    };
  } catch (error) {
    console.error('Failed to get AWS credentials from SAML:', error);
    throw error;
  }
};

// Get AWS credentials for the current session
export const getCurrentAWSCredentials = (req: Request) => {
  if (!(req as any).isAuthenticated || !(req as any).isAuthenticated()) {
    throw new Error('User not authenticated');
  }
  
  const user = (req as any).user as UserSession;
  
  if (!user.awsCredentials) {
    throw new Error('AWS credentials not found in session');
  }
  
  return user.awsCredentials;
};

// Extract AWS role from SAML attributes
export const extractAWSRoleFromSAML = (samlAttributes: any) => {
  const roleAttribute = samlAttributes['https://aws.amazon.com/SAML/Attributes/Role'] ||
                       samlAttributes['http://schemas.amazonaws.com/SAML/Attributes/Role'];
  
  if (!roleAttribute || !Array.isArray(roleAttribute) || roleAttribute.length === 0) {
    return null;
  }
  
  // Role attribute format: "arn:aws:iam::ACCOUNT:saml-provider/PROVIDER,arn:aws:iam::ACCOUNT:role/ROLE"
  const rolePair = roleAttribute[0];
  const [principalArn, roleArn] = rolePair.split(',');
  
  return { principalArn: principalArn.trim(), roleArn: roleArn.trim() };
};

// Session service class for backward compatibility
export class SessionService {
  // ... keep your existing SessionService methods ...
  // They will work alongside the new SAML functionality
}