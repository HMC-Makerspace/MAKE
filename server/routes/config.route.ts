import { Request, Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import {
    ErrorResponse,
    UNAUTHORIZED_ERROR,
    VerifyRequestHeader,
} from "common/verify";
import { TConfig } from "common/config";
import { getConfig, setConfig } from "controllers/config.controller";
import { API_SCOPE } from "common/global";
import { verifyRequest } from "controllers/verify.controller";

// --- Request and Response Types ---
type ConfigResponse = Response<TConfig | ErrorResponse>;
type ConfigRequest = Request<{}, {}, { config: TConfig }>;

const router = Router();

// --- Config Routes ---

/**
 * Get the current configuration. This is a public route.
 */
router.get("/", async (req: Request, res: ConfigResponse) => {
    req.log.debug({
        msg: `Getting config`,
    });

    const config = await getConfig();
    if (!config) {
        req.log.fatal(`No configuration found`);
        res.status(StatusCodes.NOT_FOUND).json({
            error: "No configuration data found. Please contact an administrator.",
        });
    } else {
        req.log.debug(`Returned config`);
        res.status(StatusCodes.OK).json(config);
    }
});

/**
 * Update the current configuration. This is a protected route that requires
 * the requesting user to be an admin.
 * The request body should contain the new configuration as a JSON object
 * under the `config` key.
 */
router.post("/", async (req: ConfigRequest, res: ConfigResponse) => {
    const new_config = req.body.config;
    if (!new_config) {
        req.log.warn("No new config provided for update.");
        res.status(StatusCodes.BAD_REQUEST).json({
            error: "No config provided",
        });
        return;
    }
    const headers = req.headers as VerifyRequestHeader;
    const requesting_uuid = headers.requesting_uuid;

    // If no requesting user_uuid is provided, the call is not authorized
    if (!requesting_uuid) {
        req.log.warn("No requesting_uuid was provided while updating config.");
        res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
        return;
    }
    req.log.debug({
        msg: `Updating config`,
        config: new_config,
    });

    // This request is valid if and only if the requesting user is an admin
    if (await verifyRequest(requesting_uuid, API_SCOPE.ADMIN)) {
        const updated_config = await setConfig(new_config);
        if (!updated_config) {
            req.log.warn(`No configuration found`);
            res.status(StatusCodes.NOT_FOUND).json({
                error: `No configuration was found.`,
            });
            return;
        }
        // Return the updated config
        req.log.info(`Successfully Updated config`);
        res.status(StatusCodes.OK).json(updated_config);
    } else {
        req.log.warn(
            `User ${requesting_uuid} attempted to update config, but is not an admin.`,
        );
        res.status(StatusCodes.FORBIDDEN).json({
            error: `This route requires administrator access.`,
        });
    }
});

export default router;
