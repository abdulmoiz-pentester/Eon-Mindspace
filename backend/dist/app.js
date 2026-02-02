"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const passport_1 = __importDefault(require("passport"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_session_1 = __importDefault(require("express-session"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const apiRoutes_1 = __importDefault(require("./routes/apiRoutes"));
const errorMiddleware_1 = require("./middlewares/errorMiddleware");
const app = (0, express_1.default)();
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
].filter((origin) => origin !== undefined && origin !== "process.env.FRONTEND_URL");
console.log('🌐 Allowed CORS origins:', allowedOrigins);
// For development, allow all origins to debug
// ==================== SIMPLE CORS ====================
app.use((0, cors_1.default)({
    origin: 'http://localhost:8080', // Your exact frontend URL
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Handle preflight
app.options('*', (0, cors_1.default)());
// ==================== Core Middleware ====================
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
// ==================== Session ====================
app.use((0, express_session_1.default)({
    name: "eon.sid",
    secret: process.env.SESSION_SECRET,
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
}));
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
}
else {
    console.log("⚠️ SAML disabled (dev mode)");
}
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
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
app.use("/auth", authRoutes_1.default);
app.use("/api", apiRoutes_1.default);
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
app.use(errorMiddleware_1.errorHandler);
// ==================== Start ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n✅ Server running on port ${PORT}`);
    console.log(`🌐 CORS configured for development (allowing all origins)`);
    console.log(`🔐 SAML enabled: ${process.env.ENABLE_SAML === "true"}`);
    console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`);
});
