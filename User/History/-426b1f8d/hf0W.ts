import { Router } from "express";
import { getBedrockAgentResponse } from "../controllers/bedrockController";
import { invokeAgent } from "../services/bedrockService";

const router = Router();

router.post("/bedrock-agent", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required" });

  try {
    const reply = await invokeAgent(
      "arn:aws:bedrock:us-west-2:123456:agent/ZBYIUMEYOE",
      message
    );
    res.json({ answer: reply }); // <-- always send JSON
  } catch (err) {
    console.error("Backend error:", err);
    res.status(500).json({ answer: "Failed to get response from agent." });
  }
});


export default router;
