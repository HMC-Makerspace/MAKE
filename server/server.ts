import express, { Application } from "express";
import compression from "compression";
import https from "https";
import fs from "fs";
import path from "path";
import connectDB from "./core/db";
import html from "bun-plugin-html";
import multer from "multer";
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
import checkoutRoutes from "./routes/checkout.route";
import fileRoutes from "./routes/file.route";
import inventoryRoutes from "./routes/inventory.route";
import machineRoutes from "./routes/machine.route";
import restockRoutes from "./routes/restock.route";
// import indexRoutes from "./routes/index.route";
import userRoutes from "./routes/user.route";
import workshopRoutes from "./routes/workshop.route";

const app: Application = express();

// Setup logging
const logger = pino();
logger.info("Begin logging");

if (process.env.NODE_ENV == "development") {
    logger.level = "debug";
    logger.debug("Logging level set to debug for development");
}

// Connect to the database
connectDB(logger);

// Setup CORS
// Add a list of allowed origins
// If you have more origins you would like to add, you can add them to the array below.
const allowedOrigins = [
    `http://localhost:${process.env.VITE_SERVER_PORT || 3001}`, // Backend
    `http://localhost:${process.env.VITE_PORT || 3000}`, // Frontend
];
const options: cors.CorsOptions = {
    origin: allowedOrigins,
};
logger.debug("CORS setup");

// Middleware
app.use(
    express.json(),
    compression(),
    loggerMiddleware({ logger: logger }),
    cors(options),
);

// API Routes
// app.use("/api/v3", indexRoutes);
app.use("/api/v3/checkout", checkoutRoutes);
app.use("/api/v3/file", fileRoutes);
app.use("/api/v3/inventory", inventoryRoutes);
app.use("/api/v3/machine", machineRoutes);
app.use("/api/v3/restock", restockRoutes);
app.use("/api/v3/user", userRoutes);
app.use("/api/v3/workshop", workshopRoutes);

app.get("/api/v3/test", (req, res) => {
    res.send("Hello World!");
});

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
    const PORT = process.env.VITE_SERVER_PORT || 3000;
    app.listen(PORT, () => {
        logger.info(`Server running on http://localhost:${PORT}`);
    });
}
