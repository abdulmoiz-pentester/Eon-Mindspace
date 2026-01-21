import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `You are Eon Mindspace, an internal security chatbot for Eon. You provide fast, reliable answers to security-related questions across the organization. You are helpful, professional, and security-focused. Always prioritize security best practices in your responses.

You can use markdown formatting in your responses:
- Use **bold** for important terms
- Use \`code\` for technical terms, commands, or file names
- Use code blocks with language hints for code examples
- Use bullet points and numbered lists for clarity
- Use headers (##, ###) to organize longer responses

Key areas you help with:
- Security policies and compliance
- Access control and authentication
- Credentials and secret management
- Data protection and privacy
- Incident response procedures
- Security best practices`;

// Toggle: "lovable" (default for dev) or "bedrock" (for prod)
const AI_BACKEND = Deno.env.get("AI_BACKEND") || "lovable";

async function callLovableAI(messages: any[], stream: boolean = false) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY is not configured");
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      stream,
    }),
  });

  return response;
}

async function callAWSBedrock(messages: any[]) {
  const AWS_ACCESS_KEY_ID = Deno.env.get("AWS_ACCESS_KEY_ID");
  const AWS_SECRET_ACCESS_KEY = Deno.env.get("AWS_SECRET_ACCESS_KEY");
  const AWS_REGION = Deno.env.get("AWS_REGION") || "us-west-2";
  const BEDROCK_MODEL_ID = Deno.env.get("BEDROCK_MODEL_ID") || "anthropic.claude-3-sonnet-20240229-v1:0";

  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
    throw new Error("AWS credentials not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.");
  }

  // Convert messages to Bedrock format
  const bedrockMessages = messages.map((msg: any) => ({
    role: msg.role === "assistant" ? "assistant" : "user",
    content: [{ type: "text", text: msg.content }],
  }));

  const body = JSON.stringify({
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 4096,
    system: systemPrompt,
    messages: bedrockMessages,
  });

  const endpoint = `https://bedrock-runtime.${AWS_REGION}.amazonaws.com/model/${BEDROCK_MODEL_ID}/invoke`;
  
  // AWS Signature V4 signing
  const date = new Date();
  const amzDate = date.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  
  const service = "bedrock";
  const host = `bedrock-runtime.${AWS_REGION}.amazonaws.com`;
  const canonicalUri = `/model/${BEDROCK_MODEL_ID}/invoke`;
  
  const encoder = new TextEncoder();
  
  async function sha256(message: string): Promise<string> {
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
  }
  
  async function hmacSha256(key: ArrayBuffer, message: string): Promise<ArrayBuffer> {
    const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    return await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(message));
  }
  
  const payloadHash = await sha256(body);
  const canonicalHeaders = `content-type:application/json\nhost:${host}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = "content-type;host;x-amz-date";
  const canonicalRequest = `POST\n${canonicalUri}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  
  const algorithm = "AWS4-HMAC-SHA256";
  const credentialScope = `${dateStamp}/${AWS_REGION}/${service}/aws4_request`;
  const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${await sha256(canonicalRequest)}`;
  
  const kSecret = encoder.encode("AWS4" + AWS_SECRET_ACCESS_KEY);
  const kDate = await hmacSha256(kSecret.buffer as ArrayBuffer, dateStamp);
  const kRegion = await hmacSha256(kDate, AWS_REGION);
  const kService = await hmacSha256(kRegion, service);
  const kSigning = await hmacSha256(kService, "aws4_request");
  
  const signatureBuffer = await hmacSha256(kSigning, stringToSign);
  const signature = Array.from(new Uint8Array(signatureBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
  
  const authorizationHeader = `${algorithm} Credential=${AWS_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Amz-Date": amzDate,
      "Authorization": authorizationHeader,
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Bedrock error:", response.status, errorText);
    throw new Error(`Bedrock API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    ok: true,
    message: data.content?.[0]?.text || "I apologize, but I couldn't generate a response.",
    usage: data.usage,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, stream = false } = await req.json();
    
    console.log(`Using AI backend: ${AI_BACKEND}, streaming: ${stream}`);

    if (AI_BACKEND === "bedrock") {
      // AWS Bedrock path (non-streaming for now)
      const result = await callAWSBedrock(messages);
      return new Response(
        JSON.stringify({ message: result.message, usage: result.usage }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Lovable AI path (default) - supports streaming
      const response = await callLovableAI(messages, stream);

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: "AI credits exhausted. Please add more credits." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const errorText = await response.text();
        console.error("AI gateway error:", response.status, errorText);
        return new Response(
          JSON.stringify({ error: "AI gateway error" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // If streaming, pass through the stream
      if (stream) {
        return new Response(response.body, {
          headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
        });
      }

      // Non-streaming response
      const data = await response.json();
      const assistantMessage = data.choices?.[0]?.message?.content || "I apologize, but I couldn't generate a response.";

      return new Response(
        JSON.stringify({ message: assistantMessage, usage: data.usage }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
