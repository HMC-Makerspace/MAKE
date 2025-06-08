import AdminLayout from "../../layouts/AdminLayout";
import RolesTable from "../../components/kiosks/admin/roles/RolesTable";
import { useQuery } from "@tanstack/react-query";
import { TUserRole } from "common/user";
import { API_SCOPE } from "../../../common/global";

export default function RolesPage() {
    // Get all user data
    const { data, isLoading } = useQuery<TUserRole[]>({
        queryKey: ["user", "role"],
        refetchOnWindowFocus: false,
    });
    const scopesQuery = useQuery<API_SCOPE[]>({
        queryKey: ["user", "self", "scopes"],
        refetchOnWindowFocus: false,
    });
    const scopes = scopesQuery.data ?? [];

    const canEdit = scopes.some(
        (scope) => scope === API_SCOPE.ADMIN || scope === API_SCOPE.UPDATE_ROLE,
    );

    return (
        <AdminLayout pageHref={"/admin/roles"}>
            <div className="flex flex-col lg:flex-row overflow-auto h-full gap-8">
                <RolesTable
                    roles={data ?? []}
                    isLoading={isLoading}
                    canEdit={canEdit}
                />
            </div>
        </AdminLayout>
    );
}
