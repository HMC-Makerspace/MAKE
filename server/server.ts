import express, { Application, urlencoded } from "express";
import ViteExpress from "vite-express";
import compression from "compression";
import http from "http";
import path from "path";
import connectDB from "./core/db";
import pino from "pino";
import loggerMiddleware from "pino-http";
import cors from "cors";
import cron from "node-cron";
import session from "express-session";
import cookieParser from "cookie-parser";
import passport from "passport";
import { Strategy } from "passport-saml";
import { default as MongoDBStore } from "connect-mongodb-session";
import fs from "fs/promises";

// await Bun.build({
//     entrypoints: ["website/index.html"],
//     outdir: "website/build",
//     plugins: [html()],
// });

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
import emailRoutes from "routes/email.route";
import { getOAuthToken, getOAuthURL } from "controllers/email.controller";
import { reserveMachineInstance } from "controllers/machine.controller";
import {
    checkoutAvailabilityCron,
    checkoutEmailCron,
} from "controllers/checkout.controller";
import { createUser, getUserByEmail } from "controllers/user.controller";

// @ts-expect-error Static asset loading using Vite
import favicon from "common/favicon.ico";

const app: express.Express = express();
const store = new (MongoDBStore(session))({
    uri: process.env.MONGO_URI,
    collection: "session",
});

// Setup logging
const logger = pino();
logger.info("Begin logging");

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

// Define production SAML login methods
if (process.env.NODE_ENV === "production") {
    // Get IDP cert and clean up format
    const cert = await fs.readFile("make-idp.crt");
    const cert_string = cert
        .toString()
        .replace(/-+(BEGIN|END) CERTIFICATE-+/g, "")

    // Configure SAML Strategy
    passport.use(
        new Strategy(
            {
                passReqToCallback: true,
                entryPoint: process.env.IDP_ENTRY_POINT,
                callbackUrl: process.env.IDP_CALLBACK, // e.g., http://localhost:3000/login/callback
                issuer: process.env.IDP_ISSUER,
                cert: cert_string,
                identifierFormat: process.env.IDP_ID_FORMAT,
            },
            async (req, profile, done) => {
                if (!profile || !profile.email) {
                    req.log.fatal({ msg: "Invalid profile", profile: profile, req: req });
                    done(new Error("No profile found"))
                    return
                }
                const email = profile.email as string;
                const user_obj = await getUserByEmail(email);
                if (!user_obj) {
                    req.log.info({
                        msg:`User with email ${email} not found, creating`,
                        profile: profile
                    });
                    const new_user_obj = {
                        uuid: crypto.randomUUID(),
                        name: profile.displayName as string,
                        email: profile.email as string,
                        college_id: "",  // If not provided by IDP, fill in later
                        active_roles: [],
                        past_roles: [],
                        active_certificates: [],
                        past_certificates: [],
                    };
                    await createUser(new_user_obj);
                    done(null, { uuid: new_user_obj.uuid });
                } else {
                    done(null, { uuid: user_obj.uuid });
                }
            },
        ),
    );

    app.get("/login", passport.authenticate("saml"));

    app.post(
        "/saml",
        urlencoded({ extended: false }),
        passport.authenticate("saml"),
        (req, res) => {
            res.redirect("/");
        },
    );
}
if (
    process.env.NODE_ENV === "development" ||
    process.env.ALLOW_INSECURE_LOGIN
) {
    // Define developmental login method
    app.get("/login/:user_uuid", async (req, res, next) => {
        try {
            const user_uuid = req.params.user_uuid;
            if (!user_uuid) {
                res.redirect("/");
            }
            req.login({ uuid: user_uuid }, (err) => {
                req.log.info({ msg: "Insecure login used", err: err });
                if (err) {
                    // Pass errors to Express
                    next(err);
                } else {
                    // If successfully logged in, redirect to the main page
                    res.redirect("/");
                }
            });
        } catch (error) {
            next(error);
        }
    });
}

// Logout route
app.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) { return next(err) }
        req.session.destroy((err) => {
            if (err) return next(err)
            res.clearCookie('connect.sid') // express-session cookie
            // If successfully logged out, redirect to the main page.
            res.redirect("/")
        });
    });
});

// Include user session authentication for all following routes
app.use(passport.session());

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

// Only accessible in production mode
app.get("/favicon.ico", (req, res) => {
    res.sendFile(favicon, {
        root: "/",
    });
});

// Setup cron jobs
// Query for checkout emails every minute
checkoutEmailCron(logger);
cron.schedule("* * * * *", () => {
    checkoutEmailCron(logger);
});

// Refresh all checkout quantities every 15 minutes
checkoutAvailabilityCron(logger);
cron.schedule("*/15 * * * *", () => {
    checkoutAvailabilityCron(logger);
});

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
