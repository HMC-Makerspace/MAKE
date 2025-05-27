import AdminLayout from "../../layouts/AdminLayout";
import UsersTable from "../../components/kiosks/admin/users/UsersTable";
import UserEditor from "../../components/kiosks/admin/users/UserEditor";
import { Selection } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { TUser, TUserRole } from "common/user";
import React from "react";
import PopupAlert from "../../components/PopupAlert";
import { API_SCOPE } from "../../../common/global";

export default function UsersPage() {
    // Get all user data
    const { data: users, isLoading: usersLoading } = useQuery<TUser[]>({
        queryKey: ["user"],
        refetchOnWindowFocus: false,
    });

    // Get all role data
    const { data: roles, isLoading: rolesLoading } = useQuery<TUserRole[]>({
        queryKey: ["user", "role"],
        refetchOnWindowFocus: false,
    });

    const isLoading = usersLoading || rolesLoading;

    const scopesQuery = useQuery<API_SCOPE[]>({
        queryKey: ["user", "self", "scopes"],
        refetchOnWindowFocus: false,
    });
    const scopes = scopesQuery.data ?? [];

    const canEdit = scopes.some(
        (scope) => scope === API_SCOPE.ADMIN || scope === API_SCOPE.UPDATE_USER,
    );

    const [selectedKeys, onSelectionChange] = React.useState<Selection>(
        new Set(),
    );

    const [isNewUser, setIsNewUser] = React.useState<boolean>(false);

    const [popupMessage, setPopupMessage] = React.useState<string | undefined>(
        undefined,
    );
    const [popupType, setPopupType] = React.useState<
        "success" | "warning" | "danger"
    >("success");

    const onSuccess = (message: string) => {
        setPopupMessage(message);
        setPopupType("success");
    };
    const onError = (message: string) => {
        setPopupMessage(message);
        setPopupType("danger");
    };

    return (
        <AdminLayout pageHref={"/admin/users"}>
            <div className="flex flex-col lg:flex-row overflow-auto h-full gap-8">
                {canEdit && (
                    <UserEditor
                        users={users ?? []}
                        selectedKeys={selectedKeys}
                        isLoading={isLoading}
                        isNew={isNewUser}
                        onSuccess={onSuccess}
                        onError={onError}
                    />
                )}
                <UsersTable
                    users={users ?? []}
                    roles={roles ?? []}
                    selectedKeys={selectedKeys}
                    onSelectionChange={onSelectionChange}
                    isLoading={isLoading}
                    onCreate={setIsNewUser}
                />
            </div>
            <PopupAlert
                isOpen={!!popupMessage}
                onOpenChange={() => setPopupMessage(undefined)}
                color={popupType}
                description={popupMessage}
            />
        </AdminLayout>
    );
}
