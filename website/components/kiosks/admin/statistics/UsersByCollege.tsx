//important useMemo is basically telling a component to only
//regenerate when its data has been updated
//so basically there is memory for the component
import { useMemo } from "react";
//the following is each component of the rechart
//imported from recharts
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Legend,
    Tooltip,
} from "recharts";
import { TUser } from "../../../../../common/user";

//random colors that are assigned to each slice of the pie later on
const DOMAIN_COLORS = [
    "#4A7C59",
    "#6B9D7A",
    "#D97398",
    "#F2A900",
    "#4A90D9",
    "#8B5CF6",
    "#EC4899",
    "#14B8A6",
    "#F97316",
    "#EAB308",
];

//defines the component and what properties (basically arguments) it accepts
//{ users } pulls the users prop out of the props object
// : { users: TUser[] } tells TypeScript users must be an array of TUser objects
export default function UsersByCollege({ users }: { users: TUser[] }) {
    //THE FORM OF USERMEMO: tells it to cache this calculation so it only reruns when users changes
    //without it, all this processing will rerun on every render
    //"[users]" at the end is the dependency, only recompute if users changes
    const data = useMemo(() => {
        //like a dictionary in python, this maps domain names to how many users have that domain
        // after domainCounts we define the type of keys and values we want, strings and numbers respectively
        //after processing it might look like: { "xxx.edu": 42, "xxxxxx.edu": 15 }
        const domainCounts: { [key: string]: number } = {};

        //forEach loops through every user in the users array one at a time
        users.forEach((user) => {
            //user.email is something like "student@xxx.edu"
            //.split("@") cuts it into two pieces: ["student", "xxx.edu"]
            //[1] grabs the second piece which is "xxx.edu"
            //? checks to see if such exists, if it does: continue. if not: undefined
            //.toLowerCase() makes it lowercase so "XXX.EDU" and "xxx.edu" match
            //?? "unknown" is a fallback if there's no @ symbol in the email
            const domain = user.email.split("@")[1]?.toLowerCase() ?? "unknown";

            //if this domain already exists in domainCounts, add 1 to its count
            //if it doesn't exist yet (|| 0), start counting from 0 and add 1
            //e.g. first "xxx.edu" user is seen in the hashmap as { "xxx.edu": 1 }
            //if we see "xxx.edu" user again, we get { "xxx.edu": 2 }
            domainCounts[domain] = (domainCounts[domain] || 0) + 1;
        });

        //Object.entries converts the object into an array of pairs
        //e.g. { "xxx.edu": 42 } → [["xxx.edu", 42]]
        //.map reshapes each pair into { name: "xxx.edu", value: 42 }
        //which is the format Recharts needs to draw the chart
        //.sort orders by value descending so the biggest slice comes first
        return Object.entries(domainCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [users]);

    //now that we have our object that has our data sorted so we know what demain has how many users
    //we can start to display the pie chart
    return (
        <div className="bg-default-100 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-2">Users by Domain</h2>

            <p className="text-sm text-default-600 mb-4">
                Total Users: {users.length}
            </p>

            <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={(entry: any) =>
                            `${entry.name}: ${(entry.percent * 100).toFixed(1)}%`
                        }
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${entry.name}`}
                                fill={
                                    DOMAIN_COLORS[index % DOMAIN_COLORS.length]
                                }
                            />
                        ))}
                    </Pie>

                    <Tooltip
                        formatter={(value: any) => [`${value} users`, "Count"]}
                    />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
