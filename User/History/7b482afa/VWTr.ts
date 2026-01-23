import session from 'express-session';
import { getAWSSSOConfig } from '../config/aws.sso.config';

const config = getAWSSSOConfig();

/**
 * Express session middleware
 */
export const sessionMiddleware = session({
  name: config.session.cookieName,
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: config.session.maxAge
  }
});

/**
 * Add user to response locals for templates
 */
export const userLocals = (req: any, res: any, next: any) => {
  if (req.user) {
    res.locals.user = req.user;
  }
  next();
};