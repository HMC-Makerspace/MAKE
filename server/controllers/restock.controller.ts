import { TRestockRequest, TRestockRequestLog, RESTOCK_REQUEST_STATUS } from "common/restock";
import { TUser, UserUUID } from "common/user";
import { RestockRequest } from "models/restock.model";
import mongoose from "mongoose";
import { Logger } from "pino";
import { getUser } from "./user.controller";
import { sendTemplatedEmail } from "./email.controller";
import RestockRequestTemplate from "email_templates/restock_completion";
import { getInventoryItem } from "./inventory.controller";
import { InventoryItemUUID, ITEM_RELATIVE_QUANTITY } from "common/inventory";
import { UUID } from "common/global";

/**
 * Get all restock requests
 * @returns A promise to an array of all restock requests
 */
export async function getRestockRequests() {
    const RestockRequests = mongoose.model("RestockRequest", RestockRequest);
    return RestockRequests.find();
}

/**
 * Get a specific restock request by UUID
 * @param request_uuid The UUID of the request to search for
 * @returns A promise to a restock request, or null if no request has the given UUID
 */
export async function getRestockRequest(request_uuid: string) {
    const RestockRequests = mongoose.model("RestockRequest", RestockRequest);
    return RestockRequests.findOne({ uuid: request_uuid });
}

/**
 * Get all restock requests made by a specific user
 * @param user_uuid The UUID of the user to search for
 * @returns A promise to an array of all restock requests made by the user
 */
export async function getRestockRequestsByUser(user_uuid: UserUUID) {
    const RestockRequests = mongoose.model("RestockRequest", RestockRequest);
    return RestockRequests.find({ requesting_user: user_uuid });
}

/**
 * Create a new restock request
 * @param request_obj The complete restock request information
 * @returns The new restock request object
 */
export async function createRestockRequest(request_obj: any) {
    const RestockRequests = mongoose.model("RestockRequest", RestockRequest);
    // Check if the request already exists
    const existingRequest = await RestockRequests.exists({
        uuid: request_obj.uuid,
    });
    if (existingRequest) {
        // If so, return null, and don't create a new request
        return null;
    }
    // If the request doesn't exist, create a new request and return it
    const newRequest = new RestockRequests(request_obj);
    return newRequest.save();
}


/**
 * Create a new restock request
 * @param item_uuid The item uuid of the requested restock
 * @returns true if this is a valid new restock or false if it already exissts
 */
export async function validNewRestockRequest(item_uuid: InventoryItemUUID) {
    const RestockRequests = mongoose.model("RestockRequest", RestockRequest);
    // Check if there are requests for this item already
    const existingRequests = await RestockRequests.find({ item_uuid: item_uuid });

    // If any existing request's current_status is NOT restocked or denied, return false, restock already exists
    const activeRestock = existingRequests.some(
        (req) =>
            req.current_status !== RESTOCK_REQUEST_STATUS.RESTOCKED &&
            req.current_status !== RESTOCK_REQUEST_STATUS.DENIED
    );

    return !activeRestock;
}


/**
 * Delete a restock request by UUID
 * @param request_uuid The UUID of the request to delete
 * @returns The deleted restock request object, or null if the request doesn't exist
 */
export async function deleteRestockRequest(request_uuid: string) {
    const RestockRequests = mongoose.model("RestockRequest", RestockRequest);
    // If the request exists, return it and delete it
    return RestockRequests.findOneAndDelete({ uuid: request_uuid });
}

/**
 * Update a restock request
 * @param request_obj The information to update the request with
 * @returns The updated restock request object, or null if the request doesn't exist
 */
export async function updateRestockRequest(request_obj: any) {
    const RestockRequests = mongoose.model("RestockRequest", RestockRequest);
    // If the request exists, return it and delete it
    return RestockRequests.findOneAndReplace(
        { uuid: request_obj.uuid },
        request_obj,
        {
            returnDocument: "after",
        },
    );
}

/**
 * Update the status of a restock request
 * @param request_uuid The UUID of the request to update
 * @param new_status The new status to set for the request
 * @returns The updated restock request object, or null if the request doesn't exist
 */
export async function updateRestockRequestStatus(
    request_uuid: string,
    new_status: TRestockRequestLog,
    logger: Logger,
) {
    // Find the request by UUID
    const request = await getRestockRequest(request_uuid);
    // If the request doesn't exist, return null
    if (!request) {
        return null;
    }
    // If the item is restocked, update its quantity
    if (new_status.status === RESTOCK_REQUEST_STATUS.RESTOCKED) {
        // Update the item's quantity from low to high, as necessary
        const item = await getInventoryItem(request.item_uuid);
        if (item?.quantity === ITEM_RELATIVE_QUANTITY.LOW) {
            item.quantity = ITEM_RELATIVE_QUANTITY.HIGH;
            await item.save();
        }
    }
    sendRestockUpdateEmail(request, logger);
    // Update the request's current status and status logs
    request.current_status = new_status.status;
    request.status_logs.push(new_status);
    return request.save();
}

export async function updateRestockRequestStatuses(
    restocks: UUID[],
    new_status: TRestockRequestLog,
    logger: Logger,
) {
    let new_restocks: TRestockRequest[] = [];
    for (const restock of restocks) {
        const new_restock = await updateRestockRequestStatus(
            restock,
            new_status,
            logger,
        );
        if (new_restock) {
            new_restocks.push(new_restock);
        }
    }
    return new_restocks;
}

/**
 * Update the status of a restock request
 * @param request_uuid The UUID of the request to update
 * @param new_person: The new person to add to the mailing list
 * @returns The updated restock request object, or null if the request doesn't exist
 */
export async function updateMailingList(
    request_uuid: string,
    new_list: UserUUID[],
) {
    // Find the request by UUID
    const request = await getRestockRequest(request_uuid);
    // If the request doesn't exist, return null
    if (!request) {
        return null;
    }
    // Update the request's mailing list
    request.mailing_list = new_list;
    return request.save();
}

export async function removeUserFromMailingList(
    request_uuid: string,
    user_uuid: UserUUID,
) {
    // Find the request by UUID
    const request = await getRestockRequest(request_uuid);
    // If the request doesn't exist, return null
    if (!request) {
        return null;
    }
    // Remove the user from the mailing list by filtering them out
    request.mailing_list = request.mailing_list.filter(uuid => uuid !== user_uuid);
    return request.save();
}

export async function sendRestockUpdateEmail(
    restock: TRestockRequest,
    logger: Logger,
) {
    const user = await getUser(restock.requesting_user);
    const item = await getInventoryItem(restock.item_uuid);
    if (!user) {
        logger.warn({
            msg: "No requesting user associated with restock, unable to send update email",
            restock: restock,
        });
        return;
    }
    if (!item) {
        logger.warn({
            msg: "Invalid item associated with restock, unable to send update email",
            restock: restock,
        });
        return;
    }

    const date = new Date(Date.now());
    // Send automated email to requesting user to indicate that the status has changed
    sendTemplatedEmail(
        user.email,
        `Updated Restock Request (${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()})`,
        RestockRequestTemplate(restock, user, item),
        logger,
        restock.mailing_list
    );
}
