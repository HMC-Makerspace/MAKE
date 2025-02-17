import { Config } from "models/config.model";
import mongoose from "mongoose";

export function getConfig() {
    const config = mongoose.model("Config", Config);
    return config.findOne({}); // Should only be one config
}
