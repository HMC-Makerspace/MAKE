import { TInventoryItem } from "common/inventory";
import { UserUUID } from "common/user";
import { InventoryItem } from "models/inventory.model";
import mongoose from "mongoose";

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
export async function getPublicInventory(user_uuid: UserUUID) {
    const Inventory = mongoose.model("InventoryItem", InventoryItem);
    const items = await Inventory.find();
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
