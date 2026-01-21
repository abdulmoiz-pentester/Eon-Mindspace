"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var cors_1 = require("cors");
var morgan_1 = require("morgan");
var authRoutes_1 = require("./routes/authRoutes");
var apiRoutes_1 = require("./routes/apiRoutes");
var errorMiddleware_1 = require("./middlewares/errorMiddleware");
var dotenv_1 = require("dotenv");
dotenv_1.default.config();
var app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.json());
// Routes
app.use("/auth", authRoutes_1.default);
app.use("/api", apiRoutes_1.default);
// Error middleware
app.use(errorMiddleware_1.errorHandler);
var PORT = process.env.PORT || 5000;
app.listen(PORT, function () {
    console.log("Server running on port ".concat(PORT));
});
