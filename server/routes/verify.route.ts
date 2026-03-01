import { Request, Response, NextFunction } from "express";
import { VerifyRequestHeader } from "common/verify";
import { getUser } from "controllers/user.controller";
import { createHash } from "crypto";
import { StatusCodes } from "http-status-codes";

export function verifyUser(): (req: Request, res: Response, next: NextFunction) => void  {
    return async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        const headers = req.headers as VerifyRequestHeader;
        if (req.user?.uuid) {
            next()
            return;
        };
        
        // if there is no requesting uuid the next route will handle it
        const requesting_uuid = headers.requesting_uuid;
        if (!requesting_uuid) {
            next();
            return;
        }; 

        const requesting_user = await getUser(requesting_uuid);

        const passkey_hash = createHash("sha256")
            .update(headers.passkey)
            .digest("hex");

        if (
            !requesting_user ||
            !requesting_user.passkey ||
            passkey_hash !== requesting_user.passkey
        ) {
            // Failed to authorize via passkey
            req.log.warn({
                msg: "No user session exists, and provided passkey authorization was invalid.",
                requesting_uuid: requesting_uuid,
                passkey_hash: passkey_hash,
                user_hash: requesting_user?.passkey,
            });
            res.status(StatusCodes.UNAUTHORIZED).json({
                error:
                    "No user session exists, and provided passkey authorization was invalid. Please" +
                    " provide a requesting_uuid and passkey header in your request and try again",
            });
            next(new Error(
                "No user session exists, and provided passkey authorization was invalid. Please" +
                " provide a requesting_uuid and passkey header in your request and try again"
            ));
            return;
        } 
        
        // Authorized via passkey, turning req.user.uuid into the verified user
        req.user = {
            uuid: requesting_uuid
        };
        next();
        return;
    }
}
