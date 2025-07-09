import { useQuery } from "@tanstack/react-query";
import { TUser, TUserRole } from "common/user";
import {
    Button,
    Link,
    Popover,
    PopoverContent,
    PopoverTrigger,
    User,
} from "@heroui/react";
import clsx from "clsx";
import React from "react";
import UserInfo from "../kiosks/admin/users/UserInfo";
import { ThemeSwitcher } from "../ThemeSwitcher";
import { API_SCOPE } from "../../../common/global";
import { verifyScopes } from "../../utils";
import {
    ArrowLeftEndOnRectangleIcon,
    FingerPrintIcon,
} from "@heroicons/react/24/solid";

export function MAKEUser({
    user_uuid,
    user,
    className,
    classNames = {
        name: "max-w-[130px] text-ellipsis overflow-hidden",
        description: "max-w-[130px] text-ellipsis overflow-hidden",
    },
    // {
    //     description: "hidden sm:block",
    //     name: "hidden sm:block",
    // },
    size = "lg",
    color = "default",
    popoverPlacement = "top",
    onClick = () => {},
    defaultElement = (
        <Button
            as={Link}
            href="/login"
            color="default"
            variant="solid"
            className="hidden sm:flex"
        >
            Login
        </Button>
    ),
}: {
    user_uuid: string;
    user?: TUser;
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
    defaultElement?: React.ReactNode;
}) {
    const query = useQuery<TUser>({
        queryKey: ["user", user_uuid],
        enabled: !!user_uuid && !user,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });

    const { data: roles, isLoading: rolesLoading } = useQuery<TUserRole[]>({
        queryKey: ["user", user_uuid, "roles"],
        refetchOnWindowFocus: false,
        enabled: !!user_uuid,
        refetchOnMount: false,
    });

    // Get the current users scopes
    const { data: scopes, isLoading: scopesLoading } = useQuery<API_SCOPE[]>({
        queryKey: ["user", "self", "scopes"],
        refetchOnWindowFocus: false,
        enabled: !!user_uuid,
        refetchOnMount: false,
    });

    const user_data = user ? user : query.data;

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

    const kioskAccess = scopes && verifyScopes(scopes, [API_SCOPE.VIEW_KIOSKS]);

    if (!user_uuid) {
        return defaultElement;
    } else {
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
                <PopoverContent className="w-3/4 p-2">
                    {user_uuid && user_data && roles && (
                        <UserInfo
                            user_uuid={user_uuid}
                            user={user_data}
                            roles={roles}
                            isLoading={rolesLoading}
                        />
                    )}
                    <div className="w-full flex flex-row gap-4 justify-center p-2">
                        <Button
                            variant="shadow"
                            color="primary"
                            startContent={
                                <ArrowLeftEndOnRectangleIcon className="size-6" />
                            }
                            // onPress={}
                        >
                            Logout
                        </Button>
                        {kioskAccess && (
                            <Button
                                isIconOnly
                                color="primary"
                                variant="bordered"
                                radius="sm"
                                startContent={
                                    <FingerPrintIcon className="size-6" />
                                }
                                as={Link}
                                href="/admin"
                            />
                        )}
                        <ThemeSwitcher
                            className="self-center ml-auto hidden xl:block"
                            classNames={{
                                tabList: "bg-default-200 ",
                            }}
                        />
                    </div>
                </PopoverContent>
            </Popover>
        );
    }
}
