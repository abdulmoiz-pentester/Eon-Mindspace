"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBedrockResponse = void 0;
const bedrockService_1 = require("../services/bedrockService");
/**
 * POST /api/bedrock
 * Body: { prompt: string }
 */
const getBedrockResponse = async (req, res) => {
    const { prompt } = req.body;
    if (!prompt || prompt.trim() === "") {
        return res.status(400).json({ error: "Prompt is required" });
    }
    try {
        const responseText = await (0, bedrockService_1.invokeBedrockModel)(prompt);
        res.json({ message: responseText });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch response from Bedrock" });
    }
};
exports.getBedrockResponse = getBedrockResponse;
