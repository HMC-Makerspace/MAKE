import { UUID } from "common/global";
import { TReview } from "common/review";
import { Review } from "models/review.model";
import mongoose from "mongoose";

// --- Review Controls ---

/**
 * Get all reviews in the database
 * @returns A promise to the list of TReview objects representing all
 * reviews in the db
 */
export async function getReviews(): Promise<TReview[]> {
    const Reviews = mongoose.model("Review", Review);
    return Reviews.find();
}

/**
 * Update a review information given an entire TReview object.
 * Review is found by UUID.
 * @param review_obj The review's complete and updated information
 * @returns A promise to the updated TReview object, or null if no
 *          checkout has the given UUID
 */
export async function updateReview(
    review_obj: TReview,
): Promise<TReview | null> {
    const Reviews = mongoose.model("Review", Review);
    // Update the given review with a new review_obj, searching by uuid
    return Reviews.findOneAndReplace({ uuid: review_obj.uuid }, review_obj, {
        returnDocument: "after",
    });
}

/**
 * Patch part of a review information given an partial TReview object.
 * Review is found by UUID.
 * @param partial_review_obj The review's complete and updated information
 * @returns A promise to the updated TReview object, or null if no
 *          checkout has the given UUID
 */
export async function patchReview(
    review_uuid: UUID,
    partial_review_obj: Partial<TReview>,
): Promise<TReview | null> {
    const Reviews = mongoose.model("Review", Review);
    // Update the given review with partial changes review_obj, searching by uuid
    return await Reviews.findOneAndUpdate(
        { uuid: review_uuid },
        {
            // Updates the partial change
            $set: partial_review_obj,
        },
        { returnDocument: "after" },
    );
}

/**
 * Create a new review in the database
 * @param review_obj The review's complete information
 * @returns The review object, or null if a review with the same
 *          UUID already exists
 */
export async function createReview(
    review_obj: TReview,
): Promise<TReview | null> {
    const Reviews = mongoose.model("Review", Review);
    // Check if a review already exists by the given UUID
    const review_exists = await Reviews.exists({
        uuid: review_obj.uuid,
    });
    if (review_exists) {
        // If so, return null, and don't create new review
        return null;
    }
    // If the review doesn't exist, create a new review and
    // return it
    const new_review = new Reviews(review_obj);
    return new_review.save();
}

/**
 * Delete a review in the database
 * @param review_uuid The review's uuid
 * @returns The review object, or null if no review has the given UUID
 */
export async function deleteReview(uuid: UUID): Promise<TReview | null> {
    const Reviews = mongoose.model("Review", Review);
    return Reviews.findOneAndDelete({ uuid: uuid });
}
