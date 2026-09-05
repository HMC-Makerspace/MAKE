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
import React, { useEffect, useState } from "react";
import UserInfo from "../kiosks/admin/users/UserInfo";
import { ThemeSwitcher } from "../ThemeSwitcher";
import { API_SCOPE } from "../../../common/global";
import { verifyScopes } from "../../utils";
import {
    ArrowLeftEndOnRectangleIcon,
    FingerPrintIcon,
} from "@heroicons/react/24/solid";
import { AxiosError } from "axios";
import { StatusCodes } from "http-status-codes";
import {
    AtSymbolIcon,
    ChevronDownIcon,
    ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

export function UserLoginChip({
    user_uuid,
    className,
    classNames = {
        wrapper: "items-center sm:items-start",
        name: "max-w-[130px] text-ellipsis overflow-hidden",
        description: "max-w-[130px] text-ellipsis overflow-hidden",
    },
    size = "lg",
    color = "default",
    popoverPlacement = "top",
    loginColor = "default",
    onClick = () => {},
}: {
    user_uuid: string;
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
    loginColor?:
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
    /** A function to run when logging in by email */
    onClick?: () => void;
}) {
    const [ctrlMode, setCtrlMode] = useState(false);

    useEffect(() => {
        document.addEventListener("keydown", (e) => {
            if (e.key === "Alt") {
                setCtrlMode(true);
            }
        });
    }, []);

    useEffect(() => {
        document.addEventListener("keyup", (e) => {
            if (e.key === "Alt") {
                setCtrlMode(false);
            }
        });
    }, []);

    const {
        data: user,
        isLoading,
        isError,
        error,
    } = useQuery<TUser, AxiosError>({
        queryKey: ["user", user_uuid],
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        retry: false,
    });

    const loggedOut =
        !user_uuid || isLoading || error?.status === StatusCodes.UNAUTHORIZED;

    const { data: roles, isLoading: rolesLoading } = useQuery<TUserRole[]>({
        queryKey: ["user", user?.uuid || "self", "roles"],
        refetchOnWindowFocus: false,
        enabled: !loggedOut,
        refetchOnMount: false,
    });

    // Get the current users scopes
    const { data: scopes, isLoading: scopesLoading } = useQuery<API_SCOPE[]>({
        queryKey: ["user", "self", "scopes"],
        refetchOnWindowFocus: false,
        enabled: !loggedOut,
        refetchOnMount: false,
    });

    const name =
        user?.name ??
        (isLoading ? "Loading..." : isError ? "ERROR" : "Unknown");
    const description =
        user?.email ??
        (isLoading ? "Loading..." : isError ? error.message : "Unknown");

    const kioskAccess = scopes && verifyScopes(scopes, [API_SCOPE.VIEW_KIOSKS]);

    if (loggedOut) {
        return (
            <Button
                color={loginColor}
                variant="solid"
                size="lg"
                className="w-full font-medium relative"
                onPress={() => {
                    if (!ctrlMode) {
                        window.location.href = "/login";
                    } else {
                        onClick();
                    }
                }}
                endContent={
                    <div className="flex gap-0 absolute right-3">
                        <AtSymbolIcon
                            className="size-5 transition-opacity text-default-500"
                            style={{ opacity: ctrlMode ? 100 : 0 }}
                        />
                        <ChevronRightIcon
                            className="size-5 transition-opacity text-default-500"
                            style={{ opacity: ctrlMode ? 100 : 0 }}
                        />
                    </div>
                }
            >
                Login
            </Button>
        );
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
                    {user_uuid && user && roles && (
                        <UserInfo
                            user={user}
                            roles={roles}
                            isLoading={rolesLoading}
                            unknownPlaceholders
                        />
                    )}
                    <div className="w-full flex flex-row gap-4 justify-center p-2">
                        <Button
                            variant="shadow"
                            color="primary"
                            startContent={
                                <ArrowLeftEndOnRectangleIcon className="size-6 min-w-6" />
                            }
                            onPress={() => {
                                window.location.href = "/logout";
                            }}
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
