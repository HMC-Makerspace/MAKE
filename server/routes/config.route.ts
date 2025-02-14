import { Request, Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import { ErrorResponse } from "common/verify";
import { TConfig } from "common/config";
import { getConfig } from "controllers/config.controller";

// --- Request and Response Types ---
type ConfigResponse = Response<TConfig | ErrorResponse>;

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

export default router;
