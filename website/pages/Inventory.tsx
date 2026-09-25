import { useQuery } from "@tanstack/react-query";
import InventoryTable from "../components/kiosks/admin/inventory/InventoryTable";
import DefaultLayout from "../layouts/Default";
import { TUser, TUserRole } from "common/user";
import { TCertification } from "common/certification";
import { TInventoryItem } from "common/inventory";
import { TRestockRequest } from "common/restock";
import { API_SCOPE } from "../../common/global.ts";
import { verifyScopes } from "../utils.tsx";
import { Skeleton, Selection } from "@heroui/react";
import React from 'react';
import { useRoles } from "../queries/useRoles.tsx";
 

export default function InventoryPage() {
    const { data: inventory, isLoading: inventoryLoading } = useQuery<
        TInventoryItem[]
    >({
        queryKey: ["inventory", "public"],
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });
    const { data: requestingUser, isLoading: reqUserLoading } = useQuery<TUser>({
        queryKey: ["user", "self"],
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });
    const { data: roles, isLoading: rolesLoading } = useRoles({
        refetchOnMount: false,
    });
    const { data: restocks, isLoading: restocksLoading } = useQuery<
        TRestockRequest[]
    >({
        queryKey: ["restock"],
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        retry: false,
    });
    const { data: certs, isLoading: certsLoading } = useQuery<TCertification[]>(
        {
            queryKey: ["certification"],
            refetchOnWindowFocus: false,
            refetchOnMount: false,
        },
    );
    const { data: areas, isLoading: areasLoading } = useQuery<TInventoryItem[]>(
        {
            queryKey: ["area", "public"],
            refetchOnWindowFocus: false,
            refetchOnMount: false,
        },
    );
    const { data: scopes, isLoading: scopesLoading, isError: scopesError } = useQuery<API_SCOPE[]>(
        {
            queryKey: ["user", "self", "scopes"],
            refetchOnWindowFocus: false,
            retry: false,
        }
    );

    const [selectedItems, onSelectionChange] = React.useState<Selection>(
        new Set([""]),
    );

    const betterSelectionChange = (s: Selection) => {
        if (s === "all") {
            onSelectionChange(new Set([""]));
        } else {
            const keys = Array.from(s);
            onSelectionChange(new Set([keys[keys.length - 1]]));
        }
    };

    const isLoading =
        inventoryLoading || rolesLoading || certsLoading || areasLoading || reqUserLoading || scopesLoading;

    return (
        <DefaultLayout className="py-0 px-4 lg:px-8" pageHref="/inventory">
            {inventory && roles && certs && areas && (
                <InventoryTable
                    requestingUser={requestingUser}
                    scopes={scopes}
                    inventory={inventory}
                    roles={roles}
                    restocks={restocks ?? []}
                    certifications={certs}
                    areas={areas}
                    selectedKeys={selectedItems}
                    onSelectionChange={betterSelectionChange}
                    isLoading={isLoading}
                    emptyContent={
                        inventory.length === 0
                            ? "Please login to view all inventory items"
                            : undefined
                    }
                    multiSelect={false}
                />
            )}
        </DefaultLayout>
    );
}
