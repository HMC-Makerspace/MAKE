import { TSchedule } from "common/schedule";
import AdminLayout from "../../layouts/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { TConfig } from "common/config";

import Schedule from "../../components/kiosks/admin/schedule/Schedule";

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

    if (
        schedules === undefined ||
        config === undefined ||
        schedulesLoading ||
        configLoading
    )
        return <div>Loading...</div>;

    console.log(schedules, config);

    return (
        <AdminLayout pageHref="/admin/schedule">
            <Schedule
                schedule={schedules[0] ? schedules[0] : null}
                config={config}
                isLoading={false}
                editable
            />
        </AdminLayout>
    );
}
