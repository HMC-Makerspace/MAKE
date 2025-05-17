import AdminLayout from "../../layouts/AdminLayout";
import InventoryTable from "../../components/kiosks/admin/inventory/InventoryTable";
import ItemEditor from "../../components/kiosks/admin/inventory/ItemEditor";
import { ITEM_ACCESS_TYPE, ITEM_ROLE, TInventoryItem } from "../../../common/inventory";
import { Modal, ModalContent, Selection, useDisclosure } from "@heroui/react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import React from "react";

const DEFAULT_ITEM = {
    uuid: "",
    name: "",
    role: ITEM_ROLE.TOOL,
    access_type: ITEM_ACCESS_TYPE.USE_IN_SPACE,
    locations: [],
}

export default function InventoryPage() {
    // Get all inventory data
    const { data, isLoading, isError } = useQuery<TInventoryItem[]>({
        queryKey: ["inventory"],
        refetchOnWindowFocus: false,
    });

    const [selectedKeys, onSelectionChange] = React.useState<Selection>(
        new Set(),
    );

    const items = selectedKeys == "all"? [DEFAULT_ITEM] : data?.filter((item) => selectedKeys.has(item.uuid)) ?? [];

    return (
        <AdminLayout pageHref={"/admin/inventory"}>
            <div className="flex flex-col lg:flex-row overflow-auto h-full gap-8">
                <ItemEditor
                    item={items[0] ?? DEFAULT_ITEM}
                    isLoading={isLoading}
                    isNew={false}
                    onSuccess={()=>{}}
                    onError={()=>{}}
                />
                <InventoryTable
                    items={data ?? []}
                    selectedKeys={selectedKeys}
                    onSelectionChange={onSelectionChange}
                    isLoading={isLoading}
                />
            </div>
        </AdminLayout>
    )
}
