import clsx from "clsx";
import { TShift } from "common/shift";
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
    selectedUser = null,
    setSelectedUsers = () => {},
    type = "view",
    selectedShift = [0, 0, 0],
    setSelectedShift = () => {},
    setSelectedSchedules = () => {},
}: {
    schedule_uuid: UUID;
    shifts: TShift[];
    users: TUser[];
    roles: TUserRole[];
    day: number;
    sec_start: number;
    sec_end: number;
    selectedUser?: UserUUID | null;
    setSelectedUsers?: (users: Selection) => void;
    type?: "view" | "edit" | "availability" | "worker";
    selectedShift?: number[];
    setSelectedShift?: (day_start_end: number[]) => void;
    setSelectedSchedules?: (schedules: Selection) => void;
}) {
    const queryClient = useQueryClient();

    const shiftMutation = useMutation({
        mutationFn: toggleUserShift,
        onSuccess: (result: TSchedule) => {
            queryClient.setQueryData(["schedule", schedule_uuid], result);
            queryClient.setQueryData(["schedule"], (old: TSchedule[]) =>
                old.map((sche) => (sche.uuid === result.uuid ? result : sche)),
            );
            // setSelectedSchedules(new Set([schedule_uuid]));
        },
        onError: (error) => {
            console.log(error);
        },
    });

    // TODO: Make edit availability work
    // const availabilityMutation = useMutation({
    //     mutationFn:
    // })

    const relevant_shifts = shifts.filter(
        (shift) =>
            shift.day === day &&
            shift.sec_start <= sec_start &&
            shift.sec_end >= sec_end,
    );

    const assignees = relevant_shifts.map((shift) => shift.assignee);

    const scheduled = selectedUser && assignees.includes(selectedUser);

    const selected_user = selectedUser
        ? users.find((u) => u.uuid === selectedUser)
        : null;

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
                  selectedUser && !scheduled
                      ? "cursor-cell"
                      : selectedUser && "cursor-not-allowed",
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
                        type === "worker" && available && "bg-primary-300",
                        type === "availability" &&
                            available &&
                            "bg-success-300",
                        type === "availability" &&
                            !available &&
                            availabilityColors[availabilityColorIndex],
                    )}
                    animate
                    style={{
                        transition: "background-color 0.15s ease",
                    }}
                    onDragOver={
                        type === "worker"
                            ? () => {
                                  // TODO: do stuff
                              }
                            : undefined
                    }
                    onTap={() => {
                        if (type === "edit") {
                            if (selectedUser) {
                                if (!scheduled) {
                                    shiftMutation.mutate({
                                        shift: {
                                            uuid: crypto.randomUUID(),
                                            day: day,
                                            sec_start: sec_start,
                                            sec_end: sec_end,
                                            assignee: selectedUser,
                                            history: [],
                                        },
                                        isScheduled: false,
                                        schedule_uuid: schedule_uuid,
                                    });
                                } else {
                                    shiftMutation.mutate({
                                        shift: relevant_shifts.find(
                                            (s) => s.assignee === selectedUser,
                                        )!,
                                        isScheduled: true,
                                        schedule_uuid: schedule_uuid,
                                    });
                                }
                            }
                        } else if (type === "availability") {
                            // In availability mode, show popup with available users.
                            // setSelectedUsers(
                            //     new Set(
                            //         getAvailableUsers(
                            //             schedule_uuid,
                            //             users,
                            //             day,
                            //             sec_start,
                            //             sec_end,
                            //         ).map((u) => u.uuid),
                            //     ),
                            // );
                        } else if (type === "view") {
                            if (isShiftSelected) {
                                setSelectedUsers(new Set());
                                setSelectedShift([0, 0, 0]);
                            } else {
                                // Selecting all users in this shift
                                setSelectedUsers(new Set(assignees));
                                setSelectedShift([day, sec_start, sec_end]);
                            }
                        } else {
                            // Update availability at this time
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
                                            selectedUser
                                                ? "cursor-not-allowed"
                                                : "",
                                        )}
                                        onPress={() => {
                                            setIsOpen(true);
                                            setStatUser(u);
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
                        <div className="flex flex-row gap-1">
                            <span
                                className={clsx(
                                    "font-bold",
                                    statUserShiftStatusColor,
                                )}
                            >
                                {statUserScheduledShifts}
                            </span>
                            <span>scheduled shifts</span>
                        </div>
                        <div className="flex flex-row gap-1">
                            <span>Requested shift range:</span>
                            <span className="font-semibold text-primary-300">
                                {statUserMinRequestedShifts ?? "?"}
                            </span>
                            <span className="font-thin">-</span>
                            <span className="font-semibold text-primary-300">
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
