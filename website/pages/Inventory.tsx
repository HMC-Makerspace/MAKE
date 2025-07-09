import { useQuery } from "@tanstack/react-query";
import InventoryTable from "../components/kiosks/admin/inventory/InventoryTable";
import DefaultLayout from "../layouts/Default";
import { TUserRole } from "common/user";
import { TCertification } from "common/certification";
import { TInventoryItem } from "common/inventory";
import { Skeleton } from "@heroui/react";

export default function InventoryPage() {
    const { data: inventory, isLoading: inventoryLoading } = useQuery<
        TInventoryItem[]
    >({
        queryKey: ["inventory", "public"],
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });
    const { data: roles, isLoading: rolesLoading } = useQuery<TUserRole[]>({
        queryKey: ["user", "role"],
        refetchOnWindowFocus: false,
        refetchOnMount: false,
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

    const isLoading =
        inventoryLoading || rolesLoading || certsLoading || areasLoading;

    return (
        <DefaultLayout className="px-8 py-0" pageHref="/inventory">
            {inventory && roles && certs && areas && (
                <InventoryTable
                    inventory={inventory}
                    roles={roles}
                    certifications={certs}
                    areas={areas}
                    selectedKeys={new Set()}
                    onSelectionChange={() => {}}
                    isLoading={isLoading}
                />
            )}
        </DefaultLayout>
    );
}
