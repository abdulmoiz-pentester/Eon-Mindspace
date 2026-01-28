"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bedrockController_1 = require("../controllers/bedrockController");
const requireAuth_1 = require("../middlewares/requireAuth");
const router = (0, express_1.Router)();
// Protected API endpoints
router.post("/bedrock-agent", requireAuth_1.requireAuth, bedrockController_1.getBedrockAgentResponse);
// Example protected endpoint
router.get('/user/profile', requireAuth_1.requireAuth, (req, res) => {
    res.json({
        user: req.user,
        timestamp: new Date().toISOString()
    });
});
exports.default = router;
