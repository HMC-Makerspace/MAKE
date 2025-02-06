import AdminLayout from "../../layouts/AdminLayout";
import CertificationsTable from "../../components/kiosks/admin/certifications/CTable";
import { Modal, ModalContent, Selection, useDisclosure } from "@heroui/react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { TCertification } from "common/certification";
import React from "react";


export default function CertificationsPage() {
    // Get all user data
    const { data, isLoading, isError } = useQuery<TCertification[]>({
        queryKey: ["certification"],
        refetchOnWindowFocus: false,
    });

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
            />
        </AdminLayout>
    );
}