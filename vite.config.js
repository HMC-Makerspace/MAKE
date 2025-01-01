import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    root: "website",
    target: "ESNext",
    module: "ESNext",
    plugins: [react({ include: "**/*.tsx", exclude: "node_modules" })],
    server: {
        port: 5173,
        open: true,
        // Send API requests on localhost to the backend server
        proxy: {
            "/api": {
                target: `http://localhost:${process.env.PORT || 3000}`,
                changeOrigin: true
            }
        }
    }
});
