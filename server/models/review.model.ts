import mongoose from "mongoose";
import Joi from "joi";
import {
    TRating,
    TResponse,
    TReview,
    TReviewQuestion,
    TRubric,
    TRubricItem,
    TRubricItemTier,
    TRubricValue,
} from "common/review";

const ReviewQuestion = new mongoose.Schema<TReviewQuestion>(
    {
        uuid: { type: String, required: true },
        title: { type: String, required: true },
        type: { type: String, required: true },
    },
    { _id: false },
);

const RubricItemTier = new mongoose.Schema<TRubricItemTier>(
    {
        description: { type: String, required: false },
        value: { type: Number, required: true },
    },
    { _id: false },
);

const RubricItem = new mongoose.Schema<TRubricItem>(
    {
        uuid: { type: String, required: true },
        category: { type: String, required: true },
        tiers: { type: [RubricItemTier], required: true },
    },
    { _id: false },
);

const Rubric = new mongoose.Schema<TRubric>(
    {
        uuid: { type: String, required: true },
        name: { type: String, required: true },
        items: { type: [RubricItem], required: true },
    },
    { _id: false },
);

const Response = new mongoose.Schema<TResponse>(
    {
        uuid: { type: String, required: true },
        associated_uuid: { type: String, required: false },
        answers: { type: [String], required: true },
        required_reviewers: { type: [String], required: true },
    },
    { _id: false },
);

const RubricValue = new mongoose.Schema<TRubricValue>(
    {
        rubric_item: { type: String, required: true },
        value: { type: Number, required: true },
    },
    { _id: false },
);

const Rating = new mongoose.Schema<TRating>(
    {
        response_uuid: { type: String, required: true },
        rubric_values: { type: [RubricValue], required: true },
    },
    { _id: false },
);

export const Review = new mongoose.Schema<TReview>(
    {
        uuid: { type: String, required: true },
        title: { type: String, required: true },
        timestamp_created: { type: Number, required: true },
        questions: { type: [ReviewQuestion], required: true },
        responses: { type: [Response], required: true },
        rubric: { type: Rubric, required: true },
        ratings: {
            type: Map,
            of: [Rating],
            required: true,
        },
    },
    { collection: "review" },
);

export const ReviewQuestionSchema = Joi.object<TReviewQuestion>({
    uuid: Joi.string().required(),
    title: Joi.string().required(),
    type: Joi.string().required(),
});

export const RubricItemTierSchema = Joi.object<TRubricItemTier>({
    description: Joi.string().required(),
    value: Joi.number().required(),
});

export const RubricItemSchema = Joi.object<TRubricItem>({
    uuid: Joi.string().required(),
    category: Joi.string().required(),
    tiers: Joi.array().items(RubricItemTierSchema).required(),
});

export const RubricSchema = Joi.object<TRubric>({
    uuid: Joi.string().required(),
    name: Joi.string().required(),
    items: Joi.array().items(RubricItemSchema).required(),
});

export const ResponseSchema = Joi.object<TResponse>({
    uuid: Joi.string().required(),
    associated_uuid: Joi.string(),
    answers: Joi.array().items(Joi.string().allow("", null)).required(),
    required_reviewers: Joi.array().items(Joi.string()).required(),
});

export const RubricValueSchema = Joi.object<TRubricValue>({
    rubric_item: Joi.string().required(),
    value: Joi.number().required(),
});

export const RatingSchema = Joi.object<TRating>({
    response_uuid: Joi.string().required(),
    rubric_values: Joi.array().items(RubricValueSchema).required(),
});

export const ReviewSchema = Joi.object<TReview>({
    uuid: Joi.string().required(),
    title: Joi.string().required(),
    timestamp_created: Joi.number().required(),
    questions: Joi.array().items(ReviewQuestionSchema).required(),
    responses: Joi.array().items(ResponseSchema).required(),
    rubric: RubricSchema.required(),
    ratings: Joi.object().pattern(
        Joi.string(),
        Joi.array().items(RatingSchema).required(),
    ),
});

export const ReviewSchemaOptional = ReviewSchema.fork(
    Object.keys(ReviewSchema.describe().keys),
    (schema) => schema.optional(),
);
