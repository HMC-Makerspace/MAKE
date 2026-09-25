import { useMemo } from "react";
import { DateFormatter } from "@internationalized/date";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { TCheckout } from "common/checkout";
import { TConfig } from "common/config";
import { timestampToZonedDateTime } from "../../../../../website/utils";

export default function CheckoutTrend({
    checkouts,
    config,
}: {
    checkouts: TCheckout[];
    config?: TConfig;
}) {
    const data = useMemo(() => {
        const dayCounts: Record<string, { date: string; count: number }> = {};

        const dateFormatter =
            config?.schedule.locale &&
            new DateFormatter(config.schedule.locale, {
                month: "short",
                day: "numeric",
                year: "numeric",
            });

        checkouts.forEach((checkout) => {
            const zonedDate = timestampToZonedDateTime(
                checkout.timestamp_out,
                config?.schedule.timezone,
            );

            const dayKey = `${zonedDate.year}-${String(zonedDate.month).padStart(2, "0")}-${String(zonedDate.day).padStart(2, "0")}`;

            if (!dayCounts[dayKey]) {
                dayCounts[dayKey] = {
                    date: dateFormatter
                        ? dateFormatter.format(zonedDate.toDate())
                        : `${zonedDate.month}/${zonedDate.day}/${zonedDate.year}`,
                    count: 0,
                };
            }

            dayCounts[dayKey].count += 1;
        });

        const sortedKeys = Object.keys(dayCounts).sort();
        if (sortedKeys.length === 0) return [];

        const filled: { date: string; count: number }[] = [];
        const cursor = new Date(sortedKeys[0]);
        const end = new Date(sortedKeys[sortedKeys.length - 1]);

        while (cursor <= end) {
            const dayKey = cursor.toISOString().slice(0, 10); // "YYYY-MM-DD"

            if (dayCounts[dayKey]) {
                filled.push(dayCounts[dayKey]);
            } else {
                // Format the label the same way, but from a plain JS Date
                const label = dateFormatter
                    ? dateFormatter.format(new Date(cursor))
                    : `${cursor.getMonth() + 1}/${cursor.getDate()}/${cursor.getFullYear()}`;
                filled.push({ date: label, count: 0 });
            }

            cursor.setDate(cursor.getDate() + 1);
        }
        return filled;
    }, [checkouts, config?.schedule.locale, config?.schedule.timezone]);

    //just in case there is no data at all, display this
    if (data.length === 0) {
        return (
            <div className="bg-default-100 p-6 rounded-lg col-span-1">
                <h2 className="text-xl font-bold text-foreground-900 mb-4">
                    Checkout Trend
                </h2>
                <p className="text-sm text-default-500">
                    No checkout data available.
                </p>
            </div>
        );
    }

    //all this stuff is display stuff
    return (
        <div className="bg-default-100 p-6 rounded-lg col-span-1">
            <h2 className="text-xl font-bold text-foreground-900 mb-4">
                Checkout Trend
            </h2>
            <p className="text-sm text-default-500 mb-3">
                Daily checkout activity over the selected date range.
            </p>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart
                    data={data}
                    margin={{ top: 20, right: 30, left: -10, bottom: 10 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                    <XAxis
                        dataKey="date"
                        angle={-10}
                        textAnchor="end"
                        interval="preserveStartEnd"
                        tick={{ fontSize: 11 }}
                        height={45}
                    />
                    <YAxis
                        allowDecimals={false}
                        tickFormatter={(value) => Math.floor(value).toString()}
                    />

                    <Tooltip
                        formatter={(value: any) => [
                            `${value} checkouts`,
                            "Daily Checkouts",
                        ]}
                    />

                    <Line
                        type="monotone"
                        dataKey="count"
                        stroke="hsl(var(--heroui-primary))"
                        dot={false}
                        strokeWidth={2}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
