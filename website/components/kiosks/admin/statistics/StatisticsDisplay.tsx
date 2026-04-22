import { TInventoryItem } from "common/inventory";
import { TUser, TUserRole } from "common/user";
import { TCheckout } from "common/checkout";
import UsersByCollege from "./UsersByCollege";
import CheckoutsByRole from "./CheckoutsByRole";
import TopCheckedOutItems from "./TopCheckedOutItems";
import CheckoutTrend from "./CheckoutTrend";
import CheckoutHeatmap from "./CheckoutHeatmap";
import CheckoutsByDay from "./CheckoutsByDay";
import RarelyCheckedOutItems from "./RarelyCheckedOutItems"


//this page receives all the data from StatisticsKiosk as props
//and its job is to lay out all the chart components on the page.
//it doesn't fetch anything for itself since kiosk already does that
//it generates the charts
export default function StatisticsDisplay({
    inventory,
    users,
    checkouts,
    roles,
}: {
    //these are the prop types which tells TypeScript exactly what
    //type of data this component expects to receive
    inventory: TInventoryItem[];
    users: TUser[];
    checkouts: TCheckout[];
    roles: TUserRole[];
}) {
    return (
        //flex flex-col allow the graphs stack vertically
        //overflow-auto adds a scrollbar
        <div className="flex flex-col max-h-full overflow-auto w-full">
            {/* this is just a display component that displays the title and subtitle */}
            <div className="flex flex-col content-center items-center">
                <h1 className="text-3xl font-bold text-foreground-900 mb-2">
                    Statistics
                </h1>
            </div>

            {/* this is the grid layout for displays
                On small screens: 1 column.
                On large screens: 2 columns side by side.
                gap-6 adds spacing between charts, p-6 adds padding around the grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                {/* displays UsersByCollege */}
                {/* how these work is that it passes data into the page and then displays it */}
                <UsersByCollege users={users} />

                {/* Removed: CheckoutsByRole */}

                {/* displays TopCheckedOutItems */}
                <TopCheckedOutItems
                    checkouts={checkouts}
                    inventory={inventory}
                />



                <CheckoutsByDay checkouts={checkouts} />

                <RarelyCheckedOutItems
                    checkouts={checkouts}
                    inventory={inventory}
                />
                
                <div className="col-span-1 lg:col-span-2">
                {/* displays CheckoutHeatmap */}
                <CheckoutHeatmap checkouts={checkouts} />
                </div>

                <div className="col-span-1 lg:col-span-2">
                    {/* Line chart — shows checkout volume over time */}
                    <CheckoutTrend checkouts={checkouts} />
                </div>
            </div>
        </div>
    );
}
