import { Request, Response } from "express";
import { invokeBedrockModel } from "../services/bedrockService";

/**
 * POST /api/bedrock
 * Body: { prompt: string }
 */
export const getBedrockResponse = async (req: Request, res: Response) => {
  const { prompt } = req.body;

  if (!prompt || prompt.trim() === "") {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const responseText = await invokeBedrockModel(prompt);
    res.json({ message: responseText });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch response from Bedrock" });
  }
};
