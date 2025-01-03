declare module "bun" {
    interface Env {
        MONGO_URI: string;
        NODE_ENV: "development" | "production";
        VITE_SERVER_PORT?: number;
        VITE_PORT?: number;
        EMAIL_BOT_NAME: string;
        EMAIL_BOT_HOST: string;
        EMAIL_BOT_PORT: number;
        EMAIL_BOT_ADDRESS: string;
        EMAIL_BOT_PASSWORD: string;
        FILE_UPLOAD_PATH: string;
        FILE_TEMP_PATH: string;
        FILE_MAX_SIZE: number;
    }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {};
