import { API_SCOPE } from "common/global";
import {
    getReviews,
    createReview,
    deleteReview,
    updateReview,
    patchReview,
} from "controllers/review.controller";
import { verifyRequest, verifySchema } from "controllers/verify.controller";
import { Request, Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import {
    ErrorResponse,
    UNAUTHORIZED_ERROR,
    FORBIDDEN_ERROR,
    VerifyRequestHeader,
    SuccessfulResponse,
} from "common/verify";
import { TReview } from "common/review";
import { ReviewSchema, ReviewSchemaOptional } from "models/review.model";

// --- Request and Response Types ---
type ReviewRequest = Request<{}, {}, { review_obj: TReview }>;
type ReviewResponse = Response<TReview | ErrorResponse>;
type ReviewsResponse = Response<TReview[] | ErrorResponse>;

const router = Router();

// --- Review Routes ---
/**
 * Get all reviews.
 */
router.get("/", async (req: ReviewRequest, res: ReviewsResponse) => {
    const requesting_uuid = req.user?.uuid as string;

    // If no requesting user uuid is provided, the call is not authorized
    if (!requesting_uuid) {
        req.log.warn(
            `No requesting_uuid was provided while getting all reviews`,
        );
        res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
        return;
    }

    // If the user is authorized, update the review object
    if (await verifyRequest(requesting_uuid, API_SCOPE.GET_ALL_REVIEWS)) {
        const reviews = await getReviews();

        // If not reviews are found, log an error, but still return an empty list of reviews
        if (!reviews) {
            req.log.error("No reviews found in the database.");
        } else {
            req.log.debug("Returned all reviews.");
        }
        res.status(StatusCodes.OK).json(reviews);
    } else {
        req.log.warn({
            msg: "Forbidden user attempted to patch a review",
            requesting_uuid: requesting_uuid,
        });
        // If the user is not authorized, provide a status error
        res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
    }
});

router.patch(
    "/:UUID",
    verifySchema(ReviewSchemaOptional, "partial_review_obj"),
    async (
        req: Request<
            { UUID: string },
            {},
            { partial_review_obj: Partial<TReview> }
        >,
        res: ReviewResponse,
    ) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid = req.user?.uuid as string;
        const review_uuid = req.params.UUID;
        const partial_review = req.body.partial_review_obj;

        // If no requesting user uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn(
                `No requesting_uuid was provided while updating ${review_uuid}`,
            );
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }

        req.log.debug({
            msg: `Patching review with uuid ${review_uuid}`,
            partial_review_obj: partial_review,
            requesting_uuid: requesting_uuid,
        });

        // If the user is authorized, update the review object
        if (await verifyRequest(requesting_uuid, API_SCOPE.UPDATE_REVIEW)) {
            const review = await patchReview(review_uuid, partial_review);
            if (!review) {
                req.log.warn(
                    `Review with uuid ${review_uuid} could not be ` +
                        `patched because it was not found.`,
                );
                res.status(StatusCodes.NOT_FOUND).json({
                    error: `Review with uuid ${review_uuid} could not be found`,
                });
                return;
            }
            req.log.debug(`Patched review ${review_uuid}`);
            res.status(StatusCodes.OK).json(review);
        } else {
            req.log.warn({
                msg: "Forbidden user attempted to patch a review",
                requesting_uuid: requesting_uuid,
            });
            // If the user is not authorized, provide a status error
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

/**
 * Creates a new review. This is a protected route, and a 'requesting_uuid'
 * header is required to call it. The user must have the
 * {@link API_SCOPE.CREATE_REVIEW} scope.
 */
router.post(
    "/",
    verifySchema(ReviewSchema, "review_obj"),
    async (req: ReviewRequest, res: ReviewResponse) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid: string = req.user?.uuid as string;
        const review_obj = req.body.review_obj;
        const review_uuid = review_obj.uuid;

        // If no requesting user uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn(
                "No requesting_uuid was provided while creating a review",
            );
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }

        req.log.debug({
            msg: `Creating a review.`,
            requesting_uuid: requesting_uuid,
        });

        // If the user is authorized, create a review
        if (await verifyRequest(requesting_uuid, API_SCOPE.CREATE_REVIEW)) {
            const review = await createReview(review_obj);
            if (!review) {
                req.log.warn(
                    `An attempt was made to create a review with uuid ` +
                        `${review_uuid}, but a review with that uuid already exists`,
                );
                res.status(StatusCodes.CONFLICT).json({
                    error: `A review with uuid \`${review_uuid}\` already exists.`,
                });
                return;
            }
            req.log.debug(`Created review with uuid ${review_uuid}`);
            res.status(StatusCodes.CREATED).json(review);
        } else {
            req.log.warn({
                msg: "Forbidden user attempted to create a review",
                requesting_uuid: requesting_uuid,
            });
            // If the user is not authorized, provide a status error
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

/**
 * Update a specific review. This route will not create a new review if the
 * UUID does not exist. Instead, it will return a 404 error. This is a
 * protected route, and a `requesting_uuid` header is required to call it.
 * The user must have the {@link API_SCOPE.UPDATE_REVIEW} scope.
 */
router.put(
    "/",
    verifySchema(ReviewSchema, "review_obj"),
    async (req: ReviewRequest, res: ReviewResponse) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid: string = req.user?.uuid as string;
        const review_obj = req.body.review_obj;
        const review_uuid = review_obj.uuid;

        // If no requesting user uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn(
                "No requesting_uuid was provided while updating a review",
            );
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }

        req.log.debug({
            msg: `Updating a review by uuid ${review_uuid}`,
            requesting_uuid: requesting_uuid,
        });

        // If the user is authorized, update a review's information
        if (await verifyRequest(requesting_uuid, API_SCOPE.UPDATE_REVIEW)) {
            const review = await updateReview(review_obj);
            if (!review) {
                req.log.warn(
                    `Could not update review with uuid ${review_uuid} ` +
                        `because it was not found.`,
                );
                res.status(StatusCodes.NOT_FOUND).json({
                    error:
                        `Could not update review with uuid ` +
                        `\`${review_uuid}\` because it was not found.`,
                });
                return;
            }
            req.log.debug("Returned updated review.");
            res.status(StatusCodes.OK).json(review);
        } else {
            req.log.warn({
                msg: "Forbidden user attempted to update a review",
                requesting_uuid: requesting_uuid,
            });
            // If the user is not authorized, provide a status error
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

/**
 * Delete a specific review. This is a protected route, and a
 * `requesting_uuid` header is required to call it. The user must have the
 * {@link API_SCOPE.DELETE_REVIEW} scope.
 */
router.delete(
    "/:UUID",
    async (req: Request<{ UUID: string }>, res: SuccessfulResponse) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid = req.user?.uuid as string;
        const review_uuid = req.params.UUID;

        // If no requesting user uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn(
                "No requesting_uuid was provided while deleting a review",
            );
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }

        req.log.debug({
            msg: `Deleting a review by uuid ${review_uuid}`,
            requesting_uuid: requesting_uuid,
        });

        // If the user is authorized, delete a review object
        if (await verifyRequest(requesting_uuid, API_SCOPE.DELETE_REVIEW)) {
            const review = await deleteReview(review_uuid);
            if (!review) {
                req.log.warn(
                    `Review with uuid ${review_uuid} could not be ` +
                        `deleted because it was not found.`,
                );
                res.status(StatusCodes.NOT_FOUND).json({
                    error:
                        `Review with uuid ${review_uuid} could not be ` +
                        `deleted because it was not found.`,
                });
                return;
            }
            req.log.debug(`Deleted review ${review_uuid}`);
            res.status(StatusCodes.NO_CONTENT).json({});
        } else {
            req.log.warn({
                msg: "Forbidden user attempted to delete a review",
                requesting_uuid: requesting_uuid,
            });
            // If the user is not authorized, provide a status error
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

export default router;
