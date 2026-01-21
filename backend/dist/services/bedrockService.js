"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invokeBedrockModel = void 0;
const client_bedrock_runtime_1 = require("@aws-sdk/client-bedrock-runtime");
const credential_providers_1 = require("@aws-sdk/credential-providers");
// Initialize Bedrock client with SSO profile
const bedrockClient = new client_bedrock_runtime_1.BedrockRuntimeClient({
    region: process.env.AWS_REGION || "us-west-2",
    credentials: (0, credential_providers_1.fromSSO)({ profile: "bedrock-dev" }),
});
/**
 * Send a prompt to Bedrock model and return the response
 * @param prompt The text input
 */
const invokeBedrockModel = async (prompt) => {
    try {
        const command = new client_bedrock_runtime_1.InvokeModelCommand({
            modelId: process.env.BEDROCK_MODEL_ID || "anthropic.claude-3-haiku-20240307-v1:0",
            body: JSON.stringify({ inputText: prompt }),
        });
        const response = await bedrockClient.send(command);
        // Convert response stream to string
        const bodyString = await streamToString(response.body);
        const parsed = JSON.parse(bodyString);
        // Depending on the model, adjust to extract text output
        return parsed?.outputText || parsed?.result || JSON.stringify(parsed);
    }
    catch (error) {
        console.error("Bedrock API error:", error);
        throw new Error("Failed to get response from Bedrock model");
    }
};
exports.invokeBedrockModel = invokeBedrockModel;
// Helper function to convert ReadableStream to string
const streamToString = async (stream) => {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks).toString("utf-8");
};
