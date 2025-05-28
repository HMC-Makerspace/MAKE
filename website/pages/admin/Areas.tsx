import { TSchedule } from "common/schedule";
import AdminLayout from "../../layouts/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { TConfig } from "common/config";
import ScheduleBuffer from "../../components/kiosks/admin/schedule/SchedulesBuffer";
import { Spinner, Selection, user } from "@heroui/react";
import { TUser, TUserRole, UserUUID } from "common/user";
import React, { useEffect } from "react";

export default function AreasPage() {
    const {
        data: schedules,
        isLoading: schedulesLoading,
        isPlaceholderData,
    } = useQuery<TSchedule[]>({
        queryKey: ["schedule"],
        refetchOnWindowFocus: false,
        placeholderData: [],
    });

    const { data: config, isLoading: configLoading } = useQuery<TConfig>({
        queryKey: ["config"],
        refetchOnWindowFocus: false,
    });

    const { data: users, isLoading: usersLoading } = useQuery<TUser[]>({
        queryKey: ["user"],
        refetchOnWindowFocus: false,
    });

    const { data: roles, isLoading: rolesLoading } = useQuery<TUserRole[]>({
        queryKey: ["user", "role"],
        refetchOnWindowFocus: false,
    });

    const [selectedUsers, setSelectedUsers] = React.useState<Selection>(
        new Set(),
    );

    const [selectedSchedules, setSelectedSchedules] = React.useState<Selection>(
        new Set(),
    );

    if (
        schedules === undefined ||
        config === undefined ||
        users === undefined ||
        roles === undefined ||
        schedulesLoading ||
        configLoading ||
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
                config={config}
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
