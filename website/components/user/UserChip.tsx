import { useQuery } from "@tanstack/react-query";
import { TUser, TUserRole } from "common/user";
import {
    Button,
    Popover,
    PopoverContent,
    PopoverTrigger,
    User,
} from "@heroui/react";
import clsx from "clsx";
import UserInfo from "../kiosks/admin/users/UserInfo";
import { API_SCOPE } from "../../../common/global";
import { verifyScopes } from "../../utils";
import { AxiosError } from "axios";

export function UserChip({
    user_uuid,
    user,
    roles: propRoles,
    className,
    classNames = {
        wrapper: "items-center sm:items-start",
        name: "max-w-[130px] text-ellipsis overflow-hidden",
        description: "max-w-[130px] text-ellipsis overflow-hidden",
    },
    size = "lg",
    color = "default",
    popoverPlacement = "top",
    onClick = () => {},
}: {
    user_uuid: string;
    user?: TUser;
    roles?: TUserRole[];
    /** The classes to add to the button wrapper */
    className?: string;
    /** The classnames applied to the internal HeroUI User Object slots */
    classNames?: {
        base?: string;
        name?: string;
        description?: string;
        wrapper?: string;
    };
    /** The size of the user */
    size?: "sm" | "md" | "lg";
    /** The color of the user's button */
    color?:
        | "default"
        | "primary"
        | "secondary"
        | "success"
        | "warning"
        | "danger";
    popoverPlacement?:
        | "top"
        | "bottom"
        | "right"
        | "left"
        | "top-start"
        | "top-end"
        | "bottom-start"
        | "bottom-end"
        | "left-start"
        | "left-end"
        | "right-start"
        | "right-end";
    /** A function to run when the user is clicked, which accepts the user's uuid */
    onClick?: (uuid: string) => void;
}) {
    const query = useQuery<TUser, AxiosError>({
        queryKey: ["user", user_uuid],
        enabled: !!user_uuid && !user,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        retry: false,
    });

    const { data: queriedRoles, isLoading: rolesLoading } = useQuery<
        TUserRole[]
    >({
        queryKey: ["user", user_uuid, "roles"],
        enabled: !propRoles,
        refetchOnWindowFocus: false,
        retry: false,
    });

    const user_data = user ? user : query.data;
    const roles = propRoles || queriedRoles;

    const name =
        user_data?.name ??
        (query.isLoading ? "Loading..." : query.isError ? "ERROR" : "Unknown");
    const description =
        user_data?.email ??
        (query.isLoading
            ? "Loading..."
            : query.isError
              ? query.error.message
              : "Unknown");

    return (
        <Popover placement={popoverPlacement}>
            <PopoverTrigger>
                <Button
                    className={clsx(
                        "justify-items-center px-3 bg-default-300",
                        className,
                    )}
                    color={color}
                    onPress={() => onClick(user_uuid)}
                    size={size}
                >
                    {size === "lg" ? (
                        <User
                            name={name}
                            description={description}
                            classNames={classNames}
                            avatarProps={{
                                className: "hidden sm:block",
                            }}
                        />
                    ) : size === "md" ? (
                        <User
                            name={name}
                            classNames={classNames}
                            avatarProps={{
                                size: "sm",
                            }}
                        />
                    ) : (
                        <div
                            className={clsx(
                                "inline-flex outline-none",
                                "items-center justify-center",
                                "gap-2 rounded-xl",
                                classNames?.base,
                            )}
                        >
                            {name}
                        </div>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-2 xl:min-w-[20vw] xl:max-w-[30vw]">
                {user_data && roles && (
                    <UserInfo
                        user={user_data}
                        roles={roles}
                        isLoading={rolesLoading}
                        unknownPlaceholders
                    />
                )}
            </PopoverContent>
        </Popover>
    );
}
