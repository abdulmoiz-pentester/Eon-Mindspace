import { Router } from "express";
import { getBedrockAgentResponse } from "../controllers/bedrockController";
import authController from "../controllers/authController";

const router = Router();

// Apply authentication middleware to ALL API routes
router.use(authController.requireAuth);

// Protected API endpoints
router.post("/bedrock-agent", getBedrockAgentResponse);

// Get user profile
router.get("/user/profile", (req, res) => {
  const user = (req as any).user; // User info is now in req.user from JWT
  res.json({
    user,
    timestamp: new Date().toISOString(),
  });
});

// Additional protected endpoints can be added here
router.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    authenticated: true,
    user: (req as any).user?.email || "authenticated"
  });
});

export default router;