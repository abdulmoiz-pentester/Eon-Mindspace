"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_bedrock_runtime_1 = require("@aws-sdk/client-bedrock-runtime");
const credential_providers_1 = require("@aws-sdk/credential-providers");
// SSO profile directly
const client = new client_bedrock_runtime_1.BedrockRuntimeClient({
    region: "us-west-2",
    credentials: (0, credential_providers_1.fromIni)({ profile: "bedrock-dev" }),
});
async function invokeAgent(prompt) {
    const payload = { inputText: prompt };
    const command = new client_bedrock_runtime_1.InvokeModelCommand({
        modelId: "ZBYIUMEYOE", // Your agent ID
        body: new TextEncoder().encode(JSON.stringify(payload)),
        contentType: "application/json",
        accept: "application/json",
    });
    const response = await client.send(command);
    const decoded = new TextDecoder().decode(response.body);
    return JSON.parse(decoded);
}
// Test
invokeAgent("Hello AI").then(console.log).catch(console.error);
