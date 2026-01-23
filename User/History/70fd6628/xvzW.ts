// services/bedrockAgentService.ts
import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
} from "@aws-sdk/client-bedrock-agent-runtime";
import { fromSSO } from "@aws-sdk/credential-providers";

// Create client with dynamic credentials but its not working in my dev environment
//const client = new BedrockAgentRuntimeClient();
const client = new BedrockAgentRuntimeClient({
region: "us-west-2",
credentials: fromSSO({
profile: "bedrock-dev",
}),
});

export const invokeAgent = async (
  agentArn: string, 
  inputText: string, 
  agentAliasId: string = "L3UQ4TMBQ8"
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