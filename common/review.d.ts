import { UnixTimestamp, UUID } from "./global";
import { UserUUID } from "./user";

export type TReviewQuestion = {
    uuid: string;
    title: string;
    type: "timestamp" | "email" | "text" | "selection" | "confidential" | "ignore" | "comma-sep";
};

export type TRubricItemTier = {
    description?: string;
    value: number;
};

export type TRubricItem = {
    uuid: UUID;
    category: string;
    tiers: TRubricItemTier[];
};

export type TRubric = {
    uuid: UUID;
    name: string;
    items: TRubricItem[];
};

export type TResponse = {
    uuid: UUID;
    associated_uuid?: UserUUID;
    answers: string[];
    required_reviewers: UserUUID[];
};

export type TRubricValue = { rubric_item: UUID; value: number };

export type TRating = {
    response_uuid: UUID;
    rubric_values: TRubricValue[];
};

export type TReview = {
    uuid: UUID;
    title: string;
    timestamp_created: UnixTimestamp;
    questions: TReviewQuestion[];
    responses: TResponse[];
    rubric: TRubric;
    ratings: {
        [reviewer: UserUUID]: TRating[];
    };
};
