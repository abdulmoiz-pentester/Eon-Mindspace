"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var jsonwebtoken_1 = require("jsonwebtoken");
var router = express_1.default.Router();
router.post("/login", function (req, res) {
    var email = req.body.email;
    if (!email)
        return res.status(400).json({ message: "Email required" });
    var token = jsonwebtoken_1.default.sign({ email: email }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ token: token });
});
exports.default = router;
