import { API_SCOPE, UUID } from "common/global";
import {
    TCertification,
    TCertificate,
    TCertificationType,
} from "common/certification";
import {
    Certification,
    Certificate,
    CertificationType,
} from "models/certification.model";
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

// --- CertificationType Controls ---

/**
 * Get all certification types in the database
 * @returns A list containing all certifications in the db.
 */
export async function getCertificationTypes(): Promise<TCertificationType[]> {
    const CertificationTypes = mongoose.model(
        "CertificationType",
        CertificationType,
    );
    return CertificationTypes.find();
}

/**
 * Get a specific certification type
 * @param uuid
 * @returns Either a certification corresponding to the given uuid or null if
 *          the given uuid doesn't exist.
 */
export async function getCertificationType(
    uuid: UUID,
): Promise<TCertificationType | null> {
    const CertificationTypes = mongoose.model(
        "CertificationType",
        CertificationType,
    );
    return CertificationTypes.findOne({ uuid: uuid });
}

/**
 * Create a new certification type in the database
 * @param certificate_type_obj The certification type's complete information
 * @returns Either a certification corresponding to the given uuid or null if
 *          the given uuid doesn't exist.
 */
export async function createCertificationType(
    certification_type_obj: TCertificationType,
): Promise<TCertificationType | null> {
    const CertificationTypes = mongoose.model(
        "CertificationType",
        CertificationType,
    );
    // Check if the certification type already exists
    const certification_type_exists = await CertificationTypes.exists({
        uuid: certification_type_obj.uuid,
    });
    if (certification_type_exists) {
        // If so, return null, and don't create any new certifications
        return null;
    }
    // If the certification type doesn't exist, create a new certification and
    // return it
    const new_certification_type = new CertificationTypes(
        certification_type_obj,
    );
    return new_certification_type.save();
}

/**
 * Update a certification type information given an entire TCertificationType
 * object. CertificationType is found by UUID.
 * @param certification_obj The certification type's complete and updated
 *                          information
 * @returns A promise to the updated TCertificationType object, or null if no
 *          certification type has the given UUID
 */
export async function updateCertificationType(
    certification_type_obj: TCertificationType,
): Promise<TCertificationType | null> {
    const CertificationTypes = mongoose.model(
        "CertificationType",
        CertificationType,
    );
    // Update the given certification type with a new certification_obj,
    // searching by uuid
    return CertificationTypes.findOneAndReplace(
        { uuid: certification_type_obj.uuid },
        certification_type_obj,
        { returnDocument: "after" },
    );
}

/**
 * Delete a certification type in the database
 * @param uuid The certification type's uuid
 * @returns The certification type object, or null if no certification type
 *          has the given UUID
 */
export async function deleteCertificationType(
    uuid: UUID,
): Promise<TCertification | null> {
    const CertificationTypes = mongoose.model(
        "CertificationType",
        CertificationType,
    );
    return CertificationTypes.findOneAndDelete({ uuid: uuid });
}

// --- Certificate Controls ---

// /**
//  * Get all certificates in the database
//  * @param uuid The certificate's UUID to search by
//  * @returns A promise to a TCertificate object, or null if no certificates have
//  * the given UUID
//  */
// export async function getCertificate(uuid: UUID): Promise<TCertificate | null> {
//     const Certificates = mongoose.model("Certificate", Certificate);
//     return Certificates.findOne({ uuid: uuid });
// }

// /**
//  * Get all certificates for a specific user
//  * @param user_uuid The user's UUID to search by
//  * @returns A promise to the list of TCertificate object, or an empty list if
//  * the user has no certificates
//  */
// export async function getCertificatesByUser(
//     user_uuid: UUID,
// ): Promise<TCertificate[]> {
//     const Certificates = mongoose.model("Certificate", Certificate);
//     return Certificates.find({ uuid: user_uuid });
// }

// /**
//  * Create a new certificate in the database
//  * @param certificate_obj The checkout's complete information
//  * @returns The checkout object
//  */
// export async function createCertificate(
//     certificate_obj: TCertificate,
// ): Promise<TCertificate | null> {
//     const Certificates = mongoose.model("Certificate", Certificate);
//     // Check if the certificate already exists
//     const existingCertificate = await Certificates.exists({
//         uuid: certificate_obj.certification_uuid,
//     });
//     if (existingCertificate) {
//         // If so, return null, and don't create a new certificate
//         return null;
//     }
//     // If the certificate doesn't exist, create a new certificate and return it
//     const newCertificate = new Certificates(certificate_obj);
//     return newCertificate.save();
// }

// /**
//  * Delete a certificate in the database
//  * @param certification_uuid The certificate's unique identifier
//  * @returns The certificate object, or null if no certificate has the given UUID
//  */
// export async function deleteCertificate(
//     certification_uuid: UUID,
// ): Promise<TCertificate | null> {
//     const Certificates = mongoose.model("Certificate", Certificate);
//     // Delete the certificate and return it
//     return Certificates.findOneAndDelete({ uuid: certification_uuid });
// }
