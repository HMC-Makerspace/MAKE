import { API_SCOPE, UUID } from "common/global";
import { TMachine, TMachineStatus, TPublicMachineData } from "common/machine";
import { Machine } from "models/machine.model";
import mongoose from "mongoose";
import { getUser } from "./user.controller";
import { verifyRequest } from "./verify.controller";

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
    // user has
    return Machines.find({
        $or: [
            { authorized_roles: null },
            { authorized_roles: { $in: role_uuids } },
        ],
    });
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
        authorized_roles: null,
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
 * Update a machine's statuses in the database, searching by UUID
 * @param machine_uuid The machine's UUID
 * @param statuses The new list of statuses for all the machines of this type
 * @returns The updated machine object, or null if no machine has the given UUID
 */
export async function updateMachineStatuses(
    machine_uuid: UUID,
    statuses: TMachineStatus[],
): Promise<TMachine | null> {
    const Machines = mongoose.model("Machine", Machine);
    // If the machine exists, update it and return it
    return Machines.findOneAndUpdate(
        { uuid: machine_uuid },
        // Perform the following operations:
        {
            // Push the new statuses as a log to the status_logs array
            $push: {
                status_logs: {
                    timestamp: Date.now() / 1000,
                    statuses: statuses,
                },
            },
            // Replace the current_statuses array with the new statuses
            $set: {
                current_statuses: statuses,
            },
        },
        { returnDocument: "after" },
    );
}
