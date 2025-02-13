import AdminLayout from "../../layouts/AdminLayout";
import CertificationsTable from "../../components/kiosks/admin/certifications/CTable";
import { Modal, ModalContent, Selection, useDisclosure } from "@heroui/react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { TCertification } from "common/certification";
import React from "react";
import { API_SCOPE } from "../../../common/global";


export default function CertificationsPage() {
    // Get all user data
    const { data, isLoading, isError } = useQuery<TCertification[]>({
        queryKey: ["certification"],
        refetchOnWindowFocus: false,
    });

    const scopesQuery = useQuery<API_SCOPE[]>({
        queryKey: ["user", "self", "scopes"],
        refetchOnWindowFocus: false,
    });
    const scopes = scopesQuery.data ?? [];

    const canEdit = scopes.some(
        (scope) => scope === API_SCOPE.ADMIN || scope === API_SCOPE.UPDATE_CERTIFICATION,
    );

    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const [selectedKeys, onSelectionChange] = React.useState<Selection>(
        new Set(),
    );

    return (
        <AdminLayout pageHref={"/admin/certifications"}>
            <CertificationsTable
                certs={data || []}
                selectedKeys={selectedKeys}
                onSelectionChange={onSelectionChange}
                isLoading={isLoading}
                canEdit={canEdit}
            />
        </AdminLayout>
    );
}