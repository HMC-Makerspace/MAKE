import { useQuery } from "@tanstack/react-query";
import { TUser } from "common/user";
import { Button, Link, User } from "@heroui/react";
import clsx from "clsx";

export function ShiftUser({
    user,
    className,
    classNames = {
        description: "hidden sm:block",
        name: "hidden sm:block",
    },
    onClick = () => {},
    defaultElement = (
        <Button
            as={Link}
            href="/login"
            color="default"
            variant="shadow"
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
    /** A function to run when the user is clicked, which accepts the user's uuid */
    onClick?: (uuid: string) => void;
    defaultElement?: React.ReactNode;
}) {
    const query = useQuery<TUser>({
        queryKey: ["user", user_uuid],
        enabled: !!user_uuid,
        refetchOnWindowFocus: false,
        // placeholderData: {
        //     uuid: user_uuid,
        //     name: "Loading...",
        //     email: "Loading...",
        //     college_id: "Loading...",
        //     active_roles: [],
        //     past_roles: [],
        // },
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

    if (!user_uuid) {
        return defaultElement;
    } else {
        return (
            <Button
                className={clsx(
                    "bg-default-300 px-3",
                    "justify-items-center sm:w-auto",
                    className,
                )}
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
                            classNames.base,
                        )}
                    >
                        {name}
                    </div>
                )}
            </Button>
        );
    }

    return (
        <div className="flex flex-col items-center">
            {
                // If the user hasn't been loaded yet, show the default element
                !user_uuid ? (
                    defaultElement
                ) : (
                    // TODO: Improve overflow to make text ellipsis
                    // TODO: Make button open user info popup
                    <Button
                        className="bg-default-300 px-3 justify-items-center sm:w-auto"
                        size="lg"
                    >
                        <User
                            name={name}
                            description={description}
                            classNames={{
                                description: "hidden sm:block",
                                name: "hidden sm:block",
                            }}
                        />
                    </Button>
                )
            }
        </div>
    );
}
