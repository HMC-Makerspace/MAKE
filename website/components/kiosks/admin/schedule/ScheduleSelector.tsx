import {
    Button,
    Card,
    DateRangePicker,
    DateValue,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownSection,
    DropdownTrigger,
    Input,
    RangeValue,
    Selection,
    TimeInput,
    Tooltip,
    useDisclosure,
    addToast
} from "@heroui/react";
import { TSchedule } from "common/schedule";
import { fromAbsolute, Time } from "@internationalized/date";
import {
    ChevronDownIcon,
    ClipboardDocumentIcon,
    Cog8ToothIcon,
    EyeIcon,
    EyeSlashIcon,
    MegaphoneIcon,
    PlusIcon,
    ScaleIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";
import React, { Key, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import clsx from "clsx";
import { TConfig } from "common/config";
import DeleteModal from "../../../DeleteModal";
import { timestampToTime, timeToTimestamp } from "../../../../utils";
import AlertEditorModal from "./AlertEditorModal";
import { ITEM_RELATIVE_QUANTITY } from "../../../../../common/inventory";
import ShiftHistoryModal from "../dashboard/ShiftHistoryModal";

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

const patchSchedule = async ({
    schedule_uuid,
    partial_schedule,
}: {
    schedule_uuid: string;
    partial_schedule: Partial<TSchedule>;
}) => {
    return (
        await axios.patch<TSchedule>(`/api/v3/schedule/${schedule_uuid}`, {
            partial_schedule_obj: partial_schedule,
        })
    ).data;
};

const activateSchedule = async ({
    schedule_uuid,
}: {
    schedule_uuid: string;
}) => {
    return (
        await axios.patch<TSchedule>(
            `/api/v3/schedule/activate/${schedule_uuid}`,
        )
    ).data;
};

const stageSchedule = async ({ schedule_uuid }: { schedule_uuid: string }) => {
    return (
        await axios.patch<TSchedule>(`/api/v3/schedule/stage/${schedule_uuid}`)
    ).data;
};

function DeleteScheduleModal({
    schedule,
    isOpen,
    onOpenChange,
}: {
    schedule: TSchedule;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}) {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: async () => {
            return axios.delete(`/api/v3/schedule/${schedule.uuid}`);
        },
        onSuccess: () => {
            // Remove the role from the query cache
            queryClient.setQueryData(["schedule"], (old: TSchedule[]) => {
                return old.filter((s) => s.uuid !== schedule.uuid);
            });
            queryClient.removeQueries({
                queryKey: ["schedule", schedule.uuid],
            });
            addToast({
                title: `Successfully deleted schedule "${schedule.name}"`,
                color: "success",
            });
        },
        onError: (error) => {
            addToast({
                title: `Error: ${error.message}`,
                color: "danger",
            });
        },
    });

    const onSubmit = React.useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            // Prevent default browser page refresh.
            e.preventDefault();

            // Run the mutation
            mutation.mutate();
        },
        [mutation],
    );

    return (
        <DeleteModal
            itemType="schedule"
            itemName={schedule.name}
            onSubmit={onSubmit}
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            isLoading={mutation.isPending}
        />
    );
}

export default function ScheduleSelector({
    schedules,
    defaultSchedule,
    selectedSchedule,
    setSelectedSchedules = () => {},
    config,
    scheduleMode,
    setScheduleMode,
    setSelectedUsers,
}: {
    schedules: TSchedule[];
    defaultSchedule?: TSchedule;
    selectedSchedule?: TSchedule;
    setSelectedSchedules: (selection: Selection) => void;
    config: TConfig;
    scheduleMode: "schedule" | "availability";
    setScheduleMode: (mode: "schedule" | "availability") => void;
    setSelectedUsers: (users: Selection) => void;
}) {
    const queryClient = useQueryClient();

    const createReplaceMutation = useMutation({
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
            addToast({
                title: `Successfully created schedule`,
                color: "success",
            });
        },
    });

    const patchMutation = useMutation({
        mutationFn: patchSchedule,
        onSuccess: (data: TSchedule, variables) => {
            queryClient.setQueryData(["schedule", data.uuid], data);
            queryClient.setQueryData(["schedule"], (oldData: TSchedule[]) => {
                return oldData.map((schedule) => {
                    if (schedule.uuid === data.uuid) {
                        return data;
                    } else {
                        return schedule;
                    }
                });
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

    const stageMutation = useMutation({
        mutationFn: stageSchedule,
        onSuccess: (data: TSchedule) => {
            // Refresh queries
            queryClient.invalidateQueries({
                queryKey: ["schedule"],
            });
        },
    });

    const duplicateSchedule = (schedule?: TSchedule) => {
        if (!schedule) return;
        const newSchedule: TSchedule = {
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
                timestamp_start: alert.timestamp_start,
                timestamp_end: alert.timestamp_end,
                header: alert.header,
                content: alert.content,
                hyperlink: alert.hyperlink,
            })),
            daily_open_time: schedule.daily_open_time,
            daily_close_time: schedule.daily_close_time,
            active: false, // all schedules start inactive
            staged: false, // all schedules start unstaged
        };
        createReplaceMutation.mutate({ schedule: newSchedule, isNew: true });
    };

    const createSchedule = () => {
        const schedule: TSchedule = {
            uuid: crypto.randomUUID(),
            name: "New Schedule",
            timestamp_start: Date.now() / 1000, // today
            timestamp_end: Date.now() / 1000 + 24 * 60 * 60, // tomorrow
            shifts: [],
            alerts: [],
            daily_open_time: 12 * 60 * 60, // noon
            daily_close_time: 22 * 60 * 60, // 10pm
            active: false,
            staged: false,
        };
        createReplaceMutation.mutate({
            schedule: schedule,
            isNew: true,
        });
    };

    const scheduleChangeHandler = React.useCallback(
        (newSchedule: Key) => {
            if (newSchedule === "new") {
                createSchedule();
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

    const [openTime, setOpenTime] = useState(
        schedule ? timestampToTime(schedule.daily_open_time) : undefined,
    );

    const [closeTime, setCloseTime] = useState(
        schedule ? timestampToTime(schedule.daily_close_time) : undefined,
    );

    const [scheduleRange, setScheduleRange] =
        useState<RangeValue<DateValue> | null>();

    const {
        isOpen: isDeleting,
        onOpen: onDelete,
        onOpenChange: onDeleteChange,
    } = useDisclosure();

    const {
        isOpen: isAlertModalOpen,
        onOpen: onAlertModalOpen,
        onOpenChange: onAlertModalChange,
    } = useDisclosure();

    const {
        isOpen: isHistoryOpen,
        onOpenChange: historyOpenChange,
        onOpen: openHistory,
    } = useDisclosure();

    return (
        <Card
            className="w-full p-2 pb bg-default-200 gap-2 flex-row justify-between items-center"
            shadow="sm"
        >
            <div className="flex flex-row gap-2">
                <DateRangePicker
                    aria-label="Date Range"
                    isRequired
                    isDisabled={!schedule}
                    defaultValue={
                        schedule &&
                        schedule.timestamp_start &&
                        schedule.timestamp_end
                            ? {
                                  start: fromAbsolute(
                                      schedule.timestamp_start * 1000,
                                      config.schedule.timezone,
                                  ),
                                  end: fromAbsolute(
                                      schedule.timestamp_end * 1000,
                                      config.schedule.timezone,
                                  ),
                              }
                            : undefined
                    }
                    showMonthAndYearPickers
                    granularity="day"
                    label="Date Range"
                    className="w-min py h-full justify-self-end"
                    size="md"
                    color="secondary"
                    variant="faded"
                    onChange={(value) => {
                        setScheduleRange(value);
                    }}
                    onBlur={() => {
                        if (scheduleRange && schedule) {
                            const partial_schedule: Partial<TSchedule> = {
                                timestamp_start:
                                    scheduleRange.start
                                        .toDate(config.schedule.timezone)
                                        .getTime() / 1000,
                                timestamp_end:
                                    scheduleRange.end
                                        .toDate(config.schedule.timezone)
                                        .getTime() / 1000,
                            };
                            patchMutation.mutate({
                                schedule_uuid: schedule.uuid,
                                partial_schedule: partial_schedule,
                            });
                        }
                    }}
                />
                {schedule && (
                    <Tooltip
                        content={
                            schedule.active
                                ? "Schedule is active"
                                : schedule.staged
                                  ? "Schedule is staged, click to activate"
                                  : "Click to stage for workers"
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
                                ) : schedule.staged ? (
                                    <EyeIcon className="size-6" />
                                ) : (
                                    <EyeSlashIcon className="size-6" />
                                )
                            }
                            disableRipple={schedule.active}
                            variant="ghost"
                            color={
                                schedule.active
                                    ? "success"
                                    : schedule.staged
                                      ? "primary"
                                      : "danger"
                            }
                            size="lg"
                            className="self-end m-1"
                            onPress={() => {
                                if (!schedule.active) {
                                    if (!schedule.staged) {
                                        stageMutation.mutate({
                                            schedule_uuid: schedule.uuid,
                                        });
                                    } else {
                                        activateMutation.mutate({
                                            schedule_uuid: schedule.uuid,
                                        });
                                    }
                                }
                            }}
                        />
                    </Tooltip>
                )}
            </div>
            <Tooltip
                content={"Toggle schedule/availability mode"}
                delay={250}
                color={scheduleMode === "schedule" ? "primary" : "warning"}
                placement="bottom"
            >
                <Button
                    variant="bordered"
                    className={clsx(
                        "h-full rounded-xl text-md",
                        scheduleMode === "availability" && "text-warning-400",
                    )}
                    color={scheduleMode === "schedule" ? "primary" : "warning"}
                    onPress={() => {
                        // setSelectedUsers(new Set());
                        setScheduleMode(
                            scheduleMode === "schedule"
                                ? "availability"
                                : "schedule",
                        );
                    }}
                >
                    {scheduleMode === "schedule"
                        ? "Schedule Mode"
                        : "Availability Mode"}
                </Button>
            </Tooltip>
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
                            startContent={<MegaphoneIcon className="size-6" />}
                            color="primary"
                            variant="faded"
                            size="lg"
                            className="self-end"
                            onPress={onAlertModalOpen}
                        />
                    </Tooltip>
                )}
                <Input
                    placeholder="Select Schedule"
                    // isDisabled={!schedule}
                    value={scheduleName}
                    onValueChange={setScheduleName}
                    onBlur={(blurEvent) => {
                        if (!schedule) return;
                        // Get input value
                        const value = blurEvent.target.value;
                        // Update name of schedule
                        patchMutation.mutate({
                            schedule_uuid: schedule.uuid,
                            partial_schedule: { name: value },
                        });
                    }}
                    type="text"
                    size="lg"
                    color="secondary"
                    variant="faded"
                    className="w-full self-end"
                    classNames={{
                        input: "placeholder:text-default-400 text-center",
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
                                className="max-h-[50vh] overflow-auto"
                            >
                                <DropdownSection>
                                    {schedules.map((item) => (
                                        <DropdownItem
                                            key={item.uuid}
                                            className={
                                                item.active
                                                    ? "text-success-300"
                                                    : item.staged
                                                      ? "text-primary-300"
                                                      : ""
                                            }
                                        >
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
                <Dropdown placement="bottom-end" isDisabled={!schedule}>
                    <DropdownTrigger>
                        <Button
                            isIconOnly
                            startContent={
                                <Cog8ToothIcon className="size-6 text-secondary-400" />
                            }
                            variant="faded"
                            color="secondary"
                            size="lg"
                            className="self-end"
                        />
                    </DropdownTrigger>
                    <DropdownMenu
                        className="p-2"
                        onAction={(key) => {
                            if (key === "duplicate") {
                                duplicateSchedule(schedule);
                            } else if (key === "delete") {
                                onDelete();
                            } else if (key === "history") {
                                openHistory();
                            }
                        }}
                    >
                        <DropdownItem
                            key="duplicate"
                            startContent={
                                <ClipboardDocumentIcon className="size-5" />
                            }
                            variant="shadow"
                            color="secondary"
                            className="text-secondary"
                        >
                            Duplicate
                        </DropdownItem>
                        <DropdownItem
                            key="delete"
                            startContent={<TrashIcon className="size-5" />}
                            variant="shadow"
                            color="danger"
                            className="text-danger"
                        >
                            Delete
                        </DropdownItem>
                        <DropdownItem
                            key="history"
                            startContent={<ScaleIcon className="size-5" />}
                            variant="shadow"
                            color="primary"
                            className="text-primary"
                        >
                            View History
                        </DropdownItem>
                        <DropdownItem
                            key="open-time"
                            textValue={openTime?.toString()}
                            variant="flat"
                            closeOnSelect={false}
                        >
                            <TimeInput
                                variant="faded"
                                label="Open Time"
                                isRequired
                                value={openTime}
                                onChange={(value) => {
                                    if (!value) {
                                        return;
                                    } else {
                                        setOpenTime(value);
                                    }
                                }}
                                onBlur={() => {
                                    if (!schedule || !openTime) return;
                                    // Update schedule open time
                                    patchMutation.mutate({
                                        schedule_uuid: schedule.uuid,
                                        partial_schedule: {
                                            daily_open_time:
                                                timeToTimestamp(openTime),
                                        },
                                    });
                                }}
                            />
                        </DropdownItem>
                        <DropdownItem
                            key="close-time"
                            textValue={closeTime?.toString()}
                            variant="flat"
                            closeOnSelect={false}
                        >
                            <TimeInput
                                variant="faded"
                                label="Close Time"
                                value={closeTime}
                                isRequired
                                onChange={(value) => {
                                    if (!value) {
                                        return;
                                    } else {
                                        setCloseTime(value);
                                    }
                                }}
                                onBlur={() => {
                                    if (!schedule || !closeTime) return;
                                    // Update schedule close time
                                    patchMutation.mutate({
                                        schedule_uuid: schedule.uuid,
                                        partial_schedule: {
                                            daily_close_time:
                                                timeToTimestamp(closeTime),
                                        },
                                    });
                                }}
                            />
                        </DropdownItem>
                    </DropdownMenu>
                </Dropdown>
            </div>
            {!!schedule && (
                <>
                    <DeleteScheduleModal
                        schedule={schedule}
                        isOpen={isDeleting}
                        onOpenChange={onDeleteChange}
                    />
                    <AlertEditorModal
                        schedule={schedule}
                        patchMutation={patchMutation}
                        config={config}
                        isOpen={isAlertModalOpen}
                        onOpenChange={onAlertModalChange}
                    />
                    <ShiftHistoryModal
                        schedule={schedule}
                        isOpen={isHistoryOpen}
                        onOpenChange={historyOpenChange}
                    />
                </>
            )}
        </Card>
    );
}
