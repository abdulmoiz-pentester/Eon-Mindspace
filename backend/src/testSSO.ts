import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { fromIni } from "@aws-sdk/credential-providers";

// SSO profile directly
const client = new BedrockRuntimeClient({
  region: "us-west-2",
  credentials: fromIni({ profile: "bedrock-dev" }),
});

async function invokeAgent(prompt: string) {
  const payload = { inputText: prompt };

  const command = new InvokeModelCommand({
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
