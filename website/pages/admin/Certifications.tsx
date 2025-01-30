//some stuff
import AdminLayout from "../../layouts/AdminLayout";
import CertificationsTable from "../../components/kiosks/admin/certifications/CTable";
import UserEditor from "../../components/kiosks/admin/users/UserEditor";
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
            <div>ob</div>
            
            <CertificationsTable
                certs={data || []}
                selectedKeys={selectedKeys}
                onSelectionChange={onSelectionChange}
                isLoading={isLoading}
            />
        </AdminLayout>
    );
}

/*
{ <div className="flex flex-col lg:flex-row overflow-auto h-full gap-8">
                <UserEditor
                    users={data ?? []}
                    selectedKeys={selectedKeys}
                    isLoading={isLoading}
                    isNew={false}
                />
                <UsersTable
                    users={data ?? []}
                    selectedKeys={selectedKeys}
                    onSelectionChange={onSelectionChange}
                    isLoading={isLoading}
                />
            </div> }
            */