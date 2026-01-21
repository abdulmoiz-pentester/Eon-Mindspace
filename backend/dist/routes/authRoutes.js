"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = express_1.default.Router();
router.post("/login", (req, res) => {
    const { email } = req.body;
    if (!email)
        return res.status(400).json({ message: "Email required" });
    const token = jsonwebtoken_1.default.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ token });
});
exports.default = router;
