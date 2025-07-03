import { TCertification } from "common/certification";
import UserInfo from "../users/UserInfo";
import { TUser, TUserRole } from "common/user";
import { useQuery } from "@tanstack/react-query";

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

    return (
        <UserInfo
            user_uuid={isError ? "none" : user?.uuid}
            user={user}
            certs={certs}
            roles={roles}
            size="lg"
            className="h-full overflow-auto"
        />
    );
}
