import { Button, RadioGroup, Radio } from "@heroui/react";
import {
    RegisterableHotkey,
    useHotkey,
    useHotkeys,
} from "@tanstack/react-hotkeys";
import clsx from "clsx";
import { TRating, TRubricItem } from "common/review";

export function ReviewRubricItem({
    item,
    index,
    ratingValue,
    setRatingValue,
    selectedRubricIndex,
    setRubricIndex,
}: {
    item: TRubricItem;
    index: number;
    ratingValue?: number;
    setRatingValue: (value: number) => void;
    selectedRubricIndex: number;
    setRubricIndex: (idx: number) => void;
}) {
    return (
        <Button
            className={clsx(
                "border-2 border-default-300 rounded-md w-full",
                "flex flex-col text-md px-2 py-1 h-fit items-start",
                index === selectedRubricIndex && "border-primary-300",
            )}
            variant="bordered"
            disableRipple
            onPress={() => setRubricIndex(index)}
        >
            <div className="text-primary-400 font-bold text-xl">
                {item.category}
            </div>
            <RadioGroup
                className="text-default-700"
                aria-label="Select a tier"
                color="primary"
                value={
                    ratingValue !== undefined ? String(ratingValue) : undefined
                }
                onValueChange={(v) => setRatingValue(Number(v))}
            >
                {item.tiers.map((tier) => (
                    <Radio
                        value={String(tier.value)}
                        className="text-default-800"
                        tabIndex={tier.value}
                    >
                        {tier.value} - {tier.description}
                    </Radio>
                ))}
            </RadioGroup>
        </Button>
    );
}
