import clsx from "clsx";
import { TCertification } from "common/certification";
import { TUser, TUserRole, UserUUID } from "common/user";
import { UserRoleSelect } from "../../../user/UserRoleSelect";
import { CertificationList } from "../certifications/CertificationList";

export default function UserInfo({
    user,
    roles,
    certs,
    className = "",
    size = "md",
    isLoading = false,
    unknownPlaceholders = false,
    endContent,
}: {
    user?: TUser;
    user_uuid?: UserUUID;
    roles: TUserRole[];
    certs?: TCertification[];
    className?: string;
    size?: "sm" | "md" | "lg";
    isLoading?: boolean;
    /* Whether placeholders should show as unknown */
    unknownPlaceholders?: boolean;
    endContent?: React.ReactNode;
}) {
    return (
        <div
            className={clsx(
                "w-full p-2 bg-default-100 rounded-lg gap-2",
                "flex flex-col min-w-[300px]",
                className,
            )}
        >
            <div className="w-full flex flex-row gap-2">
                <div
                    className={clsx(
                        "bg-default-200 p-2 h-fit",
                        "w-1/2 rounded-md text-center",
                        "xl:w-2/3 whitespace-nowrap overflow-x-auto",
                        user ? "text-default-700" : "text-default-400",
                        size === "sm"
                            ? "text-sm"
                            : size === "md"
                              ? "text-md"
                              : "text-lg",
                    )}
                >
                    {user?.name ||
                        (unknownPlaceholders ? "Unknown User" : "Name")}
                </div>
                <div
                    className={clsx(
                        "bg-default-200 p-2 h-fit",
                        "w-1/2 rounded-md text-center",
                        "xl:w-1/3 overflow-x-auto",
                        user ? "text-default-700" : "text-default-400",
                        size === "sm"
                            ? "text-sm"
                            : size === "md"
                              ? "text-md"
                              : "text-lg",
                    )}
                >
                    {user?.college_id || (unknownPlaceholders ? "No ID" : "ID")}
                </div>
            </div>
            <div
                className={clsx(
                    "bg-default-200 p-2 text-center min-h-fit",
                    "col-span-full rounded-md overflow-x-auto",
                    user ? "text-default-700" : "text-default-400",
                    size === "sm"
                        ? "text-sm"
                        : size === "md"
                          ? "text-md"
                          : "text-lg",
                )}
            >
                {user?.email || (unknownPlaceholders ? "No Email" : "Email")}
            </div>
            <UserRoleSelect
                roles={roles}
                defaultSelectedKeys={
                    user?.active_roles?.map((r) => r.role_uuid) || []
                }
                isLoading={isLoading}
                className="col-span-3"
                classNames={{
                    trigger:
                        !user ||
                        !user.active_roles ||
                        user.active_roles.length === 0
                            ? "px-0"
                            : "pl-2 pr-0 py-2",
                    value: clsx(
                        "text-default-400",
                        (!user ||
                            !user.active_roles ||
                            user.active_roles.length === 0) &&
                            "pl-2",
                    ),
                }}
                label=""
                placeholder={user ? "No active roles" : "Roles"}
                viewOnly
            />
            <CertificationList
                certifications={certs || []}
                list={user?.active_certificates}
                size="xl"
                placeholder={
                    unknownPlaceholders
                        ? "No active certifications"
                        : "Certifications"
                }
            />
            {endContent}
        </div>
    );
}
