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
const cookie_parser_1 = __importDefault(require("cookie-parser")); // ← ADD THIS
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const apiRoutes_1 = __importDefault(require("./routes/apiRoutes"));
const errorMiddleware_1 = require("./middlewares/errorMiddleware");
const session_middleware_1 = require("./middlewares/session.middleware");
const app = (0, express_1.default)();
// Enable SAML authentication (feature flag)
const ENABLE_SAML = process.env.ENABLE_SAML === 'true' || process.env.NODE_ENV === 'production';
// Request logging middleware
app.use((req, res, next) => {
    console.log(`🌐 ${req.method} ${req.originalUrl}`);
    next();
});
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || "http://localhost:8080",
    credentials: true
}));
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)()); // ← ADD THIS LINE (important for reading cookies)
// Session middleware (for SAML)
app.use(session_middleware_1.sessionMiddleware);
// Initialize Passport for SAML if enabled
if (ENABLE_SAML) {
    app.use(passport_1.default.initialize());
    app.use(passport_1.default.session());
    console.log('SAML authentication enabled');
}
else {
    console.log('Running with development/local authentication');
}
// Routes
app.use("/auth", authRoutes_1.default);
app.use("/api", apiRoutes_1.default);
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
app.use(errorMiddleware_1.errorHandler);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🔐 SAML Authentication: ${ENABLE_SAML ? 'ENABLED' : 'DISABLED'}`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:8080'}`);
    console.log(`🔧 Development mode: ${process.env.NODE_ENV || 'development'}`);
});
