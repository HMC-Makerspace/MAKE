import { useQuery } from "@tanstack/react-query";
import InventoryTable from "../components/kiosks/admin/inventory/InventoryTable";
import DefaultLayout from "../layouts/Default";
import { TUserRole } from "common/user";
import { TCertification } from "common/certification";
import { TInventoryItem } from "common/inventory";
import { Skeleton } from "@heroui/react";
import Area from "../components/kiosks/admin/areas/Area";
import { MACHINE_EDIT_LEVEL, TMachine } from "../../common/machine";
import { TArea } from "common/area";

export default function AreasPage() {
    const { data: areas, isLoading: areasLoading } = useQuery<TArea[]>({
        queryKey: ["area", "public"],
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });
    const { data: machines, isLoading: machinesLoading } = useQuery<TMachine[]>(
        {
            queryKey: ["machine", "public"],
            refetchOnWindowFocus: false,
            refetchOnMount: false,
        },
    );
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

    const isLoading = areasLoading || rolesLoading || certsLoading;

    return (
        <DefaultLayout className="px-8 py-0" pageHref="/areas">
            {areas && machines && roles && certs && (
                <div className="flex flex-col h-full gap-8 p-4 sm:p-0 overflow-auto">
                    {areas.map((area) => (
                        <Area
                            key={area.uuid}
                            area={area}
                            machines={machines}
                            certifications={certs}
                            roles={roles}
                            editable={MACHINE_EDIT_LEVEL.BASIC}
                        />
                    ))}
                </div>
            )}
        </DefaultLayout>
    );
}
