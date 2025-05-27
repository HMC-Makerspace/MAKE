import clsx from "clsx";
import { SHIFT_DAY, TShift } from "common/shift";
import { TUser, TUserRole, UserUUID } from "common/user";
import { motion } from "framer-motion";
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
} from "@heroui/react";
import React from "react";
import UserRole from "../../../user/UserRole";
import { getUserRoleHierarchy } from "../../../../utils";

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

const toggleWorkerAvailability = async ({
    user_uuid,
    isAvailable,
    day,
    sec_start,
    sec_end,
}: {
    user_uuid: string;
    isAvailable: boolean;
    day: SHIFT_DAY;
    sec_start: number;
    sec_end: number;
}) => {
    if (!isAvailable) {
        // Add the user's availability
        return (
            await axios.patch<TUser>(
                `/api/v3/user/${user_uuid}/availability/add`,
                {
                    day: day,
                    sec_start: sec_start,
                    sec_end: sec_end,
                },
            )
        ).data;
    } else {
        // Remove the user's availability
        return (
            await axios.patch<TUser>(
                `/api/v3/user/${user_uuid}/availability/remove`,
                {
                    day: day,
                    sec_start: sec_start,
                    sec_end: sec_end,
                },
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
    selectedShift = [0, 0, 0],
    setSelectedShift = () => {},
    dragging = false,
    setDragging = () => {},
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
    type?: "view" | "edit" | "availability" | "worker";
    selectedShift?: number[];
    setSelectedShift?: (day_start_end: number[]) => void;
    dragging: boolean;
    setDragging: (dragging: boolean) => void;
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
            console.log(error);
        },
    });

    // TODO: Make edit availability work
    const availabilityMutation = useMutation({
        mutationFn: toggleWorkerAvailability,
        onSuccess: (result: TUser) => {
            queryClient.setQueryData(["user", result.uuid], result);
            queryClient.setQueryData(["user"], (old: TUser[]) =>
                old.map((u) => (u.uuid === result.uuid ? result : u)),
            );
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

    const editor_classes =
        type === "edit"
            ? [
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
              ]
            : [];

    const isShiftSelected =
        selectedShift[0] === day &&
        selectedShift[1] === sec_start &&
        selectedShift[2] === sec_end;

    const [isOpen, setIsOpen] = React.useState(false);

    const [statUser, setStatUser] = React.useState<TUser | undefined>(
        undefined,
    );

    const statHierarchicalRoles = statUser
        ? getUserRoleHierarchy(statUser, roles)
        : [];

    const statUserScheduledShifts = shifts.filter(
        (s) => s.assignee === statUser?.uuid,
    ).length;

    const statUserMinRequestedShifts = statUser?.work_schedules?.find(
        (a) => a.schedule == schedule_uuid,
    )?.min_shift_count;
    const statUserMaxRequestedShifts = statUser?.work_schedules?.find(
        (a) => a.schedule == schedule_uuid,
    )?.max_shift_count;

    let statUserShiftStatusColor;
    if (!statUserMinRequestedShifts && !statUserMaxRequestedShifts) {
        statUserShiftStatusColor = "text-secondary-300";
    } else if (
        !statUserMinRequestedShifts ||
        statUserMinRequestedShifts <= statUserScheduledShifts
    ) {
        // Over min requested shift count

        if (
            !statUserMaxRequestedShifts ||
            statUserMaxRequestedShifts >= statUserScheduledShifts
        ) {
            // Over min and under max requested shift count, optimal
            statUserShiftStatusColor = "text-primary-300";
        } else {
            // Over min and also over max requested shift count, bad
            statUserShiftStatusColor = "text-danger-300";
        }
    } else {
        // Under min requested shift count
        if (
            !statUserMaxRequestedShifts ||
            statUserMaxRequestedShifts >= statUserScheduledShifts
        ) {
            // Under min and over max... something is wrong
            statUserShiftStatusColor = "text-warning-300";
        } else {
            // Under min and under max, not the end of the world
            statUserShiftStatusColor = "text-danger-200";
        }
    }

    // Only get available users if necessary
    const availableUsers =
        type === "availability"
            ? getAvailableUsers(schedule_uuid, users, day, sec_start, sec_end)
            : [];

    const availabilityColorIndex = Math.floor(
        (availableUsers.length / users.length) * availabilityColors.length,
    );

    const dragFn =
        type === "worker" && !!selected_user && dragging
            ? () => {
                  availabilityMutation.mutate({
                      user_uuid: selected_user.uuid,
                      isAvailable: !!available,
                      day: day,
                      sec_start: sec_start,
                      sec_end: sec_end,
                  });
              }
            : undefined;

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
                        "min-h-full w-full",
                        "flex flex-col",
                        "items-center justify-center",
                        "gap-1 p-2 rounded-md",
                        // If in view mode, cells are clickable to show info
                        type === "view" && "cursor-pointer",
                        type === "view" &&
                            !isShiftSelected &&
                            baseColors[colorIndex],
                        type === "view" && isShiftSelected && "bg-primary-300",
                        ...editor_classes,
                        type === "worker" && !available && "bg-default-300",
                        type === "worker" && available && "bg-success-400",
                        type === "availability" &&
                            available &&
                            "bg-success-300",
                        type === "availability" &&
                            !available &&
                            availabilityColors[availabilityColorIndex],
                        type === "availability" && isShiftSelected && "ring-2",
                    )}
                    animate
                    style={{
                        transition: "background-color 0.15s ease",
                    }}
                    onMouseOver={dragFn}
                    onTapStart={() => {
                        if (type === "worker") {
                            setDragging(true);
                            if (selected_user) {
                                availabilityMutation.mutate({
                                    user_uuid: selected_user.uuid,
                                    isAvailable: !!available,
                                    day: day,
                                    sec_start: sec_start,
                                    sec_end: sec_end,
                                });
                            }
                        }
                    }}
                    onTapCancel={() => setDragging(false)}
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
                            setSelectedShift([day, sec_start, sec_end]);
                        } else if (type === "view") {
                            if (isShiftSelected) {
                                setSelectedUsers(new Set());
                                setSelectedShift([0, 0, 0]);
                            } else {
                                // Selecting all users in this shift
                                setSelectedUsers(new Set(assignees));
                                setSelectedShift([day, sec_start, sec_end]);
                            }
                        } else if (type === "worker") {
                            setDragging(false);
                        }
                    }}
                    whileTap={{
                        scale: type !== "view" ? 0.98 : 1,
                    }}
                >
                    {type != "availability" &&
                        assignees.map((assignee) => {
                            const u = users.find((u) => u.uuid === assignee);
                            if (!u) {
                                return (
                                    <div
                                        className={clsx(
                                            "w-full h-full",
                                            "flex flex-row",
                                            "items-center justify-center",
                                            "text-danger-800",
                                            "text-sm",
                                        )}
                                    >
                                        Unknown User
                                    </div>
                                );
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
                            } else if (type === "view") {
                                return (
                                    <div
                                        className={clsx(
                                            "w-full h-full",
                                            "flex flex-row",
                                            "items-center justify-center",
                                            "text-default-800",
                                            "text-sm",
                                        )}
                                    >
                                        {u.name}
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
                    {assignees.length === 0 &&
                        (type === "edit" || type === "view") && (
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
                                {type === "view" ? "No shift" : "Unassigned"}
                            </div>
                        )}
                </motion.div>
            </PopoverTrigger>
            <PopoverContent>
                {statUser ? (
                    <div className="p-1 pr-0 flex flex-col gap-1">
                        <div className="flex flex-row gap-4 justify-between items-center">
                            <span key="name" className="font-bold text-medium">
                                {statUser.name}
                            </span>
                            <UserRole
                                role_uuid={statHierarchicalRoles[0].uuid}
                            />
                        </div>
                        <div
                            className={clsx(
                                "flex flex-row gap-1 font-bold",
                                statUserShiftStatusColor,
                            )}
                        >
                            {statUserScheduledShifts}
                            <span>scheduled shifts</span>
                        </div>
                        <div className="flex flex-row gap-1">
                            <span>Requested shift range:</span>
                            <span
                                className={clsx(
                                    "font-semibold",
                                    statUserMinRequestedShifts
                                        ? "text-primary-300"
                                        : "text-secondary-300",
                                )}
                            >
                                {statUserMinRequestedShifts ?? "?"}
                            </span>
                            <span className="font-thin">-</span>
                            <span
                                className={clsx(
                                    "font-semibold",
                                    statUserMaxRequestedShifts
                                        ? "text-primary-300"
                                        : "text-secondary-300",
                                )}
                            >
                                {statUserMaxRequestedShifts ?? "?"}
                            </span>
                        </div>
                    </div>
                ) : (
                    <></>
                )}
            </PopoverContent>
        </Popover>
    );
}
