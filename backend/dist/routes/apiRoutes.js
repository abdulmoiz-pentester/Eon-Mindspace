"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bedrockController_1 = require("../controllers/bedrockController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Protected API endpoints
router.post("/bedrock-agent", 
//requireAuth,  
bedrockController_1.getBedrockAgentResponse);
// Example protected endpoint
router.get('/user/profile', authMiddleware_1.requireAuth, (req, res) => {
    res.json({
        user: req.user,
        timestamp: new Date().toISOString()
    });
});
exports.default = router;
