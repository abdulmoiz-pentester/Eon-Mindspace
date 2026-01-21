"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bedrockController_1 = require("../controllers/bedrockController");
const router = (0, express_1.Router)();
router.post("/bedrock-agent", bedrockController_1.getBedrockAgentResponse);
exports.default = router;
