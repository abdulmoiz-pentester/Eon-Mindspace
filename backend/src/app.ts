import express from "express";
import cors from "cors";
import morgan from "morgan";
import session from "express-session";
import passport from "passport";
import cookieParser from "cookie-parser"; // ← ADD THIS
import authRoutes from "./routes/authRoutes";
import apiRoutes from "./routes/apiRoutes";
import { errorHandler } from "./middlewares/errorMiddleware";
import { sessionMiddleware } from "./middlewares/session.middleware";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Enable SAML authentication (feature flag)
const ENABLE_SAML = process.env.ENABLE_SAML === 'true' || process.env.NODE_ENV === 'production';

// Request logging middleware
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.originalUrl}`);
  next();
});

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:8080",
  credentials: true
}));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // ← ADD THIS LINE (important for reading cookies)

// Session middleware (for SAML)
app.use(sessionMiddleware);

// Initialize Passport for SAML if enabled
if (ENABLE_SAML) {
  app.use(passport.initialize());
  app.use(passport.session());
  console.log('SAML authentication enabled');
} else {
  console.log('Running with development/local authentication');
}

// Routes
app.use("/auth", authRoutes);
app.use("/api", apiRoutes);

// Add a test route to verify
app.get('/auth/test', (req, res) => {
  console.log('✅ /auth/test route called');
  res.json({ 
    message: 'Auth routes are working!',
    timestamp: new Date().toISOString(),
    cookies: req.cookies
  });
});

// Error middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔐 SAML Authentication: ${ENABLE_SAML ? 'ENABLED' : 'DISABLED'}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:8080'}`);
  console.log(`🔧 Development mode: ${process.env.NODE_ENV || 'development'}`);
});