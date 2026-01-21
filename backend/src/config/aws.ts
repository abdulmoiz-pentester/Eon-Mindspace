import { 
  BedrockRuntimeClient,  // Note: BedrockRuntimeClient instead of BedrockClient
  InvokeModelCommand 
} from "@aws-sdk/client-bedrock-runtime";  // Note: bedrock-runtime instead of bedrock
import { fromIni } from "@aws-sdk/credential-providers";

// Use SSO profile credentials
export const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-west-2",
  credentials: fromIni({ profile: "bedrock-dev" }),
});

// Convert NodeJS ReadableStream to string
const streamToString = async (stream: any): Promise<string> => {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString("utf-8");
};

// Function to invoke a Bedrock model
export const invokeModel = async (modelId: string, input: string) => {
  const command = new InvokeModelCommand({
    modelId,
    body: JSON.stringify({ inputText: input }),
  });

  const response = await bedrockClient.send(command);

  // TypeScript may complain about body type, cast it as any
  const bodyString = await streamToString(response.body as any);

  try {
    return JSON.parse(bodyString);
  } catch {
    return bodyString; // fallback in case response is plain text
  }
};
