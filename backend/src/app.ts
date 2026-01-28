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
import { sessionMiddleware } from "./middlewares/session.middleware";

// ← Import SAML strategy BEFORE passport.init
if (process.env.ENABLE_SAML === 'true' || process.env.NODE_ENV === 'production') {
  import('./config/passport').catch(err => console.error('Failed to load SAML strategy:', err));
}

const app = express();

// Logging
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
app.use(cookieParser());
app.use(sessionMiddleware);

// Initialize Passport
if (process.env.ENABLE_SAML === 'true' || process.env.NODE_ENV === 'production') {
  app.use(passport.initialize());
  app.use(passport.session());
  console.log('SAML authentication enabled');
} else {
  console.log('Running with development/local authentication');
}

// Routes
app.use("/auth", authRoutes);
app.use("/api", apiRoutes);


app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔐 SAML Authentication: ${process.env.ENABLE_SAML === 'true' ? 'ENABLED' : 'DISABLED'}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:8080'}`);
});
