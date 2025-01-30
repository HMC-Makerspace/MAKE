import AdminLayout from "../../layouts/AdminLayout";
import RestockTable from "../../components/kiosks/admin/restock/RestockTable";
import { useQuery } from "@tanstack/react-query";
import { TRestockRequest } from "../../../common/restock";
import { Modal, ModalContent, Selection, useDisclosure } from "@heroui/react";
import React from "react";



export default function RestockPage() {
    // getting restock data
    const { data, isLoading, isError } = useQuery<TRestockRequest[]>({
        queryKey: ["restock"], 
        refetchOnWindowFocus: false,
    });

    const [selectedKeys, onSelectionChange] = React.useState<Selection>(
        new Set(),
    );
    
    return (
        <AdminLayout pageHref={"/admin/restocks"}>
            <div>
                 <RestockTable
                    restocks={data ?? []}
                    selectedKeys={selectedKeys}
                    onSelectionChange={onSelectionChange}
                    isLoading={isLoading}
                />
            </div>
        </AdminLayout>
    )

}