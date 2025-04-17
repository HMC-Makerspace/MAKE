import { TSchedule } from "common/schedule";
import AdminLayout from "../../layouts/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { TConfig } from "common/config";

import Schedule from "../../components/kiosks/admin/schedule/Schedule";
import ScheduleUserPicker from "../../components/kiosks/admin/schedule/ScheduleUserPicker";
import ScheduleSelector from "../../components/kiosks/admin/schedule/ScheduleSelector";
import { Spinner, Selection } from "@heroui/react";
import { TUser, TUserRole, UserUUID } from "common/user";
import React, { useCallback, useEffect, useState } from "react";
import { UUID } from "common/global";

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

    const { data: roles, isLoading: rolesLoading } = useQuery<TUserRole[]>({
        queryKey: ["user", "role"],
        refetchOnWindowFocus: false,
    });

    const [selectedUsers, setSelectedUsers] = React.useState<Selection>(
        new Set(),
    );

    // Only can be one user selected at a time, so we can just use the first one
    // It's impossible for "all" to be selected
    const selectedUser =
        selectedUsers === "all"
            ? null
            : (Array.from(selectedUsers)[0] as UserUUID);

    const defaultSchedule = schedules?.find((schedule) => schedule.active);

    useEffect(() => {
        setSelectedSchedules(new Set(defaultSchedule?.uuid));
    }, [defaultSchedule]);

    const [selectedSchedules, setSelectedSchedules] = React.useState<Selection>(
        new Set(defaultSchedule?.uuid),
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

    const filteredUsers = users.filter((user) =>
        user.active_roles.some((role) =>
            config.schedule.schedulable_roles.includes(role.role_uuid),
        ),
    );

    const schedule =
        selectedSchedules === "all"
            ? defaultSchedule
            : schedules.find(
                  (s) =>
                      s.uuid === (Array.from(selectedSchedules)[0] as string),
              );

    return (
        <AdminLayout pageHref="/admin/schedule">
            <div className="w-full h-full flex flex-col lg:flex-row gap-4 overflow-auto">
                <div className="w-full flex flex-col overflow-auto gap-2">
                    <ScheduleSelector
                        schedules={schedules}
                        defaultSchedule={defaultSchedule}
                        selectedSchedule={schedule}
                        setSelectedSchedules={setSelectedSchedules}
                        key={schedule?.uuid}
                    />
                    <Schedule
                        // Check to make sure there is a current schedule
                        schedule={defaultSchedule}
                        config={config}
                        users={filteredUsers}
                        isLoading={false}
                        selectedUser={selectedUser}
                        setSelectedUsers={setSelectedUsers}
                        type="edit"
                    />
                </div>
                <ScheduleUserPicker
                    config={config}
                    users={filteredUsers}
                    roles={roles}
                    isLoading={false}
                    selectedUsers={selectedUsers}
                    setSelectedUsers={setSelectedUsers}
                />
            </div>
        </AdminLayout>
    );
}
