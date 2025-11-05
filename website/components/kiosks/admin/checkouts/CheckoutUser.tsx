import { TCertification } from "common/certification";
import UserInfo from "../users/UserInfo";
import { TUser, TUserRole } from "common/user";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";

export default function CheckoutUser({
    college_id,
    certs,
    roles,
}: {
    college_id?: string;
    certs: TCertification[];
    roles: TUserRole[];
}) {
    const {
        data: user,
        isLoading,
        isError,
    } = useQuery<TUser>({
        queryKey: ["user", "by", "id", college_id],
        refetchOnWindowFocus: false,
        enabled: !!college_id,
        retry: false,
    });

    console.log(roles);

    return (
        <UserInfo
            key={user?.uuid}
            user_uuid={isError ? "none" : user?.uuid}
            user={user}
            certs={certs}
            roles={roles}
            size="md"
            className="h-full overflow-auto relative min-w-0"
            endContent={
                isError ? (
                    <div
                        className={clsx(
                            "absolute h-[50%] primary shadow-md bg-primary-100/50 flex",
                            "items-center justify-center text-lg rounded-lg m-4",
                            "text-default-foreground/90 bottom-2 my-auto",
                            "left-4 right-4 mx-auto text-center p-4",
                        )}
                    >
                        Select a user to assign this id
                    </div>
                ) : (
                    <></>
                )
            }
        />
    );
}
