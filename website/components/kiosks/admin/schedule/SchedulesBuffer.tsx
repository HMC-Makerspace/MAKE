import { TSchedule } from "common/schedule";
import { TConfig } from "common/config";
import Schedule from "./Schedule";
import ScheduleUserPicker from "./ScheduleUserPicker";
import ScheduleSelector from "./ScheduleSelector";
import { Selection, useDisclosure } from "@heroui/react";
import { TUser, TUserRole, UserUUID } from "common/user";
import React, { useCallback, useMemo, useState } from "react";

function getUserTotalAvailableTime(user: TUser, schedule?: TSchedule) {
    if (!schedule) {
        return 0;
    }
    return (
        user.work_schedules
            ?.find((s) => s.schedule === schedule.uuid)
            ?.days.reduce(
                (sum, day) =>
                    sum +
                    day.availability.reduce(
                        (day_sum, b) => day_sum + b.sec_end - b.sec_start,
                        0,
                    ),
                0,
            ) || 0
    );
}

/**
 * This buffer ensures that state parameters are defined
 */
export default function ScheduleBuffer({
    schedules,
    config,
    roles,
    users,
    setSelectedUsers,
    selectedSchedules,
    setSelectedSchedules,
    selectedUsers,
}: {
    schedules: TSchedule[];
    config: TConfig;
    roles: TUserRole[];
    users: TUser[];
    selectedSchedules: Selection;
    setSelectedSchedules: (schedules: Selection) => void;
    selectedUsers: Selection;
    setSelectedUsers: (users: Selection) => void;
}) {

    // Opposite of schedule mode is availability mode
    const [scheduleMode, setScheduleMode] = React.useState<
        "schedule" | "availability"
    >("schedule");

    const [availableUsers, setAvailableUsers] = useState<Selection>(new Set());

    // When in schedule mode, only one user can be selected at a time, so
    // we can just use the first. When in availability mode, selected users are available
    const selectedUserUUID =
        selectedUsers === "all" || scheduleMode === "availability"
            ? null
            : (Array.from(selectedUsers)[0] as UserUUID);

    const defaultSchedule = schedules.find((schedule) => schedule.active);

    const schedule =
        selectedSchedules === "all"
            ? defaultSchedule
            : (schedules.find(
                  (s) =>
                      s.uuid === (Array.from(selectedSchedules)[0] as string),
              ) ?? defaultSchedule);

    const filteredUsers = users.filter((user) =>
        user.active_roles.some((role) =>
            config.schedule.worker_roles.includes(role.role_uuid),
        ),
    );

    const sortedUsers = useMemo(
        () =>
            filteredUsers.toSorted(
                (a, b) =>
                    getUserTotalAvailableTime(a, schedule) -
                    getUserTotalAvailableTime(b, schedule),
            ),
        [filteredUsers, schedule],
    );

    const sortedAvailableUsers = useMemo(
        () =>
            sortedUsers.filter(
                (user) =>
                    availableUsers === "all" || availableUsers.has(user.uuid),
            ),
        [sortedUsers, availableUsers],
    );

    const selectedUser = selectedUserUUID
        ? users.find((u) => u.uuid === selectedUserUUID)
        : undefined;

    return (
        <div className="w-full h-full">
            <div className="w-full h-full flex flex-col lg:flex-row gap-4 overflow-auto">
                <div className="w-full flex flex-col overflow-auto gap-2">
                    <ScheduleSelector
                        schedules={schedules}
                        defaultSchedule={defaultSchedule}
                        selectedSchedule={schedule}
                        setSelectedSchedules={setSelectedSchedules}
                        config={config}
                        scheduleMode={scheduleMode}
                        setScheduleMode={setScheduleMode}
                        setSelectedUsers={setSelectedUsers}
                        key={schedule?.uuid}
                    />
                    <Schedule
                        schedule={schedule}
                        config={config}
                        users={filteredUsers}
                        roles={roles}
                        isLoading={false}
                        selectedUser={selectedUser}
                        setSelectedUsers={
                            scheduleMode === "schedule"
                                ? setSelectedUsers
                                : setAvailableUsers
                        }
                        type={
                            scheduleMode === "schedule"
                                ? "edit"
                                : "availability"
                        }
                    />
                </div>
                <ScheduleUserPicker
                    schedule_uuid={schedule?.uuid}
                    config={config}
                    users={
                        scheduleMode === "schedule"
                            ? sortedUsers
                            : sortedAvailableUsers
                    }
                    roles={roles}
                    isLoading={false}
                    selectedUsers={selectedUsers}
                    setSelectedUsers={
                        scheduleMode === "schedule"
                            ? setSelectedUsers
                            : setAvailableUsers
                    }
                    type={scheduleMode === "schedule" ? "edit" : "availability"}
                />
            </div>
        </div>
    );
}
