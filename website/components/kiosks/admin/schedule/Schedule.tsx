import { Card, Selection, Table, TableRow } from "@heroui/react";
import { TConfig } from "common/config";
import { TSchedule } from "common/schedule";
import Shift from "./Shift";
import { SHIFT_DAY } from "../../../../../common/shift";
import { TUser, TUserRole, UserUUID } from "common/user";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { useCallback, useEffect, useState, useMemo } from "react";
import { motion } from "motion/react";
import axios from "axios";

const toggleWorkerAvailability = async ({
    user_uuid,
    availabilityChange,
    selectedShifts,
}: {
    user_uuid: string;
    isSelf?: boolean;
    availabilityChange: boolean;
    selectedShifts: {
        day: SHIFT_DAY;
        sec_start: number;
        sec_end: number;
    }[];
}) => {
    if (availabilityChange) {
        // Add the user's availability
        return (
            await axios.patch<TUser>(
                `/api/v3/user/${user_uuid}/availability/add/batch`,
                {
                    selectedShifts: selectedShifts,
                },
            )
        ).data;
    } else {
        // Remove the user's availability
        return (
            await axios.patch<TUser>(
                `/api/v3/user/${user_uuid}/availability/remove/batch`,
                {
                    selectedShifts: selectedShifts,
                },
            )
        ).data;
    }
};

export default function Schedule({
    schedule,
    users,
    roles,
    config,
    isLoading,
    selectedUser,
    setSelectedUsers = () => {},
    selectedShifts = new Set(),
    setSelectedShifts,
    type = "view",
    hideMissingShifts = false,
}: {
    schedule: TSchedule | undefined;
    users: TUser[];
    roles: TUserRole[];
    config: TConfig;
    isLoading: boolean;
    selectedUser?: TUser;
    setSelectedUsers?: (users: Selection) => void;
    selectedShifts?: Set<string>;
    setSelectedShifts?: (shifts: Set<string>) => void;
    type?:
        | "view"
        | "edit"
        | "availability"
        | "worker_availability"
        | "worker_view";
    hideMissingShifts?: boolean;
}) {
    if (!schedule) {
        // New schedule
        return (
            <Card className="w-full grow p-10" shadow="sm">
                <div className="flex h-full w-full flex-col items-center justify-center gap-4">
                    Please create a new schedule.
                </div>
            </Card>
        );
    }
    const queryClient = useQueryClient();

    const availabilityMutation = useMutation({
        mutationFn: toggleWorkerAvailability,
        onSuccess: (result: TUser) => {
            queryClient.setQueryData(["user", result.uuid], result);
            queryClient.setQueryData(["user"], (old?: TUser[]) =>
                (old ?? []).map((u) => (u.uuid === result.uuid ? result : u)),
            );

            // Naively assume worker availability is updating self, since that
            // is the only current use of the availability modal.
            // TODO: Update later to add a isSelf parameter?
            queryClient.setQueryData(["user", "self"], result);
        },
    });

    const numIntervals = Math.floor(
        (schedule.daily_close_time - schedule.daily_open_time) /
            config.schedule.increment_sec,
    );

    const days = config.schedule.days_open ?? [0, 1, 2, 3, 4, 5, 6];

    const [dragging, setDragging] = useState(false);
    const [availableShifts, setAvailableShifts] = useState<
        {
            day: SHIFT_DAY;
            sec_start: number;
            sec_end: number;
        }[]
    >([]);

    const availableShiftsSet = useMemo<Set<string>>(() => {
        return new Set(
            availableShifts.map(
                ({ day, sec_start, sec_end }) =>
                    `${day},${sec_start},${sec_end}`,
            ),
        );
    }, [availableShifts]);

    const [availabilityChange, setAvailabilityChange] =
        useState<boolean>(false);

    const handleDragEnd = () => {
        if (selectedUser) {
            availabilityMutation.mutate({
                user_uuid: selectedUser.uuid,
                availabilityChange: availabilityChange,
                selectedShifts: availableShifts,
            });
        }
        setAvailableShifts([]);
    };

    const handleKeyPress = useCallback((event: KeyboardEvent) => {
        if (event.key === "Escape") {
            // Clear selected
            setSelectedUsers(new Set());
            setSelectedShifts ? setSelectedShifts(new Set()) : null;
        }
    }, []);

    useEffect(() => {
        // attach the event listener
        document.addEventListener("keydown", handleKeyPress);

        // remove the event listener
        return () => {
            document.removeEventListener("keydown", handleKeyPress);
        };
    }, [handleKeyPress]);

    return (
        <Card className="w-full grow p-5 pt-1 overflow-auto h-full" shadow="sm">
            <table
                className={clsx(
                    "h-full w-full items-center justify-center",
                    "border-separate border-spacing-1",
                    type === "worker_availability" ? "table-fixed" : "",
                )}
            >
                <tbody>
                    {/* TODO: Think about adding tap to clear selection */}
                    <tr key="header">
                        <td
                            key="space"
                            className="w-[3.7rem] sm:w-16 lg:w-[4.2rem]"
                        ></td>
                        {days.map((day) => (
                            <th
                                key={`day-${day}`}
                                className={clsx(
                                    "text-default-600 lg:text-sm",
                                    "text-xs py-1 lg:min-w-15 capitalize",
                                )}
                            >
                                <div
                                    className={clsx(
                                        "flex w-full align-text-bottom",
                                        "justify-center",
                                        type !== "worker_availability" &&
                                            "min-w-[72px]",
                                    )}
                                >
                                    <span className="sm:hidden">
                                        {type === "worker_availability"
                                            ? SHIFT_DAY[day]
                                                  .toLowerCase()
                                                  .slice(0, 2)
                                            : SHIFT_DAY[day].toLowerCase()}
                                    </span>
                                    <span className="hidden sm:block">
                                        {SHIFT_DAY[day].toLowerCase()}
                                    </span>
                                </div>
                            </th>
                        ))}
                    </tr>
                    {[...Array(numIntervals)].map((_, i) => {
                        const row_start_sec =
                            schedule.daily_open_time +
                            i * config.schedule.increment_sec;
                        const row_end_sec =
                            schedule.daily_open_time +
                            (i + 1) * config.schedule.increment_sec;
                        const row_start_time = new Date(
                            0,
                            0,
                            0,
                            0,
                            0,
                            row_start_sec,
                        );
                        const row_end_time = new Date(
                            0,
                            0,
                            0,
                            0,
                            0,
                            row_end_sec,
                        );
                        const row_start_str = row_start_time.toLocaleTimeString(
                            "en-US",
                            {
                                hour: "numeric",
                                minute: "numeric",
                                hour12: true,
                            },
                        );
                        const row_end_str = row_end_time.toLocaleTimeString(
                            "en-US",
                            {
                                hour: "numeric",
                                minute: "numeric",
                                hour12: true,
                            },
                        );
                        // Rows
                        return (
                            <tr key={`interval-${i}`} className="gap-2 p-1">
                                <td
                                    className={clsx(
                                        "flex flex-col items-start",
                                        "justify-end text-default-600",
                                        "-my-3 h-full justify-between",
                                        "text-xs lg:text-sm text-right",
                                        "whitespace-nowrap mr-1",
                                        // "min-w-16 lg:min-w-20",
                                    )}
                                    key={`shift-time-${i}`}
                                >
                                    <span className="w-full">
                                        {row_start_str}
                                    </span>
                                    <span className="-mb-5 w-full">
                                        {i === numIntervals - 1 && row_end_str}
                                    </span>
                                </td>
                                {
                                    // Column
                                    days.map((day) => (
                                        <td key={`shift-${day}-${i}`}>
                                            <motion.div
                                                onTapStart={() => {
                                                    if (
                                                        type ===
                                                        "worker_availability"
                                                    ) {
                                                        setDragging(true);
                                                            const available = selectedUser
                                                                ? selectedUser.work_schedules
                                                                    ?.find((a) => a.schedule == schedule.uuid)
                                                                    ?.days.some(
                                                                        (record) =>
                                                                            record.day === day &&
                                                                            record.availability.some(
                                                                                (time) =>
                                                                                    time.sec_start <= row_start_sec &&
                                                                                    time.sec_end >= row_end_sec,
                                                                            ),
                                                                    )
                                                                : false;
                                                        setAvailabilityChange(
                                                            !available,
                                                        );
                                                        if (selectedUser) {
                                                            setAvailableShifts((prev) => [
                                                                    ...prev, {
                                                                        day: day,
                                                                        sec_start: row_start_sec,
                                                                        sec_end: row_end_sec,
                                                                    }],
                                                            );
                                                        }
                                                    }
                                                }}
                                                onTapCancel={() => {
                                                    if (
                                                        type ===
                                                        "worker_availability"
                                                    ) {
                                                        setDragging(false);
                                                        handleDragEnd();
                                                    }
                                                }}
                                                onTap={() => {
                                                    if (
                                                        type ===
                                                        "worker_availability"
                                                    ) {
                                                        setDragging(false);
                                                        if (selectedUser) {
                                                            const available = selectedUser
                                                                ? selectedUser.work_schedules
                                                                    ?.find((a) => a.schedule == schedule.uuid)
                                                                    ?.days.some(
                                                                        (record) =>
                                                                            record.day === day &&
                                                                            record.availability.some(
                                                                                (time) =>
                                                                                    time.sec_start <= row_start_sec &&
                                                                                    time.sec_end >= row_end_sec,
                                                                            ),
                                                                    )
                                                                : false;
                                                            setAvailabilityChange(
                                                            !available,
                                                        );
                                                        if (selectedUser) {
                                                            setAvailableShifts((prev) => [
                                                                    ...prev, {
                                                                        day: day,
                                                                        sec_start: row_start_sec,
                                                                        sec_end: row_end_sec,
                                                                    }],
                                                                );
                                                        }
                                                        handleDragEnd();
                                                        }
                                                    }
                                                }}
                                                onMouseOver={
                                                    type ===
                                                        "worker_availability" &&
                                                    !!selectedUser &&
                                                    dragging
                                                        ? () => {
                                                              setAvailableShifts(
                                                                  (prev) => [
                                                                      ...prev,
                                                                      {
                                                                          day: day,
                                                                          sec_start:
                                                                              row_start_sec,
                                                                          sec_end:
                                                                              row_end_sec,
                                                                      },
                                                                  ],
                                                              );
                                                          }
                                                        : undefined
                                                }
                                            >
                                                <Shift
                                                    schedule_uuid={
                                                        schedule.uuid
                                                    }
                                                    shifts={schedule.shifts}
                                                    users={users}
                                                    roles={roles}
                                                    day={day}
                                                    sec_start={row_start_sec}
                                                    sec_end={row_end_sec}
                                                    selected_user={selectedUser}
                                                    setSelectedUsers={
                                                        setSelectedUsers
                                                    }
                                                    type={type}
                                                    selectedShifts={
                                                        type ===
                                                        "worker_availability"
                                                            ? availableShiftsSet
                                                            : selectedShifts
                                                    }
                                                    setSelectedShifts={
                                                        setSelectedShifts
                                                    }
                                                    dragging={dragging}
                                                    setDragging={setDragging}
                                                    firstNamesOnly={
                                                        config.schedule
                                                            .first_names_only
                                                    }
                                                    availabilityChange={availabilityChange}
                                                />
                                            </motion.div>
                                        </td>
                                    ))
                                }
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </Card>
    );
}
