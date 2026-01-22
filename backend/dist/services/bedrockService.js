"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invokeAgent = void 0;
// services/bedrockAgentService.ts
const client_bedrock_agent_runtime_1 = require("@aws-sdk/client-bedrock-agent-runtime");
const credential_providers_1 = require("@aws-sdk/credential-providers");
// Create client with dynamic credentials but its not working in my dev environment
//const client = new BedrockAgentRuntimeClient();
const client = new client_bedrock_agent_runtime_1.BedrockAgentRuntimeClient({
    region: "us-west-2",
    credentials: (0, credential_providers_1.fromSSO)({
        profile: "bedrock-dev",
    }),
});
const invokeAgent = async (agentArn, inputText, agentAliasId = "L3UQ4TMBQ8") => {
    try {
        console.log("🔧 Invoking Bedrock Agent...");
        const agentId = agentArn.split('/').pop() || 'ZBYIUMEYOE';
        console.log(`🔧 Agent ID: ${agentId}, Alias ID: ${agentAliasId}`);
        const command = new client_bedrock_agent_runtime_1.InvokeAgentCommand({
            agentId,
            agentAliasId,
            sessionId: `session-${Date.now()}`,
            inputText,
        });
        console.log("🔧 Sending command...");
        const response = await client.send(command);
        console.log("✅ Received response");
        const chunks = [];
        if (response.completion) {
            for await (const chunk of response.completion) {
                if (chunk.chunk?.bytes) {
                    chunks.push(new TextDecoder().decode(chunk.chunk.bytes));
                }
            }
        }
        const result = chunks.join('');
        console.log(`✅ Response (${result.length} chars):`, result.substring(0, 100) + '...');
        return result;
    }
    catch (err) {
        console.error("🚨 AGENT ERROR:", err.name, "-", err.message);
        if (err.name === 'UnrecognizedClientException') {
            console.error("\n💡 QUICK FIX: Run this command then try again:");
            console.error("aws sso login --profile bedrock-dev");
        }
        throw new Error(`Bedrock Agent error: ${err.message}`);
    }
};
exports.invokeAgent = invokeAgent;
