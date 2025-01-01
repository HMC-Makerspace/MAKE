import { API_SCOPE, UUID } from "common/global";
import { UserUUID } from "common/user";
import { TWorkshop } from "common/workshop";
import { Workshop } from "models/workshop.model";
import mongoose from "mongoose";

/**
 * Get all workshops in the database
 * @returns A promise to list of TWorkshop objects representing all workshops in the db
 */
export async function getWorkshops(): Promise<TWorkshop[]> {
    const Workshops = mongoose.model("Workshop", Workshop, "workshops");
    return Workshops.find();
}

/**
 * Get a specific workshop's information, searching by UUID
 * @param workshop_uuid The workshop's UUID to search by
 * @returns A promise to a TWorkshop object, or null if no workshop has the given UUID
 */
export async function getWorkshop(workshop_uuid: UUID) {
    const Workshops = mongoose.model("Workshop", Workshop, "workshops");
    return Workshops.findOne({ uuid: workshop_uuid });
}

/**
 * Create a new workshop in the database
 * @param workshop_obj the complete workshop information
 * @returns The workshop object
 */
export async function createWorkshop(
    workshop_obj: TWorkshop,
): Promise<TWorkshop | null> {
    const Workshops = mongoose.model("Workshops", Workshop, "workshops");
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
 * Delete a workshop in the database
 * @param workshop_uuid the specific workshop's unique id
 * @returns The workshop object, or null if the workshop doesn't exist
 */
export async function deleteWorkshop(
    workshop_uuid: UUID,
): Promise<TWorkshop | null> {
    const Workshops = mongoose.model("Workshops", Workshop, "workshops");
    // If the workshop exists, return it and delete it
    return Workshops.findOneAndDelete({ uuid: workshop_uuid });
}

/**
 * Update a workshop in the database
 * @param workshop_obj the information to update the workshop with
 * @returns The workshop object, or null if the workshop doesn't exist
 */
export async function updateWorkshop(
    workshop_obj: TWorkshop,
): Promise<TWorkshop | null> {
    const Workshops = mongoose.model("Workshops", Workshop, "workshops");
    // If the workshop exists, return it and delete it
    return Workshops.findOneAndReplace(
        { uuid: workshop_obj.uuid },
        workshop_obj,
        {
            returnDocument: "after",
        },
    );
}

/**
 * RSVP for a workshop
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
    // Check if user is already in the rsvp list
    if (user_uuid in workshop.rsvp_list) {
        // If so, the RSVP fails
        return false;
    }
    // Add the user to the rsvp list
    workshop.rsvp_list[user_uuid] = Date.now();
    // Update the workshop in the database
    workshop.save();
    return true;
}

/**
 * Cancel RSVP to a workshop
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
    // Check if user is not already in the rsvp list
    if (!(user_uuid in workshop.rsvp_list)) {
        // If so, the cancellation fails
        return false;
    }
    // Update the workshop in the database
    delete workshop.rsvp_list[user_uuid];
    workshop.save();
    return true;
}

/**
 * Sign in to a workshop
 * @param workshop_uuid The workshop's UUID
 * @param user_uuid The user's UUID who is signing in
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
    // Check if user is already in the sign in list
    if (user_uuid in workshop.sign_in_list) {
        // If so, the sign in fails
        return false;
    }
    // Add the user to the sign in list
    workshop.sign_in_list[user_uuid] = Date.now();
    workshop.save();
    return true;
}
