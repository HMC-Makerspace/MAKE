import { InventoryItemUUID, TInventoryItem } from "common/inventory";
import { UserUUID } from "common/user";
import { InventoryItem } from "models/inventory.model";
import mongoose from "mongoose";
import { getUser } from "./user.controller";
import { getAreasVisibleToUser, getPublicAreas } from "./area.controller";
import { verifyRequest } from "./verify.controller";
import { API_SCOPE, UUID } from "common/global";

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
export async function getInventoryItem(item_uuid: InventoryItemUUID) {
    const Inventory = mongoose.model("InventoryItem", InventoryItem);
    return Inventory.findOne({ uuid: item_uuid });
}

/**
 * Get multiple inventory items by UUID
 * @param item_uuids The UUIDs of the item to search for
 * @returns A promise to an inventory item, or null if no item has the given UUID
 */
export async function getInventoryItems(item_uuids: InventoryItemUUID[]) {
    const Inventory = mongoose.model("InventoryItem", InventoryItem);
    return Inventory.find({ uuid: item_uuids });
}

export async function getInventoryVisibleToUser(
    user_uuid: UserUUID,
): Promise<TInventoryItem[]> {
    // If the user doesn't exist, return only public items
    const user = await getUser(user_uuid);
    if (!user) {
        return getPublicInventory();
    }

    // If the user is an admin or can get all items, return all items
    if (
        await verifyRequest(
            user_uuid,
            API_SCOPE.ADMIN,
            API_SCOPE.GET_ALL_INVENTORY,
        )
    ) {
        return getInventory();
    }

    // Otherwise, find all items that the user can access
    const role_uuids = user.active_roles.map((log) => log.role_uuid);
    const cert_uuids =
        user.active_certificates?.map((cert) => cert.certification_uuid) ?? [];

    // Get all visible areas
    const visible_areas = (await getAreasVisibleToUser(user_uuid)).map(
        (area) => area.uuid,
    );

    const Inventory = mongoose.model("InventoryItem", InventoryItem);
    // Find all items that require no roles or which require roles that the user
    // has at least one of, and remove locations the user does not have access to
    return await Inventory.aggregate([
        {
            $match: {
                $or: [
                    { visible_to: null },
                    { visible_to: { $in: role_uuids } },
                ],
            },
        },
        {
            $set: {
                locations: {
                    $filter: {
                        input: "$locations",
                        as: "loc",
                        cond: {
                            $in: ["$$loc.area", visible_areas],
                        },
                    },
                },
            },
        },
    ]);

    // Consider filter out items that require certifications the user doesn't have
    // Should potentially check parent kit's required certifications as well?
    /*.filter((item) =>
        item.required_certifications?.every((cert) =>
            cert_uuids.includes(cert.certification_uuid),
        ),
    );*/
}

/**
 * Get all inventory items that are public (no roles or certifications required,
 * and not in private areas)
 * @returns A promise to an array of all public inventory items
 */
async function getPublicInventory(): Promise<TInventoryItem[]> {
    const Inventory = mongoose.model("InventoryItem", InventoryItem);

    const visible_areas = (await getPublicAreas()).map((area) => area.uuid);

    // Find all items that need no roles or certifications
    return await Inventory.aggregate([
        {
            $match: {
                visible_to: null,
                // Required certifications must either be empty or not exist
                $or: [
                    { required_certifications: null },
                    { required_certifications: { $size: 0 } },
                ],
            },
        },
        {
            $set: {
                locations: {
                    $filter: {
                        input: "$locations",
                        as: "loc",
                        cond: {
                            $in: ["$$loc.area", visible_areas],
                        },
                    },
                },
            },
        },
    ]);
}

/**
 * Patch part of an inventory item information given an partial TInventoryItem object.
 * Item is found by UUID.
 * @param partial_item_obj The item's complete and updated information
 * @returns A promise to the updated TInventoryItem object, or null if no
 *          checkout has the given UUID
 */
export async function patchInventoryItem(
    item_uuid: UUID,
    partial_item_obj: Partial<TInventoryItem>,
): Promise<TInventoryItem | null> {
    const Inventory = mongoose.model("InventoryItem", InventoryItem);
    // Update the given item with partial changes partial_item_obj, searching by uuid
    return await Inventory.findOneAndUpdate(
        { uuid: item_uuid },
        {
            // Updates the partial change
            $set: partial_item_obj,
        },
        { returnDocument: "after" },
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

export async function clearInventoryAvailability() {
    // Update all available amounts to be equal to max quantity
    const Inventory = mongoose.model("InventoryItem", InventoryItem);
    // Must be a list (aggregation pipeline) to set available
    // based on quantity (another field)
    await Inventory.updateMany({}, [{ $set: { available: "$quantity" } }]);
}
