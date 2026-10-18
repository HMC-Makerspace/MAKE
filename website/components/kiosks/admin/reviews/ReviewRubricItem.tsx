import { Button, RadioGroup, Radio } from "@heroui/react";
import clsx from "clsx";
import { TRubricItem } from "common/review";
import { useEffect, useRef } from "react";

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
    // Scroll rubric into view when selected
    const scrollRef = useRef<HTMLButtonElement>(null);
    useEffect(() => {
        if (selectedRubricIndex === index) {
            scrollRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [selectedRubricIndex, index]);
    return (
        <Button
            className={clsx(
                "border-2 border-default-300 rounded-md w-full min-h-fit",
                "flex flex-col text-md px-2 py-1 h-fit items-start",
                index === selectedRubricIndex && "border-primary-300",
            )}
            variant="bordered"
            disableRipple
            onPress={() => setRubricIndex(index)}
            ref={scrollRef}
        >
            <div className="text-primary-400 font-bold text-xl">
                {item.category}
            </div>
            <RadioGroup
                className="text-default-700 max-w-full"
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
                        className="text-default-800 max-w-full"
                        tabIndex={tier.value}
                    >
                        <div className="w-full flex gap-2 items-center">
                            <div>{tier.value}</div>-
                            <div className="w-full text-wrap text-start">
                                {tier.description}
                            </div>
                        </div>
                    </Radio>
                ))}
            </RadioGroup>
        </Button>
    );
}
