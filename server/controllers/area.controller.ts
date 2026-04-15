import { API_SCOPE, UUID } from "common/global";
import { TArea, TAreaStatus } from "common/area";
import { Area } from "models/area.model";
import mongoose from "mongoose";
import { Machine } from "models/machine.model";
import { getUser } from "./user.controller";
import { verifyRequest } from "./verify.controller";
import { InventoryItem } from "models/inventory.model";
import { ITEM_ACCESS_TYPE, ITEM_ROLE, TInventoryItem } from "common/inventory";
import { refreshMachineItems } from "./machine.controller";

/**
 * Get all areas in the database
 * @returns A promise to list of TArea objects representing all areas
 *      in the db
 */
export async function getAreas(): Promise<TArea[]> {
    const Areas = mongoose.model("Area", Area);
    return Areas.find();
}

/**
 * Get a specific area's information, searching by UUID
 * @param area_uuid The area's UUID to search by
 * @returns A promise to a TArea object, or null if no area has the given UUID
 */
export async function getArea(area_uuid: UUID) {
    const Areas = mongoose.model("Area", Area);
    return Areas.findOne({ uuid: area_uuid });
}

export async function getAreasVisibleToUser(user_uuid: UUID): Promise<TArea[]> {
    // If the user doesn't exist, return only public areas
    const user = await getUser(user_uuid);
    if (!user) {
        return getPublicAreas();
    }

    // If the user is an admin or can get all areas, return all areas
    if (
        await verifyRequest(user_uuid, API_SCOPE.ADMIN, API_SCOPE.GET_ALL_AREAS)
    ) {
        return getAreas();
    }

    // Otherwise, find all areas that the user can access
    const role_uuids = user.active_roles.map((log) => log.role_uuid);

    const Areas = mongoose.model("Area", Area);
    // Find all areas that require no roles or which require roles that the
    // user has
    return Areas.find({
        $or: [{ visible_to: null }, { visible_to: { $in: role_uuids } }],
    });
}

/**
 * Get all public area data, which only includes public
 * areas and is stripped of log information
 * @returns A promise to list of TPublicAreaData objects representing all
 *    public areas
 */
export async function getPublicAreas(): Promise<TArea[]> {
    const Areas = mongoose.model("Area", Area, "areas");
    // Get all areas that are public
    return Areas.find({
        visible_to: null,
    });
}

/**
 * Get all machine objects in a specific area
 * @param area_uuid The area's UUID to search by
 * @returns A list of TMachine objects representing all machines in the area
 */
export async function getMachinesInArea(area_uuid: UUID) {
    // Get the list of machines in the area
    const Areas = mongoose.model("Area", Area);
    const area = await Areas.findOne({ uuid: area_uuid }).select(["equipment"]);
    // If there are no machines in the area, return an empty list
    if (!area || !area.equipment) {
        return [];
    }
    // Return all machine objects that are in the equipment list
    const Machines = mongoose.model("Machine", Machine);
    return Machines.find({ uuid: { $in: area.equipment } });
}

/**
 * Create a new area in the database
 * @param area_obj the complete area information
 * @returns The area object
 */
export async function createArea(area_obj: TArea): Promise<TArea | null> {
    const Areas = mongoose.model("Area", Area);
    // Check if the area already exists
    const existingArea = await Areas.exists({
        uuid: area_obj.uuid,
    });
    if (existingArea) {
        // If so, return null, and don't create a new area
        return null;
    }
    // If the area doesn't exist, create a new area and return it
    const newArea = new Areas(area_obj);
    return newArea.save();
}

/**
 * Delete a area in the database by UUID
 * @param area_uuid the specific area's unique id
 * @returns The deleted area object, or null if the area doesn't exist
 */
export async function deleteArea(area_uuid: UUID): Promise<TArea | null> {
    const Areas = mongoose.model("Area", Area);
    // If the area has linked items, delete them
    const Inventory = mongoose.model("InventoryItem", InventoryItem);
    await Inventory.deleteMany({
        role: ITEM_ROLE.AREA,
        linked_uuid: area_uuid,
    });
    // If the area exists, return it and delete it
    return Areas.findOneAndDelete({ uuid: area_uuid });
}

/**
 * Update a area in the database, searching by UUID
 * @param area_obj the new area information
 * @returns The updated area object, or null if no area exists by the
 *      given UUID
 */
export async function updateArea(area_obj: TArea): Promise<TArea | null> {
    const Areas = mongoose.model("Area", Area);
    // If the area exists, update it and return it
    return Areas.findOneAndReplace({ uuid: area_obj.uuid }, area_obj, {
        returnDocument: "after",
    });
}

/**
 * Set all areas, deleting any that exist.
 * @param area_objs The new list of area objects.
 * @returns The inputted list of area objects.
 */
export async function setAllAreas(area_objs: TArea[]): Promise<TArea[] | null> {
    const Areas = mongoose.model("Area", Area);
    // Delete all existing areas
    await Areas.deleteMany({});
    // Add new areas
    for (const area_obj of area_objs) {
        const area = new Areas({
            uuid: area_obj.uuid,
            name: area_obj.name,
            description: area_obj.description,
            documents: area_obj.documents,
            equipment: area_obj.equipment,
            images: area_obj.images,
            required_certifications: area_obj.required_certifications,
            available_to: area_obj.available_to,
            reservable: area_obj.reservable,
            reserved: area_obj.reserved,
            visible_to: area_obj.visible_to,
        });
        await area.save();
    }
    return area_objs;
}

/**
 * Updates a area's data with partial information
 * @param area_uuid The area to update
 * @returns The updated area object
 */
export async function patchArea(
    area_uuid: UUID,
    partial_area: Partial<TArea>,
): Promise<TArea | null> {
    const Areas = mongoose.model("Area", Area);

    const original_area = await Areas.findOne({ uuid: area_uuid });

    const updated_area = await Areas.findOneAndUpdate(
        { uuid: area_uuid },
        {
            // Updates the partial change
            $set: partial_area,
        },
        { returnDocument: "after" },
    );
    if (
        updated_area &&
        // If any data related to area instances changes,
        // refresh instance items
        (partial_area.reservable !== undefined ||
            partial_area.name ||
            partial_area.available_to ||
            partial_area.visible_to ||
            partial_area.required_certifications)
    ) {
        refreshAreaItem(updated_area);
    }
    if (original_area && updated_area) {
        const equipment_to_update = new Set(updated_area.equipment).union(
            new Set(original_area.equipment),
        );
        console.log("Refreshing machines from area update");
        const Machines = mongoose.model("Machine", Machine);
        for (const e of equipment_to_update) {
            const machine = await Machines.findOne({
                uuid: e,
            });
            if (machine) {
                console.log("Refreshing", machine.uuid);
                refreshMachineItems(machine, machine.instances);
            }
        }
    }
    return updated_area;
}

/**
 * Update a area's statuses in the database, searching by UUID
 * @param area_uuid The area's UUID
 * @param status The new list of statuses for all the areas of this type
 * @returns The updated area object, or null if no area has the given UUID
 */
export async function updateAreaStatus(
    area_uuid: UUID,
    status: TAreaStatus,
): Promise<TArea | null> {
    const Areas = mongoose.model("Area", Area);
    // If the area exists, update it and return it
    return Areas.findOneAndUpdate(
        { uuid: area_uuid },
        // Perform the following operations:
        {
            // Push the new status as a log to the status_logs array
            $push: {
                status_logs: {
                    timestamp: Date.now() / 1000,
                    status: status,
                },
            },
            // Replace the current_status with with the new status
            $set: {
                status: status,
            },
        },
        { returnDocument: "after" },
    );
}

/**
 * Create linked item for an area
 * @param area The entire area object
 * @param statuses The list of instances
 */
export async function refreshAreaItem(area: TArea) {
    if (area.reservable) {
        const Inventory = mongoose.model("InventoryItem", InventoryItem);
        // Delete existing linked item
        await Inventory.deleteMany({
            role: ITEM_ROLE.AREA,
            linked_uuid: area.uuid,
        });
        // Create a linked item for the area
        const instance_item_data: TInventoryItem = {
            uuid: crypto.randomUUID(),
            name: `${area.name}: Reservation`,
            long_name: `Reserve the entire area.`,
            role: ITEM_ROLE.AREA,
            linked_uuid: area.uuid,
            quantity: 1,
            available: area.reservable ? 1 : 0,
            access_type: ITEM_ACCESS_TYPE.CHECKOUT_IN_SPACE,
            locations: [
                {
                    area: area.uuid,
                },
            ],
            required_certifications: area.required_certifications,
            available_to: area.available_to,
            visible_to: area.visible_to,
        };
        new Inventory(instance_item_data).save();
    } else if (area.reservable === false) {
        // If the area is no longer reservable, delete
        // linked instance items
        const Inventory = mongoose.model("InventoryItem", InventoryItem);
        await Inventory.deleteMany({
            role: ITEM_ROLE.AREA,
            linked_uuid: area.uuid,
        });
    }
}

/**
 * Remove all reservations from all areas
 */
export async function clearAreaReservations() {
    const Areas = mongoose.model("Area", Area);
    await Areas.updateMany(
        {},
        {
            $set: { reserved: false },
        },
    );
}