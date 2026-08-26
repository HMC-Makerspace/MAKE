import clsx from "clsx";
import { SHIFT_DAY, TShift } from "common/shift";
import { TUser, TUserRole, UserUUID } from "common/user";
import { motion } from "motion/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_SCOPE, UUID } from "../../../../../common/global";
import axios from "axios";
import { TSchedule } from "common/schedule";
import {
    Button,
    Popover,
    PopoverContent,
    PopoverTrigger,
    Selection,
    addToast,
} from "@heroui/react";
import React from "react";
import UserRole from "../../../user/UserRole";
import { getUserRoleHierarchy } from "../../../../utils";
import WorkerInfo from "./WorkerInfo";

const baseColors = [
    "bg-secondary-50",
    "bg-secondary-100",
    "bg-secondary-200",
    "bg-secondary-300",
    "bg-secondary-400",
];

const assigneeColors = [
    "bg-success-300",
    "bg-success-200",
    "bg-success-100",
    "bg-success-100",
    "bg-success-100",
];

const availabilityColors = [
    "bg-warning-50",
    "bg-warning-100",
    "bg-warning-200",
    "bg-warning-300",
    "bg-warning-400",
    "bg-warning-500",
    "bg-warning-500",
    "bg-warning-500",
];

const toggleUserShift = async ({
    shift,
    isScheduled,
    schedule_uuid,
}: {
    shift: TShift;
    isScheduled: boolean;
    schedule_uuid: UUID;
}) => {
    if (!isScheduled) {
        // Add the user to the shift
        return (
            await axios.post<TSchedule>(
                `/api/v3/schedule/${schedule_uuid}/shifts`,
                {
                    shift_obj: shift,
                },
            )
        ).data;
    } else {
        return (
            await axios.delete<TSchedule>(
                `/api/v3/schedule/${schedule_uuid}/shifts/${shift.uuid}`,
            )
        ).data;
    }
};

function getAvailableUsers(
    schedule_uuid: UUID,
    users: TUser[],
    day: number,
    sec_start: number,
    sec_end: number,
) {
    return users.filter((u) =>
        u.work_schedules
            ?.find((a) => a.schedule == schedule_uuid)
            ?.days.some(
                (record) =>
                    record.day === day &&
                    record.availability.some(
                        (time) =>
                            time.sec_start <= sec_start &&
                            time.sec_end >= sec_end,
                    ),
            ),
    );
}

export default function Shift({
    schedule_uuid,
    shifts,
    users,
    roles,
    day,
    sec_start,
    sec_end,
    selected_user,
    setSelectedUsers = () => {},
    type = "view",
    selectedShifts = new Set(),
    setSelectedShifts = () => {},
    dragging = false,
    setDragging = () => {},
    firstNamesOnly = true,
    availabilityChange = false
}: {
    schedule_uuid: UUID;
    shifts: TShift[];
    users: TUser[];
    roles: TUserRole[];
    day: number;
    sec_start: number;
    sec_end: number;
    selected_user?: TUser;
    setSelectedUsers?: (users: Selection) => void;
    type?:
        | "view"
        | "edit"
        | "availability"
        | "worker_availability"
        | "worker_view";
    selectedShifts?: Set<string>;
    setSelectedShifts?: (day_start_end: Set<string>) => void;
    dragging: boolean;
    setDragging: (dragging: boolean) => void;
    firstNamesOnly?: boolean;
    availabilityChange?: boolean;
}) {
    const queryClient = useQueryClient();

    const shiftMutation = useMutation({
        mutationFn: toggleUserShift,
        onSuccess: (result: TSchedule) => {
            queryClient.setQueryData(["schedule", schedule_uuid], result);
            queryClient.setQueryData(["schedule"], (old: TSchedule[]) =>
                old.map((s) => (s.uuid === result.uuid ? result : s)),
            );
        },
        onError: (error) => {
            addToast({
                title: `Error: ${error.message}`,
                color: "danger",
            });
        },
    });

    const relevant_shifts = shifts.filter(
        (shift) =>
            shift.day === day &&
            shift.sec_start <= sec_start &&
            shift.sec_end >= sec_end,
    );

    const assignees = relevant_shifts.map((shift) => shift.assignee);

    const scheduled = selected_user && assignees.includes(selected_user.uuid);

    const available = selected_user
        ? selected_user.work_schedules
              ?.find((a) => a.schedule == schedule_uuid)
              ?.days.some(
                  (record) =>
                      record.day === day &&
                      record.availability.some(
                          (time) =>
                              time.sec_start <= sec_start &&
                              time.sec_end >= sec_end,
                      ),
              )
        : false;

    const colorIndex = Math.min(assignees.length, baseColors.length - 1);

    const isShiftSelected = selectedShifts.has(
        `${day},${sec_start},${sec_end}`,
    );

    const [isOpen, setIsOpen] = React.useState(false);

    const [statUser, setStatUser] = React.useState<TUser | undefined>(
        undefined,
    );

    // Only get available users if necessary
    const availableUsers =
        type === "availability"
            ? getAvailableUsers(schedule_uuid, users, day, sec_start, sec_end)
            : [];

    const availabilityColorIndex = Math.floor(
        (availableUsers.length / users.length) * availabilityColors.length,
    );

    const edit_classes = [
        // If in edit mode and the user is scheduled, show a + cursor,
        // otherwise a no-edit cursor
        selected_user && !scheduled
            ? "cursor-cell"
            : selected_user && "cursor-not-allowed",
        // Background cell color is based on if the selected user is
        // scheduled and or available
        !scheduled && available && assigneeColors[colorIndex],
        !scheduled && !available && baseColors[colorIndex],
        scheduled && available && "bg-primary-300",
        scheduled && !available && "bg-danger-100",
    ];

    const view_classes = [
        // If in view mode, cells are clickable to show info
        "cursor-pointer ring-inset hover:ring-2",
        !isShiftSelected && baseColors[colorIndex],
        !isShiftSelected && "hover:ring-secondary",
        isShiftSelected && "bg-primary-300 hover:ring-primary-400",
    ];

    const availability_classes = [
        available && "bg-success-300",
        !available && availabilityColors[availabilityColorIndex],
        isShiftSelected && "ring-2",
    ];

    const worker_availability_classes = [
        !available && "bg-default-300",
        dragging && availabilityChange && isShiftSelected && "bg-success-600",
        available && "bg-success-400",
        dragging && !availabilityChange && isShiftSelected && "bg-danger-500",
    ];

    const worker_view_classes = [
        "cursor-pointer",
        assignees.length > 0 && !scheduled
            ? "bg-primary-300"
            : baseColors[colorIndex],
    ];

    return (
        <Popover
            isOpen={isOpen}
            onOpenChange={() => setIsOpen(false)} // always close on blur, but don't open
            shouldCloseOnBlur
            placement="left"
            shouldFlip
            showArrow
            classNames={{
                content: "bg-default-300",
            }}
            triggerScaleOnOpen={false}
        >
            <PopoverTrigger>
                <motion.div
                    className={clsx(
                        "h-full w-full",
                        "flex flex-col",
                        "items-center justify-center",
                        "gap-1 p-2 rounded-md",
                        "transition-colors-opacity duration-150",
                        ...(type === "edit" ? edit_classes : []),
                        ...(type === "view" ? view_classes : []),
                        ...(type === "availability"
                            ? availability_classes
                            : []),
                        ...(type === "worker_availability"
                            ? worker_availability_classes
                            : []),
                        ...(type === "worker_view" ? worker_view_classes : []),
                    )}
                    animate
                    onTap={() => {
                        if (type === "edit") {
                            if (selected_user) {
                                if (!scheduled) {
                                    shiftMutation.mutate({
                                        shift: {
                                            uuid: crypto.randomUUID(),
                                            day: day,
                                            sec_start: sec_start,
                                            sec_end: sec_end,
                                            assignee: selected_user.uuid,
                                            history: [],
                                        },
                                        isScheduled: false,
                                        schedule_uuid: schedule_uuid,
                                    });
                                } else {
                                    shiftMutation.mutate({
                                        shift: relevant_shifts.find(
                                            (s) =>
                                                s.assignee ===
                                                selected_user.uuid,
                                        )!,
                                        isScheduled: true,
                                        schedule_uuid: schedule_uuid,
                                    });
                                }
                            }
                        } else if (type === "availability") {
                            // In availability mode, show popup with available users.
                            setSelectedUsers(
                                new Set(
                                    getAvailableUsers(
                                        schedule_uuid,
                                        users,
                                        day,
                                        sec_start,
                                        sec_end,
                                    ).map((u) => u.uuid),
                                ),
                            );
                            setSelectedShifts(
                                new Set(`${day},${sec_start},${sec_end}`),
                            );
                        } else if (type === "view" || type === "worker_view") {
                            if (isShiftSelected) {
                                setSelectedUsers(new Set());
                                setSelectedShifts(new Set(["0,0,0"]));
                            } else {
                                // Selecting all users in this shift
                                setSelectedUsers(new Set(assignees));
                                setSelectedShifts(
                                    new Set([`${day},${sec_start},${sec_end}`]),
                                );
                            }
                        }
                    }}
                    whileTap={{
                        scale: 0.98,
                    }}
                >
                    {(type === "edit" ||
                        type === "view" ||
                        type === "worker_view") &&
                        assignees.map((assignee) => {
                            const u = users.find((u) => u.uuid === assignee);
                            if (!u) {
                                if (type === "worker_view") {
                                    return <div className="min-h-4" />;
                                } else {
                                    return (
                                        <div
                                            className={clsx(
                                                "w-full h-full",
                                                "flex flex-row",
                                                "items-center justify-center",
                                                "text-danger-800",
                                                "text-sm",
                                            )}
                                            title={assignee}
                                        >
                                            Unknown User
                                        </div>
                                    );
                                }
                            }
                            if (type === "edit") {
                                const hierarchical_roles = getUserRoleHierarchy(
                                    u,
                                    roles,
                                );
                                const hierarchical_color =
                                    hierarchical_roles[0].color;
                                return (
                                    <Button
                                        key={assignee}
                                        className={clsx(
                                            "bg-default-300 px-3",
                                            "justify-items-center sm:w-auto",
                                            "rounded-full",
                                            selected_user
                                                ? "cursor-not-allowed"
                                                : "",
                                        )}
                                        onPress={() => {
                                            // Don't open the popup if a user is
                                            // selected, because a selected user
                                            // means we are assigning shifts
                                            if (!selected_user) {
                                                setIsOpen(true);
                                                setStatUser(u);
                                            }
                                        }}
                                        size="sm"
                                        title={assignee}
                                    >
                                        <div
                                            className={clsx(
                                                "inline-flex outline-none",
                                                "items-center justify-center",
                                                "gap-2 rounded-xl",
                                            )}
                                        >
                                            {u.name}
                                            <span
                                                style={{
                                                    backgroundColor:
                                                        hierarchical_color,
                                                }}
                                                className="size-2 rounded-full"
                                            ></span>
                                        </div>
                                    </Button>
                                );
                            } else if (type === "worker_view") {
                                return (
                                    <div
                                        key={u.uuid}
                                        className={clsx(
                                            "w-full h-full",
                                            "flex flex-row",
                                            "items-center justify-center",
                                            "text-default-800",
                                            "text-[9px] lg:text-xs text-center",
                                        )}
                                    >
                                        {u.name}
                                    </div>
                                );
                            } else if (type === "view") {
                                return (
                                    <div
                                        key={u.uuid}
                                        className={clsx(
                                            "w-full h-full",
                                            "flex flex-row",
                                            "items-center justify-center",
                                            "text-default-800",
                                            " text-center",
                                            firstNamesOnly
                                                ? "text-xs lg:text-sm"
                                                : "text-[9px] lg:text-xs",
                                        )}
                                    >
                                        {firstNamesOnly
                                            ? u.name.split(" ")[0]
                                            : u.name}
                                    </div>
                                );
                            }
                        })}
                    {type === "availability" && (
                        <div
                            className={clsx(
                                `w-full flex`,
                                "items-center justify-center",
                                available
                                    ? "text-default-300"
                                    : "text-default-500",
                            )}
                            style={{
                                // Keep same vertical height when switching modes
                                height:
                                    32 * assignees.length +
                                    4 * (assignees.length - 1),
                            }}
                        >
                            {`${availableUsers.length}/${users.length}`}
                        </div>
                    )}
                    {type === "worker_availability" && (
                        <div
                            className="min-h-[28px]"
                            style={{
                                // Keep same vertical height when switching modes
                                height:
                                    16 * assignees.length +
                                    2 * (assignees.length - 1),
                            }}
                        ></div>
                    )}
                    {assignees.length === 0 &&
                        (type == "edit" ||
                            type === "view" ||
                            type === "worker_view") && (
                            <div
                                className={clsx(
                                    "w-full h-[32px] text-sm",
                                    "flex flex-row",
                                    "items-center justify-center",
                                    available
                                        ? "text-default-200"
                                        : "text-default-400",
                                )}
                                style={{
                                    transition: "color 0.15s ease",
                                }}
                            >
                                {type === "view"
                                    ? "No shift"
                                    : type === "worker_view"
                                      ? ""
                                      : "Unassigned"}
                            </div>
                        )}
                </motion.div>
            </PopoverTrigger>
            <PopoverContent>
                <WorkerInfo
                    worker={statUser}
                    roles={roles}
                    shifts={shifts}
                    schedule_uuid={schedule_uuid}
                />
            </PopoverContent>
        </Popover>
    );
}
