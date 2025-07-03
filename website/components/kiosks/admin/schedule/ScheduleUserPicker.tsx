import { Card, Table, TableRow, Selection } from "@heroui/react";
import { TConfig } from "common/config";
import { TUser, TUserRole } from "common/user";
import UsersTable from "../users/UsersTable";
import { ScheduleUUID } from "common/schedule";
import { TCertification } from "common/certification";

export default function ScheduleUserPicker({
    schedule_uuid,
    users,
    roles,
    config,
    isLoading,
    selectedUsers,
    setSelectedUsers,
}: {
    schedule_uuid?: ScheduleUUID;
    users: TUser[];
    roles: TUserRole[];
    config: TConfig;
    isLoading: boolean;
    selectedUsers: Selection;
    setSelectedUsers: (selectedUsers: Selection) => void;
}) {
    return (
        <Card
            className="w-full lg:w-1/3 p-5 overflow-auto h-2/3 lg:h-full"
            shadow="sm"
        >
            <UsersTable
                users={users}
                roles={roles}
                certs={[]}
                selectedKeys={selectedUsers}
                onSelectionChange={setSelectedUsers}
                isLoading={isLoading}
                onCreate={() => {}} // Not used
                fullHeader={false}
                // Only show columns relevant to hiring
                defaultColumns={["name", "active_roles", "shifts"]}
                extraColumns={[
                    {
                        name: "Shift #",
                        id: "shifts",
                    },
                ]}
                emptyContent="Select a shift to see availability"
                customColumnComponents={{
                    shifts: (u) =>
                        `${
                            u.work_schedules?.find(
                                (a) => a.schedule == schedule_uuid,
                            )?.min_shift_count || 0
                        } - ${
                            u.work_schedules?.find(
                                (a) => a.schedule == schedule_uuid,
                            )?.max_shift_count || 0
                        }`,
                }}
            />
        </Card>
    );
}
