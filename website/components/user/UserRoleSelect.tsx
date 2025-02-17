import {
    Select,
    SelectedItemProps,
    Selection,
    SelectItem,
} from "@heroui/react";
import { TUserRole, UserRoleUUID } from "common/user";
import UserRole from "./UserRole";
import { useQuery } from "@tanstack/react-query";

export function UserRoleSelect({
    roles,
    selectedKeys,
    onSelectionChange = () => {},
    defaultSelectedKeys,
    isLoading,
    isDisabled = false,
    className = "",
}: {
    roles?: TUserRole[]; // optional, if not passed will get internally
    selectedKeys?: UserRoleUUID[]; // optional, otherwise no selected roles
    onSelectionChange?: (selectedKeys: Selection) => void; // optional, otherwise no selection change handler
    defaultSelectedKeys?: UserRoleUUID[]; // optional, otherwise no default selected roles
    isLoading?: boolean; // only needed if roles is passed
    isDisabled?: boolean; // optional, defaults to false
    className?: string; // for the base className of the select, defaults to ""
}) {
    const { data: queryRoles, isLoading: queryLoading } = useQuery<TUserRole[]>(
        {
            queryKey: ["user", "role"],
            refetchOnWindowFocus: false,
            enabled: !roles,
        },
    );
    roles = roles || queryRoles || [];
    return (
        <Select
            items={roles ?? []}
            name="roles"
            selectedKeys={selectedKeys}
            onSelectionChange={onSelectionChange}
            defaultSelectedKeys={defaultSelectedKeys}
            isLoading={isLoading || queryLoading}
            isDisabled={isDisabled}
            selectionMode="multiple"
            isMultiline
            placeholder="Select roles"
            size="lg"
            variant="faded"
            color="primary"
            label="Roles"
            labelPlacement="outside"
            classNames={{
                label: "pl-2",
                value: "text-default-500",
            }}
            // Base classes
            className={className}
            renderValue={(selectedKeys) => {
                if (selectedKeys.length === 0) {
                    return "";
                } else {
                    return (
                        <div className="flex flex-wrap gap-1 p-2">
                            {selectedKeys.map(
                                (
                                    selected_role: SelectedItemProps<TUserRole>,
                                ) => (
                                    <UserRole
                                        key={selected_role.data?.uuid}
                                        role_uuid={
                                            selected_role.data?.uuid || ""
                                        }
                                    />
                                ),
                            )}
                        </div>
                    );
                }
            }}
        >
            {(role) => (
                <SelectItem
                    key={role.uuid}
                    value={role.uuid}
                    textValue={role.title}
                >
                    <UserRole role_uuid={role.uuid} />
                </SelectItem>
            )}
        </Select>
    );
}
