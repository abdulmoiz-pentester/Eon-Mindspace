import { Request, Response } from "express";
import { invokeAgent } from "../services/bedrockService";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";

export const getBedrockAgentResponse = async (req: Request, res: Response) => {
  try {
    const { message, agentAliasId } = req.body;
    const authReq = req as AuthenticatedRequest & { session: any };

    if (!authReq.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
        loginUrl: "/auth/login"
      });
    }

    if (!message) {
      return res.status(400).json({ 
        success: false, 
        error: "Message is required in the request body" 
      });
    }

    const agentArn = process.env.BEDROCK_AGENT_ARN || 
                     "arn:aws:bedrock:us-west-2:965631485706:agent/ZBYIUMEYOE";
    const aliasId = agentAliasId || "L3UQ4TMBQ8";

    console.log(`Invoking Bedrock Agent:
      - Agent ID: ${agentArn.split('/').pop()}
      - Alias ID: ${aliasId}
      - Message: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}
    `);

    
    const response = await invokeAgent(agentArn, message, aliasId);
    res.json({ 
      success: true, 
      answer: response,
      agentAliasUsed: aliasId,
      timestamp: new Date().toISOString(),
      user: authReq.user.email,
      
    });

  } catch (err: any) {
    console.error("Controller error:", err);

    res.status(500).json({ 
      success: false, 
      error: err.message || "Failed to get response from Bedrock agent",
      timestamp: new Date().toISOString()
    });
  }
};
