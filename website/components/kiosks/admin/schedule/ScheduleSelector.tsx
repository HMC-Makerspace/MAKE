import {
    Button,
    Card,
    DateInput,
    DateRangePicker,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownSection,
    DropdownTrigger,
    Input,
    Selection,
    Tooltip,
} from "@heroui/react";
import { TSchedule } from "common/schedule";
import { fromAbsolute, parseZonedDateTime } from "@internationalized/date";
import {
    BellAlertIcon,
    BellIcon,
    BellSlashIcon,
    CheckIcon,
    ChevronDownIcon,
    ClipboardDocumentIcon,
    EyeIcon,
    EyeSlashIcon,
    PlusIcon,
} from "@heroicons/react/24/outline";
import React, { Key, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { isCancel } from "axios";
import clsx from "clsx";
import { data } from "react-router-dom";

const createUpdateSchedule = async ({
    schedule,
    isNew,
}: {
    schedule: TSchedule;
    isNew: boolean;
}) => {
    if (isNew) {
        return (
            await axios.post<TSchedule>("/api/v3/schedule", {
                schedule_obj: schedule,
            })
        ).data;
    } else {
        return (
            await axios.put<TSchedule>("/api/v3/schedule", {
                schedule_obj: schedule,
            })
        ).data;
    }
};

const activateSchedule = async ({
    schedule_uuid,
}: {
    schedule_uuid: string;
}) => {
    return (
        await axios.patch<TSchedule>(`/api/v3/schedule/active/${schedule_uuid}`)
    ).data;
};

export default function ScheduleSelector({
    schedules,
    defaultSchedule,
    selectedSchedule,
    setSelectedSchedules = () => {},
}: {
    schedules: TSchedule[];
    defaultSchedule?: TSchedule;
    selectedSchedule?: TSchedule;
    setSelectedSchedules: (selection: Selection) => void;
}) {
    const queryClient = useQueryClient();

    const scheduleMutation = useMutation({
        mutationFn: createUpdateSchedule,
        onSuccess: (data: TSchedule, variables) => {
            queryClient.setQueryData(["schedule", data.uuid], data);
            queryClient.setQueryData(["schedule"], (oldData: TSchedule[]) => {
                if (variables.isNew) {
                    return oldData.concat([data]);
                } else {
                    return oldData.map((schedule) => {
                        if (schedule.uuid === data.uuid) {
                            return data;
                        } else {
                            return schedule;
                        }
                    });
                }
            });
            setSelectedSchedules(new Set([data.uuid]));
        },
    });

    const activateMutation = useMutation({
        mutationFn: activateSchedule,
        onSuccess: (data: TSchedule) => {
            // Refresh queries
            queryClient.invalidateQueries({
                queryKey: ["schedule"],
            });
        },
    });

    const duplicateSchedule = (schedule?: TSchedule) => {
        if (!schedule) return;
        const newSchedule = {
            uuid: crypto.randomUUID(),
            name: `${schedule.name} (copy)`,
            timestamp_start: schedule.timestamp_start,
            timestamp_end: schedule.timestamp_end,
            shifts: schedule.shifts.map((shift) => ({
                uuid: crypto.randomUUID(),
                day: shift.day,
                sec_start: shift.sec_start,
                sec_end: shift.sec_end,
                assignee: shift.assignee,
                history: [],
            })),
            alerts: schedule.alerts.map((alert) => ({
                uuid: crypto.randomUUID(),
                default: alert.default,
                timestamp_start: alert.timestamp_start,
                timestamp_end: alert.timestamp_end,
                header: alert.header,
                message: alert.message,
            })),
            daily_open_time: schedule.daily_open_time,
            daily_close_time: schedule.daily_close_time,
            active: false, // all schedules start inactive
        };
        scheduleMutation.mutate({ schedule: newSchedule, isNew: true });
    };

    const scheduleChangeHandler = React.useCallback(
        (newSchedule: Key) => {
            if (newSchedule === "new") {
                // TODO: Handle new schedule creation logic here
                return;
            } else {
                setSelectedSchedules(new Set([newSchedule as string]));
            }
        },
        [setSelectedSchedules],
    );

    const schedule = selectedSchedule || defaultSchedule;

    const [scheduleName, setScheduleName] = useState(
        schedule ? schedule.name : "",
    );

    return (
        <Card
            className="w-full p-2 pb bg-default-200 gap-2 flex-row justify-between items-center"
            shadow="sm"
        >
            <div className="flex flex-row gap-2 w-2/5">
                <DateRangePicker
                    isRequired
                    // @ts-ignore
                    defaultValue={
                        schedule &&
                        schedule.timestamp_start &&
                        schedule.timestamp_end
                            ? {
                                  start: fromAbsolute(
                                      schedule.timestamp_start * 1000,
                                      "America/Los_Angeles",
                                  ),
                                  end: fromAbsolute(
                                      schedule.timestamp_end * 1000,
                                      "America/Los_Angeles",
                                  ),
                              }
                            : undefined
                    }
                    showMonthAndYearPickers
                    granularity="day"
                    label="Active Range"
                    className="w-min py h-full justify-self-end"
                    size="md"
                    color="secondary"
                    variant="faded"
                />
                {schedule && (
                    <Tooltip
                        content={
                            schedule?.active
                                ? "Schedule is active"
                                : "Click to set as active schedule"
                        }
                        delay={250}
                        color={schedule.active ? "success" : "primary"}
                        placement="bottom"
                    >
                        <Button
                            isIconOnly
                            startContent={
                                schedule.active ? (
                                    <EyeIcon className="size-6" />
                                ) : (
                                    <EyeSlashIcon className="size-6" />
                                )
                            }
                            disableRipple={schedule.active}
                            variant={schedule.active ? "ghost" : "faded"}
                            color={schedule.active ? "success" : "danger"}
                            size="lg"
                            className="self-end m-1"
                            onPress={() => {
                                if (!schedule.active) {
                                    activateMutation.mutate({
                                        schedule_uuid: schedule.uuid,
                                    });
                                }
                            }}
                        />
                    </Tooltip>
                )}
            </div>
            <div className="flex flex-row gap-0 items-center w-2/5">
                {schedule && (
                    <Tooltip
                        content={
                            <div className="text-md text-default-700">
                                View/Edit Alerts
                            </div>
                        }
                        className="bg-default-300"
                        placement="bottom"
                    >
                        <Button
                            isIconOnly
                            startContent={<BellIcon className="size-6" />}
                            color="primary"
                            variant="faded"
                            size="lg"
                            className="self-end"
                            onPress={() => /** show alert modal */ {}}
                        />
                    </Tooltip>
                )}
                <Input
                    placeholder="Select Schedule"
                    isDisabled={!schedule}
                    value={scheduleName}
                    onValueChange={setScheduleName}
                    onBlur={(blurEvent) => {
                        if (!schedule) return;
                        // Get input value
                        const value = blurEvent.target.value;
                        // Update name of schedule
                        const newSchedule: TSchedule = {
                            ...schedule,
                            name: value,
                        };
                        scheduleMutation.mutate({
                            schedule: newSchedule,
                            isNew: false,
                        });
                    }}
                    type="text"
                    size="lg"
                    color="secondary"
                    variant="faded"
                    className="w-full self-end"
                    classNames={{
                        input: "placeholder:text-default-400 text-center ",
                    }}
                    minLength={1}
                    aria-label="Schedule Name"
                    endContent={
                        <Dropdown>
                            <DropdownTrigger>
                                <Button
                                    isIconOnly
                                    className="bg-default-100 group -mr-1.5"
                                    disableAnimation
                                    size="sm"
                                >
                                    <ChevronDownIcon
                                        className={clsx(
                                            "size-6 text-secondary-300",
                                            "rotate-90 transition-all",
                                            "group-aria-[expanded=true]:rotate-0",
                                        )}
                                    />
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu
                                aria-label="Choose Schedule"
                                onAction={scheduleChangeHandler}
                            >
                                <DropdownSection>
                                    {schedules.map((item) => (
                                        <DropdownItem key={item.uuid}>
                                            {item.name}
                                        </DropdownItem>
                                    ))}
                                </DropdownSection>
                                <DropdownSection>
                                    <DropdownItem
                                        key="new"
                                        className="text-default-400"
                                        startContent={
                                            <PlusIcon className="size-5 text-default-400" />
                                        }
                                    >
                                        New Schedule
                                    </DropdownItem>
                                </DropdownSection>
                            </DropdownMenu>
                        </Dropdown>
                    }
                />
                <Tooltip
                    content={
                        <div className="text-md text-default-700">
                            Duplicate Schedule
                        </div>
                    }
                    className="bg-default-300"
                    placement="bottom"
                >
                    <Button
                        isIconOnly
                        startContent={
                            <ClipboardDocumentIcon className="size-6 text-secondary-400" />
                        }
                        variant="faded"
                        color="secondary"
                        size="lg"
                        className="self-end"
                        onPress={() => duplicateSchedule(schedule)}
                    />
                </Tooltip>
            </div>
        </Card>
    );
}
