"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const apiRoutes_1 = __importDefault(require("./routes/apiRoutes"));
const errorMiddleware_1 = require("./middlewares/errorMiddleware");
const session_middleware_1 = require("./middlewares/session.middleware");
// ← Import SAML strategy BEFORE passport.init
if (process.env.ENABLE_SAML === 'true' || process.env.NODE_ENV === 'production') {
    Promise.resolve().then(() => __importStar(require('./config/passport'))).catch(err => console.error('Failed to load SAML strategy:', err));
}
const app = (0, express_1.default)();
// Logging
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
app.use((0, cookie_parser_1.default)());
app.use(session_middleware_1.sessionMiddleware);
// Initialize Passport
if (process.env.ENABLE_SAML === 'true' || process.env.NODE_ENV === 'production') {
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
app.use(errorMiddleware_1.errorHandler);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🔐 SAML Authentication: ${process.env.ENABLE_SAML === 'true' ? 'ENABLED' : 'DISABLED'}`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:8080'}`);
});
