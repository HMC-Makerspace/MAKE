import { TEmbed } from "common/embed";
import { TUserRole, UserRoleUUID, UserUUID } from "common/user";
import { Embed } from "models/embed.model";
import mongoose from "mongoose";
import { getUser } from "./user.controller";
import { verifyRequest } from "./verify.controller";
import { API_SCOPE, UUID } from "common/global";

/**
 * Get all embeds
 * @returns A promise to an array of all embeds
 */
export async function getEmbeds(): Promise<TEmbed[]> {
    const Embeds = mongoose.model("Embed", Embed);
    return Embeds.find();
}

export async function getEmbedsVisibleToUser(
    user_uuid: UserUUID,
): Promise<TEmbed[]> {
    const user = await getUser(user_uuid);

    let role_uuids: UserRoleUUID[] = [];
    if (user) {
        role_uuids = user.active_roles.map((log) => log.role_uuid);
    }

    // If the user is an admin or can get all items, return all items
    if (
        await verifyRequest(
            user_uuid,
            API_SCOPE.ADMIN,
            API_SCOPE.GET_ALL_EMBEDS,
        )
    ) {
        return getEmbeds();
    }

    // Otherwise, find all items that the user can access

    const Embeds = mongoose.model("Embed", Embed);
    // Find all items that require no roles or which require roles that the user
    // has at least one of, and remove locations the user does not have access to
    return await Embeds.aggregate([
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
                                        $isArray: "$$docs.authorized_roles",
                                    },
                                },
                                {
                                    $gt: [
                                        {
                                            $size: {
                                                $setIntersection: [
                                                    "$$docs.authorized_roles",
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

    // Consider filter out items that require certifications the user doesn't have
    // Should potentially check parent kit's required certifications as well?
    /*.filter((item) =>
        item.required_certifications?.every((cert) =>
            cert_uuids.includes(cert.certification_uuid),
        ),
    );*/
}

/**
 * Patch part of an embeds information given an partial TEmbed object.
 * Embed is found by UUID.
 * @param partial_embed_obj The embed's partially updated information
 * @returns A promise to the updated TEmbed object, or null if no
 *          embed has the given UUID
 */
export async function patchEmbed(
    embed_uuid: UUID,
    partial_embed_obj: Partial<TEmbed>,
): Promise<TEmbed | null> {
    const Embeds = mongoose.model("Embed", Embed);
    // Update the given embed with partial changes partial_embed_obj, searching by uuid
    return await Embeds.findOneAndUpdate(
        { uuid: embed_uuid },
        {
            // Updates the partial change
            $set: partial_embed_obj,
        },
        { returnDocument: "after" },
    );
}

/**
 * Create a new embed
 * @param embed_obj The embed information
 * @returns The new embed object
 */
export async function createEmbed(embed_obj: TEmbed): Promise<TEmbed | null> {
    const Embeds = mongoose.model("Embed", Embed);
    // Check if the item already exists
    const existingEmbed = await Embeds.exists({ uuid: embed_obj.uuid });
    if (existingEmbed) {
        // If so, return null, and don't create a new item
        return null;
    }
    // If the item doesn't exist, create a new item and return it
    const newEmbed = new Embeds(embed_obj);
    return newEmbed.save();
}

/**
 * Delete an embed by UUID
 * @param embed_uuid The UUID of the embed to delete
 * @returns The deleted embed item object, or null if the embed doesn't exist
 */
export async function deleteEmbed(embed_uuid: string): Promise<TEmbed | null> {
    const Embeds = mongoose.model("Embed", Embed);
    // If the item exists, return it and delete it
    return Embeds.findOneAndDelete({ uuid: embed_uuid });
}
