import { API_SCOPE, UUID } from "common/global";
import { UserUUID } from "common/user";
import { TPublicWorkshopData, TWorkshop } from "common/workshop";
import { Workshop } from "models/workshop.model";
import mongoose from "mongoose";
import { getUser } from "./user.controller";
import { verifyRequest } from "./verify.controller";

/**
 * Get all workshops in the database
 * @returns A promise to list of TWorkshop objects representing all workshops
 *      in the db
 */
export async function getWorkshops(): Promise<TWorkshop[]> {
    const Workshops = mongoose.model("Workshop", Workshop);
    return Workshops.find();
}

/**
 * Get a specific workshop's information, searching by UUID
 * @param workshop_uuid The workshop's UUID to search by
 * @returns A promise to a TWorkshop object, or null if no workshop has the given UUID
 */
export async function getWorkshop(workshop_uuid: UUID) {
    const Workshops = mongoose.model("Workshop", Workshop);
    return Workshops.findOne({ uuid: workshop_uuid });
}

export async function getWorkshopsVisibleToUser(
    user_uuid: UserUUID,
): Promise<TPublicWorkshopData[]> {
    // If the user doesn't exist, return only public workshops
    const user = await getUser(user_uuid);
    if (!user) {
        return getPublicWorkshops();
    }

    // If the user is an admin or can get all workshops, return all workshops
    if (
        await verifyRequest(
            user_uuid,
            API_SCOPE.ADMIN,
            API_SCOPE.GET_ALL_WORKSHOPS,
        )
    ) {
        return getWorkshops();
    }

    // Otherwise, find all workshops that the user can access
    const role_uuids = user.active_roles.map((log) => log.role_uuid);

    const Workshops = mongoose.model("Workshop", Workshop);
    // Find all workshops that require no roles or which require roles that the
    // user has
    return Workshops.find({
        $or: [
            { authorized_roles: null },
            { authorized_roles: { $in: role_uuids } },
        ],
    });
}

/**
 * Get all public workshop data, which only includes currently public
 * workshops and is stripped of log information
 * @returns A promise to list of TPublicWorkshopData objects representing all
 *    currently public workshops
 */
export async function getPublicWorkshops(): Promise<TPublicWorkshopData[]> {
    const Workshops = mongoose.model("Workshop", Workshop, "workshops");
    // Get all workshops that are currently public
    return Workshops.find({
        timestamp_public: { $lte: Date.now() / 1000 },
        authorized_roles: null,
    }).select([
        // Remove private information from workshop
        "-timestamp_public",
        "-support_instructors",
        "-rsvp_list",
        "-users_notified",
        "-sign_in_list",
    ]);
}

/**
 * Create a new workshop in the database
 * @param workshop_obj the complete workshop information
 * @returns The workshop object
 */
export async function createWorkshop(
    workshop_obj: TWorkshop,
): Promise<TWorkshop | null> {
    const Workshops = mongoose.model("Workshop", Workshop);
    // Check if the workshop already exists
    const existingWorkshop = await Workshops.exists({
        uuid: workshop_obj.uuid,
    });
    if (existingWorkshop) {
        // If so, return null, and don't create a new workshop
        return null;
    }
    // If the workshop doesn't exist, create a new workshop and return it
    const newWorkshop = new Workshops(workshop_obj);
    return newWorkshop.save();
}

/**
 * Delete a workshop in the database by UUID
 * @param workshop_uuid the specific workshop's unique id
 * @returns The deleted workshop object, or null if the workshop doesn't exist
 */
export async function deleteWorkshop(
    workshop_uuid: UUID,
): Promise<TWorkshop | null> {
    const Workshops = mongoose.model("Workshop", Workshop);
    // If the workshop exists, return it and delete it
    return Workshops.findOneAndDelete({ uuid: workshop_uuid });
}

/**
 * Update a workshop in the database, searching by UUID
 * @param workshop_obj the new workshop information
 * @returns The updated workshop object, or null if no workshop exists by the
 *      given UUID
 */
export async function updateWorkshop(
    workshop_obj: TWorkshop,
): Promise<TWorkshop | null> {
    const Workshops = mongoose.model("Workshop", Workshop);
    // If the workshop exists, update it and return it
    return Workshops.findOneAndReplace(
        { uuid: workshop_obj.uuid },
        workshop_obj,
        { returnDocument: "after" },
    );
}

/**
 * RSVP a user to a workshop
 * @param workshop_uuid The workshop's UUID
 * @param user_uuid The user's UUID who is RSVPing
 * @returns Whether or not the RSVP was successful
 */
export async function rsvpToWorkshop(
    workshop_uuid: UUID,
    user_uuid: UserUUID,
): Promise<boolean> {
    const workshop = await getWorkshop(workshop_uuid);
    // If the workshop doesn't exist, the RSVP fails
    if (!workshop) {
        return false;
    }
    // If the user is already in the rsvp list, the RSVP fails
    if (user_uuid in workshop.rsvp_list) {
        return false;
    }
    // Add the user to the rsvp list
    workshop.rsvp_list[user_uuid] = Date.now() / 1000;
    // Update the workshop in the database
    workshop.save();
    return true;
}

/**
 * Cancel a given user's RSVP to a workshop
 * @param workshop_uuid The workshop's UUID
 * @param user_uuid The user's UUID to cancel the RSVP for
 * @returns Whether or not the cancellation was successful
 */
export async function cancelRSVPToWorkshop(
    workshop_uuid: UUID,
    user_uuid: UserUUID,
): Promise<boolean> {
    const workshop = await getWorkshop(workshop_uuid);
    // If the workshop doesn't exist, the cancellation fails
    if (!workshop) {
        return false;
    }
    // If the user isn't in the rsvp list, the cancellation fails
    if (!(user_uuid in workshop.rsvp_list)) {
        return false;
    }
    // Remove the user from the rsvp list
    delete workshop.rsvp_list[user_uuid];
    // Update the workshop in the database
    workshop.save();
    return true;
}

/**
 * Sign in a user to a given workshop
 * @param workshop_uuid The workshop's UUID
 * @param user_uuid The user's UUID to sign in
 * @returns Whether or not the sign in was successful
 */
export async function signInToWorkshop(
    workshop_uuid: UUID,
    user_uuid: UserUUID,
): Promise<boolean> {
    const workshop = await getWorkshop(workshop_uuid);
    // If the workshop doesn't exist, the sign in fails
    if (!workshop) {
        return false;
    }
    // If the user is already in the sign in list, the sign in fails
    if (user_uuid in workshop.sign_in_list) {
        return false;
    }
    // Otherwise, add the user to the sign in list
    workshop.sign_in_list[user_uuid] = Date.now() / 1000;
    // Update the workshop in the database
    workshop.save();
    return true;
}
