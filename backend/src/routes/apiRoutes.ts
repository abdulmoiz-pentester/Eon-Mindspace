import { Router } from "express";
import { getBedrockResponse } from "../controllers/bedrockController";

const router = Router();

router.post("/bedrock", getBedrockResponse);

export default router;
