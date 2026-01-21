import { Router } from "express";
import { getBedrockAgentResponse } from "../controllers/bedrockController";

const router = Router();

router.post("/bedrock-agent", getBedrockAgentResponse);

export default router;
