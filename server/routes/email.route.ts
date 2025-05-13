import { Request, Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import { ErrorResponse } from "common/verify";
import { getOAuthToken, saveOAuthToken } from "controllers/email.controller";

// --- Request and Response Types ---
type EmailResponse = Response<{} | ErrorResponse>;
// type ConfigRequest = Request<{}, {}, { config: TConfig }>;

const router = Router();

// --- Email Routes ---

/**
 * Get the current configuration. This is a public route.
 */
router.get(
    "/",
    async (req: Request<{}, {}, {}, { code: string }>, res: EmailResponse) => {
        req.log.debug({
            msg: `OAuth requested`,
        });

        const oAuth = await getOAuthToken(req.log);
        if (oAuth) {
            req.log.warn(
                `OAuth requested while an OAuth token already exists.`,
            );
            res.status(StatusCodes.UNAUTHORIZED).json({
                error:
                    "OAuth has already been configured for this site. Please " +
                    "contact an administrator if you believe this is an error.",
            });
        } else {
            req.log.info(`No OAuth exists, attempting to set from code.`);
            req.log.info(req);
            const oAuthCode = req.query.code;
            if (!oAuthCode) {
                req.log.error(`No OAuth code provided.`);
                res.status(StatusCodes.BAD_REQUEST).json({
                    error: "No OAuth code provided.",
                });
            } else {
                const successful = await saveOAuthToken(oAuthCode, req.log);
                if (successful) {
                    res.status(StatusCodes.ACCEPTED).json({});
                } else {
                    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                        error: "Failed to save OAuth token to file.",
                    });
                }
            }
        }
    },
);

export default router;
