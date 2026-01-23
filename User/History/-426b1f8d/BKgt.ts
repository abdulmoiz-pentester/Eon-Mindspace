import { Router } from "express";
import { getBedrockAgentResponse } from "../controllers/bedrockController";
import { requireAuth, requireCompanyDomain } from '../middlewares/authMiddleware';

const router = Router();

// Protected API endpoints
router.post("/bedrock-agent", 
  requireAuth, 
  requireCompanyDomain, 
  getBedrockAgentResponse
);

// Example protected endpoint
router.get('/user/profile', requireAuth, (req: any, res: any) => {
  res.json({
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

export default router;