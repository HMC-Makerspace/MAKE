import { TConfig } from "common/config";
import { UUID } from "common/global";
import { Config } from "models/config.model";
import mongoose from "mongoose";

/**
 * Retrieves the current configuration from the database.
 * @returns The current configuration, or null if it does not exist.
 */
export function getConfig() {
    const config = mongoose.model("Config", Config);
    return config.findOne({}); // Should only be one config
}

/**
 * Sets the current configuration in the database.
 * @param new_config The new configuration to set.
 * @returns The updated configuration.
 */
export function setConfig(new_config: TConfig) {
    const config = mongoose.model("Config", Config);
    return config.findOneAndReplace({}, new_config, {
        returnDocument: "after",
    });
}

/**
 * Creates an initial config object. Throws an error if a config already exists.
 */
export async function createConfig(config: TConfig) {
    const Configuration = mongoose.model("Config", Config);
    if (await Configuration.exists({})) {
        throw Error("Config already exists, cannot create default.")
    } else {
        return Configuration.create(config);
    }
}