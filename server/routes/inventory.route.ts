import { API_SCOPE } from "common/global";
import {
    createInventoryItem,
    deleteInventoryItem,
    getInventory,
    getInventoryItem,
    updateInventoryItem,
} from "controllers/inventory.controller";
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
import { TInventoryItem } from "common/inventory";

// --- Request and Response Types ---
type ItemRequest = Request<{}, {}, { item_obj: TInventoryItem }>;
type ItemResponse = Response<TInventoryItem | ErrorResponse>;
type InventoryResponse = Response<TInventoryItem[] | ErrorResponse>;

const router = Router();

// --- Inventory Routes ---

/**
 * Get a specific inventory item by UUID
 */
router.get(
    "/:UUID",
    async (req: Request<{ UUID: string }>, res: ItemResponse) => {
        const item_uuid = req.params.UUID;
        req.log.debug(`Getting item by uuid ${item_uuid}`);

        const item = await getInventoryItem(item_uuid);

        if (!item) {
            req.log.warn(`Item not found by uuid ${item_uuid}`);
            res.status(StatusCodes.NOT_FOUND).json({
                error: `No item found with uuid \`${item_uuid}\`.`,
            });
            return;
        }

        req.log.debug({
            msg: `Found item by uuid ${item_uuid}`,
            user: item,
        });

        res.status(StatusCodes.OK).json(item);
    },
);

/**
 * Get all inventory items. This is a protected route, and a `requesting_uuid`
 * header is required to call it. The user must have the
 * {@link API_SCOPE.GET_ALL_INVENTORY} scope.
 */
router.get("/", async (req: Request, res: InventoryResponse) => {
    const headers = req.headers as VerifyRequestHeader;
    const requesting_uuid = headers.requesting_uuid;
    // If no requesting user_uuid is provided, the call is not authorized
    if (!requesting_uuid) {
        req.log.warn("No requesting_uuid was provided while getting inventory");
        res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
        return;
    }
    req.log.debug({
        msg: "Getting inventory",
        requesting_uuid: requesting_uuid,
    });

    // If the user is authorized, get all items information
    if (await verifyRequest(requesting_uuid, API_SCOPE.GET_ALL_INVENTORY)) {
        const inventory = await getInventory();
        // If no items are found, log an error, but still return an
        // empty array
        if (!inventory) {
            req.log.error("No inventory items found in the database");
        } else {
            req.log.debug("Returned all inventory items");
        }
        res.status(StatusCodes.OK).json(inventory);
    } else {
        req.log.warn({
            msg: "Forbidden user attempted to get all inventory items",
            requesting_uuid: requesting_uuid,
        });
        // If the user is not authorized, provide a status error
        res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
    }
});

/**
 * Update a specific inventory item by UUID. Does not allow creating new items.
 * This is a protected route, and a `requesting_uuid` header is required to
 * call it. The user must have the {@link API_SCOPE.UPDATE_ITEM} scope. If the
 * user is not authorized, a status error is returned. If the user is authorized,
 * the updated InventoryItem object is returned.
 */
router.put("/", async (req: ItemRequest, res: ItemResponse) => {
    // Get the item object from the request body
    const item_obj = req.body.item_obj;
    if (!item_obj) {
        req.log.warn("No item object provided to update");
        res.status(StatusCodes.BAD_REQUEST).json({
            error: "No item object provided to update.",
        });
        return;
    }

    // Check for authorization
    const headers = req.headers as VerifyRequestHeader;
    const requesting_uuid = headers.requesting_uuid;
    const uuid = item_obj.uuid;
    // If no requesting user_uuid is provided, the call is not authorized
    if (!requesting_uuid) {
        req.log.warn(
            "No requesting_uuid was provided while updating item by UUID",
        );
        res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
        return;
    }
    req.log.debug({
        msg: `Updating item with uuid ${uuid}`,
        requesting_uuid: requesting_uuid,
    });

    // An update request is valid if the requesting user can update any user,
    // or if the requesting user is allowed to update their own information.
    if (await verifyRequest(requesting_uuid, API_SCOPE.UPDATE_ITEM)) {
        // If the user is authorized, perform the update.
        const item = await updateInventoryItem(item_obj);
        if (!item) {
            req.log.warn(`Item not found to update with uuid ${uuid}`);
            res.status(StatusCodes.NOT_FOUND).json({
                error: `No item found to update with uuid \`${uuid}\`.`,
            });
            return;
        }
        req.log.debug(`Updated item with uuid ${uuid}`);
        // Return the updated item object
        res.status(StatusCodes.OK).json(item);
    } else {
        // If the user is not authorized, provide a status error
        req.log.warn({
            msg: `Forbidden user attempted to update item with uuid ${uuid}`,
            requesting_uuid: requesting_uuid,
        });
        res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
    }
});

/**
 * Create a new inventory item.
 * This is a protected route, and a `requesting_uuid` header is required to
 * call it. The user must have the {@link API_SCOPE.CREATE_ITEM} scope. If the
 * user is not authorized, a status error is returned. If the user is
 * authorized, the new InventoryItem object is returned.
 */
router.post("/", async (req: ItemRequest, res: ItemResponse) => {
    // Get the item object from the request body
    const item_obj = req.body.item_obj;
    if (!item_obj) {
        req.log.warn("No item object provided for creating new item");
        res.status(StatusCodes.BAD_REQUEST).json({
            error: "No item object was provided.",
        });
        return;
    }

    // Check for authorization
    const headers = req.headers as VerifyRequestHeader;
    const requesting_uuid = headers.requesting_uuid;
    const new_item_uuid = item_obj.uuid;
    // If no requesting user_uuid is provided, the call is not authorized
    if (!requesting_uuid) {
        req.log.warn(
            "No requesting_uuid was provided while creating new item.",
        );
        res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
        return;
    }
    req.log.debug({
        msg: `Creating item with uuid ${new_item_uuid}`,
        requesting_uuid: requesting_uuid,
    });

    // If the user is authorized, perform the creation
    if (await verifyRequest(requesting_uuid, API_SCOPE.CREATE_ITEM)) {
        const item = await createInventoryItem(item_obj);
        if (!item) {
            req.log.warn(
                `An attempt was made to create an inventory item with uuid ` +
                    `${new_item_uuid}, but an item with that uuid already exists`,
            );
            res.status(StatusCodes.NOT_ACCEPTABLE).json({
                error: `An item with uuid \`${new_item_uuid}\` already exists.`,
            });
            return;
        }
        req.log.debug(`Created item with uuid ${new_item_uuid}`);
        // Return the new item object
        res.status(StatusCodes.OK).json(item);
    } else {
        // If the user is not authorized, provide a status error
        req.log.warn({
            msg: `Forbidden user attempted to create inventory item.`,
            requesting_uuid: requesting_uuid,
        });
        res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
    }
});

/**
 * Delete a specific inventory item by UUID
 * This is a protected route, and a `requesting_uuid` header is required to
 * call it. The user must have the {@link API_SCOPE.DELETE_ITEM} scope. If the
 * user is not authorized, a status error is returned. If the user is
 * authorized, a status ok is returned.
 */
router.delete(
    "/:UUID",
    async (req: Request<{ UUID: string }>, res: SuccessfulResponse) => {
        // Check for authorization
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid = headers.requesting_uuid;
        // If no requesting user_uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn(
                "No requesting_uuid was provided while deleting inventory item",
            );
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }

        const item_uuid = req.params.UUID;
        req.log.debug({
            msg: `Deleting inventory item with uuid ${item_uuid}`,
            requesting_uuid: requesting_uuid,
        });

        // Verify the user is authorized to delete items
        if (await verifyRequest(requesting_uuid, API_SCOPE.DELETE_ITEM)) {
            // If the user is authorized, perform the deletion
            const deleted_item = await deleteInventoryItem(item_uuid);
            if (!deleted_item) {
                req.log.warn(`No item found to delete with uuid ${item_uuid}`);
                res.status(StatusCodes.NOT_FOUND).json({
                    error: `No item found to delete with uuid \`${item_uuid}\`.`,
                });
                return;
            } else {
                req.log.debug(`Deleted item with uuid ${item_uuid}`);
                // Return a status ok, deleted item object is not returned
                res.status(StatusCodes.OK);
            }
        } else {
            // If the user is not authorized, provide a status error
            req.log.warn({
                msg: `Forbidden user attempted to delete item with uuid ${item_uuid}`,
                requesting_uuid: requesting_uuid,
            });
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

export default router;
