import { Card, Selection, Table, TableRow } from "@heroui/react";
import { TConfig } from "common/config";
import { TSchedule } from "common/schedule";
import Shift from "./Shift";
import { SHIFT_DAY } from "../../../../../common/shift";
import { TUser, TUserRole, UserUUID } from "common/user";
import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

export default function Schedule({
    schedule,
    users,
    roles,
    config,
    isLoading,
    selectedUser = null,
    setSelectedUsers = () => {},
    selectedShifts = new Set(),
    setSelectedShifts,
    type = "view",
}: {
    schedule: TSchedule | undefined;
    users: TUser[];
    roles: TUserRole[];
    config: TConfig;
    isLoading: boolean;
    selectedUser?: UserUUID | null;
    setSelectedUsers?: (users: Selection) => void;
    selectedShifts?: Set<string>;
    setSelectedShifts?: (shifts: Set<string>) => void;
    type?: "view" | "edit" | "availability" | "worker";
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

    const numIntervals = Math.floor(
        (schedule.daily_close_time - schedule.daily_open_time) /
            config.schedule.increment_sec,
    );

    const days = config.schedule.days_open ?? [0, 1, 2, 3, 4, 5, 6];

    const [dragging, setDragging] = useState(false);

    const selected_user = selectedUser
        ? users.find((u) => u.uuid === selectedUser)
        : undefined;

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
                    type === "worker" ? "table-fixed" : "",
                )}
            >
                <tbody>
                    {/* TODO: Think about adding tap to clear selection */}
                    <tr key="header">
                        <td key="space" className="w-15"></td>
                        {days.map((day) => (
                            <th
                                key={`day-${day}`}
                                className={clsx(
                                    "text-default-600 lg:text-sm",
                                    "text-xs py-1 min-w-15 capitalize",
                                )}
                            >
                                <div className="flex justify-center w-full align-text-bottom">
                                    {SHIFT_DAY[day].toLowerCase()}
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
                                        "-my-3 h-full pr-3 justify-between",
                                        "text-xs lg:text-sm text-right",
                                        "min-w-16 lg:min-w-20",
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
                                            <Shift
                                                schedule_uuid={schedule.uuid}
                                                shifts={schedule.shifts}
                                                users={users}
                                                roles={roles}
                                                day={day}
                                                sec_start={row_start_sec}
                                                sec_end={row_end_sec}
                                                selected_user={selected_user}
                                                setSelectedUsers={
                                                    setSelectedUsers
                                                }
                                                type={type}
                                                selectedShifts={selectedShifts}
                                                setSelectedShifts={
                                                    setSelectedShifts
                                                }
                                                dragging={dragging}
                                                setDragging={setDragging}
                                            />
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
