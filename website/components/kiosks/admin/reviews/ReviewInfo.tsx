import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { addToast, Button, Divider } from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { TRating, TResponse, TReview, TRubricValue } from "common/review";
import { TUser } from "common/user";
import axios from "axios";
import { useState } from "react";
import { ReviewResponse } from "./ReviewResponse";
import { TConfig } from "common/config";
import { useHotkeys } from "@tanstack/react-hotkeys";

async function updateReview({ review }: { review: TReview }) {
    return (await axios.put<TReview>("/api/v3/review", { review_obj: review }))
        .data;
}

export function ReviewInfo({
    self,
    review,
    users,
    config,
}: {
    self: TUser;
    review: TReview;
    users: TUser[];
    config: TConfig;
}) {
    const queryClient = useQueryClient();

    const reviewers = Object.keys(review.ratings);
    const isReviewer = reviewers.includes(self.uuid);
    const requiredResponses = isReviewer
        ? review.responses.filter((r) =>
              r.required_reviewers.includes(self.uuid),
          )
        : undefined;
    const ratings = isReviewer ? review.ratings[self.uuid] : undefined;

    const mutation = useMutation({
        mutationFn: updateReview,
        onSuccess: (result: TReview) => {
            queryClient.setQueryData(["review"], (old: TReview[]) => {
                return old.map((u) => (u.uuid === result.uuid ? result : u));
            });
        },
        onError: (error) => {
            addToast({
                title: `Error: ${error.message}`,
                color: "danger",
            });
        },
    });

    const [currentRating, setCurrentRating] = useState<TRating | undefined>(
        ratings && requiredResponses
            ? ratings[0] || {
                  response_uuid: requiredResponses[0].uuid,
                  rubric_values: [],
              }
            : undefined,
    );

    const updateRubricValue = (value: TRubricValue) => {
        if (!currentRating) return;
        const newValues = currentRating.rubric_values.filter(
            (r) => r.rubric_item !== value.rubric_item,
        );
        newValues.push(value);
        const newRating = { ...currentRating, rubric_values: newValues };
        setCurrentRating(newRating);
    };

    const updateRating = (rating: TRating) => {
        if (
            !self ||
            !(self.uuid in review.ratings) ||
            rating.rubric_values.length === 0
        )
            return;
        const newRatings = review.ratings[self.uuid].filter(
            (r) => r.response_uuid !== rating.response_uuid,
        );
        newRatings.push(rating);
        const newReview = { ...review, ratings: { ...review.ratings } };
        newReview.ratings[self.uuid] = newRatings;
        mutation.mutate({ review: newReview });
    };

    const [responseIndex, setResponseIndex] = useState(0);
    const response = requiredResponses && requiredResponses[responseIndex];

    const nextResponse = () => {
        if (
            !requiredResponses ||
            !currentRating ||
            !ratings ||
            responseIndex >= requiredResponses.length
        )
            return;
        // Push rating to server
        updateRating(currentRating);
        // Get next response
        const nextUp = requiredResponses[responseIndex + 1];
        // Check for existing rating
        const nextRating = ratings.find(
            (r) => r.response_uuid === nextUp.uuid,
        ) || { response_uuid: nextUp.uuid, rubric_values: [] };
        // Update current rating
        setCurrentRating(nextRating);
        // Move response index
        setResponseIndex(responseIndex + 1);
    };

    const prevResponse = () => {
        if (
            !requiredResponses ||
            !currentRating ||
            !ratings ||
            responseIndex <= 0
        )
            return;
        // Push rating to server
        updateRating(currentRating);
        // Get next response
        const prevUp = requiredResponses[responseIndex - 1];
        // Check for existing rating
        const prevRating = ratings.find(
            (r) => r.response_uuid === prevUp.uuid,
        ) || { response_uuid: prevUp.uuid, rubric_values: [] };
        // Update current rating
        setCurrentRating(prevRating);
        // Move response index
        setResponseIndex(responseIndex - 1);
    };

    useHotkeys([
        {
            hotkey: "Tab",
            callback: nextResponse,
        },
        {
            hotkey: "ArrowRight",
            callback: nextResponse,
        },
        {
            hotkey: "Shift+Tab",
            callback: prevResponse,
        },
        {
            hotkey: "ArrowLeft",
            callback: prevResponse,
        },
    ]);

    return (
        <div
            className={clsx(
                "flex flex-col gap-3 justify-start",
                "w-full h-full overflow-auto",
            )}
        >
            <div
                className={clsx(
                    "w-full bg-default-100 py-2 px-4",
                    "flex gap-8 rounded-xl h-fit",
                )}
            >
                <div className="flex gap-2 text-lg">
                    <div className="font-bold">Responses:</div>
                    <div className="text-primary-400">
                        {review.responses.length}
                    </div>
                </div>
                <div className="flex gap-2 text-lg">
                    <div className="font-bold">Reviewers:</div>
                    <div className="text-primary-400">{reviewers.length}</div>
                </div>
                <div className="ml-auto"></div>
                {requiredResponses && ratings && (
                    <div className={clsx("flex gap-2 text-lg font-bold")}>
                        Your ratings:
                        <div
                            className={clsx(
                                "text-danger-400",
                                ratings.length / requiredResponses.length >
                                    0.5 && "text-primary-300",
                                ratings.length === requiredResponses.length &&
                                    "text-success-300",
                                ratings.length > requiredResponses.length &&
                                    "!text-danger-200",
                            )}
                        >
                            {ratings.length} / {requiredResponses.length}
                        </div>
                        {/* 
                        // TODO: separate ratings page
                        <Button
                            size="sm"
                            endContent={<ArrowRightIcon className="size-4" />}
                            className="text-small ml-4"
                            variant="bordered"
                            color="primary"
                        >
                            Go to ratings
                        </Button> */}
                    </div>
                )}
            </div>
            {isReviewer && ratings && requiredResponses && (
                <>
                    {response && currentRating && (
                        <ReviewResponse
                            questions={review.questions}
                            response={response}
                            rating={currentRating}
                            rubric={review.rubric}
                            updateRatingValue={updateRubricValue}
                            config={config}
                        />
                    )}
                    <div
                        className={clsx(
                            "w-full bg-default-100 items-center",
                            "flex gap-8 rounded-xl h-fit justify-between",
                        )}
                    >
                        <Button
                            isIconOnly
                            variant="flat"
                            size="lg"
                            isDisabled={responseIndex === 0}
                            onPress={prevResponse}
                        >
                            <ArrowLeftIcon className="size-6" strokeWidth={2} />
                        </Button>
                        <div className="text-lg font-bold text-default-800">
                            Response {responseIndex + 1}
                        </div>
                        <Button
                            isIconOnly
                            variant="flat"
                            size="lg"
                            isDisabled={
                                responseIndex === requiredResponses.length - 1
                            }
                            onPress={nextResponse}
                        >
                            <ArrowRightIcon
                                className="size-6"
                                strokeWidth={2}
                            />
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}
