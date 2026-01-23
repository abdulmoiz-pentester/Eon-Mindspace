import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { UserInfo } from './saml.services';
import { getAWSSSOConfig } from '../config/aws.sso.config';

export interface SessionToken {
  userId: string;        // Email
  email: string;
  name: string;
  company: string;
  groups: string[];
  domain: string;
  sessionId: string;
  iat: number;
  exp: number;
}

export class SessionService {
  private secret: string;
  private config: ReturnType<typeof getAWSSSOConfig>;
  
  constructor() {
    this.config = getAWSSSOConfig();
    this.secret = this.config.session.secret;
  }
  
  /**
   * Create JWT session token from user info
   */
  createSession(userInfo: UserInfo): { token: string; expiresAt: Date } {
    const expiresIn = 24 * 60 * 60; // 24 hours in seconds
    const expiresAt = new Date(Date.now() + expiresIn * 1000);
    const sessionId = randomBytes(16).toString('hex');
    
    const payload: SessionToken = {
      userId: userInfo.email,
      email: userInfo.email,
      name: userInfo.name,
      company: userInfo.company,
      groups: userInfo.groups,
      domain: userInfo.domain,
      sessionId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(expiresAt.getTime() / 1000)
    };
    
    const token = jwt.sign(payload, this.secret, {
      algorithm: 'HS256'
    });
    
    return { token, expiresAt };
  }
  
  /**
   * Verify JWT session token
   */
  verifySession(token: string): SessionToken | null {
    try {
      const decoded = jwt.verify(token, this.secret) as SessionToken;
      
      // Check if token is expired
      if (decoded.exp < Math.floor(Date.now() / 1000)) {
        return null;
      }
      
      return decoded;
    } catch (error) {
      console.error('Session verification failed:', error);
      return null;
    }
  }
  
  /**
   * Extract session from request cookies
   */
  getSessionFromRequest(req: any): SessionToken | null {
    const cookies = req.headers.cookie;
    if (!cookies) return null;
    
    const match = cookies.match(new RegExp(`(^| )${this.config.session.cookieName}=([^;]+)`));
    if (!match) return null;
    
    return this.verifySession(match[2]);
  }
  
  /**
   * Set session cookie in response
   */
  setSessionCookie(res: any, token: string, expiresAt: Date): void {
    res.cookie(this.config.session.cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/'
    });
  }
  
  /**
   * Clear session cookie
   */
  clearSessionCookie(res: any): void {
    res.clearCookie(this.config.session.cookieName, {
      path: '/'
    });
  }
}