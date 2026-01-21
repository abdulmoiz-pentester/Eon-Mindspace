"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var bedrockController_1 = require("../controllers/bedrockController");
var authMiddleware_1 = require("../middlewares/authMiddleware");
var router = express_1.default.Router();
// Protected route to invoke chatbot
router.post("/invoke-bedrock", authMiddleware_1.authMiddleware, bedrockController_1.chatBotHandler);
exports.default = router;
