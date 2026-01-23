import { Request, Response } from 'express';
import { STSClient, AssumeRoleWithSAMLCommand } from '@aws-sdk/client-sts';
import awsConfig from '../config/aws';
import jwt from 'jsonwebtoken';

// JWT secret for session tokens
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production';

export interface UserSessionData {
  id?: string;
  email: string;
  name: string;
  company: string;
  groups: string[];
  domain: string;
  samlSessionIndex?: string;
  awsRoles?: string[];
  roles?: string[];
  awsCredentials?: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken: string;
    expiration: Date;
  };
  [key: string]: any;
}

export interface SessionToken {
  token: string;
  expiresAt: Date;
}

export interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  expiration: Date;
}

// Service to get AWS credentials from SAML assertion
export const getCredentialsFromSAML = async (
  samlAssertion: string,
  roleArn: string,
  principalArn: string
): Promise<AWSCredentials> => {
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
export const getCurrentAWSCredentials = (req: Request): AWSCredentials => {
  if (!(req as any).isAuthenticated || !(req as any).isAuthenticated()) {
    throw new Error('User not authenticated');
  }
  
  const user = (req as any).user as UserSessionData;
  
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
  /**
   * Create a new session for a user
   */
  createSession(userInfo: UserSessionData): SessionToken {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    const tokenPayload = {
      id: userInfo.id || userInfo.email,
      email: userInfo.email,
      name: userInfo.name,
      company: userInfo.company,
      groups: userInfo.groups || [],
      domain: userInfo.domain,
      samlSessionIndex: userInfo.samlSessionIndex,
      awsRoles: userInfo.awsRoles || [],
      roles: userInfo.roles || [],
      exp: Math.floor(expiresAt.getTime() / 1000)
    };
    
    const token = jwt.sign(tokenPayload, JWT_SECRET);
    
    return {
      token,
      expiresAt
    };
  }

  /**
   * Set session cookie in response
   */
  setSessionCookie(res: Response, token: string, expiresAt: Date): void {
    res.cookie('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      expires: expiresAt,
      path: '/'
    });
  }

  /**
   * Create session and set cookie in one call
   */
  createSessionCookie(userInfo: UserSessionData, res: Response): SessionToken {
    const session = this.createSession(userInfo);
    this.setSessionCookie(res, session.token, session.expiresAt);
    return session;
  }

  /**
   * Clear session cookie
   */
  clearSessionCookie(res: Response): void {
    res.clearCookie('session_token', { path: '/' });
  }

  /**
   * Get session from request (cookie or Authorization header)
   */
  getSessionFromRequest(req: Request): UserSessionData | null {
    try {
      // Check for session cookie
      let token = req.cookies?.session_token;
      
      // Also check Authorization header for Bearer token
      if (!token && req.headers.authorization) {
        const authHeader = req.headers.authorization;
        if (authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7);
        }
      }
      
      if (!token) {
        return null;
      }
      
      // Verify JWT token
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      // Check if token is expired
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        return null;
      }
      
      return {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        company: decoded.company,
        groups: decoded.groups || [],
        domain: decoded.domain,
        samlSessionIndex: decoded.samlSessionIndex,
        awsRoles: decoded.awsRoles || [],
        roles: decoded.roles || []
      };
    } catch (error) {
      console.error('Session validation error:', error);
      return null;
    }
  }

  /**
   * Store AWS credentials in session
   */
  setAWSCredentials(req: Request, credentials: AWSCredentials): void {
    if (!(req as any).session) {
      (req as any).session = {};
    }
    (req as any).session.awsCredentials = credentials;
  }
  
  /**
   * Get AWS credentials from session
   */
  getAWSCredentials(req: Request): AWSCredentials | null {
    return (req as any).session?.awsCredentials || null;
  }

  /**
   * Validate session token
   */
  validateSession(token: string): UserSessionData | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        return null;
      }
      
      return {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        company: decoded.company,
        groups: decoded.groups || [],
        domain: decoded.domain,
        samlSessionIndex: decoded.samlSessionIndex,
        awsRoles: decoded.awsRoles || [],
        roles: decoded.roles || []
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Refresh session - create new token with same user data
   */
  refreshSession(oldToken: string): SessionToken | null {
    const userData = this.validateSession(oldToken);
    if (!userData) {
      return null;
    }
    
    return this.createSession(userData);
  }

  /**
   * Check if session exists and is valid
   */
  hasValidSession(req: Request): boolean {
    return this.getSessionFromRequest(req) !== null;
  }

  /**
   * Get user ID from session
   */
  getUserId(req: Request): string | null {
    const session = this.getSessionFromRequest(req);
    return session?.id || session?.email || null;
  }

  /**
   * Get user email from session
   */
  getUserEmail(req: Request): string | null {
    const session = this.getSessionFromRequest(req);
    return session?.email || null;
  }

  /**
   * Check if user has specific role
   */
  hasRole(req: Request, role: string): boolean {
    const session = this.getSessionFromRequest(req);
    if (!session) return false;
    
    return session.roles?.includes(role) || session.groups?.includes(role) || false;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(req: Request, roles: string[]): boolean {
    const session = this.getSessionFromRequest(req);
    if (!session) return false;
    
    const userRoles = [...(session.roles || []), ...(session.groups || [])];
    return roles.some(role => userRoles.includes(role));
  }

  /**
   * Update session data
   */
  updateSession(req: Request, updates: Partial<UserSessionData>): UserSessionData | null {
    const session = this.getSessionFromRequest(req);
    if (!session) return null;
    
    const updatedSession = { ...session, ...updates };
    
    // If we want to update the actual session token, we need to:
    // 1. Get the current token
    // 2. Create new token with updated data
    // 3. Set new cookie
    // But for now, just return the updated session object
    return updatedSession;
  }

  /**
   * Invalidate session (logout)
   */
  invalidateSession(req: Request, res: Response): void {
    this.clearSessionCookie(res);
    
    // Also clear any session data stored in req.session
    if ((req as any).session) {
      (req as any).session.destroy?.();
    }
  }

  /**
   * Get all session data
   */
  getSessionData(req: Request): UserSessionData | null {
    return this.getSessionFromRequest(req);
  }

  /**
   * Create mock session for testing
   */
  createMockSession(email: string = 'test@example.com', name: string = 'Test User'): SessionToken {
    const mockUserInfo: UserSessionData = {
      id: `mock-${Date.now()}`,
      email,
      name,
      company: 'Test Company',
      groups: ['users'],
      domain: email.split('@')[1] || 'example.com',
      samlSessionIndex: `mock-session-${Date.now()}`
    };
    
    return this.createSession(mockUserInfo);
  }
}

// Export a default instance for convenience
export const sessionService = new SessionService();

// Legacy function aliases for backward compatibility
export const getSessionFromRequest = (req: Request) => sessionService.getSessionFromRequest(req);
export const createSession = (userInfo: UserSessionData) => sessionService.createSession(userInfo);
export const setSessionCookie = (res: Response, token: string, expiresAt: Date) => 
  sessionService.setSessionCookie(res, token, expiresAt);
export const clearSessionCookie = (res: Response) => sessionService.clearSessionCookie(res);