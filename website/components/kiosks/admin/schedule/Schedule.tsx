import { Card, Selection, Table, TableRow } from "@heroui/react";
import { TConfig } from "common/config";
import { TSchedule } from "common/schedule";
import Shift from "./Shift";
import { SHIFT_DAY } from "../../../../../common/shift";
import { TUser, UserUUID } from "common/user";
import clsx from "clsx";
import { type } from "os";
import { useState } from "react";

export default function Schedule({
    schedule,
    users,
    config,
    isLoading,
    selectedUser = null,
    setSelectedUsers = () => {},
    type = "view",
}: {
    schedule: TSchedule | undefined;
    users: TUser[];
    config: TConfig;
    isLoading: boolean;
    selectedUser?: UserUUID | null;
    setSelectedUsers?: (users: Selection) => void;
    type?: "view" | "edit" | "availability";
}) {
    if (!schedule) {
        // New schedule
        return (
            <Card className="w-full grow p-10" shadow="sm">
                <div className="flex h-full w-full flex-col items-center justify-center gap-4">
                    Please
                </div>
            </Card>
        );
    }

    const numIntervals = Math.floor(
        (schedule.daily_close_time - schedule.daily_open_time) /
            config.schedule.increment_sec,
    );

    const days = config.schedule.days_open ?? [0, 1, 2, 3, 4, 5, 6];

    const [selectedShift, setSelectedShift] = useState<number[]>([0, 0, 0]);

    return (
        <Card className="w-full grow p-5 overflow-auto h-full" shadow="sm">
            <table
                className={clsx(
                    "h-full w-full items-center justify-center",
                    "border-separate border-spacing-1",
                    type == "availability" ? "table-fixed" : "",
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
                                    "text-default-600 text-sm",
                                    "py-1 min-w-15 capitalize",
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
                        const row_time = new Date(0, 0, 0, 0, 0, row_start_sec);
                        const row_str = row_time.toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "numeric",
                            hour12: true,
                        });
                        // Rows
                        return (
                            <tr key={`interval-${i}`} className="gap-2 p-1">
                                <td
                                    className={clsx(
                                        "flex flex-col justify-center",
                                        "items-end text-default-600 text-sm",
                                        "py-1 min-w-15 h-full pr-3",
                                    )}
                                    key={`shift-time-${i}`}
                                >
                                    {row_str}
                                </td>
                                {
                                    // Column
                                    days.map((day) => (
                                        <td key={`shift-${day}-${i}`}>
                                            <Shift
                                                schedule_uuid={schedule.uuid}
                                                shifts={schedule.shifts}
                                                users={users}
                                                day={day}
                                                sec_start={row_start_sec}
                                                sec_end={row_end_sec}
                                                selectedUser={selectedUser}
                                                setSelectedUsers={
                                                    setSelectedUsers
                                                }
                                                type={type}
                                                selectedShift={selectedShift}
                                                setSelectedShift={
                                                    setSelectedShift
                                                }
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
