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

// ==================== CORS ====================
const corsOptions = {
origin: process.env.FRONTEND_URL || "http://localhost:8081",
credentials: true,
methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
exposedHeaders: ["Set-Cookie"] 
};

app.use(cors(corsOptions));

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
    secure: false,      // keep false for localhost
    sameSite: 'lax',    // 'lax' works for redirect-based login
    maxAge: 24 * 60 * 60 * 1000,
  },
})
);
app.use((req, res, next) => {
  console.log('\n=== REQUEST DEBUG ===');
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log('Session ID:', req.sessionID);
  console.log('Session:', req.session);
  console.log('Cookies:', req.cookies);
  console.log('Headers:', req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body keys:', Object.keys(req.body));
    // Don't log full SAML response (it's huge)
    if (req.body.SAMLResponse) {
      console.log('Has SAMLResponse (truncated):', req.body.SAMLResponse.substring(0, 100) + '...');
    }
  }
  console.log('=====================\n');
  next();
});

// ==================== Passport ====================
// IMPORTANT: load passport config ONLY when needed
if (process.env.ENABLE_SAML === "true")
{
require("./config/passport");
console.log("✅ SAML strategy registered");
} else {
console.log("⚠️ SAML disabled (dev mode)");
}

app.use(passport.initialize());
app.use(passport.session());

// ==================== Routes ====================
app.get("/", (req, res) => {
  res.redirect(process.env.FRONTEND_URL!);
});

app.use("/auth", authRoutes);
app.use("/api", apiRoutes);

app.get("/health", (req, res) => {
res.json({
status: "OK",
samlEnabled: process.env.ENABLE_SAML === "true",
env: process.env.NODE_ENV,
});
});

// ==================== 404 (EXPRESS 5 SAFE) ====================
app.use((req, res) => {
res.status(404).json({
error: "Not Found",
path: req.originalUrl,
});
});

// ==================== Error Handler ====================
app.use(errorHandler);

// ==================== Start ====================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
console.log(`✅ Server running on port ${PORT}`);
});
