import express, { Application } from "express";
import fs from "fs";
import ViteExpress from "vite-express";
import compression from "compression";
import connectDB from "./core/db";
import pino from "pino";
import loggerMiddleware from "pino-http";
import cors from "cors";
import cron from "node-cron";
import session from "express-session";
import lusca from "lusca";
import cookieParser from "cookie-parser";
import passport from "passport";
import { default as MongoDBStore } from "connect-mongodb-session";

// await Bun.build({
//     entrypoints: ["website/index.html"],
//     outdir: "website/build",
//     plugins: [html()],
// });

// Routes
import loginRoutes from "./routes/login.route";
import areaRoutes from "./routes/area.route";
import certificationRoutes from "./routes/certification.route";
import checkoutRoutes from "./routes/checkout.route";
import configRoutes from "./routes/config.route";
import embedRoutes from "./routes/embed.route";
import fileRoutes from "./routes/file.route";
// import indexRoutes from "./routes/index.route"; // TODO: Determine if still necessary
import inventoryRoutes from "./routes/inventory.route";
import machineRoutes from "./routes/machine.route";
import restockRoutes from "./routes/restock.route";
import scheduleRoutes from "./routes/schedule.route";
import userRoutes from "./routes/user.route";
import workshopRoutes from "./routes/workshop.route";
import emailRoutes from "routes/email.route";
import { getOAuthToken, getOAuthURL } from "controllers/email.controller";
import {
    checkoutAvailabilityCron,
    checkoutEmailCron,
} from "controllers/checkout.controller";
import { workshopReminderEmailCron } from "controllers/workshop.controller";

// @ts-expect-error Static asset loading using Vite
import favicon from "common/favicon.ico";
import { clearExpiredFilesCron } from "controllers/file.controller";
import { revokeExpiredCertificatesCron } from "controllers/certification.controller";

// Setup logging
const logger = pino();
logger.info("Begin logging");

if (!fs.existsSync(".env")) {
    logger.fatal(
        "\n>>>>>>>>>>>>>\nNo .env file found, please run " +
            "`bun setup` to initialize.\n>>>>>>>>>>>>>",
    );
}

const app: express.Express = express();
const store = new (MongoDBStore(session))({
    uri: process.env.MONGO_URI,
    collection: "session",
});

if (process.env.NODE_ENV == "development") {
    logger.level = "debug";
    logger.debug("Logging level set to debug for development");
}

// Connect to the database
connectDB(logger);

const PORT = process.env.VITE_SERVER_PORT || 3001;

// Setup CORS
// Add a list of allowed origins
// If you have more origins you would like to add, you can add them to the array below.
const allowedOrigins = [
    `http://localhost:${PORT}`, // Backend
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
    cookieParser(),
    loggerMiddleware({ logger: logger }),
    cors(options),
    session({
        secret: process.env.SESSION_SECRET,
        rolling: true,
        cookie: {
            secure: process.env.NODE_ENV === "production",
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 7, // One week
        },
        store: store,
        proxy: process.env.NODE_ENV === "production",
        resave: false,
        saveUninitialized: false,
    }),
    // lusca.csrf(),
    passport.initialize(),
);

passport.serializeUser((user, done) => {
    process.nextTick(() => {
        return done(null, { uuid: user.uuid });
    });
});

passport.deserializeUser((user: Express.User, done) => {
    process.nextTick(() => {
        return done(null, { uuid: user.uuid });
    });
});

app.use(loginRoutes);

// Include user session authentication for all following routes
app.use(passport.session());

// API Routes
app.use("/api/v3/area", areaRoutes);
app.use("/api/v3/certification", certificationRoutes);
app.use("/api/v3/checkout", checkoutRoutes);
app.use("/api/v3/config", configRoutes);
app.use("/api/v3/embed", embedRoutes);
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

// Only accessible in production mode
app.get("/favicon.ico", (req, res) => {
    res.sendFile(favicon, {
        root: "/",
    });
});

// Setup cron jobs
// Query for checkout emails every minute
await checkoutEmailCron(logger);
cron.schedule("* * * * *", () => {
    checkoutEmailCron(logger);
});

// Delete expired user files every 10 minutes
await clearExpiredFilesCron(logger);
cron.schedule("*/10 * * * *", () => {
    clearExpiredFilesCron(logger);
});

// Refresh all checkout quantities every minute
await checkoutAvailabilityCron(logger);
cron.schedule("*/1 * * * *", () => {
    checkoutAvailabilityCron(logger);
});

// Query for workshop reminder emails every minute
await workshopReminderEmailCron(logger);
cron.schedule("*/1 * * * *", () => {
    workshopReminderEmailCron(logger);
});

// Revoke expired certificates every 15 minutes
await revokeExpiredCertificatesCron(logger);
cron.schedule("*/15 * * * *", () => {
    revokeExpiredCertificatesCron(logger);
});

// Setup email client if CLI option included
if (!(await getOAuthToken(logger))) {
    // If OAuth token is invalid, prompt the administrator to login
    logger.info({
        msg: "No OAuth token found. Please authenticate with a valid OAuth account.",
        url: getOAuthURL(),
    });
} else {
    logger.debug("OAuth is enabled.");
}

if (process.env.NODE_ENV === "production") {
    ViteExpress.listen(app, PORT, () => {
        logger.info(
            `Server running in production mode http://127.0.0.1:${PORT}`,
        );
    });
} else {
    app.listen(PORT, () => {
        logger.info(`Server running on http://127.0.0.1:${PORT}`);
    });
}
