import { Spinner } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { TCertification } from "common/certification";
import { TUser, TUserRole, UserUUID } from "common/user";
import { UserRoleSelect } from "../../../user/UserRoleSelect";
import { CertSelect } from "../certifications/CertSelect";
import CertificationTag from "../certifications/CertificationTag";

export default function UserInfo({
    user_uuid,
    user,
    roles,
    certs,
    className = "",
    size = "md",
    isLoading = false,
}: {
    user_uuid?: UserUUID;
    user?: TUser;
    roles?: TUserRole[];
    certs?: TCertification[];
    className?: string;
    size?: "sm" | "md" | "lg";
    isLoading?: boolean;
}) {
    const { data: queriedUser, isLoading: userLoading } = useQuery<TUser>({
        queryKey: ["user", user_uuid],
        refetchOnWindowFocus: false,
        enabled: !user && !!user_uuid,
        retry: false,
    });

    const { data: queriedRoles, isLoading: rolesLoading } = useQuery<
        TUserRole[]
    >({
        queryKey: ["user", user_uuid, "role"],
        refetchOnWindowFocus: false,
        enabled: !roles && !!user_uuid,
    });

    // const { data: queriedCerts } = useQuery<TCertification[]>({
    //     queryKey: ["certification"],
    //     refetchOnWindowFocus: false,
    //     enabled: !certs,
    // });

    const user_data = user || queriedUser;
    const role_data = roles || queriedRoles;
    // const cert_data = certs || queriedCerts;
    const loading = userLoading || rolesLoading || isLoading;

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
                        user_uuid ? "text-default-700" : "text-default-400",
                        size === "sm"
                            ? "text-sm"
                            : size === "md"
                              ? "text-md"
                              : "text-lg",
                    )}
                >
                    {user_data?.name || (user_uuid ? "Unknown User" : "Name")}
                </div>
                <div
                    className={clsx(
                        "bg-default-200 p-2 h-fit",
                        "w-1/2 rounded-md text-center",
                        "xl:w-1/3 overflow-x-auto",
                        user_uuid ? "text-default-700" : "text-default-400",
                        size === "sm"
                            ? "text-sm"
                            : size === "md"
                              ? "text-md"
                              : "text-lg",
                    )}
                >
                    {user_data?.college_id || (user_uuid ? "No ID" : "ID")}
                </div>
            </div>
            <div
                className={clsx(
                    "bg-default-200 p-2 text-center",
                    "col-span-full rounded-md overflow-x-auto",
                    user_uuid ? "text-default-700" : "text-default-400",
                    size === "sm"
                        ? "text-sm"
                        : size === "md"
                          ? "text-md"
                          : "text-lg",
                )}
            >
                {user_data?.email || (user_uuid ? "No Email" : "Email")}
            </div>
            <UserRoleSelect
                roles={role_data}
                key={user_uuid}
                defaultSelectedKeys={
                    user_data?.active_roles?.map((r) => r.role_uuid) || []
                }
                isLoading={loading}
                className="col-span-3"
                classNames={{
                    trigger: "px-0 placeholder",
                    value: clsx(
                        "text-default-400",
                        (!user_data?.active_roles ||
                            user_data.active_roles.length === 0) &&
                            "pl-2",
                    ),
                }}
                label=""
                placeholder={user_uuid ? "No active roles" : "Roles"}
                viewOnly
            />
            <div
                className={clsx(
                    "rounded-lg bg-default-100 border-2 border-default-200 p-2",
                    "col-span-3 flex flex-wrap gap-2",
                )}
            >
                {user_data?.active_certificates &&
                user_data.active_certificates.length > 0 ? (
                    user_data.active_certificates.map((c) => (
                        <CertificationTag
                            key={c.certification_uuid}
                            cert_uuid={c.certification_uuid}
                            certifications={certs}
                            level={c.level}
                        />
                    ))
                ) : (
                    <div className="text-default-400 text-center w-full">
                        {user_uuid
                            ? "No active certifications"
                            : "Certifications"}
                    </div>
                )}
            </div>
        </div>
    );
}
