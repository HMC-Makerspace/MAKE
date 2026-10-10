import {
    MinusIcon,
    PlusIcon,
    SquaresPlusIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";
import { Button, ButtonGroup, input, Input, NumberInput, Textarea } from "@heroui/react";
import clsx from "clsx";
import { TRubric } from "common/review";

export function ReviewRubricEditor({
    rubric,
    setRubric,
}: {
    rubric: TRubric;
    setRubric?: (r: TRubric) => void;
}) {
    const editable = !!setRubric;
    return (
        <div className={clsx("w-1/2 pt-3")}>
            {editable ? (
                <Input
                    aria-label="Rubric name"
                    placeholder="New Rubric"
                    defaultValue={rubric.name}
                    onBlur={(blurEvent) => {
                        // Get input value
                        const value = blurEvent.target.value;
                        if (value == rubric.name || !value) {
                            return; // no update
                        }
                        // Update name of rubric
                        setRubric({ ...rubric, name: value });
                    }}
                    type="text"
                    size="lg"
                    color="primary"
                    variant="underlined"
                    className="w-full"
                    classNames={{
                        input: clsx(
                            "placeholder:text-default-400 font-bold",
                            "text-xl text-default-800",
                        ),
                    }}
                    isRequired
                    minLength={1}
                    errorMessage={"Unsaved changes: please enter a name"}
                    startContent={
                        <div className="font-bold text-xl pr-3 text-default-800">
                            Rubric:
                        </div>
                    }
                    endContent={
                        <Button
                            variant="ghost"
                            color="primary"
                            isIconOnly
                            onPress={() =>
                                setRubric({
                                    ...rubric,
                                    items: [
                                        ...rubric.items,
                                        {
                                            uuid: crypto.randomUUID(),
                                            category: "",
                                            tiers: [],
                                        },
                                    ],
                                })
                            }
                        >
                            <SquaresPlusIcon className="size-7" />
                        </Button>
                    }
                />
            ) : (
                <div className="w-full font-bold text-xl p-1 pt-2 pb-3 text-default-800">
                    {rubric.name || "New Rubric"}
                </div>
            )}
            <div
                className={clsx(
                    "bg-default-100 min-h-20 rounded-large p-2",
                    "empty:after:content-['No_rubric_items']",
                    "grid grid-cols-2 gap-2 max-h-[400px] overflow-auto",
                    "text-md empty:text-default-400 empty:flex",
                    "empty:justify-center empty:items-center",
                )}
            >
                {rubric.items.map((item, idx) => (
                    <div
                        key={item.uuid}
                        className={clsx("bg-default-200 p-2", "rounded-small")}
                    >
                        {editable ? (
                            <Input
                                aria-label="Category"
                                placeholder="New category"
                                defaultValue={item.category}
                                onBlur={(blurEvent) => {
                                    // Get input value
                                    const value = blurEvent.target.value;
                                    if (value == item.category || !value) {
                                        return; // no update
                                    }
                                    const newRubric = { ...rubric };
                                    newRubric.items[idx] = {
                                        ...item,
                                        category: value,
                                    };
                                    setRubric(newRubric);
                                }}
                                type="text"
                                size="sm"
                                color="primary"
                                variant="underlined"
                                className="w-full"
                                classNames={{
                                    input: clsx(
                                        "placeholder:text-default-400",
                                        "text-lg text-default-800 mr-2 pl-1",
                                    ),
                                }}
                                isRequired
                                minLength={1}
                                errorMessage={
                                    "Unsaved changes: please enter a category"
                                }
                                endContent={
                                    <ButtonGroup>
                                        <Button
                                            size="sm"
                                            variant="light"
                                            color="primary"
                                            isIconOnly
                                            onPress={() => {
                                                const newRubric = { ...rubric };
                                                newRubric.items[idx] = {
                                                    ...item,
                                                    tiers: [
                                                        ...item.tiers,
                                                        {
                                                            description: "",
                                                            value: 0,
                                                        },
                                                    ],
                                                };
                                                setRubric(newRubric);
                                            }}
                                        >
                                            <PlusIcon
                                                className="size-5"
                                                strokeWidth={2}
                                            />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="light"
                                            color="danger"
                                            isIconOnly
                                            onPress={() => {
                                                const newRubric = { ...rubric };
                                                newRubric.items.splice(idx, 1);
                                                setRubric(newRubric);
                                            }}
                                        >
                                            <TrashIcon
                                                className="size-5"
                                                strokeWidth={2}
                                            />
                                        </Button>
                                    </ButtonGroup>
                                }
                            />
                        ) : (
                            <div className="w-full font-bold text-lg p-1 pt-2 pb-3 text-default-800">
                                {item.category || "New category"}
                            </div>
                        )}
                        <div
                            className={clsx(
                                "empty:bg-default-100 rounded-sm empty:p-2 gap-1",
                                "empty:after:content-['No_tiers'] flex-col",
                                "text-md empty:text-default-400 flex",
                                "empty:justify-center empty:items-center",
                            )}
                        >
                            {item.tiers.map((tier, tidx) =>
                                editable ? (
                                    <div
                                        key={tidx}
                                        className={clsx(
                                            "flex gap-2 items-center w-full",
                                            "bg-default-100 rounded-sm p-1",
                                        )}
                                    >
                                        <NumberInput
                                            aria-label="Value"
                                            value={tier.value}
                                            onValueChange={(value) => {
                                                const newRubric = { ...rubric };
                                                const newTier = {
                                                    ...tier,
                                                    value,
                                                };
                                                const newItem = {
                                                    ...item,
                                                };
                                                newItem.tiers[tidx] = newTier;
                                                newRubric.items[idx] = newItem;
                                                setRubric(newRubric);
                                            }}
                                            color="primary"
                                            variant="underlined"
                                            size="sm"
                                            classNames={{
                                                base: "max-w-fit text-default-800",
                                                input: "w-8 max-w-fit font-bold text-end pr-0.5",
                                            }}
                                        />
                                        <Textarea
                                            aria-label="Tier"
                                            placeholder="New tier"
                                            minRows={1}
                                            defaultValue={tier.description}
                                            onBlur={(blurEvent) => {
                                                // Get input value
                                                const value =
                                                    blurEvent.target.value;
                                                if (value == tier.description) {
                                                    return; // no update
                                                }
                                                const newTier = {
                                                    ...tier,
                                                    description: value,
                                                };
                                                const newItem = { ...item };
                                                newItem.tiers[tidx] = newTier;
                                                const newRubric = { ...rubric };
                                                newRubric.items[idx] = newItem;
                                                setRubric(newRubric);
                                            }}
                                            type="text"
                                            size="sm"
                                            color="primary"
                                            variant="underlined"
                                            className="w-full"
                                            classNames={{
                                                input: clsx(
                                                    "placeholder:text-default-400",
                                                    "text-medium text-default-800",
                                                ),
                                                inputWrapper: "py-0"
                                            }} 
                                        />
                                        <Button
                                            size="sm"
                                            variant="light"
                                            color="danger"
                                            isIconOnly
                                            className="ml-auto"
                                            onPress={() => {
                                                const newRubric = { ...rubric };
                                                const newItem = { ...item };
                                                newItem.tiers.splice(tidx, 1);
                                                newRubric.items[idx] = newItem;
                                                setRubric(newRubric);
                                            }}
                                        >
                                            <MinusIcon
                                                className="size-5"
                                                strokeWidth={2}
                                            />
                                        </Button>
                                    </div>
                                ) : (
                                    <div>
                                        {tier.value} -{" "}
                                        {tier.description || "New tier"}
                                    </div>
                                ),
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
