import { TSchedule } from "common/schedule";
import AdminLayout from "../../layouts/AdminLayout";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TConfig } from "common/config";
import ScheduleBuffer from "../../components/kiosks/admin/schedule/SchedulesBuffer";
import { Spinner, Selection, user, Button, useDisclosure, addToast } from "@heroui/react";
import { TUser, TUserRole, UserUUID } from "common/user";
import React, { useEffect, useState } from "react";
import { TArea } from "common/area";
import { TCertification } from "common/certification";
import { TMachine, MACHINE_EDIT_LEVEL } from "../../../common/machine";
import Area from "../../components/kiosks/admin/areas/Area";
import clsx from "clsx";
import {
    AdjustmentsHorizontalIcon,
    EyeIcon,
    PencilSquareIcon,
    PlusIcon,
} from "@heroicons/react/24/outline";
import axios from "axios";
import RearrangeAreasModal from "../../components/kiosks/admin/areas/RearrangeAreasModal";

const createEmptyArea = async () => {
    return (
        await axios.post<TArea>("/api/v3/area/", {
            area_obj: {
                uuid: crypto.randomUUID(),
                name: "New Area",
                visible_to: [], // Start areas as not visible
            },
        })
    ).data;
};

export default function AreasKiosk() {
    const { data: areas, isLoading: areasLoading } = useQuery<TArea[]>({
        queryKey: ["area"],
        refetchOnWindowFocus: false,
    });

    const { data: machines, isLoading: machinesLoading } = useQuery<TMachine[]>(
        {
            queryKey: ["machine"],
            refetchOnWindowFocus: false,
        },
    );

    const { data: roles, isLoading: rolesLoading } = useQuery<TUserRole[]>({
        queryKey: ["user", "role"],
        refetchOnWindowFocus: false,
    });

    const { data: certifications, isLoading: certificationsLoading } = useQuery<
        TCertification[]
    >({
        queryKey: ["certification"],
        refetchOnWindowFocus: false,
    });

    const queryClient = useQueryClient();
    const createMutation = useMutation({
        mutationFn: createEmptyArea,
        onSuccess: (obj: TArea) => {
            queryClient.setQueryData(["area", obj.uuid], obj);
            queryClient.setQueryData(["area"], (old: TArea[]) => {
                return [...old, obj];
            });
            addToast({
                title: `Successfully created area`,
                color: "success",
            });
        },
        onError: (error) => {
            alert(`Error: ${error.message}`);
        },
    });

    const [preview, setPreview] = useState(false);

    const {
        isOpen: rearrangeModal,
        onOpenChange: rearrangeModalOpenChange,
        onOpen: rearrangeModalOpen,
    } = useDisclosure();

    if (
        areas === undefined ||
        machines === undefined ||
        roles === undefined ||
        certifications === undefined ||
        areasLoading ||
        machinesLoading ||
        rolesLoading ||
        certificationsLoading
    ) {
        return (
            <div className="w-full h-screen flex justify-center py-auto">
                <Spinner />
            </div>
        );
    }

    // TODO: Add more engrained feature disables depending on user scopes

    return (
        <AdminLayout pageHref="/admin/areas">
            <div className="h-full overflow-auto flex flex-col gap-3">
                <div
                    className={clsx(
                        "bg-default-200 p-3 rounded-lg",
                        "flex gap-4 items-center",
                    )}
                >
                    <div className="flex-1 mr-auto">
                        <Button
                            variant="flat"
                            color="primary"
                            className="text-md"
                            startContent={
                                <AdjustmentsHorizontalIcon className="size-6" />
                            }
                            onPress={rearrangeModalOpen}
                        >
                            Rearrange
                        </Button>
                        <RearrangeAreasModal
                            areas={areas}
                            isOpen={rearrangeModal}
                            onOpenChange={rearrangeModalOpenChange}
                        />
                    </div>
                    <span className="flex justify-center flex-1 text-xl text-default-700 font-bold">
                        Area Editor
                    </span>
                    <div className="flex-1 ml-auto flex gap-3 items-center justify-end">
                        <span className="text-default-700 font-semibold">
                            {preview ? "Preview Mode" : "Edit Mode"}
                        </span>
                        <Button
                            isIconOnly
                            color="primary"
                            variant="bordered"
                            onPress={() => setPreview(!preview)}
                        >
                            {preview ? (
                                <EyeIcon className="size-6" />
                            ) : (
                                <PencilSquareIcon className="size-6" />
                            )}
                        </Button>
                    </div>
                </div>
                <div className="flex flex-col h-full gap-4 p-4 sm:p-0 overflow-auto">
                    {areas.map((area) => (
                        <Area
                            key={area.uuid}
                            area={area}
                            machines={machines}
                            certifications={certifications}
                            roles={roles}
                            editable={
                                preview
                                    ? MACHINE_EDIT_LEVEL.STATIC
                                    : MACHINE_EDIT_LEVEL.FULL
                            }
                        />
                    ))}
                    {!preview && (
                        <Button
                            className="w-full min-h-fit p-2"
                            color="default"
                            variant="bordered"
                            onPress={() => createMutation.mutate()}
                        >
                            <PlusIcon className="size-6" />
                        </Button>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
