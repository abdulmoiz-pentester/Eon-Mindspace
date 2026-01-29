import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
      console.log('🔐 [DEBUG] requireAuth called');
  console.log('🔐 [DEBUG] Request path:', req.path);
  console.log('🔐 [DEBUG] Cookies:', req.cookies);
  console.log('🔐 [DEBUG] JWT cookie exists:', !!req.cookies.jwt);
  console.log('🔐 [DEBUG] Headers:', req.headers);
    const token = req.cookies.jwt;

    if (!token) {
          console.error('❌ [DEBUG] No JWT token found in cookies');
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
        console.log('✅ [DEBUG] JWT verified, user:', decoded);
        (req as any).user = decoded;
        next();
    } catch (error) {
          console.error('❌ [DEBUG] JWT verification failed:', error);
        res.status(401).json({ error: "Invalid token" });
    }
};

export default requireAuth;
