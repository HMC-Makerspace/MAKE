import AdminLayout from "../../layouts/AdminLayout";
import InventoryTable from "../../components/kiosks/admin/inventory/InventoryTable";
import ItemEditor from "../../components/kiosks/admin/inventory/ItemEditor";
import {
    ITEM_ACCESS_TYPE,
    ITEM_ROLE,
    TInventoryItem,
} from "../../../common/inventory";
import {
    Modal,
    ModalContent,
    Selection,
    Spinner,
    useDisclosure,
} from "@heroui/react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import React from "react";
import { TUserRole } from "common/user";
import { TCertification } from "common/certification";
import { TArea } from "common/area";

const DEFAULT_ITEM: TInventoryItem = {
    uuid: "",
    name: "",
    role: ITEM_ROLE.TOOL,
    quantity: 0,
    available: 0,
    access_type: ITEM_ACCESS_TYPE.USE_IN_SPACE,
    locations: [],
};

export default function InventoryKiosk() {
    // Get all inventory data
    const { data: inventory, isLoading: inventoryLoading } = useQuery<
        TInventoryItem[]
    >({
        queryKey: ["inventory"],
        refetchOnWindowFocus: false,
    });

    const { data: roles, isLoading: rolesLoading } = useQuery<TUserRole[]>({
        queryKey: ["user", "role"],
        refetchOnWindowFocus: false,
    });
    const { data: certs, isLoading: certsLoading } = useQuery<TCertification[]>(
        {
            queryKey: ["certification"],
            refetchOnWindowFocus: false,
        },
    );
    const { data: areas, isLoading: areasLoading } = useQuery<TArea[]>({
        queryKey: ["area"],
        refetchOnWindowFocus: false,
    });

    const [selectedItems, onSelectionChange] = React.useState<Selection>(
        new Set([""]),
    );

    if (
        !inventory ||
        !roles ||
        !certs ||
        !areas ||
        inventoryLoading ||
        rolesLoading ||
        certsLoading ||
        areasLoading
    ) {
        return (
            <div className="w-full h-screen flex justify-center py-auto">
                <Spinner />
            </div>
        );
    }

    const betterSelectionChange = (s: Selection) => {
        if (s === "all") {
            onSelectionChange(new Set([""]));
        } else {
            const keys = Array.from(s);
            console.log(keys);
            onSelectionChange(new Set([keys[keys.length - 1]]));
        }
    };

    const selectedArray =
        selectedItems == "all"
            ? [DEFAULT_ITEM]
            : (inventory.filter((item) => selectedItems.has(item.uuid)) ?? []);

    const item = selectedArray[0];

    return (
        <AdminLayout pageHref={"/admin/inventory"}>
            <div className="flex flex-col lg:flex-row overflow-auto h-full gap-8 p-3">
                <ItemEditor
                    item={item ?? DEFAULT_ITEM}
                    certs={certs}
                    roles={roles}
                    areas={areas}
                    isDisabled={
                        !item ||
                        item.role === ITEM_ROLE.MACHINE ||
                        item.role === ITEM_ROLE.AREA
                    }
                    isNew={false}
                    onSuccess={() => {}}
                    onError={() => {}}
                />
                <InventoryTable
                    inventory={inventory ?? []}
                    roles={roles}
                    certifications={certs}
                    areas={areas}
                    selectedKeys={selectedItems}
                    onSelectionChange={betterSelectionChange}
                    isLoading={inventoryLoading}
                    editable
                    onCreate={() => {}}
                />
            </div>
        </AdminLayout>
    );
}
