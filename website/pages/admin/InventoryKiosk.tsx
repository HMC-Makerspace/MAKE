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
    ModalBody,
    Selection,
    Spinner,
    useDisclosure,
    ModalHeader,
} from "@heroui/react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import React from "react";
import { TUser, TUserRole } from "common/user";
import { TCertification } from "common/certification";
import { TArea } from "common/area";
import { TRestockRequest } from "../../../common/restock";
import { API_SCOPE } from "common/global";
import { useRoles } from "../../queries/useRoles";
import { useMediaQuery } from "../../utils";

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

    const { data: roles, isLoading: rolesLoading } = useRoles();
    const { data: requestingUser, isLoading: reqUserLoading } = useQuery<TUser>(
        {
            queryKey: ["user", "self"],
            refetchOnWindowFocus: false,
        },
    );
    const {
        data: scopes,
        isLoading: scopesLoading,
        isError: scopesError,
    } = useQuery<API_SCOPE[]>({
        queryKey: ["user", "self", "scopes"],
        refetchOnWindowFocus: false,
        retry: false,
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

    const [isNewItem, setIsNewItem] = React.useState<boolean>(false);
    const {
        data: restocks,
        isLoading: restocksLoading,
        isError,
    } = useQuery<TRestockRequest[]>({
        queryKey: ["restock"],
        refetchOnWindowFocus: false,
    });
    const isMobile = useMediaQuery("(max-width: 1023px)");
    const {
        isOpen: editIsOpen,
        onOpen: editOnOpen,
        onClose: editOnClose,
        onOpenChange: editOnOpenChange,
    } = useDisclosure();

    const betterSelectionChange = (s: Selection) => {
        if (s === "all") {
            onSelectionChange(new Set([""]));
        } else {
            const keys = Array.from(s);
            onSelectionChange(new Set([keys[keys.length - 1]]));
        }
    };

    React.useEffect(() => {
        if (selectedItems !== "all") {
            if (isMobile && (selectedItems.size > 0 || isNewItem)) {
                editOnOpen();
            } else {
                editOnClose();
            }
        }
    }, [selectedItems, isNewItem]);

    if (
        !inventory ||
        !roles ||
        !certs ||
        !areas ||
        !restocks ||
        !requestingUser ||
        !scopes ||
        inventoryLoading ||
        rolesLoading ||
        certsLoading ||
        areasLoading ||
        restocksLoading ||
        reqUserLoading ||
        scopesLoading
    ) {
        return (
            <div className="w-full h-screen flex justify-center py-auto">
                <Spinner />
            </div>
        );
    }

    const selectedArray =
        selectedItems == "all"
            ? [DEFAULT_ITEM]
            : (inventory.filter((item) => selectedItems.has(item.uuid)) ?? []);

    const item = selectedArray[0];

    return (
        <AdminLayout pageHref={"/admin/inventory"}>
            <div className="flex flex-col lg:flex-row overflow-auto h-full gap-8 sm:p-3">
                <div className="hidden lg:block w-2/5">
                    <ItemEditor
                        item={item ?? DEFAULT_ITEM}
                        certs={certs}
                        roles={roles}
                        areas={areas}
                        items={inventory}
                        isDisabled={
                            !isNewItem &&
                            (!item ||
                                item.role === ITEM_ROLE.MACHINE ||
                                item.role === ITEM_ROLE.AREA)
                        }
                        isNew={isNewItem}
                        onUpdate={() => setIsNewItem(false)}
                        setSelectedItem={onSelectionChange}
                    />
                </div>
                <InventoryTable
                    requestingUser={requestingUser}
                    scopes={scopes}
                    inventory={inventory ?? []}
                    roles={roles}
                    certifications={certs}
                    areas={areas}
                    restocks={restocks}
                    selectedKeys={selectedItems}
                    onSelectionChange={betterSelectionChange}
                    isLoading={inventoryLoading}
                    showsKitContents={true}
                    editable
                    onCreate={setIsNewItem}
                />
            </div>

            {isMobile && (
                <Modal
                    isOpen={editIsOpen}
                    onOpenChange={editOnOpenChange}
                    placement="bottom"
                    scrollBehavior="inside"
                    size="xl"
                    classNames={{
                        // wrapper: "items-end",
                        base: "max-h-[85vh] h-auto rounded-t-2xl overflow-hidden w-full",
                        body: "overflow-y-auto px-4",
                    }}
                >
                    <ModalContent>
                        <ModalHeader>

                        </ModalHeader>
                        <ModalBody>
                            <ItemEditor
                                item={item ?? DEFAULT_ITEM}
                                certs={certs}
                                roles={roles}
                                areas={areas}
                                items={inventory}
                                isDisabled={
                                    !isNewItem &&
                                    (!item ||
                                        item.role === ITEM_ROLE.MACHINE ||
                                        item.role === ITEM_ROLE.AREA)
                                }
                                isNew={isNewItem}
                                onUpdate={() => setIsNewItem(false)}
                                setSelectedItem={onSelectionChange}
                            />
                        </ModalBody>
                    </ModalContent>
                </Modal>
            )}
        </AdminLayout>
    );
}
