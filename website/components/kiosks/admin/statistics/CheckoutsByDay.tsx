import { useMemo } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { TCheckout } from "common/checkout";

// maps .getDay() index (0–6) to a readable name
// .getDay() returns 0 for Sunday, 1 for Monday, etc.
enum Day {
    Sun = 0,
    Mon = 1,
    Tue = 2,
    Wed = 3,
    Thu = 4,
    Fri = 5,
    Sat = 6,
}

const ORDERED_DAYS = [
    Day.Sun,
    Day.Mon,
    Day.Tue,
    Day.Wed,
    Day.Thu,
    Day.Fri,
    Day.Sat,
];

export default function CheckoutsByDay({
    checkouts,
}: {
    checkouts: TCheckout[];
}) {
    const data = useMemo(() => {
        const dayCounts: { [key in Day]: number } = {
            [Day.Sun]: 0,
            [Day.Mon]: 0,
            [Day.Tue]: 0,
            [Day.Wed]: 0,
            [Day.Thu]: 0,
            [Day.Fri]: 0,
            [Day.Sat]: 0,
        };

        checkouts.forEach((checkout) => {
            const day: Day = new Date(checkout.timestamp_out * 1000).getDay();
            dayCounts[day] += 1;
        });

        return ORDERED_DAYS.map((dayEnum) => ({
            day: Day[dayEnum], 
            count: dayCounts[dayEnum],
        }));
    }, [checkouts]);

    //if there's no data yet, show a message instead of an empty chart
    if (data.length === 0) {
        return (
            <div className="bg-default-100 p-6 rounded-lg">
                <h2 className="text-xl font-bold mb-4">
                    Checkouts by Day of Week
                </h2>
                <p className="text-sm text-default-500">
                    No checkout data available.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-default-100 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Checkouts by Day of Week</h2>
            <ResponsiveContainer width="100%" height={350}>
                <BarChart
                    data={data}
                    margin={{ top: 10, right: 20, left: 20, bottom: 20 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                    <XAxis dataKey="day" />
                    <YAxis allowDecimals={false} />
                    <Tooltip
                        formatter={(value: any) => [
                            `${value} checkouts`,
                            "Count",
                        ]}
                    />
                    <Bar dataKey="count" fill="hsl(var(--heroui-primary))" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
