"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invokeAgent = void 0;
const client_bedrock_agent_runtime_1 = require("@aws-sdk/client-bedrock-agent-runtime");
const invokeAgent = async (agentArn, inputText, agentAliasId = "L3UQ4TMBQ8") => {
    try {
        const agentId = agentArn.split('/').pop() || "ZBYIUMEYOE";
        const client = new client_bedrock_agent_runtime_1.BedrockAgentRuntimeClient({
            region: "us-west-2",
            // credentials not needed, uses AWS_PROFILE env automatically
        });
        const command = new client_bedrock_agent_runtime_1.InvokeAgentCommand({
            agentId,
            agentAliasId,
            sessionId: `session-${Date.now()}`,
            inputText,
        });
        const response = await client.send(command);
        const chunks = [];
        if (response.completion) {
            for await (const chunk of response.completion) {
                if (chunk.chunk?.bytes) {
                    chunks.push(new TextDecoder().decode(chunk.chunk.bytes));
                }
            }
        }
        return chunks.join("");
    }
    catch (err) {
        console.error("🚨 AGENT ERROR:", err.name, "-", err.message);
        if (err.name === "UnrecognizedClientException") {
            console.error("💡 Run: aws sso login --profile your-profile");
        }
        throw new Error(`Bedrock Agent error: ${err.message}`);
    }
};
exports.invokeAgent = invokeAgent;
