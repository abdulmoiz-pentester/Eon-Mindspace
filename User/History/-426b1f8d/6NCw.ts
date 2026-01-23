import { Router } from "express";
import { getBedrockAgentResponse } from "../controllers/bedrockController";
import { requireAuth, requireCompanyDomain } from '../middlewares/authMiddleware';

const router = Router();

router.post("/bedrock-agent", getBedrockAgentResponse);
router.get('/user/profile', requireAuth, (req, res) => {
  res.json({
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

export default router;
