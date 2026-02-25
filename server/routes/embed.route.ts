import { API_SCOPE } from "common/global";
import {
    createEmbed,
    deleteEmbed,
    getEmbeds,
    getEmbedsVisibleToUser,
    patchEmbed,
} from "controllers/embed.controller";
import { verifyRequest } from "controllers/verify.controller";
import { Request, Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import {
    ErrorResponse,
    UNAUTHORIZED_ERROR,
    FORBIDDEN_ERROR,
    VerifyRequestHeader,
    SuccessfulResponse,
} from "common/verify";
import { TEmbed } from "common/embed";

// --- Request and Response Types ---
type EmbedRequest = Request<{}, {}, { embed_obj: TEmbed }>;
type EmbedResponse = Response<TEmbed | ErrorResponse>;
type EmbedsResponse = Response<TEmbed[] | ErrorResponse>;

const router = Router();

// --- Embed Routes ---

/**
 * Get all public embeds. This route allows for an optional
 * `requesting_uuid` header to find all embeds that this user is
 * authorized to see. If the user is an admin or has the
 * {@link API_SCOPE.GET_ALL_EMBEDS} scope, all embeds
 * are returned.
 */
router.get("/public", async (req: Request, res: EmbedsResponse) => {
    const requesting_uuid = req.user?.uuid as string;

    req.log.debug({
        msg: `Getting embeds visible to user ${requesting_uuid}`,
        requesting_uuid: requesting_uuid,
    });

    const embeds = await getEmbedsVisibleToUser(requesting_uuid);
    if (!embeds) {
        req.log.warn(`No embeds found visible to user ${requesting_uuid}`);
    } else {
        req.log.debug(`Returned embeds visible to user ${requesting_uuid}`);
    }
    res.status(StatusCodes.OK).json(embeds);
});

/**
 * Get all embeds. This is a protected route, and a `requesting_uuid`
 * header is required to call it. The user must have the
 * {@link API_SCOPE.GET_ALL_EMBEDS} scope.
 */
router.get("/", async (req: Request, res: EmbedsResponse) => {
    const requesting_uuid = req.user?.uuid as string;
    // If no requesting user_uuid is provided, the call is not authorized
    if (!requesting_uuid) {
        req.log.warn("No requesting_uuid was provided while getting embeds");
        res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
        return;
    }
    req.log.debug({
        msg: "Getting embeds",
        requesting_uuid: requesting_uuid,
    });

    // If the user is authorized, get all embeds information
    if (await verifyRequest(requesting_uuid, API_SCOPE.GET_ALL_EMBEDS)) {
        const embeds = await getEmbeds();
        // If no embeds are found, log an error, but still return an
        // empty array
        if (!embeds) {
            req.log.error("No embeds found in the database");
        } else {
            req.log.debug("Returned all embeds");
        }
        res.status(StatusCodes.OK).json(embeds);
    } else {
        req.log.warn({
            msg: "Forbidden user attempted to get all embeds",
            requesting_uuid: requesting_uuid,
        });
        // If the user is not authorized, provide a status error
        res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
    }
});

/**
 * Patch a specific embed by UUID. Does not allow creating new embeds.
 * This is a protected route, and a `requesting_uuid` header is required to
 * call it. The user must have the {@link API_SCOPE.UPDATE_EMBED} scope. If the
 * user is not authorized, a status error is returned. If the user is authorized,
 * the updated embed object is returned.
 */
router.patch(
    "/:UUID",
    async (
        req: Request<
            { UUID: string },
            {},
            { partial_embed_obj: Partial<TEmbed> }
        >,
        res: EmbedResponse,
    ) => {
        const requesting_uuid = req.user?.uuid as string;
        const embed_uuid = req.params.UUID;
        const partial_embed = req.body.partial_embed_obj;

        // If no requesting user uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn(
                `No requesting_uuid was provided while updating ${embed_uuid}`,
            );
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }

        req.log.debug({
            msg: `Patching embed with uuid ${embed_uuid}`,
            partial_embed_obj: partial_embed,
            requesting_uuid: requesting_uuid,
        });

        // If the user is authorized, delete a machine object
        if (await verifyRequest(requesting_uuid, API_SCOPE.UPDATE_EMBED)) {
            const embed = await patchEmbed(embed_uuid, partial_embed);
            if (!embed) {
                req.log.warn(
                    `Embed with uuid ${embed_uuid} could not be ` +
                        `patched because it was not found.`,
                );
                res.status(StatusCodes.NOT_FOUND).json({
                    error: `Embed with uuid ${embed_uuid} could not be found`,
                });
                return;
            }
            req.log.debug(`Patched embed ${embed_uuid}`);
            res.status(StatusCodes.OK).json(embed);
        } else {
            req.log.warn({
                msg: "Forbidden user attempted to patch an embed",
                requesting_uuid: requesting_uuid,
            });
            // If the user is not authorized, provide a status error
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

/**
 * Create a new embed.
 * This is a protected route, and a `requesting_uuid` header is required to
 * call it. The user must have the {@link API_SCOPE.CREATE_EMBED} scope. If the
 * user is not authorized, a status error is returned. If the user is
 * authorized, the new Embed object is returned.
 */
router.post("/", async (req: EmbedRequest, res: EmbedResponse) => {
    // Get the embed object from the request body
    const embed_obj = req.body.embed_obj;
    if (!embed_obj) {
        req.log.warn("No embed object provided for creating new embed");
        res.status(StatusCodes.BAD_REQUEST).json({
            error: "No embed object was provided.",
        });
        return;
    }

    // Check for authorization
    const requesting_uuid = req.user?.uuid as string;
    const new_embed_uuid = embed_obj.uuid;
    // If no requesting user_uuid is provided, the call is not authorized
    if (!requesting_uuid) {
        req.log.warn(
            "No requesting_uuid was provided while creating new embed.",
        );
        res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
        return;
    }
    req.log.debug({
        msg: `Creating embed with uuid ${new_embed_uuid}`,
        requesting_uuid: requesting_uuid,
    });

    // If the user is authorized, perform the creation
    if (await verifyRequest(requesting_uuid, API_SCOPE.CREATE_EMBED)) {
        const embed = await createEmbed(embed_obj);
        if (!embed) {
            req.log.warn(
                `An attempt was made to create an embed with uuid ` +
                    `${new_embed_uuid}, but an embed with that uuid already exists`,
            );
            res.status(StatusCodes.CONFLICT).json({
                error: `An embed with uuid \`${new_embed_uuid}\` already exists.`,
            });
            return;
        }
        req.log.debug(`Created embed with uuid ${new_embed_uuid}`);
        // Return the new embed object
        res.status(StatusCodes.CREATED).json(embed);
    } else {
        // If the user is not authorized, provide a status error
        req.log.warn({
            msg: `Forbidden user attempted to create an embed.`,
            requesting_uuid: requesting_uuid,
        });
        res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
    }
});

/**
 * Delete a specific embed by UUID
 * This is a protected route, and a `requesting_uuid` header is required to
 * call it. The user must have the {@link API_SCOPE.DELETE_EMBED} scope. If the
 * user is not authorized, a status error is returned. If the user is
 * authorized, a status ok is returned.
 */
router.delete(
    "/:UUID",
    async (req: Request<{ UUID: string }>, res: SuccessfulResponse) => {
        // Check for authorization
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid = req.user?.uuid as string;
        // If no requesting user_uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn(
                "No requesting_uuid was provided while deleting embed",
            );
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }

        const embed_uuid = req.params.UUID;
        req.log.debug({
            msg: `Deleting embed with uuid ${embed_uuid}`,
            requesting_uuid: requesting_uuid,
        });

        // Verify the user is authorized to delete embeds
        if (await verifyRequest(requesting_uuid, API_SCOPE.DELETE_EMBED)) {
            // If the user is authorized, perform the deletion
            const deleted_embed = await deleteEmbed(embed_uuid);
            if (!deleted_embed) {
                req.log.warn(
                    `No embed found to delete with uuid ${embed_uuid}`,
                );
                res.status(StatusCodes.NOT_FOUND).json({
                    error: `No embed found to delete with uuid \`${embed_uuid}\`.`,
                });
                return;
            } else {
                req.log.debug(`Deleted embed with uuid ${embed_uuid}`);
                // Return a status ok, deleted embed object is not returned
                res.status(StatusCodes.NO_CONTENT).json({});
            }
        } else {
            // If the user is not authorized, provide a status error
            req.log.warn({
                msg: `Forbidden user attempted to delete embed with uuid ${embed_uuid}`,
                requesting_uuid: requesting_uuid,
            });
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

export default router;
