import express, { Application } from "express";
import compression from "compression";
import https from "https";
import fs from "fs";
import path from "path";
import connectDB from "./config/db";
import html from "bun-plugin-html";

await Bun.build({
    entrypoints: ["website/index.html"],
    outdir: "website/build",
    plugins: [html()],
});

// Routes
import indexRoutes from "./routes/index.route";
import userRoutes from "./routes/user.route";

const app: Application = express();

// Connect to the database
connectDB();

// Middleware
app.use(express.json(), compression());

// API Routes
app.use("/api/v3", indexRoutes);
app.use("/api/v3/user", userRoutes);

// Frontend, in website/build/index.html
app.use(express.static(path.join(__dirname, "../website/build")));

if (process.env.NODE_ENV === "production") {
    const options = {
        key: fs.readFileSync("path/to/key.pem"),
        cert: fs.readFileSync("path/to/cert.pem"),
    };

    https.createServer(options, app).listen(443, "0.0.0.0", () => {
        console.log("Server running in production mode on port 443");
    });
} else {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
