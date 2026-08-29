import { TUserRole, TUserRoleLog, UserRoleUUID } from "common/user";
import { UserRoleChip } from "./UserRoleChip";
import { useMemo } from "react";
import { getUserRoleHierarchy } from "../../utils";

export function UserRoleList({
    size,
    roles,
    list,
    max = 3,
}: {
    size: "sm" | "md" | "lg";
    roles: TUserRole[];
    list: TUserRoleLog[] | UserRoleUUID[] | null | undefined;
    max?: number;
}) {
    const sortedRoles = useMemo(
        () => getUserRoleHierarchy(list, roles),
        [roles, list],
    );

    if (size === "sm") {
        return (
            <div className="flex flex-row flex-wrap gap-1 items-center">
                {sortedRoles.slice(0, max).map((role, index) => (
                    <UserRoleChip
                        role_uuid={role.uuid}
                        role={role}
                        key={role.uuid}
                        size="sm"
                        className="-ml-4"
                        zIndex={max - index}
                    />
                ))}
                {sortedRoles.length > max && (
                    <span className="pr-0.5">+{sortedRoles.length - max}</span>
                )}
            </div>
        );
    }

    if (size === "md") {
        return (
            <div className="flex flex-row flex-wrap gap-1">
                {sortedRoles.map((role) => (
                    <UserRoleChip
                        role_uuid={role.uuid}
                        role={role}
                        key={role.uuid}
                        size="sm"
                    />
                ))}
            </div>
        );
    }

    if (size === "lg") {
        return (
            <div className="flex flex-row flex-wrap gap-2">
                {sortedRoles.map((role) => (
                    <UserRoleChip
                        role_uuid={role.uuid}
                        role={role}
                        key={role.uuid}
                        size="md"
                    />
                ))}
            </div>
        );
    }
}
