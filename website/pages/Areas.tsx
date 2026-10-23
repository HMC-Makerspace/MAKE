import { useQuery } from "@tanstack/react-query";
import DefaultLayout from "../layouts/Default";
import { TUserRole } from "common/user";
import { TCertification } from "common/certification";
import Area from "../components/kiosks/admin/areas/Area";
import { MACHINE_EDIT_LEVEL, TMachine } from "../../common/machine";
import { TArea } from "common/area";
import { API_SCOPE } from "../../common/global";
import { verifyScopes } from "../utils";
import { Spinner } from "@heroui/react";
import { useRoles } from "../queries/useRoles";
import { useVirtualizer } from "@tanstack/react-virtual";
import React from "react";
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

    const scrollerRef = React.useRef<HTMLElement | null>(null);
    const areasVirtualizer = useVirtualizer({
        count: areas?.length ?? 0,
        getScrollElement: () => scrollerRef.current,
        estimateSize: () => 600,
        overscan: 2,
        // getItemKey: (index) => areas?.[index]?.uuid ?? index,
        gap: 16,
    });

    const canEditMachines =
        scopes && verifyScopes(scopes, [API_SCOPE.UPDATE_MACHINE_INSTANCES]);

    return (
        <DefaultLayout className="p-4 lg:p-8" pageHref="/areas">
            {areas && machines && roles && certs && (
                <main
                    className="h-full overflow-auto rounded-xl relative"
                    ref={scrollerRef}
                >
                    <div
                        style={{
                            height: `${areasVirtualizer.getTotalSize()}px`,
                        }}
                        className="h-fit rounded-xl"
                    >
                        {areasVirtualizer
                            .getVirtualItems()
                            .map((virtualItem) => {
                                const area = areas![virtualItem.index];
                                return (
                                    <div
                                        key={area.uuid}
                                        data-index={virtualItem.index}
                                        ref={areasVirtualizer.measureElement}
                                        className="absolute top-0 left-0"
                                        style={{
                                            transform: `translateY(${virtualItem.start}px)`,
                                        }}
                                    >
                                        <Area
                                            area={area}
                                            machines={machines!}
                                            certifications={certs!}
                                            roles={roles!}
                                            editable={
                                                canEditMachines
                                                    ? MACHINE_EDIT_LEVEL.STATUS_ALL
                                                    : MACHINE_EDIT_LEVEL.BASIC
                                            }
                                        />
                                    </div>
                                );
                            })}
                    </div>
                </main>
            )}
        </DefaultLayout>
    );
}
