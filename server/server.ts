import express, { Application } from "express";
import compression from "compression";
import https from "https";
import fs from "fs";
import path from "path";
import connectDB from "./core/db";
import html from "bun-plugin-html";
import pino from "pino";
import loggerMiddleware from "pino-http";
import cors from "cors";

// await Bun.build({
//     entrypoints: ["index.html"],
//     outdir: "website/build",
//     plugins: [html()],
// });

// Import frontend
import * as frontend from "../website/index";

// Routes
import indexRoutes from "./routes/index.route";
import userRoutes from "./routes/user.route";

const app: Application = express();

// Setup logging
const logger = pino();
if (process.env.NODE_ENV == "development") {
    logger.level = "debug";
}
logger.info("Begin logging");

// Connect to the database
connectDB(logger);

// Add a list of allowed origins.
// If you have more origins you would like to add, you can add them to the array below.
const allowedOrigins = [`http://localhost:${process.env.PORT || 3000}`];
const options: cors.CorsOptions = {
    origin: allowedOrigins,
};

// Middleware
app.use(express.json(), compression(), loggerMiddleware(logger), cors(options));

// API Routes
// app.use("/api/v3", indexRoutes);
app.use("/api/v3/user", userRoutes);

// Frontend, in website/public/index.html
// TODO: Need to figure out how to serve the frontend in production
// app.use(express.static(path.join(__dirname, "../website/build")));

if (process.env.NODE_ENV === "production") {
    const options = {
        key: fs.readFileSync("path/to/key.pem"),
        cert: fs.readFileSync("path/to/cert.pem"),
    };

    https.createServer(options, app).listen(443, "0.0.0.0", () => {
        logger.info("Server running in production mode on port 443");
    });
} else {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        logger.info(`Server running on http://localhost:${PORT}`);
    });
}
