import { API_SCOPE } from "common/global";
import {
    ErrorResponse,
    FORBIDDEN_ERROR,
    UNAUTHORIZED_ERROR,
    VerifyRequestHeader,
} from "common/verify";
import { verifyRequest } from "controllers/verify.controller";
import { Request, Response, Router } from "express";
import { StatusCodes } from "http-status-codes";

const router = Router();

/*
get all
get one
delete one
rename one
extend one
get by user
create for user
get by workshop
create for workshop
get by machine
create for machine
*/

router.get(
    "/by/user/:UUID",
    async (req: Request<{ UUID: string }>, res: Response) => {
        const user_uuid = req.params.UUID;
    },
);

//router.get("/", async (req: Request, res: Response) => {};
