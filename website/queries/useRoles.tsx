import { useQuery } from "@tanstack/react-query";
import { TUserRole } from "common/user";
import { compareUserRoles } from "../utils";

export function useRoles({
    disabled = false,
    refetchOnMount = true,
}: {
    disabled?: boolean;
    refetchOnMount?: boolean;
} = {}) {
    return useQuery<TUserRole[]>({
        queryKey: ["user", "role"],
        refetchOnWindowFocus: false,
        refetchOnMount: refetchOnMount,
        enabled: !disabled,
        select: (roles) =>
            roles.toSorted(compareUserRoles),
    });
}
