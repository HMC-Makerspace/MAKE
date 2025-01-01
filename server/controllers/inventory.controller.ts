import { TInventoryItem, TRestockRequestLog } from "common/inventory";
import { InventoryItem, RestockRequest } from "models/inventory.model";
import mongoose from "mongoose";

/**
 * Get all inventory items
 * @returns A promise to an array of all inventory items
 */
export async function getInventory(): Promise<TInventoryItem[]> {
    const Inventory = mongoose.model(
        "InventoryItem",
        InventoryItem,
        "inventory",
    );
    return Inventory.find();
}

/**
 * Get a specific inventory item by UUID
 * @param item_uuid The UUID of the item to search for
 * @returns A promise to an inventory item, or null if no item has the given UUID
 */
export async function getInventoryItem(
    item_uuid: string,
): Promise<TInventoryItem | null> {
    const Inventory = mongoose.model(
        "InventoryItem",
        InventoryItem,
        "inventory",
    );
    return Inventory.findOne({ uuid: item_uuid });
}

/**
 * Create a new inventory item
 * @param item_obj The complete inventory item information
 * @returns The new inventory item object
 */
export async function createInventoryItem(
    item_obj: TInventoryItem,
): Promise<TInventoryItem | null> {
    const Inventory = mongoose.model(
        "InventoryItem",
        InventoryItem,
        "inventory",
    );
    // Check if the item already exists
    const existingItem = await Inventory.exists({ uuid: item_obj.uuid });
    if (existingItem) {
        // If so, return null, and don't create a new item
        return null;
    }
    // If the item doesn't exist, create a new item and return it
    const newItem = new Inventory(item_obj);
    return newItem.save();
}

/**
 * Delete an inventory item by UUID
 * @param item_uuid The UUID of the item to delete
 * @returns The deleted inventory item object, or null if the item doesn't exist
 */
export async function deleteInventoryItem(
    item_uuid: string,
): Promise<TInventoryItem | null> {
    const Inventory = mongoose.model(
        "InventoryItem",
        InventoryItem,
        "inventory",
    );
    // If the item exists, return it and delete it
    return Inventory.findOneAndDelete({ uuid: item_uuid });
}

/**
 * Update an inventory item
 * @param item_obj The information to update the item with
 * @returns The updated inventory item object, or null if the item doesn't exist
 */
export async function updateInventoryItem(
    item_obj: TInventoryItem,
): Promise<TInventoryItem | null> {
    const Inventory = mongoose.model(
        "InventoryItem",
        InventoryItem,
        "inventory",
    );
    // If the item exists, return it and delete it
    return Inventory.findOneAndReplace({ uuid: item_obj.uuid }, item_obj, {
        returnDocument: "after",
    });
}

/**
 * Get all restock requests
 * @returns A promise to an array of all restock requests
 */
export async function getRestockRequests() {
    const RestockRequests = mongoose.model(
        "RestockRequest",
        RestockRequest,
        "restock_requests",
    );
    return RestockRequests.find();
}

/**
 * Get a specific restock request by UUID
 * @param request_uuid The UUID of the request to search for
 * @returns A promise to a restock request, or null if no request has the given UUID
 */
export async function getRestockRequest(request_uuid: string) {
    const RestockRequests = mongoose.model(
        "RestockRequest",
        RestockRequest,
        "restock_requests",
    );
    return RestockRequests.findOne({ uuid: request_uuid });
}

/**
 * Create a new restock request
 * @param request_obj The complete restock request information
 * @returns The new restock request object
 */
export async function createRestockRequest(request_obj: any) {
    const RestockRequests = mongoose.model(
        "RestockRequest",
        RestockRequest,
        "restock_requests",
    );
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
 * Delete a restock request by UUID
 * @param request_uuid The UUID of the request to delete
 * @returns The deleted restock request object, or null if the request doesn't exist
 */
export async function deleteRestockRequest(request_uuid: string) {
    const RestockRequests = mongoose.model(
        "RestockRequest",
        RestockRequest,
        "restock_requests",
    );
    // If the request exists, return it and delete it
    return RestockRequests.findOneAndDelete({ uuid: request_uuid });
}

/**
 * Update a restock request
 * @param request_obj The information to update the request with
 * @returns The updated restock request object, or null if the request doesn't exist
 */
export async function updateRestockRequest(request_obj: any) {
    const RestockRequests = mongoose.model(
        "RestockRequest",
        RestockRequest,
        "restock_requests",
    );
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
) {
    // Find the request by UUID
    const request = await getRestockRequest(request_uuid);
    // If the request doesn't exist, return null
    if (!request) {
        return null;
    }
    // Add the new status to the request's status logs
    request.status_logs.push(new_status);
    return request.save();
}
