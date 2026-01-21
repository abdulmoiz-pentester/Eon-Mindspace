// services/bedrockAgentService.ts
import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
} from "@aws-sdk/client-bedrock-agent-runtime";
import { fromSSO } from "@aws-sdk/credential-providers";

// Create a function to get fresh credentials
const getFreshCredentials = async () => {
  try {
    // Use fromSSO which will handle token refresh if needed
    return fromSSO({ 
      profile: "bedrock-dev",
      // Optional: Force refresh if token is expired
      clientConfig: { region: "us-west-2" }
    })();
  } catch (error: any) {
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
const client = new BedrockAgentRuntimeClient({
  region: "us-west-2",
  credentials: getFreshCredentials,
});

export const invokeAgent = async (
  agentArn: string, 
  inputText: string, 
  agentAliasId: string = "TSTALIASID"
) => {
  try {
    console.log("🔧 Invoking Bedrock Agent...");
    
    const agentId = agentArn.split('/').pop() || 'ZBYIUMEYOE';
    
    console.log(`🔧 Agent ID: ${agentId}, Alias ID: ${agentAliasId}`);

    const command = new InvokeAgentCommand({
      agentId,
      agentAliasId,
      sessionId: `session-${Date.now()}`,
      inputText,
    });

    console.log("🔧 Sending command...");
    const response = await client.send(command);
    console.log("✅ Received response");

    const chunks: string[] = [];
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
    
  } catch (err: any) {
    console.error("🚨 AGENT ERROR:", err.name, "-", err.message);
    
    if (err.name === 'UnrecognizedClientException') {
      console.error("\n💡 QUICK FIX: Run this command then try again:");
      console.error("aws sso login --profile bedrock-dev");
    }
    
    throw new Error(`Bedrock Agent error: ${err.message}`);
  }
};