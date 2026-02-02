"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bedrockController_1 = require("../controllers/bedrockController");
const authController_1 = __importDefault(require("../controllers/authController"));
const router = (0, express_1.Router)();
// ==================== Apply auth to all API routes ====================
router.use(authController_1.default.requireAuth);
// Protected API endpoints
router.post("/bedrock-agent", bedrockController_1.getBedrockAgentResponse);
// Get user profile
router.get("/user/profile", (req, res) => {
    const authReq = req; // typecast here
    res.json({
        user: authReq.user,
        timestamp: new Date().toISOString(),
    });
});
// Health check
router.get("/health", (req, res) => {
    const authReq = req; // typecast here
    res.json({
        status: "OK",
        authenticated: true,
        user: authReq.user?.email || "authenticated",
    });
});
exports.default = router;
