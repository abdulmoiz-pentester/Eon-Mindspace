import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { AwsCredentialIdentity } from '@aws-sdk/types';
import { STSClient, AssumeRoleWithSAMLCommand } from "@aws-sdk/client-sts";
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    awsCredentials?: AwsCredentialIdentity;
  }
}

const stsClient = new STSClient({ region: 'us-west-2' });

// SAML User type
interface SamlUser {
  nameID: string;
  email?: string;
  sessionIndex?: string;
  [key: string]: any;
}

// Extended Request to include typed user
export interface AuthRequest extends Request {
  user?: SamlUser;
}

class authController {
  // ==================== SAML Login ====================
 async login(req: AuthRequest, res: Response, next: NextFunction) {
      try {
    const awsCredentials = await defaultProvider()(); // auto picks up default SSO login
    req.session.awsCredentials = awsCredentials; // store in session
    console.log("✅ AWS credentials stored in session:", {
      accessKeyId: awsCredentials.accessKeyId,
      hasSessionToken: !!awsCredentials.sessionToken,
      expiration: awsCredentials.expiration?.toISOString(),
    });
  } catch (e) {
    console.error("❌ Failed to load AWS credentials from SSO:", e);
  }
  const token = req.cookies.jwt;

  // 1️⃣ JWT exists → redirect directly
  if (token) {
    try {
      jwt.verify(token, process.env.JWT_SECRET!);
      console.log('✅ JWT valid, redirecting to chatbot');
      return res.redirect('http://localhost:8081/');
    } catch {
      console.log('⚠️ JWT invalid or expired, continue to SSO login');
    }
  }

  // 2️⃣ Check if SSO session exists
  if (req.isAuthenticated && req.isAuthenticated()) {
    console.log('🔐 SSO session active, issuing JWT silently');
    const user = req.user as SamlUser;

    const token = jwt.sign(
      {
        userId: user.nameID,
        email: user.email || user.nameID,
        sessionId: req.sessionID,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.redirect('http://localhost:8081/');
  }

  // 3️⃣ Otherwise → normal SAML login
  console.log('🔐 No JWT or SSO session, starting SAML login');
  passport.authenticate('saml', {
    failureRedirect: '/login',
    failureFlash: true,
  })(req, res, next);
}



  // ==================== SAML Callback ====================

callback(req: AuthRequest, res: Response, next: NextFunction) {
  passport.authenticate('saml', { failureRedirect: 'http://localhost:8081/login' })(req, res, async () => {
    if (!req.user) return res.redirect('http://localhost:8081/login');

    const authenticatedUser = req.user;

    // No AWS credentials stuff here

    const token = jwt.sign(
      { userId: authenticatedUser.nameID, email: authenticatedUser.email || authenticatedUser.nameID, sessionId: req.sessionID },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    res.cookie('jwt', token, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 24*60*60*1000 });
    res.redirect('http://localhost:8081/');
  });
}

  // ==================== Logout ====================
async logout(req: AuthRequest, res: Response) {
  try {
    // 1️⃣ Logout Passport
    await new Promise<void>((resolve, reject) => {
      req.logout((err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    // 2️⃣ Destroy session
    await new Promise<void>((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destroy error:', err);
          return reject(err);
        }
        resolve();
      });
    });

    // 3️⃣ Clear cookies
    res.clearCookie('jwt', { path: '/' });
res.clearCookie('connect.sid', { path: '/' });

    // 4️⃣ Redirect to SSO logout or frontend login
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8081';
    const idpLogoutUrl = process.env.SAML_LOGOUT_URL || '';

    if (process.env.ENABLE_SAML === 'true' && idpLogoutUrl) {
      console.log('🔐 Redirecting to SSO logout');
      return res.redirect(idpLogoutUrl);
    }

    res.redirect(`${frontendUrl}/login`);
  } catch (err) {
    console.error('Logout failed:', err);
    res.status(500).send('Failed to logout');
  }
}




  // ==================== Check Auth Status ====================
  checkAuth(req: AuthRequest, res: Response) {
    const token = req.cookies.jwt;
    if (!token) return res.json({ authenticated: false });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      res.json({ authenticated: true, user: decoded });
    } catch {
      res.json({ authenticated: false });
    }
  }

  // ==================== Get Current User ====================
  getCurrentUser(req: AuthRequest, res: Response) {
    const token = req.cookies.jwt;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      res.json({ user: decoded });
    } catch {
      res.status(401).json({ error: 'Invalid token' });
    }
  }

  // ==================== Require Auth Middleware ====================
  requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies.jwt;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    (req as AuthRequest).user = decoded as SamlUser; // typecast here
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(401).json({ error: 'Invalid token' });
  }
}
}

export default new authController();
