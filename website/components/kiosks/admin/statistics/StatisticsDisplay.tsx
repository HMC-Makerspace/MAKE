import { TInventoryItem } from "common/inventory";
import { TUser, TUserRole } from "common/user";
import { TCheckout } from "common/checkout";
import { TRestockRequest } from "common/restock";
import UsersByDomain from "./UsersByDomain";
import CheckoutsByRole from "./CheckoutsByRole";
import TopCheckedOutItems from "./TopCheckedOutItems";
import CheckoutTrend from "./CheckoutTrend";
import CheckoutHeatmap from "./CheckoutHeatmap";
import CheckoutsByDay from "./CheckoutsByDay";
import RarelyCheckedOutItems from "./RarelyCheckedOutItems";
import TopRestockedItems from "./TopRestockedItems";
import { TCertification } from "common/certification";
import { TArea } from "common/area";

//this page receives all the data from StatisticsKiosk as props
//and its job is to lay out all the chart components on the page.
//it doesn't fetch anything for itself since kiosk already does that
//it generates the charts
export default function StatisticsDisplay({
    inventory,
    users,
    checkouts,
    roles,
    restocks,
    areas,
    certs,
}: {
    //these are the prop types which tells TypeScript exactly what
    //type of data this component expects to receive
    inventory: TInventoryItem[];
    users: TUser[];
    checkouts: TCheckout[];
    roles: TUserRole[];
    restocks: TRestockRequest[];
    areas: TArea[];
    certs: TCertification[];
}) {
    return (
        <div className="flex flex-col max-h-full overflow-auto w-full">
            <div className="flex flex-col content-center items-center">
                <h1 className="text-3xl font-bold text-foreground-900 mb-2">
                    Statistics
                </h1>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                <div className="col-span-1 lg:col-span-2">
                    <UsersByDomain users={users} />
                    {/* <CheckoutsByRole
                        users={users}
                        roles={roles}
                        checkouts={checkouts}
                    /> */}
                </div>

                <TopCheckedOutItems
                    checkouts={checkouts}
                    inventory={inventory}
                />
                <CheckoutsByDay checkouts={checkouts} />

                <RarelyCheckedOutItems
                    checkouts={checkouts}
                    inventory={inventory}
                    areas={areas}
                    certs={certs}
                />
                <TopRestockedItems restocks={restocks} inventory={inventory} />
                <div className="col-span-1 lg:col-span-2">
                    <CheckoutHeatmap checkouts={checkouts} />
                </div>
                <div className="col-span-1 lg:col-span-2">
                    <CheckoutTrend checkouts={checkouts} />
                </div>
            </div>
        </div>
    );
}
