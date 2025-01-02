import { API_SCOPE, UUID } from "common/global";
import { TCertificate } from "common/certification";
import { TCertification } from "common/certification";
import { Certificate } from "models/certification.model";
import { Certification } from "models/certification.model";
import mongoose from "mongoose";

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
 * has the given UUID
 */
export async function getCertification(
    uuid: UUID,
): Promise<TCertification | null> {
    const Certifications = mongoose.model("Certification", Certification);
    return Certifications.findOne({ uuid: uuid });
}

/**
 * Update a certification information given an entire TCertification object. Certification is
 * found by UUID.
 * @param certification_obj The certification's complete and updated information
 * @returns A promise to the updated TCertification object, or null if no checkout
 *     has the given UUID
 */
export async function updateCertification(
    certification_obj: TCertification,
): Promise<TCertification | null> {
    const Certifications = mongoose.model("Certification", Certification);
    // Update the given certification with a new certification_obj, searching by uuid
    return Certifications.findOneAndReplace(
        { uuid: certification_obj.uuid },
        certification_obj,
        {
            returnDocument: "after",
        },
    );
}

/**
 * Create a new certification in the database
 * @param certiifcation_obj The checkout's complete information
 * @returns The certification object
 */
export async function createCertification(
    certification_obj: TCertification,
): Promise<TCertification | null> {
    const Certifications = mongoose.model("Certification", Certification);
    // Check if the certification already exists
    const exisitingCertification = await Certifications.exists({
        uuid: certification_obj.uuid,
    });
    if (exisitingCertification) {
        // If so, return null, and don't create new certification
        return null;
    }
    // If the certification doesn't exist, create a new certification and return it
    const newCertification = new Certifications(certification_obj);
    return newCertification.save();
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

// /**
//  * Get all certificates in the database
//  * @param uuid The certificate's UUID to search by
//  * @returns A promise to a TCertificate object, or null if no certificates have
//  * the givn UUID
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
