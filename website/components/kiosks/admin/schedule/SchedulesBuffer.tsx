import { TSchedule } from "common/schedule";
import { TConfig } from "common/config";
import Schedule from "./Schedule";
import ScheduleUserPicker from "./ScheduleUserPicker";
import ScheduleSelector from "./ScheduleSelector";
import { Selection, useDisclosure } from "@heroui/react";
import { TUser, TUserRole, UserUUID } from "common/user";
import PopupAlert from "../../../PopupAlert";
import React from "react";

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
    // Only can be one user selected at a time, so we can just use the first one
    // It's impossible for "all" to be selected
    const selectedUser =
        selectedUsers === "all"
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

    const [popupMessage, setPopupMessage] = React.useState<string | undefined>(
        undefined,
    );
    const [popupType, setPopupType] = React.useState<
        "success" | "warning" | "danger"
    >("success");

    const filteredUsers = users.filter((user) =>
        user.active_roles.some((role) =>
            config.schedule.schedulable_roles.includes(role.role_uuid),
        ),
    );

    const sortedUsers = filteredUsers.toSorted(
        (a, b) =>
            getUserTotalAvailableTime(a, schedule) -
            getUserTotalAvailableTime(b, schedule),
    );

    // Opposite of schedule mode is availability mode
    const [scheduleMode, setScheduleMode] = React.useState<
        "schedule" | "availability"
    >("schedule");

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
                        onSuccess={(message) => {
                            setPopupMessage(message);
                            setPopupType("success");
                        }}
                        onError={(message) => {
                            setPopupMessage(message);
                            setPopupType("danger");
                        }}
                        key={schedule?.uuid}
                    />
                    <Schedule
                        schedule={schedule}
                        config={config}
                        users={filteredUsers}
                        roles={roles}
                        isLoading={false}
                        selectedUser={selectedUser}
                        setSelectedUsers={setSelectedUsers}
                        setSelectedSchedules={setSelectedSchedules}
                        type={
                            scheduleMode === "schedule"
                                ? "edit"
                                : "availability"
                        }
                    />
                </div>
                <ScheduleUserPicker
                    config={config}
                    users={sortedUsers}
                    roles={roles}
                    isLoading={false}
                    selectedUsers={selectedUsers}
                    setSelectedUsers={setSelectedUsers}
                />
            </div>
            <PopupAlert
                isOpen={!!popupMessage}
                onOpenChange={() => setPopupMessage(undefined)}
                color={popupType}
                description={popupMessage}
            />
        </div>
    );
}
