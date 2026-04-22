import {
    AdjustmentsHorizontalIcon,
    CheckIcon,
} from "@heroicons/react/24/outline";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/solid";
import {
    Button,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownTrigger,
    Input,
    NumberInput,
    Textarea,
} from "@heroui/react";
import clsx from "clsx";
import { TFAQItem } from "common/config";
import { useCallback } from "react";

export default function EditableFAQItem({
    faq_item,
    index = 0,
    setItem,
    deleteItem,
    depth = 0,
}: {
    faq_item: TFAQItem;
    index?: number;
    setItem: (faq: TFAQItem, index: number) => void;
    deleteItem?: (index: number) => void;
    depth?: number;
}) {
    const setter = useCallback(
        (child: TFAQItem, child_index: number) => {
            const children = [...(faq_item.children ?? [])];
            children.splice(child_index, 1, child);
            const new_self: TFAQItem = {
                ...faq_item,
                children: children,
            };
            setItem(new_self, index);
        },
        [faq_item, index],
    );

    function blurCallback<P extends keyof TFAQItem>(prop: P) {
        return (
            blurEvent?: React.FocusEvent<HTMLInputElement, Element>,
            given_value?: TFAQItem[P],
        ) => {
            // Get input value
            const value =
                (blurEvent?.target.value as TFAQItem[P]) ?? given_value;
            if (value == faq_item[prop]) {
                return; // no update
            }
            const new_self = { ...faq_item };
            if (value) {
                // Update
                new_self[prop] = value;
                setItem(new_self, index);
            } else {
                delete new_self[prop];
                setItem(new_self, index);
            }
        };
    }

    return (
        <div className="w-full border-l-2 flex flex-col gap-1 border-secondary-200  ">
            <div className="py-1 pl-2 flex flex-col gap-1">
                <div className="flex gap-3 items-center">
                    <Input
                        type="text"
                        defaultValue={faq_item?.title}
                        onBlur={blurCallback("title")}
                        color="secondary"
                        variant="underlined"
                        placeholder="FAQ item title"
                        className="w-full"
                        isRequired
                        classNames={{
                            input: clsx([
                                "placeholder:text-default-500",
                                "placeholder:italic",
                                "text-default-700",
                                "text-lg font-semibold",
                            ]),
                        }}
                    />
                    <Button
                        color="secondary"
                        size="sm"
                        variant="faded"
                        startContent={<PlusIcon className="min-w-4 -mr-1" />}
                        className="px-4"
                        onPress={() => {
                            const children = faq_item?.children ?? [];
                            const new_self: TFAQItem = {
                                ...faq_item,
                                children: [...children, { title: "FAQ Item" }],
                            };
                            setItem(new_self, index);
                        }}
                    >
                        Add Child
                    </Button>
                    <Button
                        color="danger"
                        size="sm"
                        variant="flat"
                        isIconOnly
                        startContent={<TrashIcon className="size-5" />}
                        onPress={() => deleteItem && deleteItem(index)}
                        isDisabled={!deleteItem}
                    />
                    <Dropdown closeOnSelect={false} type="listbox">
                        <DropdownTrigger>
                            <Button
                                size="sm"
                                variant="flat"
                                isIconOnly
                                startContent={
                                    <AdjustmentsHorizontalIcon className="size-5" />
                                }
                            />
                        </DropdownTrigger>
                        <DropdownMenu
                            variant="faded"
                            onAction={(key) => {
                                switch (key) {
                                    case "columns":
                                        break;
                                    case "default_open":
                                    case "always_open":
                                    case "bordered":
                                    case "title_centered":
                                        const new_item = { ...faq_item };
                                        new_item[key] = !faq_item[key];
                                        setItem(new_item, index);
                                        break;
                                }
                            }}
                        >
                            <DropdownItem
                                key="columns"
                                textValue={"Child Column Count"}
                            >
                                <div className="flex flex-row gap-2 items-center h-6">
                                    <div className="text-sm whitespace-nowrap">
                                        Child Columns
                                    </div>
                                    <NumberInput
                                        size="sm"
                                        classNames={{
                                            inputWrapper: "min-w-16",
                                            mainWrapper: "w-min",
                                            label: "text-md pl-0 text-default-600",
                                        }}
                                        color="secondary"
                                        variant="bordered"
                                        minValue={1}
                                        defaultValue={
                                            faq_item.children_columns ?? 1
                                        }
                                        onValueChange={(value) =>
                                            blurCallback("children_columns")(
                                                undefined,
                                                value,
                                            )
                                        }
                                    />
                                </div>
                            </DropdownItem>
                            <DropdownItem
                                key="default_open"
                                endContent={
                                    <CheckIcon
                                        className={clsx(
                                            "size-4 duration-150",
                                            "text-secondary-300",
                                            faq_item.default_open
                                                ? ""
                                                : "opacity-0",
                                        )}
                                    />
                                }
                            >
                                Default Open?
                            </DropdownItem>
                            <DropdownItem
                                key="always_open"
                                endContent={
                                    <CheckIcon
                                        className={clsx(
                                            "size-4 duration-150",
                                            "text-secondary-300",
                                            faq_item.always_open
                                                ? ""
                                                : "opacity-0",
                                        )}
                                    />
                                }
                            >
                                Always Open?
                            </DropdownItem>
                            <DropdownItem
                                key="bordered"
                                endContent={
                                    <CheckIcon
                                        className={clsx(
                                            "size-4 duration-150",
                                            "text-secondary-300",
                                            faq_item.bordered
                                                ? ""
                                                : "opacity-0",
                                        )}
                                    />
                                }
                            >
                                Bordered?
                            </DropdownItem>
                            <DropdownItem
                                key="title_centered"
                                endContent={
                                    <CheckIcon
                                        className={clsx(
                                            "size-4 duration-150",
                                            "text-secondary-300",
                                            faq_item.title_centered
                                                ? ""
                                                : "opacity-0",
                                        )}
                                    />
                                }
                            >
                                Center Title?
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                </div>
                <Textarea
                    defaultValue={faq_item.description}
                    onBlur={blurCallback("description")}
                    minRows={2}
                    color="secondary"
                    placeholder="Item content"
                    variant="faded"
                    radius="sm"
                    classNames={{
                        input: clsx([
                            "placeholder:text-default-500",
                            "placeholder:italic",
                            "text-default-700",
                        ]),
                    }}
                />
            </div>
            <div className="flex flex-col pl-2 gap-3">
                {faq_item?.children?.map((child, i) => (
                    <EditableFAQItem
                        key={`faq-i${index}-c${i}-d${depth + 1}`}
                        faq_item={child}
                        index={i}
                        setItem={setter}
                        deleteItem={(i) =>
                            setItem(
                                {
                                    ...faq_item,
                                    children: (
                                        faq_item.children ?? []
                                    ).toSpliced(i, 1),
                                },
                                index,
                            )
                        }
                        depth={depth + 1}
                    />
                ))}
            </div>
        </div>
    );
}
