"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAgentHealth = exports.getBedrockAgentResponse = void 0;
const bedrockService_1 = require("../services/bedrockService");
const getBedrockAgentResponse = async (req, res) => {
    try {
        const { message, agentAliasId } = req.body;
        if (!message) {
            return res.status(400).json({
                success: false,
                error: "Message is required in the request body"
            });
        }
        // Use environment variable or hardcoded ARN
        const agentArn = process.env.BEDROCK_AGENT_ARN ||
            "arn:aws:bedrock:us-west-2:965631485706:agent/ZBYIUMEYOE";
        // Default to TSTALIASID if not specified
        const aliasId = agentAliasId || "TSTALIASID";
        console.log(`Invoking Bedrock Agent:
      - Agent ID: ${agentArn.split('/').pop()}
      - Alias ID: ${aliasId}
      - Message: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}
    `);
        // Call the service function
        const response = await (0, bedrockService_1.invokeAgent)(agentArn, message, aliasId);
        // Return the response
        res.json({
            success: true,
            response: response,
            agentAliasUsed: aliasId,
            timestamp: new Date().toISOString()
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
// Optional: Add a health check function
const getAgentHealth = async (req, res) => {
    res.json({
        success: true,
        message: "Bedrock Agent service is running",
        agentArn: process.env.BEDROCK_AGENT_ARN || "arn:aws:bedrock:us-west-2:965631485706:agent/ZBYIUMEYOE",
        availableAliases: [
            { id: "TSTALIASID", name: "AgentTestAlias", description: "Test Alias for Agent" },
            { id: "L3UQ4TMBQ8", name: "Eon-Mindspace", description: "Production alias" }
        ],
        region: "us-west-2"
    });
};
exports.getAgentHealth = getAgentHealth;
