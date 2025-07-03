import express, { Application } from "express";
import compression from "compression";
import http from "http";
import path from "path";
import connectDB from "./core/db";
import pino from "pino";
import loggerMiddleware from "pino-http";
import cors from "cors";

// await Bun.build({
//     entrypoints: ["website/index.html"],
//     outdir: "website/build",
//     plugins: [html()],
// });

// Import frontend
import * as frontend from "../website/index";

// Routes
import areaRoutes from "./routes/area.route";
import certificationRoutes from "./routes/certification.route";
import checkoutRoutes from "./routes/checkout.route";
import configRoutes from "./routes/config.route";
import fileRoutes from "./routes/file.route";
// import indexRoutes from "./routes/index.route"; // TODO: Determine if still necessary
import inventoryRoutes from "./routes/inventory.route";
import machineRoutes from "./routes/machine.route";
import restockRoutes from "./routes/restock.route";
import scheduleRoutes from "./routes/schedule.route";
import userRoutes from "./routes/user.route";
import workshopRoutes from "./routes/workshop.route";
import emailRoutes from "./routes/email.route";
import { getOAuthToken, getOAuthURL } from "controllers/email.controller";

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
app.use("/api/v3/area", areaRoutes);
app.use("/api/v3/certification", certificationRoutes);
app.use("/api/v3/checkout", checkoutRoutes);
app.use("/api/v3/config", configRoutes);
app.use("/api/v3/file", fileRoutes);
// app.use("/api/v3", indexRoutes);
app.use("/api/v3/inventory", inventoryRoutes);
app.use("/api/v3/machine", machineRoutes);
app.use("/api/v3/restock", restockRoutes);
app.use("/api/v3/schedule", scheduleRoutes);
app.use("/api/v3/user", userRoutes);
app.use("/api/v3/workshop", workshopRoutes);
app.use("/api/v3/oauth", emailRoutes);

app.get("/api/v3/test", (req, res) => {
    req.log.debug("Test log");
    res.send("Hello World!");
});

const PORT = process.env.VITE_SERVER_PORT || 3000;

if (process.env.NODE_ENV === "production") {
    // Join frontend build paths statically
    app.use(express.static(path.join(__dirname, "../website/build")));
    // Route all other paths to index so React Router can handle frontend routes.
    app.get("/*path", function (req, res) {
        res.sendFile(path.join(__dirname, "../website/build", "index.html"));
    });

    http.createServer(app).listen(PORT, () => {
        logger.info(
            `Server running in production mode http://127.0.0.1:${PORT}`,
        );
    });
} else {
    app.listen(PORT, () => {
        logger.info(`Server running on http://127.0.0.1:${PORT}`);
    });
}

// Setup email client if CLI option included
// if (Bun.argv.includes("--setup-email")) {
//     logger.info(getOAuthURL());
// }
if (!(await getOAuthToken(logger))) {
    // If OAuth token is invalid, prompt the administrator to login
    logger.info({
        msg: "No OAuth token found. Please authenticate with a valid OAuth account.",
        url: getOAuthURL(),
    });
} else {
    logger.debug("OAuth is enabled.");
}
