import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd());
    return {
        root: "website",
        target: "ESNext",
        module: "ESNext",
        publicDir: "common",
        plugins: [react({ include: "**/*.tsx", exclude: "node_modules" })],
        server: {
            port: env.VITE_PORT ?? 3000,
            // Send API requests on localhost to the backend server
            proxy: {
                "/api": {
                    target: `http://localhost:${env.VITE_SERVER_PORT ?? 3001}`,
                    changeOrigin: true,
                },
            },
        },
    };
});
