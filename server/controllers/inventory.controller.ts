import { TInventoryItem } from "common/inventory";
import { UserUUID } from "common/user";
import { InventoryItem } from "models/inventory.model";
import mongoose from "mongoose";
import { getUser } from "./user.controller";
import { getPrivateAreas } from "./area.controller";
import { verifyRequest } from "./verify.controller";
import { API_SCOPE } from "common/global";

/**
 * Get all inventory items
 * @returns A promise to an array of all inventory items
 */
export async function getInventory(): Promise<TInventoryItem[]> {
    const Inventory = mongoose.model("InventoryItem", InventoryItem);
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
    const Inventory = mongoose.model("InventoryItem", InventoryItem);
    return Inventory.findOne({ uuid: item_uuid });
}

// TODO: Finish once Area is done
export async function getInventoryVisibleToUser(
    user_uuid: UserUUID,
): Promise<TInventoryItem[]> {
    // If the user doesn't exist, return an empty array
    const user = await getUser(user_uuid);
    if (!user) {
        return [];
    }

    // If the user is an admin, return all items
    if (await verifyRequest(user_uuid, API_SCOPE.ADMIN)) {
        return getInventory();
    }

    // Otherwise, find all items that the user can access
    const role_uuids = user.active_roles.map((log) => log.role_uuid);
    const cert_uuids =
        user.certificates?.map((cert) => cert.certification_uuid) ?? [];

    // Get all hidden areas
    const private_areas = (await getPrivateAreas()).map((area) => area.uuid);

    const Inventory = mongoose.model("InventoryItem", InventoryItem);
    // Find all items that the user has a role for, and exclude items in
    // private areas
    const items = await Inventory.find({
        $and: [
            { authorized_roles: { $elemMatch: { $in: role_uuids } } },
            { "locations.area": { $nin: private_areas } },
        ],
    });

    // Finally, filter out items that require certifications the user doesn't have
    return items.filter(
        (item) =>
            item.required_certifications?.every((cert) =>
                cert_uuids.includes(cert.certification_uuid),
            ) ?? true,
    );
}

/**
 * Create a new inventory item
 * @param item_obj The complete inventory item information
 * @returns The new inventory item object
 */
export async function createInventoryItem(
    item_obj: TInventoryItem,
): Promise<TInventoryItem | null> {
    const Inventory = mongoose.model("InventoryItem", InventoryItem);
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
    const Inventory = mongoose.model("InventoryItem", InventoryItem);
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
    const Inventory = mongoose.model("InventoryItem", InventoryItem);
    // If the item exists, return it and delete it
    return Inventory.findOneAndReplace({ uuid: item_obj.uuid }, item_obj, {
        returnDocument: "after",
    });
}
