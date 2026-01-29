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
// ==================== CORS ====================
const corsOptions = {
    origin: process.env.FRONTEND_URL || "http://localhost:8080",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposedHeaders: ["Set-Cookie"]
};
app.use((0, cors_1.default)(corsOptions));
// ==================== Core Middleware ====================
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
// ==================== Session ====================
app.use((0, express_session_1.default)({
    name: "eon.sid",
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
    },
}));
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
if (process.env.ENABLE_SAML === "true" || process.env.NODE_ENV === "production") {
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
    res.redirect("http://localhost:8080/login");
});
app.use("/auth", authRoutes_1.default);
app.use("/api", apiRoutes_1.default);
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
app.use(errorMiddleware_1.errorHandler);
// ==================== Start ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
