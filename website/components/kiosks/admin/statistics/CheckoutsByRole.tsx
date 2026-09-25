import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Legend,
    Tooltip,
} from "recharts";
import { TUser } from "../../../../../common/user";

const ROLE_COLORS = ["#4A7C59", "#6B9D7A", "#8FBC8F", "#A8D5BA", "#C1E1C1"];

//defines function name, what data it accepts, and what for of data it takes in
export default function CheckoutsByRole({
    checkouts,
    users,
    roles,
}: {
    checkouts: any[];
    users: TUser[];
    roles: any[];
}) {
    // Create user lookup map
    const userMap = new Map(users.map((u) => [u.uuid, u]));

    // Count checkouts by user role
    const roleCounts: { [key: string]: number } = {};

    //uses an array function for each to get each user_uuid
    //checks if the user is false, or its role or false, or it has no role
    //mark the role as unknown
    checkouts.forEach((checkout) => {
        const user = userMap.get(checkout.user_uuid);
        if (!user || !user.active_roles || user.active_roles.length === 0) {
            roleCounts["Unknown"] = (roleCounts["Unknown"] || 0) + 1;
            return;
        }

        // Use first active role as the primary role
        const roleUuid = user.active_roles[0].role_uuid;
        roleCounts[roleUuid] = (roleCounts[roleUuid] || 0) + 1;
    });

    //sorts the data based on the most popular roles, based on values which is the number
    //of times that role does
    const data = Object.entries(roleCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    //display stuff yay!
    return (
        <div className="bg-default-100 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-2">Checkouts by User Role</h2>
            <p className="text-sm text-default-600 mb-4">
                Total Checkouts: {checkouts.length}
            </p>
            <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        labelLine={true}
                        label={(entry: any) =>
                            `${(entry.percent * 100).toFixed(1)}%`
                        }
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${entry.name}`}
                                fill={ROLE_COLORS[index % ROLE_COLORS.length]}
                            />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value: any) => [
                            `${value} checkouts`,
                            "Count",
                        ]}
                    />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}