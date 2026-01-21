import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

import { fromSSO } from "@aws-sdk/credential-providers";

// Initialize Bedrock client with SSO profile
const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-west-2",
  credentials: fromSSO({ profile: "bedrock-dev" }),
});

/**
 * Send a prompt to Bedrock model and return the response
 * @param prompt The text input
 */
export const invokeBedrockModel = async (prompt: string): Promise<string> => {
  try {
    const command = new InvokeModelCommand({
      modelId: process.env.BEDROCK_MODEL_ID || "anthropic.claude-3-haiku-20240307-v1:0",
      body: JSON.stringify({ inputText: prompt }),
    });

    const response = await bedrockClient.send(command);

    // Convert response stream to string
    const bodyString = await streamToString(response.body);
    const parsed = JSON.parse(bodyString);

    // Depending on the model, adjust to extract text output
    return parsed?.outputText || parsed?.result || JSON.stringify(parsed);
  } catch (error) {
    console.error("Bedrock API error:", error);
    throw new Error("Failed to get response from Bedrock model");
  }
};

// Helper function to convert ReadableStream to string
const streamToString = async (stream: any): Promise<string> => {
  const chunks: any[] = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString("utf-8");
};
