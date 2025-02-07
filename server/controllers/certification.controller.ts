import { API_SCOPE, UUID } from "common/global";
import { TCertification } from "common/certification";
import { Certification } from "models/certification.model";
import mongoose from "mongoose";
import { getUser } from "./user.controller";
import { verifyRequest } from "./verify.controller";

// --- Certification Controls ---

/**
 * Get all certifications in the database
 * @returns A promise to the list of TCertification objects representing all
 * certifications in the db
 */
export async function getCertifications(): Promise<TCertification[]> {
    const Certifications = mongoose.model("Certification", Certification);
    return Certifications.find();
}

/**
 * Get a specific certification in the database
 * @param uuid The certification's UUID to search by
 * @returns A promise to a TCertification object, or null if no certification
 *          has the given UUID
 */
export async function getCertification(
    uuid: UUID,
): Promise<TCertification | null> {
    const Certifications = mongoose.model("Certification", Certification);
    return Certifications.findOne({ uuid: uuid });
}

/**
 * Get all certifications that are visible to a specific user. If the user is
 * an admin or has the {@link API_SCOPE.GET_ALL_CERTIFICATIONS} scope, all
 * certifications are returned. Otherwise, only certifications that the user
 * has access to are returned.
 * @param user_uuid The user's UUID to search by
 * @returns the list of TCertification objects representing all certifications
 *          that the user can access
 */
export async function getCertificationsVisibleToUser(
    user_uuid: UUID,
): Promise<TCertification[]> {
    // If the user doesn't exist, return only public certifications
    const user = await getUser(user_uuid);
    if (!user) {
        return getPublicCertifications();
    }

    // If the user is an admin or can get all certifications, return all
    if (
        await verifyRequest(
            user_uuid,
            API_SCOPE.ADMIN,
            API_SCOPE.GET_ALL_CERTIFICATIONS,
        )
    ) {
        return getCertifications();
    }

    // Otherwise, find all items that the user can access
    const role_uuids = user.active_roles.map((log) => log.role_uuid);

    const Certifications = mongoose.model("Certification", Certification);
    // Find all items that require no roles or which require roles that the
    // user has at least one of
    return await Certifications.find({
        $or: [
            { authorized_roles: null },
            { authorized_roles: { $elemMatch: { $in: role_uuids } } },
        ],
    });
}

/**
 * Get all certifications that are public, i.e. require no roles to access
 * @returns A promise to the list of TCertification objects representing all
 *          public certifications in the database
 */
async function getPublicCertifications(): Promise<TCertification[]> {
    const Certifications = mongoose.model("Certification", Certification);
    // Only return certifications that have require no roles
    return Certifications.find({
        authorized_roles: null,
    });
}

/**
 * Update a certification information given an entire TCertification object.
 * Certification is found by UUID.
 * @param certification_obj The certification's complete and updated information
 * @returns A promise to the updated TCertification object, or null if no
 *          checkout has the given UUID
 */
export async function updateCertification(
    certification_obj: TCertification,
): Promise<TCertification | null> {
    const Certifications = mongoose.model("Certification", Certification);
    // Update the given certification with a new certification_obj, searching by uuid
    return Certifications.findOneAndReplace(
        { uuid: certification_obj.uuid },
        certification_obj,
        { returnDocument: "after" },
    );
}

/**
 * Create a new certification in the database
 * @param certification_obj The checkout's complete information
 * @returns The certification object, or null if a certification with the same
 *          UUID already exists
 */
export async function createCertification(
    certification_obj: TCertification,
): Promise<TCertification | null> {
    const Certifications = mongoose.model("Certification", Certification);
    // Check if a certification already exists by the given UUID
    const certification_exists = await Certifications.exists({
        uuid: certification_obj.uuid,
    });
    if (certification_exists) {
        // If so, return null, and don't create new certification
        return null;
    }
    // If the certification doesn't exist, create a new certification and
    // return it
    const new_certification = new Certifications(certification_obj);
    return new_certification.save();
}

/**
 * Delete a certification in the database
 * @param certification_uuid The certification's uuid
 * @returns The certification object, or null if no certification has the given UUID
 */
export async function deleteCertification(
    uuid: UUID,
): Promise<TCertification | null> {
    const Certifications = mongoose.model("Certification", Certification);
    return Certifications.findOneAndDelete({ uuid: uuid });
}
