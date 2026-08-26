import { Card, Table, TableRow, Selection, cn } from "@heroui/react";
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
    type,
    className,
}: {
    schedule_uuid?: ScheduleUUID;
    users: TUser[];
    roles: TUserRole[];
    config: TConfig;
    isLoading: boolean;
    selectedUsers: Selection;
    setSelectedUsers: (selectedUsers: Selection) => void;
    type: "edit" | "availability";
    className: string;
}) {
    return (
        <Card
            className={cn(
                "w-full lg:w-1/3 p-5 overflow-auto h-2/3 lg:h-full",
                className,
            )}
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
                emptyContent={
                    type === "availability"
                        ? "Select a shift to see availability"
                        : "No users"
                }
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
