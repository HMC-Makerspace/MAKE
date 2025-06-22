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
    isRequired = false,
    selectionMode = "multiple",
    color = "primary",
    variant = "faded",
    className = "",
    classNames = {
        label: "pl-2",
        value: "text-default-500 min-h-[48px] content-center",
    },
    placeholder = "Select roles",
    label = "Roles",
    labelPlacement = "outside",
}: {
    roles?: TUserRole[]; // optional, if not passed will get internally
    selectedKeys?: UserRoleUUID[]; // optional, otherwise no selected roles
    onSelectionChange?: (selectedKeys: Selection) => void; // optional, otherwise no selection change handler
    defaultSelectedKeys?: UserRoleUUID[]; // optional, otherwise no default selected roles
    isLoading?: boolean; // only needed if roles is passed
    isDisabled?: boolean; // optional, defaults to false
    isRequired?: boolean; // optional, defaults to false
    selectionMode?: "single" | "multiple"; // optional, defaults to multiple selection
    color?:
        | "primary"
        | "default"
        | "secondary"
        | "success"
        | "warning"
        | "danger";
    variant?: "faded" | "flat" | "bordered" | "underlined";
    className?: string; // for the base className of the select, defaults to ""
    classNames?: {
        label?: string;
        value?: string;
    }; // optional, has default styles
    placeholder?: string; // optional, defaults to "Select roles"
    label?: string; // optional, defaults to "Roles"
    labelPlacement?: "outside" | "outside-left" | "inside"; // optional, defaults to "outside"
}) {
    const { data: queryRoles, isLoading: queryLoading } = useQuery<TUserRole[]>(
        {
            queryKey: ["user", "role"],
            refetchOnWindowFocus: false,
            enabled: !roles,
        },
    );
    const allRoles = roles || queryRoles || [];
    return (
        <Select
            items={allRoles ?? []}
            name="roles"
            selectedKeys={selectedKeys}
            onSelectionChange={onSelectionChange}
            defaultSelectedKeys={defaultSelectedKeys}
            isLoading={isLoading || queryLoading}
            isDisabled={isDisabled}
            isRequired={isRequired}
            selectionMode={selectionMode}
            isMultiline
            placeholder={placeholder}
            size="lg"
            variant={variant}
            color={color}
            label={label}
            labelPlacement={labelPlacement}
            classNames={classNames}
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
                                        role={allRoles.find(
                                            (r) =>
                                                r.uuid ==
                                                selected_role.data?.uuid,
                                        )}
                                    />
                                ),
                            )}
                        </div>
                    );
                }
            }}
        >
            {(role) => (
                <SelectItem key={role.uuid} textValue={role.title}>
                    <UserRole role_uuid={role.uuid} />
                </SelectItem>
            )}
        </Select>
    );
}
