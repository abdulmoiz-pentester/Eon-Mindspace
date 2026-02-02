import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import morgan from "morgan";
import passport from "passport";
import cookieParser from "cookie-parser";
import session from "express-session";

import authRoutes from "./routes/authRoutes";
import apiRoutes from "./routes/apiRoutes";
import { errorHandler } from "./middlewares/errorMiddleware";

const app = express();
app.get('/debug-auth', (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    cookies: req.cookies,
    headers: {
      origin: req.headers.origin,
      cookie: req.headers.cookie,
    },
    session: {
      id: req.sessionID,
      authenticated: req.isAuthenticated ? req.isAuthenticated() : false,
      user: req.user,
    },
    env: {
      frontendUrl: process.env.FRONTEND_URL,
      jwtSecret: process.env.JWT_SECRET ? 'Set' : 'Not set',
    }
  });
});
// In app.ts, add this test route:
app.get('/set-test-cookie', (req, res) => {
  res.cookie('test_cookie', 'working_' + Date.now(), {
    httpOnly: false,
    secure: false,
    sameSite: 'lax',
    maxAge: 3600000,
    path: '/'
  });
  
  res.json({
    success: true,
    message: 'Test cookie set',
    cookiesOnServer: req.cookies
  });
});

app.get('/check-test-cookie', (req, res) => {
  res.json({
    testCookie: req.cookies.test_cookie,
    allCookies: req.cookies
  });
});
// ==================== CORS ====================
// Define allowed origins
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:3000', 
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.FRONTEND_URL
].filter((origin): origin is string => origin !== undefined && origin !== "process.env.FRONTEND_URL");

console.log('🌐 Allowed CORS origins:', allowedOrigins);

// For development, allow all origins to debug
// ==================== SIMPLE CORS ====================
app.use(cors({
  origin: 'http://localhost:8080', // Your exact frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Handle preflight
app.options('*', cors());



// ==================== Core Middleware ====================
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ==================== Session ====================
app.use(
  session({
    name: "eon.sid",
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // MUST be false for localhost
      sameSite: 'lax', // Changed from 'none' to 'lax'
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
      // REMOVE domain: 'localhost' - let browser handle it
    },
  })
);

// Debug middleware
app.use((req, res, next) => {
  console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log('Origin:', req.headers.origin);
  console.log('Cookies:', req.cookies);
  next();
});

// ==================== Passport ====================
if (process.env.ENABLE_SAML === "true") {
  require("./config/passport");
  console.log("✅ SAML strategy registered");
} else {
  console.log("⚠️ SAML disabled (dev mode)");
}

app.use(passport.initialize());
app.use(passport.session());

// ==================== Routes ====================
app.get("/", (req, res) => {
  res.json({ 
    message: "Backend API is running",
    frontend: process.env.FRONTEND_URL,
    timestamp: new Date().toISOString()
  });
});

// Health check endpoints
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    samlEnabled: process.env.ENABLE_SAML === "true",
    env: process.env.NODE_ENV,
    frontendUrl: process.env.FRONTEND_URL,
    timestamp: new Date().toISOString()
  });
});

app.get('/health-check', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    cookies: req.cookies,
    origin: req.headers.origin,
    sessionId: req.sessionID
  });
});

// CORS test endpoint
app.get('/cors-test', (req, res) => {
  res.json({
    success: true,
    message: 'CORS is working!',
    origin: req.headers.origin,
    timestamp: new Date().toISOString(),
    cookies: req.headers.cookie ? 'Cookies present' : 'No cookies'
  });
});

// Main routes
app.use("/auth", authRoutes);
app.use("/api", apiRoutes);

// ==================== 404 ====================
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// ==================== Error Handler ====================
app.use(errorHandler);

// ==================== Start ====================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n✅ Server running on port ${PORT}`);
  console.log(`🌐 CORS configured for development (allowing all origins)`);
  console.log(`🔐 SAML enabled: ${process.env.ENABLE_SAML === "true"}`);
  console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`);
});