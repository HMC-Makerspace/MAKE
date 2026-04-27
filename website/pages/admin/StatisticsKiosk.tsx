import AdminLayout from "../../layouts/AdminLayout";
import StatisticsDisplay from "../../components/kiosks/admin/statistics/StatisticsDisplay";
import { useQuery } from "@tanstack/react-query";
import { TInventoryItem } from "../../../common/inventory";
import { TUser, TUserRole } from "../../../common/user";
import { TCheckout } from "../../../common/checkout";
import { TRestockRequest } from "../../../common/restock";
import { Spinner } from "@heroui/react";
import { TArea } from "common/area";
import { TCertification } from "common/certification";

//the kiosk's job is just to fetch the data needed from the server using useQuery
//and display a loading circle when any of the data needed isn't ready
//it doesn't actually display anything itself besides the loading circle
//the display component is what loads the graphs
export default function StatisticsKiosk() {
    //fetches the inventory data from the server
    //react automatically manages this data.
    //we use const here to declare a variable that can't be reassigned
    const { data: inventory, isLoading: inventoryLoading } = useQuery<
        TInventoryItem[]
    >({
        queryKey: ["inventory"],
        refetchOnWindowFocus: false, //don't fetch again just because user switched tabs
    });

    //fetches the user data from the server
    const { data: users, isLoading: usersLoading } = useQuery<TUser[]>({
        queryKey: ["user"],
        refetchOnWindowFocus: false,
    });

    //fetches checkout data from the server
    const { data: checkouts, isLoading: checkoutsLoading } = useQuery<
        TCheckout[]
    >({
        queryKey: ["checkout"],
        refetchOnWindowFocus: false,
    });

    //fetches the user role data which is used to display role names
    //in CheckoutsByRole instead of their raw UUIDs
    const { data: roles, isLoading: rolesLoading } = useQuery<TUserRole[]>({
        queryKey: ["user", "role"],
        refetchOnWindowFocus: false,
    });

    const { data: restocks, isLoading: restocksLoading } = useQuery<TRestockRequest[]>({
        queryKey: ["restock"],
        refetchOnWindowFocus: false,
    });
    //fetches area data
    const { data: areas, isLoading: areasLoading } = useQuery<TArea[]>({
        queryKey: ["area"],
        refetchOnWindowFocus: false,
    });

    //fetches certification data
    const { data: certs, isLoading: certsLoading } = useQuery<TCertification[]>({
        queryKey: ["certification"],
        refetchOnWindowFocus: false,
    });

    //displays a centered spinner if any of the four queries are still loading.
    //also checks if any of the data is undefined
    if (
        inventory === undefined ||
        users === undefined ||
        checkouts === undefined ||
        roles === undefined ||
        restocks == undefined
        areas === undefined ||
        certs === undefined
    ) {
        return (
            <div className="w-full h-screen flex justify-center py-auto">
                <Spinner />
            </div>
        );
    }

    //once all data has been quieried, render the page inside the admin nav wrapper
    //and passes all data down to StatisticsDisplay to be displayed
    return (
        <AdminLayout pageHref="/admin/statistics">
            <StatisticsDisplay
                inventory={inventory}
                users={users}
                checkouts={checkouts}
                roles={roles}
                restocks={restocks}
                areas={areas}
                certs={certs}
            />
        </AdminLayout>
    );
}
