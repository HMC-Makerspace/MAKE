import { API_SCOPE, UUID } from "common/global";
import { UserUUID } from "common/user";
import { TPublicWorkshopData, TWorkshop } from "common/workshop";
import { Workshop } from "models/workshop.model";
import mongoose from "mongoose";
import { getUser } from "./user.controller";
import { verifyRequest } from "./verify.controller";
import { sendTemplatedEmail } from "./email.controller";
import WorkshopReminderTemplate from "email_templates/workshop_reminder";
import { Logger } from "pino";
import WorkshopConfirmationTemplate from "email_templates/workshop_confirmation";
import { getConfig } from "./config.controller";
import WorkshopWaitlistTemplate from "email_templates/workshop_waitlist_move";
import { Response } from "express";
import { StatusCodes } from "http-status-codes";
import { removeResourcesFromFile, deleteFileOnServer, deleteFile } from "./file.controller";

/**
 * Get all workshops in the database
 * @returns A promise to list of TWorkshop objects representing all workshops
 *      in the db
 */
export async function getWorkshops(): Promise<TWorkshop[]> {
    const Workshops = mongoose.model("Workshop", Workshop);
    return Workshops.find().sort({ timestamp_start: -1 });
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
    const Workshops = mongoose.model<TWorkshop>("Workshop", Workshop);

    // Delete the workshop and get the document in one call
    return await Workshops.findOneAndDelete({ uuid: workshop_uuid });

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
 * Updates a workshop with partial new information
 * @param workshop_uuid The UUID of the workshop to modify
 * @param partial_workshop The partial set of changes to update
 * @returns The updated workshop
 */
export async function patchWorkshop(
    workshop_uuid: UUID,
    partial_workshop: Partial<TWorkshop>,
) {
    const Workshops = mongoose.model("Workshop", Workshop);

    return Workshops.findOneAndUpdate(
        { uuid: workshop_uuid },
        {
            // Updates the partial change
            $set: partial_workshop,
        },
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
    logger: Logger,
    res: Response,
): Promise<TWorkshop | null> {
    const workshop = await getWorkshop(workshop_uuid);
    const user = await getUser(user_uuid);
    const config = await getConfig();
    // If the workshop or user doesn't exist, the RSVP fails
    if (!workshop || !user || !config) {
        logger.warn(
            `Failed to find ${(workshop ?? "workshop") || (user ?? "user") || (config ?? "config")}`,
        );
        res.status(StatusCodes.NOT_FOUND).json({
            error: `Error finding workshop.`,
        });
        return null;
    }
    // If the workshop is not yet public, RSVP fails
    if (
        workshop.timestamp_public &&
        workshop.timestamp_public > Date.now() / 1000
    ) {
        logger.warn(
            `No public workshop found by uuid ${workshop_uuid}, failed to RSVP`,
        );
        res.status(StatusCodes.FORBIDDEN).json({
            error: `\"${workshop.title}\" is not public, failed to RSVP.`,
        });
        return null;
    }
    // If the user is already in the rsvp list, the RSVP fails
    if (
        workshop.rsvp_list.some(
            (rsvp_record) => rsvp_record.user_uuid === user_uuid,
        )
    ) {
        logger.warn(`User ${user.uuid} already RSVPd to workshop `);
        res.status(StatusCodes.FORBIDDEN).json({
            error: `Already RSVPd to \"${workshop.title}\"!`,
        });
        return null;
    }
    // If the user does not have all necessary certifications, the RSVP fails
    if (
        !workshop.required_certifications?.every((workshop_cert) =>
            user.active_certificates?.some(
                (user_cert) =>
                    user_cert.certification_uuid ===
                        workshop_cert.certification_uuid &&
                    user_cert.level >= workshop_cert.required_level,
            ),
        )
    ) {
        logger.info(
            `User ${user.uuid} was missing required certifications for workshop ${workshop.uuid}.`,
        );
        res.status(StatusCodes.FORBIDDEN).json({
            error: `Missing one or more required certifications!`,
        });
        return null;
    }
    // Add the user to the rsvp list
    workshop.rsvp_list.push({
        user_uuid: user_uuid,
        timestamp: Date.now() / 1000,
    });
    // Send a reminder confirmation email to the user
    await sendTemplatedEmail(
        user.email,
        "Workshop RSVP: " + workshop.title,
        WorkshopConfirmationTemplate(workshop, user, config),
        logger,
    );

    // Update the workshop in the database
    return workshop.save();
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
    logger: Logger,
): Promise<TWorkshop | null> {
    const workshop = await getWorkshop(workshop_uuid);
    // If the workshop doesn't exist, the cancellation fails
    if (!workshop) {
        return null;
    }
    // If the user isn't in the rsvp list, the cancellation fails
    if (
        !workshop.rsvp_list.some(
            (rsvp_record) => rsvp_record.user_uuid === user_uuid,
        )
    ) {
        return null;
    }
    // Find the user's index in the rsvp list
    const position = workshop.rsvp_list.findIndex(
        (rsvp) => rsvp.user_uuid === user_uuid,
    );
    // Remove the user from the rsvp list
    workshop.rsvp_list = workshop.rsvp_list.filter(
        (rsvp) => rsvp.user_uuid != user_uuid,
    );

    // If the current user was in the first slots of the RSVP list,
    // send an email to the user moved off the waitlist
    const firstUserOnWaitlist =
        workshop.capacity &&
        workshop.capacity > 0 &&
        position < workshop.capacity &&
        workshop.rsvp_list.length >= workshop.capacity
            ? workshop.rsvp_list[workshop.capacity - 1].user_uuid
            : null;

    if (firstUserOnWaitlist) {
        const user = await getUser(firstUserOnWaitlist);
        const config = await getConfig();

        if (user && config) {
            await sendTemplatedEmail(
                user.email,
                "Workshop Waitlist Update: " + workshop.title,
                WorkshopWaitlistTemplate(workshop, user, config),
                logger,
            );
        }
    }

    // Update the workshop in the database
    return workshop.save();
}

/**
 * Sign in a user to a given workshop
 * @param workshop_uuid The workshop's UUID
 * @param user_uuid The user's UUID to sign in
 * @returns The updated workshop object (or "undefined" if the workshop doesn't exist, or "false" if the user is already signed in)
 */
export async function signInToWorkshop(
    workshop_uuid: UUID,
    user_uuid: UserUUID,
): Promise<TWorkshop | boolean | undefined> {
    const workshop = await getWorkshop(workshop_uuid);
    // If the workshop doesn't exist, the sign in fails
    if (!workshop) {
        return undefined;
    }
    // If the user is already in the sign in list, the sign in fails
    if (workshop.sign_in_list.some((i) => i.user_uuid == user_uuid)) {
        return false;
    }
    // Otherwise, add the user to the sign in list
    workshop.sign_in_list.push({
        user_uuid: user_uuid,
        timestamp: Date.now() / 1000,
    });
    // Update the workshop in the database
    return workshop.save();
}

export async function workshopReminderEmailCron(logger: Logger) {
    logger.info("Cron: Sending workshop reminder emails.");

    const config = await getConfig();
    const timestamp = Math.round(Date.now() / 1000);

    if (!config) return null;

    const Workshops = mongoose.model("Workshop", Workshop);
    const due_workshops = await Workshops.find({
        // Workshops that haven't started yet
        timestamp_start: { $gte: timestamp },
    });

    for (const workshop of due_workshops) {
        let sent = false;
        const new_sent_times = [...workshop.reminder_emails_sent];

        for (const reminder of config.workshop.reminder_times.filter(
            (r) => !new_sent_times?.includes(r),
        )) {
            if (workshop.timestamp_start <= timestamp + reminder) {
                if (!sent) {
                    // only send one email per cycle so we're not making up 3000 emails at once if they haven't sent for some reason

                    // get users on the RSVP list
                    for (let u of workshop.rsvp_list) {
                        const user = await getUser(u.user_uuid);

                        if (user) {
                            // send email
                            await sendTemplatedEmail(
                                user.email,
                                "Reminder: " + workshop.title,
                                WorkshopReminderTemplate(
                                    workshop.title,
                                    Math.round(
                                        workshop.timestamp_start - timestamp,
                                    ),
                                ),
                                logger,
                            );
                        }
                    }

                    sent = true;
                }

                new_sent_times.push(reminder);
            }
        }

        if (new_sent_times.length != workshop.reminder_emails_sent.length) {
            await Workshops.updateOne(
                {
                    uuid: workshop.uuid,
                },
                {
                    reminder_emails_sent: new_sent_times,
                },
            );
        }
    }
}
