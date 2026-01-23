import session from 'express-session';
import { getAWSSSOConfig } from '../config/aws.sso.config';

const config = getAWSSSOConfig();

/**
 * Express session middleware with store configuration
 * In production, use Redis or another session store
 */
export const sessionMiddleware = session({
  name: config.session.cookieName,
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: config.session.maxAge
  },
  // In production, you should use a session store like Redis
  store: process.env.REDIS_URL ? 
    // new RedisStore({ url: process.env.REDIS_URL }) // Uncomment when Redis is configured
    undefined : undefined
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