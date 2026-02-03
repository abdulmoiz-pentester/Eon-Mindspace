import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
} from "@aws-sdk/client-bedrock-agent-runtime";

export const invokeAgent = async (
  agentArn: string,
  inputText: string,
  agentAliasId: string = "L3UQ4TMBQ8"
) => {
  try {
    const agentId = agentArn.split('/').pop() || "ZBYIUMEYOE";

    const client = new BedrockAgentRuntimeClient({
      region: "us-west-2",
      // credentials not needed, uses AWS_PROFILE env automatically
    });

    const command = new InvokeAgentCommand({
      agentId,
      agentAliasId,
      sessionId: `session-${Date.now()}`,
      inputText,
    });

    const response = await client.send(command);

    const chunks: string[] = [];
    if (response.completion) {
      for await (const chunk of response.completion) {
        if (chunk.chunk?.bytes) {
          chunks.push(new TextDecoder().decode(chunk.chunk.bytes));
        }
      }
    }

    return chunks.join("");

  } catch (err: any) {
    console.error("AGENT ERROR:", err.name, "-", err.message);
    if (err.name === "UnrecognizedClientException") {
      console.error("Run: aws sso login --profile your-profile");
    }
    throw new Error(`Bedrock Agent error: ${err.message}`);
  }
};
