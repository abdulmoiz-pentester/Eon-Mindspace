import { Router } from "express";
import { getBedrockAgentResponse } from "../controllers/bedrockController";
import authController, { AuthRequest } from "../controllers/authController";

const router = Router();

// ==================== Apply auth to all API routes ====================
router.use(authController.requireAuth);

// Protected API endpoints
router.post("/bedrock-agent", getBedrockAgentResponse);

// Get user profile
router.get("/user/profile", (req, res) => {
  const authReq = req as AuthRequest; // typecast here
  res.json({
    user: authReq.user,
    timestamp: new Date().toISOString(),
  });
});


// Health check
router.get("/health", (req, res) => {
  const authReq = req as AuthRequest; // typecast here
  res.json({
    status: "OK",
    authenticated: true,
    user: authReq.user?.email || "authenticated",
  });
});

export default router;
