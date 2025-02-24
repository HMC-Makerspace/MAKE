import { Card, Table, TableRow } from "@heroui/react";
import { TConfig } from "common/config";
import { TSchedule } from "common/schedule";
import Shift from "./Shift";
import { SHIFT_DAY } from "common/shift";

export default function Schedule({
    schedule,
    config,
    isLoading,
    editable,
}: {
    schedule: TSchedule | null;
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
        <Card className="w-full grow p-10" shadow="sm">
            {/* <Table className="h-full w-full items-center justify-center gap-2">
                
            </Table> */}
            <table className="h-full w-full items-center justify-center gap-2">
                {[...Array(numIntervals)].map((_, i) => {
                    const row_start_sec =
                        schedule.daily_open_time +
                        i * config.schedule.increment_sec;
                    const row_end_sec =
                        schedule.daily_open_time +
                        (i + 1) * config.schedule.increment_sec;
                    const row_start = new Date(0, 0, 0, 0, 0, row_start_sec);
                    const row_end = new Date(0, 0, 0, 0, 0, row_end_sec);
                    const row_start_str = row_start.toLocaleTimeString(
                        "en-US",
                        {
                            hour: "numeric",
                            minute: "numeric",
                            hour12: true,
                        },
                    );
                    const row_end_str = row_end.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "numeric",
                        hour12: true,
                    });
                    // Rows
                    return (
                        <tr
                            key={`interval-${i}`}
                            className="flex flex-row gap-2 p-1"
                        >
                            <div className="flex flex-col text-default-600 text-sm justify-between py-1 min-w-20">
                                <span>{row_start_str}</span>
                                <span>{row_end_str}</span>
                            </div>
                            {
                                // Columns
                                days.map((day) => (
                                    <Shift
                                        key={`shift-${day}-${i}`}
                                        shifts={schedule.shifts}
                                        day={day}
                                        sec_start={row_start_sec}
                                        sec_end={row_end_sec}
                                    />
                                ))
                            }
                        </tr>
                    );
                })}
            </table>
        </Card>
    );
}
