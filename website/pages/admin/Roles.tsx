import AdminLayout from "../../layouts/AdminLayout";
import RolesTable from "../../components/kiosks/admin/roles/RolesTable";
import UserEditor from "../../components/kiosks/admin/users/UserEditor";
import { Selection } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { TUser, TUserRole } from "common/user";
import React from "react";
import PopupAlert from "../../components/PopupAlert";
import { API_SCOPE } from "../../../common/global";

export default function RolesPage() {
    // Get all user data
    const { data, isLoading, isError } = useQuery<TUserRole[]>({
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

    const [selectedKeys, onSelectionChange] = React.useState<Selection>(
        new Set(),
    );

    const [popupMessage, setPopupMessage] = React.useState<string | undefined>(
        undefined,
    );
    const [popupType, setPopupType] = React.useState<
        "success" | "warning" | "danger"
    >("success");

    const [showPopup, setShowPopup] = React.useState<boolean>(false);

    const onSuccess = (message: string) => {
        setPopupMessage(message);
        setPopupType("success");
        setShowPopup(true);
    };
    const onError = (message: string) => {
        setPopupMessage(message);
        setPopupType("danger");
        setShowPopup(true);
    };

    return (
        <AdminLayout pageHref={"/admin/users"}>
            <div className="flex flex-col lg:flex-row overflow-auto h-full gap-8">
                <RolesTable
                    roles={data ?? []}
                    isLoading={isLoading}
                    canEdit={canEdit}
                />
            </div>
            <PopupAlert
                isOpen={showPopup}
                onOpenChange={setShowPopup}
                color={popupType}
                description={popupMessage}
                className="absolute bottom-6 right-6 w-1/4"
            />
        </AdminLayout>
    );
}
