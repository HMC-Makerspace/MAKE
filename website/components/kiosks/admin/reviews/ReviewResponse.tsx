import {
    TRating,
    TResponse,
    TReview,
    TReviewQuestion,
    TRubric,
    TRubricValue,
} from "common/review";
import clsx from "clsx";
import { TConfig } from "common/config";
import { DateFormatter } from "@internationalized/date";
import { timestampToZonedDateTime } from "../../../../utils";
import { Button, Radio, RadioGroup } from "@heroui/react";
import { useRef, useState } from "react";
import {
    RegisterableHotkey,
    useHotkey,
    useHotkeys,
} from "@tanstack/react-hotkeys";
import { ReviewRubricItem } from "./ReviewRubricItem";

export function ReviewResponse({
    questions,
    response,
    rubric,
    rating,
    updateRatingValue,
    config,
    hideConfidential = true,
}: {
    questions: TReviewQuestion[];
    response: TResponse;
    rubric: TRubric;
    rating: TRating;
    updateRatingValue: (value: TRubricValue) => void;
    config: TConfig;
    hideConfidential?: boolean;
}) {
    const formatter = config?.schedule.locale
        ? new DateFormatter(config.schedule.locale, {
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
          })
        : undefined;

    const [selectedRubricIndex, setRubricIndex] = useState(-1);
    useHotkeys([
        {
            hotkey: "`",
            callback: () => {
                setRubricIndex((selectedRubricIndex + 1) % rubric.items.length);
            },
        },
        {
            hotkey: "Escape",
            callback: () => {
                setRubricIndex(-1);
            },
        },
    ]);
    useHotkeys(
        Array.from("123456789").map((key, index) => ({
            hotkey: key as RegisterableHotkey,
            callback: () => setRubricIndex(index % rubric.items.length),
        })),
    );
    useHotkeys(
        Array.from("qwertyuiop").map((key, index) => ({
            hotkey: key as RegisterableHotkey,
            callback: () => {
                if (selectedRubricIndex === -1) return;
                const item = rubric.items[selectedRubricIndex];
                updateRatingValue({
                    rubric_item: item.uuid,
                    value: item.tiers[index].value,
                });
            },
        })),
    );
    return (
        <div
            className={clsx(
                "w-full bg-content1 py-2 px-4",
                "flex flex-row rounded-xl h-full overflow-auto",
            )}
        >
            <div className="h-full flex flex-col overflow-auto flex-1 pr-3">
                {questions.map((question, idx) => {
                    if (
                        question.type === "ignore" ||
                        (hideConfidential &&
                            (question.type === "confidential" ||
                                question.type === "email"))
                    ) {
                        return null;
                    }
                    const value = response.answers[idx];
                    if (value === "") return null;
                    return (
                        <div
                            className={clsx(
                                "border-2 border-default-300 rounded-md",
                                "flex flex-col text-md mb-1 px-2 py-1",
                            )}
                        >
                            <div className="text-primary-600/50 font-semibold">
                                {question.title}
                                {question.type === "confidential" && " *"}
                            </div>
                            <div className="text-default-700">
                                {question.type === "timestamp"
                                    ? formatter?.format(
                                          timestampToZonedDateTime(
                                              Number(value),
                                              config.schedule.timezone,
                                          ).toDate(),
                                      )
                                    : value}
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="w-[2px] bg-default-400/80 rounded-sm h-full" />
            <div
                className="flex h-fit overflow-auto flex-1 flex-col px-3 gap-2"
                key={response.uuid}
            >
                {rubric.items.map((item, ridx) => {
                    const ratingValue = rating.rubric_values.find(
                        (rv) => rv.rubric_item === item.uuid,
                    )?.value;
                    return (
                        <ReviewRubricItem
                            key={item.uuid}
                            index={ridx}
                            item={item}
                            ratingValue={ratingValue}
                            setRatingValue={(value) =>
                                updateRatingValue({
                                    rubric_item: item.uuid,
                                    value,
                                })
                            }
                            selectedRubricIndex={selectedRubricIndex}
                            setRubricIndex={setRubricIndex}
                        />
                    );
                })}
            </div>
        </div>
    );
}
