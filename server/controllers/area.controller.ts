import { UUID } from "common/global";
import { TArea, TAreaStatus, TPublicAreaData } from "common/area";
import { Area } from "models/area.model";
import mongoose from "mongoose";
import { Machine } from "models/machine.model";

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

/**
 * Get all public area data, which only includes public
 * areas and is stripped of log information
 * @returns A promise to list of TPublicAreaData objects representing all
 *    public areas
 */
export async function getPublicAreas(): Promise<TPublicAreaData[]> {
    const Areas = mongoose.model("Area", Area, "areas");
    // Get all areas that are public
    return Areas.find({ hidden: false }).select([
        // Remove private information from the area
        "-uuid",
        "-status_logs",
    ]);
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
                current_status: status,
            },
        },
        { returnDocument: "after" },
    );
}
