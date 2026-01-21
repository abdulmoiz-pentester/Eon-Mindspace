"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invokeAgent = void 0;
// services/bedrockAgentService.ts
const client_bedrock_agent_runtime_1 = require("@aws-sdk/client-bedrock-agent-runtime");
const credential_providers_1 = require("@aws-sdk/credential-providers");
// Create a function to get fresh credentials
const getFreshCredentials = async () => {
    try {
        // Use fromSSO which will handle token refresh if needed
        return (0, credential_providers_1.fromSSO)({
            profile: "bedrock-dev",
            // Optional: Force refresh if token is expired
            clientConfig: { region: "us-west-2" }
        })();
    }
    catch (error) {
        console.error("❌ Failed to get SSO credentials:", error.message);
        // If token is expired/invalid, prompt user to login
        if (error.message.includes('token') ||
            error.message.includes('expired') ||
            error.name === 'UnrecognizedClientException') {
            console.error("\n🔑 AWS SSO TOKEN EXPIRED OR INVALID");
            console.error("Run this command to refresh:");
            console.error("aws sso login --profile bedrock-dev");
            console.error("\nOr use IAM credentials instead (see .env.example)");
            // Check if IAM credentials are available as fallback
            if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
                console.log("🔄 Falling back to IAM credentials from environment...");
                return {
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                    sessionToken: process.env.AWS_SESSION_TOKEN, // optional
                };
            }
        }
        throw error;
    }
};
// Create client with dynamic credentials
const client = new client_bedrock_agent_runtime_1.BedrockAgentRuntimeClient({
    region: "us-west-2",
    credentials: getFreshCredentials,
});
const invokeAgent = async (agentArn, inputText, agentAliasId = "TSTALIASID") => {
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
            console.log("🔧 Processing stream...");
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
