import { TSchedule } from "common/schedule";
import AdminLayout from "../../layouts/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { Spinner, Card, Button } from "@heroui/react";
import { TUserRole } from "common/user";
import Machine from "../../components/kiosks/admin/machines/Machine";
import { TCertification } from "common/certification";
import { TMachine, MACHINE_EDIT_LEVEL } from "../../../common/machine";
import Area from "../../components/kiosks/admin/areas/Area";
import clsx from "clsx";
import { TArea } from "common/area";
import {
    EyeIcon,
    PencilSquareIcon,
    PlusIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";

export default function MachinesPage() {
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

    const [preview, setPreview] = useState(false);

    if (
        machines === undefined ||
        roles === undefined ||
        certifications === undefined ||
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

    return (
        <AdminLayout pageHref="/admin/machines">
            <div className="h-full overflow-auto flex flex-col gap-3">
                <div
                    className={clsx(
                        "bg-default-100 p-3 rounded-lg",
                        "flex gap-4 items-center",
                    )}
                >
                    <div className="flex-1 mr-auto"></div>
                    <span className="flex justify-center flex-1 text-xl text-default-700 font-bold">
                        Machine Editor
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
                <div
                    className={clsx(
                        "w-full min-h-fit overflow-auto",
                        "gap-4 grid grid-cols-1",
                        "md:grid-cols-2 3xl:grid-cols-3",
                    )}
                >
                    {machines.map((machine) => (
                        <Machine
                            key={machine.uuid}
                            machine={machine}
                            certifications={certifications}
                            roles={roles}
                            editable={
                                preview
                                    ? MACHINE_EDIT_LEVEL.STATIC
                                    : MACHINE_EDIT_LEVEL.FULL
                            }
                        />
                    ))}
                    <Button
                        className={clsx(
                            "w-full h-full min-h-fit p-2",
                            machines.length % 2 === 0 && "col-span-full",
                        )}
                        color="default"
                        variant="bordered"
                    >
                        <PlusIcon className="size-6" />
                    </Button>
                </div>
            </div>
        </AdminLayout>
    );
}
