import session from 'express-session';
import { RequestHandler } from 'express';

export const sessionMiddleware: RequestHandler = session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    domain: process.env.NODE_ENV === 'production' ? '.yourdomain.com' : 'localhost'
  },
  name: 'eon.sid'
});