import { TSchedule } from "common/schedule";
import AdminLayout from "../../layouts/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { Spinner, Card } from "@heroui/react";
import { TUserRole } from "common/user";
import Machine from "../../components/kiosks/admin/machines/Machine";
import { TCertification } from "common/certification";
import { TMachine } from "common/machine";
import clsx from "clsx";

export default function MachinesPage() {
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
        <AdminLayout pageHref="/admin/schedule">
            <Card className="w-full h-full p-4" shadow="sm">
                <div
                    className={clsx(
                        "w-full h-fit overflow-auto",
                        "gap-4 grid grid-cols-1",
                        "md:grid-cols-2 xl:grid-cols-3",
                    )}
                >
                    <Machine
                        machine={machines[0]}
                        roles={roles}
                        certifications={certifications}
                        editable
                    ></Machine>
                    <Machine
                        machine={machines[0]}
                        roles={roles}
                        certifications={certifications}
                    ></Machine>
                    <Machine
                        machine={machines[0]}
                        roles={roles}
                        certifications={certifications}
                        editable
                    ></Machine>
                    <Machine
                        machine={machines[0]}
                        roles={roles}
                        certifications={certifications}
                        editable
                    ></Machine>
                    <Machine
                        machine={machines[0]}
                        roles={roles}
                        certifications={certifications}
                        editable
                    ></Machine>
                    <Machine
                        machine={machines[0]}
                        roles={roles}
                        certifications={certifications}
                        editable
                    ></Machine>
                </div>
            </Card>
        </AdminLayout>
    );
}
