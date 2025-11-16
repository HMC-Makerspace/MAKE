import AdminLayout from "../../layouts/AdminLayout";
import RestockTable from "../../components/kiosks/admin/restock/RestockTable";
import { useQuery } from "@tanstack/react-query";
import { TRestockRequest } from "../../../common/restock";
import { TArea } from "common/area";
import { TCertification } from "common/certification";
import { TInventoryItem } from "../../../common/inventory";
import { TUser } from "common/user";
import { TUserRole } from "common/user";
import { Spinner } from "@heroui/react";

export default function RestockKiosk() {
    // getting restock data
    const {
        data: restocks,
        isLoading: restocksLoading,
        isError,
    } = useQuery<TRestockRequest[]>({
        queryKey: ["restock"],
        refetchOnWindowFocus: false,
    });

    const { data: inventory, isLoading: inventoryLoading } = useQuery<
        TInventoryItem[]
    >({
        queryKey: ["inventory"],
        refetchOnWindowFocus: false,
    });

    const { data: areas, isLoading: areasLoading } = useQuery<TArea[]>({
        queryKey: ["area"],
        refetchOnWindowFocus: false,
    });

    const { data: users, isLoading: usersLoading } = useQuery<
        TUser[]
    >({
        queryKey: ["user"],
        refetchOnWindowFocus: false,
    });

    const { data: certs, isLoading: certsLoading } = useQuery<TCertification[]>(
        {
            queryKey: ["certification"],
            refetchOnWindowFocus: false,
        },
    );

    const isLoading = inventoryLoading || areasLoading || usersLoading || restocksLoading || certsLoading;


    if (
        !inventory ||
        !restocks ||
        !certs ||
        !areas ||
        !users ||
        inventoryLoading ||
        restocksLoading ||
        certsLoading ||
        areasLoading || 
        usersLoading
    ) {
        return (
            <div className="w-full h-screen flex justify-center py-auto">
                <Spinner />
            </div>
        );
    }

    return (
        <AdminLayout pageHref={"/admin/restocks"}>
            {isError ? (
                <div className="font-bold text-xl text-danger-400 text-center">
                    Error loading restock data
                </div>
            ) : (
                <RestockTable
                    restocks={restocks ?? []}
                    inventory={inventory ?? []}
                    users={users ?? []}
                    areas={areas ?? []}
                    certs={certs ?? []}
                    isLoading={isLoading}
                />
            )}
        </AdminLayout>
    );
}
