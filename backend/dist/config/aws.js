"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invokeModel = exports.bedrockClient = void 0;
const client_bedrock_runtime_1 = require("@aws-sdk/client-bedrock-runtime"); // Note: bedrock-runtime instead of bedrock
const credential_providers_1 = require("@aws-sdk/credential-providers");
// Use SSO profile credentials
exports.bedrockClient = new client_bedrock_runtime_1.BedrockRuntimeClient({
    region: process.env.AWS_REGION || "us-west-2",
    credentials: (0, credential_providers_1.fromIni)({ profile: "bedrock-dev" }),
});
// Convert NodeJS ReadableStream to string
const streamToString = async (stream) => {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks).toString("utf-8");
};
// Function to invoke a Bedrock model
const invokeModel = async (modelId, input) => {
    const command = new client_bedrock_runtime_1.InvokeModelCommand({
        modelId,
        body: JSON.stringify({ inputText: input }),
    });
    const response = await exports.bedrockClient.send(command);
    // TypeScript may complain about body type, cast it as any
    const bodyString = await streamToString(response.body);
    try {
        return JSON.parse(bodyString);
    }
    catch {
        return bodyString; // fallback in case response is plain text
    }
};
exports.invokeModel = invokeModel;
