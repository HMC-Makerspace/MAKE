import mongoose from "mongoose";
import type { Logger } from "pino";

const connectDB = async (logger?: Logger) => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);

        if (logger) logger.info(`MongoDB Connected: ${conn.connection.host}`);

        return conn;
    } catch (error) {
        if (logger) logger.error("Error connecting to MongDB", error);
        process.exit(1);
    }
};

export default connectDB;
