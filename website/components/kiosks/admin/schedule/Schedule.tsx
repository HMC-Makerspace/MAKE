import { Card, Table, TableRow } from "@heroui/react";
import { TConfig } from "common/config";
import { TSchedule } from "common/schedule";
import Shift from "./Shift";
import { SHIFT_DAY } from "common/shift";
import { TUser } from "common/user";
import clsx from "clsx";

export default function Schedule({
    schedule,
    users,
    config,
    isLoading,
    editable,
}: {
    schedule: TSchedule | null;
    users: TUser[];
    config: TConfig;
    isLoading: boolean;
    editable: boolean;
}) {
    if (schedule === null) {
        // New schedule
        return (
            <Card className="w-full grow p-10" shadow="sm">
                <div className="flex h-full w-full flex-col items-center justify-center gap-4">
                    New Schedule
                </div>
            </Card>
        );
    }

    const numIntervals = Math.floor(
        (schedule.daily_close_time - schedule.daily_open_time) /
            config.schedule.increment_sec,
    );

    const days = config.schedule.days_open ?? [0, 1, 2, 3, 4, 5, 6];

    return (
        <Card className="w-full grow p-10 overflow-auto h-full" shadow="sm">
            {/* <Table className="h-full w-full items-center justify-center gap-2">
                
            </Table> */}
            <table className="h-full w-full items-center justify-center border-separate border-spacing-1">
                <tbody>
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
                                        "text-default-600 text-sm",
                                        "py-1 min-w-15 h-full",
                                    )}
                                >
                                    {row_str}
                                </td>
                                {
                                    // Columns
                                    days.map((day) => (
                                        <td>
                                            <Shift
                                                key={`shift-${day}-${i}`}
                                                shifts={schedule.shifts}
                                                users={users}
                                                day={day}
                                                sec_start={row_start_sec}
                                                sec_end={row_end_sec}
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
