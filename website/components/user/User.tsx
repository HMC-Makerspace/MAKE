import { useQuery } from "@tanstack/react-query";
import { TUser } from "common/user";
import { Button, Link, User } from "@heroui/react";

export function MAKEUser({ user_uuid }: { user_uuid: string }) {
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

    return (
        <div className="flex flex-col items-center">
            {
                // If the user hasn't been loaded yet, show a login prompt
                !user_uuid ? (
                    <Button
                        as={Link}
                        href="/login"
                        color="default"
                        variant="shadow"
                        className="hidden sm:flex"
                    >
                        Login
                    </Button>
                ) : query.isLoading ? (
                    <User name={"Loading..."} description={"Loading..."} />
                ) : query.isError ? (
                    <User name={"ERROR"} description={query.error.message} />
                ) : query.isSuccess ? (
                    // TODO: Improve overflow to make text ellipsis
                    // TODO: Make button open user info popup
                    <Button
                        className="bg-default-300 px-3 justify-items-center sm:w-auto"
                        size="lg"
                    >
                        <User
                            name={query.data.name}
                            description={query.data.email}
                            classNames={{
                                description: "hidden sm:block",
                                name: "hidden sm:block",
                            }}
                        />
                    </Button>
                ) : null
            }
        </div>
    );
}
