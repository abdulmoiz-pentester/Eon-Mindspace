"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBedrockAgentResponse = void 0;
const bedrockService_1 = require("../services/bedrockService");
const getBedrockAgentResponse = async (req, res) => {
    try {
        const { message, agentAliasId } = req.body;
        const authReq = req;
        if (!authReq.user) {
            return res.status(401).json({
                success: false,
                error: "Authentication required",
                loginUrl: "/auth/login"
            });
        }
        if (!message) {
            return res.status(400).json({
                success: false,
                error: "Message is required in the request body"
            });
        }
        const agentArn = process.env.BEDROCK_AGENT_ARN ||
            "arn:aws:bedrock:us-west-2:965631485706:agent/ZBYIUMEYOE";
        const aliasId = agentAliasId || "L3UQ4TMBQ8";
        console.log(`Invoking Bedrock Agent:
      - Agent ID: ${agentArn.split('/').pop()}
      - Alias ID: ${aliasId}
      - Message: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}
    `);
        const response = await (0, bedrockService_1.invokeAgent)(agentArn, message, aliasId);
        res.json({
            success: true,
            answer: response,
            agentAliasUsed: aliasId,
            timestamp: new Date().toISOString(),
            user: authReq.user.email,
        });
    }
    catch (err) {
        console.error("Controller error:", err);
        res.status(500).json({
            success: false,
            error: err.message || "Failed to get response from Bedrock agent",
            timestamp: new Date().toISOString()
        });
    }
};
exports.getBedrockAgentResponse = getBedrockAgentResponse;
