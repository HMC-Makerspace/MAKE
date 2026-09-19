import { API_SCOPE, UUID } from "common/global";
import {
    MachineUUID,
    TMachine,
    TMachineInstance,
    TPublicMachineData,
} from "common/machine";
import { Machine } from "models/machine.model";
import mongoose from "mongoose";
import { getUser } from "./user.controller";
import { verifyRequest } from "./verify.controller";
import { InventoryItem } from "models/inventory.model";
import { ITEM_ROLE } from "common/inventory";
import { Area } from "models/area.model";

/**
 * Get all machines in the database
 * @returns A promise to list of TMachine objects representing all machines
 *      in the db
 */
export async function getMachines(): Promise<TMachine[]> {
    const Machines = mongoose.model("Machine", Machine);
    return Machines.find();
}

/**
 * Get a specific machine's information, searching by UUID
 * @param machine_uuid The machine's UUID to search by
 * @returns A promise to a TMachine object, or null if no machine has the given UUID
 */
export async function getMachine(machine_uuid: UUID) {
    const Machines = mongoose.model("Machine", Machine);
    return Machines.findOne({ uuid: machine_uuid });
}

/**
 * Get all machines visible to a user, which includes all public machines and
 * all machines that the user has an authorized role for
 * @param user_uuid The user's UUID
 * @returns A promise to a list of TPublicMachineData objects representing all
 *      machines visible to the user
 */
export async function getMachinesVisibleToUser(
    user_uuid: UUID,
): Promise<TPublicMachineData[]> {
    // If the user doesn't exist, return only public machines
    const user = await getUser(user_uuid);
    if (!user) {
        return getPublicMachines();
    }

    // If the user is an admin or can get all machines, return all machines
    if (
        await verifyRequest(
            user_uuid,
            API_SCOPE.ADMIN,
            API_SCOPE.GET_ALL_MACHINES,
        )
    ) {
        return getMachines();
    }

    // Otherwise, find all machines that the user can access
    const role_uuids = user.active_roles.map((log) => log.role_uuid);

    const Machines = mongoose.model("Machine", Machine);
    // Find all machines that require no roles or which require roles that the
    // user has and ensures that the documents shown are ones the users have roles for
    return await Machines.aggregate([
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
                documents: {
                    $filter: {
                        input: "$documents",
                        as: "docs",
                        cond: {
                            $or: [
                                {
                                    $not: {
                                        $isArray: "$$docs.visible_to",
                                    },
                                },
                                {
                                    $gt: [
                                        {
                                            $size: {
                                                $setIntersection: [
                                                    "$$docs.visible_to",
                                                    role_uuids,
                                                ],
                                            },
                                        },
                                        0,
                                    ],
                                },
                            ],
                        },
                    },
                },
            },
        },
    ]);
}

/**
 * Get all public machine data, which is stripped of log information
 * @returns A promise to list of TPublicMachineData objects representing all
 *    public machine data
 */
async function getPublicMachines(): Promise<TPublicMachineData[]> {
    const Machines = mongoose.model("Machine", Machine, "machines");
    // Get all machines that are public
    return Machines.find({
        visible_to: null,
    }).select([
        // Remove private information from the machine
        "-status_logs",
    ]);
}

/**
 * Create a new machine in the database
 * @param machine_obj the complete machine information
 * @returns The machine object
 */
export async function createMachine(
    machine_obj: TMachine,
): Promise<TMachine | null> {
    const Machines = mongoose.model("Machine", Machine);
    // Check if the machine already exists
    const existingMachine = await Machines.exists({
        uuid: machine_obj.uuid,
    });
    if (existingMachine) {
        // If so, return null, and don't create a new machine
        return null;
    }
    // If the machine doesn't exist, create a new machine and return it
    const newMachine = new Machines(machine_obj);
    return newMachine.save();
}

/**
 * Delete a machine in the database by UUID
 * @param machine_uuid the specific machine's unique id
 * @returns The deleted machine object, or null if the machine doesn't exist
 */
export async function deleteMachine(
    machine_uuid: UUID,
): Promise<TMachine | null> {
    const Machines = mongoose.model("Machine", Machine);
    // If the machine has associated items, delete them
    const Inventory = mongoose.model("InventoryItem", InventoryItem);
    await Inventory.deleteMany({
        role: ITEM_ROLE.MACHINE,
        linked_uuid: machine_uuid,
    });
    // If any areas have this machine, remove them
    const Areas = mongoose.model("Area", Area);
    await Areas.updateMany(
        {
            equipment: machine_uuid,
        },
        {
            $pull: {
                equipment: machine_uuid,
            },
        },
    );
    // If the machine exists, return it and delete it
    return Machines.findOneAndDelete({ uuid: machine_uuid });
}

/**
 * Update a machine in the database, searching by UUID
 * @param machine_obj the new machine information
 * @returns The updated machine object, or null if no machine exists by the
 *      given UUID
 */
export async function updateMachine(
    machine_obj: TMachine,
): Promise<TMachine | null> {
    const Machines = mongoose.model("Machine", Machine);
    // If the machine exists, update it and return it
    return Machines.findOneAndReplace({ uuid: machine_obj.uuid }, machine_obj, {
        returnDocument: "after",
    });
}

/**
 * Updates a machine's data with partial information
 * @param machine_uuid The machine to update
 * @returns The updated machine object
 */
export async function patchMachine(
    machine_uuid: UUID,
    partial_machine: Partial<TMachine>,
): Promise<TMachine | null> {
    const Machines = mongoose.model("Machine", Machine);
    
    const updated_machine = await Machines.findOneAndUpdate(
        { uuid: machine_uuid },
        {
            // Updates the partial change
            $set: partial_machine,
        },
        { returnDocument: "after" },
    );
    if (
        updated_machine &&
        // If any data related to machine instances changes,
        // refresh instance items
        (partial_machine.reservable !== undefined ||
            partial_machine.name ||
            partial_machine.available_to ||
            partial_machine.visible_to ||
            partial_machine.reservation_type ||
            partial_machine.required_certifications)
    ) {
        refreshMachineItems(updated_machine, updated_machine.instances);
    }
    return updated_machine;
}

/**
 * Set a machine's statuses in the database, searching by UUID
 * @param machine_uuid The machine's UUID
 * @param statuses The new list of instances for all the machines of this type
 * @returns The updated machine object, or null if no machine has the given UUID
 */
export async function setMachineInstances(
    machine_uuid: UUID,
    instances: TMachineInstance[],
): Promise<TMachine | null> {
    const Machines = mongoose.model("Machine", Machine);
    // If the machine exists, update it and return it
    const machine = await Machines.findOneAndUpdate(
        { uuid: machine_uuid },
        // Perform the following operations:
        {
            // Set the machine instances
            $set: {
                instances: instances,
                count: instances.length,
            },
            $push: {
                // Push the new statuses as a log to the status_logs array
                status_logs: {
                    $each: instances.map((i) => {
                        return {
                            timestamp: Date.now() / 1000,
                            instance_uuid: i.uuid,
                            status: i.status,
                            message: i.message,
                        };
                    }),
                },
            },
        },
        { returnDocument: "after" },
    );

    if (!machine) return null;

    refreshMachineItems(machine, instances);

    return machine;
}

/**
 * Create linked items for a machine
 * @param machine The entire machine object
 * @param statuses The list of instances
 */
export async function refreshMachineItems(
    machine: TMachine,
    instances: TMachineInstance[],
) {
    if (machine.reservable && machine.reservation_type) {
        // Pre-fetch item location data
        const Areas = mongoose.model("Areas", Area);
        const areas_with_machine = await Areas.find({
            equipment: machine.uuid,
        });
        const locations = areas_with_machine.map((a) => ({
            area: a.uuid,
        }));
        const Inventory = mongoose.model("InventoryItem", InventoryItem);
        // Delete existing linked items
        await Inventory.deleteMany({
            role: ITEM_ROLE.MACHINE,
            linked_uuid: machine.uuid,
        });
        // Create a linked item for each instance
        instances.forEach((instance, i) => {
            const name = instance.name || machine.name + ` ${i + 1}`;
            const instance_item_data = {
                uuid: instance.uuid, // Same UUID as the instance
                name: name,
                long_name: `Instance ${name} of machine ${machine.name}`,
                role: ITEM_ROLE.MACHINE,
                linked_uuid: machine.uuid,
                quantity: 1,
                available: instance.reserved ? 0 : 1,
                access_type: machine.reservation_type,
                locations: locations,
                required_certifications: machine.required_certifications,
                available_to: machine.available_to,
                visible_to: machine.visible_to,
            };
            new Inventory(instance_item_data).save();
        });
    } else if (machine.reservable === false) {
        // If the machine is no longer reservable, delete all
        // linked instance items
        const Inventory = mongoose.model("InventoryItem", InventoryItem);
        await Inventory.deleteMany({
            role: ITEM_ROLE.MACHINE,
            linked_uuid: machine.uuid,
        });
    }
}

export async function reserveMachineInstance(
    machine_uuid: MachineUUID,
    instance_uuid: UUID,
    reserved: boolean = true,
) {
    const Machines = mongoose.model("Machine", Machine);
    return Machines.updateOne(
        {
            uuid: machine_uuid,
        },
        {
            $set: { "instances.$[elem].reserved": reserved },
        },
        {
            arrayFilters: [{ "elem.uuid": instance_uuid }],
        },
    );
}

/**
 * Clear the reserved status for all instances of all machines
 */
export async function clearMachineReservations() {
    const Machines = mongoose.model("Machine", Machine);
    await Machines.updateMany(
        {},
        {
            $set: { "instances.$[].reserved": false },
        },
    );
}