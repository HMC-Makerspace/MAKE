import clsx from "clsx";
import { TShift } from "common/shift";
import { TUser, UserUUID } from "common/user";
import { MAKEUser } from "../../../user/User";
import { animate, motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UUID } from "common/global";
import axios from "axios";
import { TSchedule } from "common/schedule";
import { Selection } from "@heroui/react";
import { useState } from "react";

const baseColors = [
    "bg-secondary-50",
    "bg-secondary-100",
    "bg-secondary-200",
    "bg-secondary-300",
    "bg-secondary-400",
];

const availableColors = [
    "bg-success-300",
    "bg-success-200",
    "bg-success-100",
    "bg-success-100",
    "bg-success-100",
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

export default function Shift({
    schedule_uuid,
    shifts,
    users,
    day,
    sec_start,
    sec_end,
    selectedUser = null,
    setSelectedUsers = () => {},
    type = "view",
    selectedShift = [0, 0, 0],
    setSelectedShift = () => {},
}: {
    schedule_uuid: UUID;
    shifts: TShift[];
    users: TUser[];
    day: number;
    sec_start: number;
    sec_end: number;
    selectedUser?: UserUUID | null;
    setSelectedUsers?: (users: Selection) => void;
    type?: "view" | "edit" | "availability";
    selectedShift?: number[];
    setSelectedShift?: (day_start_end: number[]) => void;
}) {
    const queryClient = useQueryClient();

    const shiftMutation = useMutation({
        mutationFn: toggleUserShift,
        onSuccess: (result: TSchedule) => {
            queryClient.setQueryData(["schedule", schedule_uuid], result);
            queryClient.setQueryData(["schedule"], (old: TSchedule[]) =>
                old.map((sche) => (sche.uuid === result.uuid ? result : sche)),
            );
        },
        onError: (error) => {
            // TODO: deal with
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
        ? selected_user.availability?.some(
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
                  !scheduled && available && availableColors[colorIndex],
                  !scheduled && !available && baseColors[colorIndex],
                  scheduled && available && "bg-primary-300",
                  scheduled && !available && "bg-danger-100",
              ]
            : [];

    const isShiftSelected =
        selectedShift[0] === day &&
        selectedShift[1] === sec_start &&
        selectedShift[2] === sec_end;

    return (
        <motion.div
            className={clsx(
                "min-h-full w-full",
                "flex flex-col",
                "items-center justify-center",
                "gap-1 p-2 rounded-md",
                // If in view mode, cells are clickable to show info
                type === "view" && "cursor-pointer",
                type === "view" && !isShiftSelected && baseColors[colorIndex],
                type === "view" && isShiftSelected && "bg-primary-300",
                ...editor_classes,
                type === "availability" && available && "bg-primary-300",
            )}
            animate
            style={{
                transition: "background-color 0.15s ease",
            }}
            onDragOver={
                type === "availability"
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
                    } else {
                        // No user selected,
                    }
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
            {assignees.map((assignee) => {
                const u = users.find((u) => u.uuid === assignee);
                if (!u) return;
                if (type === "edit") {
                    return (
                        <MAKEUser
                            key={assignee}
                            user_uuid={assignee}
                            user={u}
                            onClick={(uuid) => {
                                // Show popup
                            }}
                            size="sm"
                            className={clsx(
                                "rounded-full",
                                selectedUser ? "cursor-not-allowed" : "",
                            )}
                        />
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
            {assignees.length === 0 && type !== "availability" && (
                <div
                    className={clsx(
                        "w-full h-[32px] text-sm",
                        "flex flex-row",
                        "items-center justify-center",
                        available ? "text-default-200" : "text-default-400",
                    )}
                    style={{
                        transition: "color 0.15s ease",
                    }}
                >
                    {type === "edit" ? "Unassigned" : "No shift"}
                </div>
            )}
        </motion.div>
    );
}
