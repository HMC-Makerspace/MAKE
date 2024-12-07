declare module "bun" {
  interface Env {
    MONGO_URI: string;
    NODE_ENV: "development" | "production";
    PORT?: number;
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {};
