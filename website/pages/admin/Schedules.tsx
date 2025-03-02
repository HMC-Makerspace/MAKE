import { TSchedule } from "common/schedule";
import AdminLayout from "../../layouts/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { TConfig } from "common/config";

import Schedule from "../../components/kiosks/admin/schedule/Schedule";
import { Spinner } from "@heroui/react";
import { TUser } from "common/user";

export default function SchedulePage() {
    const { data: schedules, isLoading: schedulesLoading } = useQuery<
        TSchedule[]
    >({
        queryKey: ["schedule"],
        refetchOnWindowFocus: false,
    });

    const { data: config, isLoading: configLoading } = useQuery<TConfig>({
        queryKey: ["config"],
        refetchOnWindowFocus: false,
    });

    const { data: users, isLoading: usersLoading } = useQuery<TUser[]>({
        queryKey: ["user"],
        refetchOnWindowFocus: false,
    });

    if (
        schedules === undefined ||
        config === undefined ||
        users === undefined ||
        schedulesLoading ||
        configLoading ||
        usersLoading
    )
        return (
            <div className="w-full h-full justify-center align-middle">
                <Spinner />
            </div>
        );

    console.log(schedules, config);

    return (
        <AdminLayout pageHref="/admin/schedule">
            <Schedule
                schedule={schedules[0] ? schedules[0] : null}
                config={config}
                users={users}
                isLoading={false}
                editable
            />
        </AdminLayout>
    );
}
