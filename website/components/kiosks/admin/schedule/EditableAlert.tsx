import {
    Button,
    ButtonGroup,
    Input,
    Tooltip,
    Switch,
    DateRangePicker,
    DateRangePickerField,
    Popover,
    PopoverContent,
    PopoverTrigger,
    RangeCalendar,
    Checkbox,
} from "@heroui/react";
import clsx from "clsx";
import { TAlert } from "common/schedule";
import {
    LinkSlashIcon,
    LinkIcon,
    TrashIcon,
    XMarkIcon,
    CheckIcon,
} from "@heroicons/react/24/outline";

import {
    CalendarDateRangeIcon,
    CheckCircleIcon,
    ClockIcon,
} from "@heroicons/react/24/solid";
import {
    convertTimestampToDate,
    timestampToZonedDateTime,
    zonedDateTimeToTimestamp,
} from "../../../../utils";

export default function EditableAlert({
    alert,
    deleteAlert,
    wrapEdit,
    timezone,
}: {
    alert: TAlert;
    deleteAlert: () => void;
    wrapEdit: <P extends keyof TAlert>(prop: P) => (val: TAlert[P]) => void;
    timezone: string;
}) {
    const isDefault = !(alert.timestamp_end && alert.timestamp_start);
    return (
        <div className="flex flex-col sm:flex-row w-full gap-2 items-top">
            <div
                className={clsx(
                    "w-full h-full flex gap-1 flex-col",
                    "items-center bg-default-200",
                    "p-1 rounded-2xl",
                )}
            >
                <Input
                    variant="faded"
                    label="Header"
                    defaultValue={alert.header}
                    size="lg"
                    classNames={{
                        input: "font-bold text-content1-foreground",
                    }}
                    onValueChange={wrapEdit("header")}
                    color="secondary"
                    endContent={
                        <ButtonGroup className="pl-2">
                            <Tooltip color="danger" content="Delete this alert">
                                <Button
                                    variant="flat"
                                    color="danger"
                                    onPress={deleteAlert}
                                    isIconOnly
                                >
                                    <TrashIcon className="size-6" />
                                </Button>
                            </Tooltip>
                            <Popover placement="bottom-end">
                                <PopoverTrigger>
                                    <Button
                                        color={
                                            isDefault ? "default" : "success"
                                        }
                                        startContent={
                                            <CalendarDateRangeIcon className="size-6" />
                                        }
                                        isIconOnly
                                    />
                                </PopoverTrigger>
                                <PopoverContent className="p-0">
                                    <RangeCalendar
                                        classNames={{
                                            content: "min-h-[275px]",
                                        }}
                                        color="success"
                                        topContent={
                                            <div
                                                className={clsx(
                                                    "text-medium font-semibold",
                                                    "text-center pt-2 -mb-1.5",
                                                    "bg-content1 ",
                                                )}
                                            >
                                                Scheduled Date Range
                                            </div>
                                        }
                                        value={
                                            alert.timestamp_start &&
                                            alert.timestamp_end
                                                ? {
                                                      start: timestampToZonedDateTime(
                                                          alert.timestamp_start,
                                                          timezone,
                                                      ),
                                                      end: timestampToZonedDateTime(
                                                          alert.timestamp_end,
                                                          timezone,
                                                      ),
                                                  }
                                                : null
                                        }
                                        onChange={(range) => {
                                            if (range?.start) {
                                                wrapEdit("timestamp_start")(
                                                    zonedDateTimeToTimestamp(
                                                        range.start,
                                                    ),
                                                );
                                            }
                                            if (range?.end) {
                                                wrapEdit("timestamp_end")(
                                                    zonedDateTimeToTimestamp(
                                                        range.end,
                                                    ),
                                                );
                                            }
                                        }}
                                        bottomContent={
                                            <div className="w-full p-2 -mt-4 flex justify-center">
                                                <Checkbox
                                                    isSelected={isDefault}
                                                    onValueChange={(
                                                        selected,
                                                    ) => {
                                                        if (selected) {
                                                            wrapEdit(
                                                                "timestamp_start",
                                                            )(undefined);
                                                            wrapEdit(
                                                                "timestamp_end",
                                                            )(undefined);
                                                        }
                                                    }}
                                                    isDisabled={isDefault}
                                                    color="success"
                                                    className={clsx(
                                                        "w-full text-md",
                                                        "data-[disabled=true]:opacity-80",
                                                    )}
                                                >
                                                    Default?
                                                </Checkbox>
                                            </div>
                                        }
                                    />
                                </PopoverContent>
                            </Popover>
                        </ButtonGroup>
                    }
                />
                <Input
                    variant="faded"
                    label="Content"
                    labelPlacement="outside-left"
                    fullWidth
                    defaultValue={alert.content}
                    classNames={{
                        mainWrapper: "w-full",
                        input: alert.hyperlink && "underline",
                    }}
                    onValueChange={wrapEdit("content")}
                    color="secondary"
                    endContent={
                        <Tooltip
                            content={
                                alert.hyperlink
                                    ? "Disable hyperlink"
                                    : "Enable hyperlink"
                            }
                        >
                            <Switch
                                color="success"
                                onValueChange={wrapEdit("hyperlink")}
                                isSelected={alert.hyperlink}
                                className="pl-1"
                                classNames={{
                                    thumb: !alert.hyperlink && "bg-danger/50",
                                }}
                                thumbIcon={({ isSelected, className }) =>
                                    isSelected ? (
                                        <LinkIcon
                                            className={clsx(
                                                className,
                                                "size-4 text-success-200",
                                            )}
                                            strokeWidth={2}
                                        />
                                    ) : (
                                        <LinkSlashIcon
                                            className={clsx(
                                                className,
                                                "size-4 text-danger-600",
                                            )}
                                            strokeWidth={2}
                                        />
                                    )
                                }
                            />
                        </Tooltip>
                    }
                />
            </div>
        </div>
    );
}
