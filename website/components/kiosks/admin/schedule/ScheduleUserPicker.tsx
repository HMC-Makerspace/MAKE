import { Card, Table, TableRow, Selection } from "@heroui/react";
import { TConfig } from "common/config";
import { TUser, TUserRole } from "common/user";
import UsersTable from "../users/UsersTable";

export default function ScheduleUserPicker({
    users,
    roles,
    config,
    isLoading,
    selectedUsers,
    setSelectedUsers,
}: {
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
                key={users.length}
                users={users}
                roles={roles}
                selectedKeys={selectedUsers}
                onSelectionChange={setSelectedUsers}
                isLoading={isLoading}
                onCreate={() => {}} // Not used
                fullHeader={false}
                // Only show columns relevant to hiring
                defaultColumns={["name", "active_roles"]}
            />
        </Card>
    );
}
