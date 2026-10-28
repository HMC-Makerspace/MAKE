import { TSchedule } from "common/schedule";
import { useQuery } from "@tanstack/react-query";
import { Selection, Spinner } from "@heroui/react";
import { TUser } from "common/user";
import React from "react";
import { useRoles } from "../../queries/useRoles";
import AdminLayout from "../../layouts/AdminLayout";
import ScheduleBuffer from "../../components/kiosks/admin/schedule/SchedulesBuffer";

export default function ScheduleKiosk() {
    const {
        data: schedules,
        isLoading: schedulesLoading,
        isPlaceholderData,
    } = useQuery<TSchedule[]>({
        queryKey: ["schedule"],
        refetchOnWindowFocus: false,
        placeholderData: [],
    });

    const { data: users, isLoading: usersLoading } = useQuery<TUser[]>({
        queryKey: ["user"],
        refetchOnWindowFocus: false,
    });

    const { data: roles, isLoading: rolesLoading } = useRoles();

    const [selectedUsers, setSelectedUsers] = React.useState<Selection>(
        new Set(),
    );

    const [selectedSchedules, setSelectedSchedules] = React.useState<Selection>(
        new Set(),
    );

    if (
        schedules === undefined ||
        users === undefined ||
        roles === undefined ||
        schedulesLoading ||
        usersLoading ||
        rolesLoading
    ) {
        return (
            <div className="w-full h-screen flex justify-center py-auto">
                <Spinner />
            </div>
        );
    }

    return (
        <AdminLayout pageHref="/admin/schedule">
            <ScheduleBuffer
                schedules={schedules}
                roles={roles}
                users={users}
                setSelectedUsers={setSelectedUsers}
                selectedSchedules={selectedSchedules}
                setSelectedSchedules={setSelectedSchedules}
                selectedUsers={selectedUsers}
            />
        </AdminLayout>
    );
}
