import { useQuery } from "@tanstack/react-query";
import DefaultLayout from "../layouts/Default";
import { TUserRole } from "common/user";
import { TCertification } from "common/certification";
import Area from "../components/kiosks/admin/areas/Area";
import { MACHINE_EDIT_LEVEL, TMachine } from "../../common/machine";
import { TArea } from "common/area";
import { API_SCOPE } from "../../common/global";
import { verifyScopes } from "../utils";
import { useScroll } from "../components/UseScroll";
import { Spinner } from "@heroui/react";
import { useRoles } from "../queries/useRoles";

export default function AreasPage() {
    const {
        data: scopes,
        isLoading: scopesLoading,
        isError: scopesError,
    } = useQuery<API_SCOPE[]>({
        queryKey: ["user", "self", "scopes"],
        refetchOnWindowFocus: false,
        retry: false,
    });
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
    const { data: roles, isLoading: rolesLoading } = useRoles({
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

    const canEditMachines =
        scopes && verifyScopes(scopes, [API_SCOPE.UPDATE_MACHINE_INSTANCES]);

    const { visibleContent, hasMoreContent, loaderRef, scrollerRef } =
        useScroll(areas ?? [], 2, 2);

    return (
        <DefaultLayout className="p-4 lg:p-8" pageHref="/areas">
            {areas && machines && roles && certs && (
                <main
                    className="h-full overflow-auto rounded-xl"
                    ref={scrollerRef}
                >
                    <div className="h-fit flex flex-col gap-8 rounded-xl">
                        {visibleContent.map((area) => (
                            <Area
                                key={area.uuid}
                                area={area}
                                machines={machines}
                                certifications={certs}
                                roles={roles}
                                editable={
                                    canEditMachines
                                        ? MACHINE_EDIT_LEVEL.STATUS_ALL
                                        : MACHINE_EDIT_LEVEL.BASIC
                                }
                            />
                        ))}
                        {hasMoreContent && (
                            <Spinner ref={loaderRef} color="primary" />
                        )}
                    </div>
                </main>
            )}
        </DefaultLayout>
    );
}
