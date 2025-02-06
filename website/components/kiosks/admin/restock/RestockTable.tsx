import {
    Input,
    Selection,
    SortDescriptor,
    Button,
    DropdownTrigger,
    Dropdown,
    DropdownMenu,
    DropdownItem,
    Modal,
    Spinner,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Checkbox,
    Link,
    Form,
    Select,
    SelectItem
} from "@heroui/react";
import {
    MagnifyingGlassIcon as SearchIcon,
    ChevronDownIcon,
    PlusIcon,
    PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { RESTOCK_REQUEST_STATUS, TRestockRequest, TRestockRequestLog } from "../../../../../common/restock";
import MAKETable from "../../../Table";
import RestockUser from "./RestockUser";
import RestockType from "./RestockType";
import RestockEditor from "./RestockEditor"
import Fuse from "fuse.js";
import React, { useState } from "react";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const columns = [
    { name: "UUID", id: "uuid" },
    { name: "Requested Time", id: "time_requested"},
    { name: "Requesting User", id: "requesting_user" },
    { name: "Item UUID", id: "item_uuid" },
    { name: "Current Quantity", id: "current_quantity",},
    { name: "Requested Quantity", id: "quantity_requested",},
    { name: "Reason for Request", id: "reason" },
    { name: "Current Status", id: "current_status" },
    { name: "Updated Time", id: "time_updated" },
    { name: "Completion Note", id: "completion_note" },
    { name: "Edit", id: "edit_button" },
    // { name: "Status Logs", id: "status_logs" },
];

const defaultColumns = [
    "time_requested",
    "item_uuid",
    "current_quantity",
    "quantity_requested",
    "reason",
    "requesting_user",
    "current_status",
    "time_updated",
    "completion_note",
    "edit_button"
];

export default function RestockTable({
    restocks,
    selectedKeys,
    onSelectionChange,
    isLoading,
}: {
    restocks: TRestockRequest[];
    selectedKeys: Selection;
    onSelectionChange: (selectedKeys: Selection) => void;
    isLoading: boolean;
}) {

    const [visibleColumns, setVisibleColumns] = React.useState<Selection>(
            new Set(defaultColumns),
    );

    const [search, setSearch] = React.useState<string>("");

    const fuse = React.useMemo(() => {
        return new Fuse(restocks, {
            keys: ["time_requested", "inventory_uuid"],
            threshold: 0.3,
        });
    }, [restocks]);
    
    
    // The list of items after filtering and sorting
    const filteredRestocks = React.useMemo(() => {
        if (search) {
            return fuse.search(search).map((result) => result.item);
        } else {
            return restocks;
        }
    }, [restocks, fuse, search]);
    
    const numUsers = restocks.length;

    const modifiedSelectionChange = (selectedKeys: Selection) => {     
       
    };

     const [restockSelected, setRestockSelected] = React.useState<TRestockRequest | null>(null);

    //allows users to modify restock status 
    const { isOpen, onOpen, onOpenChange } = useDisclosure(); // Manage modal state
    
    
    // modal for editor
    function ModifyRestockModal({ isOpen, onOpenChange, }: { isOpen: boolean; onOpenChange: () => void; }) {

        return (
            <Modal isOpen={isOpen} placement="top-center" onOpenChange={onOpenChange}>
                <ModalContent>
                    {(onClose) => (

                        restockSelected ? <RestockEditor onClose={onClose} restock={restockSelected} /> : null
                    )}
                </ModalContent>
            </Modal>
        );



    }

    return  (
        <div>
            <MAKETable
                content={filteredRestocks}
                columns={columns}
                visibleColumns={visibleColumns}
                selectedKeys={selectedKeys}
                onSelectionChange={modifiedSelectionChange}
                multiSelect = {false}
                customColumnComponents={{
                    time_requested: (restock) => (
                        <span>
                            {(restock.status_logs.at(0)?.timestamp)}
                        </span>
                    ),
                    time_updated: (restock) => (
                        <span>
                            {restock.status_logs.at(-1)?.timestamp}
                        </span>
                    ),
                    completion_note: (restock) => (
                        <span>
                            {restock.status_logs.at(-1)?.message}
                        </span>
                    ),
                    requesting_user: (restock) => (
                        <div>
                            <RestockUser user_uuid={restock.requesting_user} />
                        </div>
                    ),
                    current_status: (restock) => (
                        <div>
                            <RestockType request_status={restock.current_status} />
                        </div>
                    ),
                    edit_button: (restock) => (
                        <Button
                            color="primary"
                            startContent={
                                <PencilSquareIcon className="size-6" />
                            }
                            onPress={() => {
                                setRestockSelected(restock);
                                onOpen();

                            }}
                        >
                        </Button>
                    )
                }}
                isLoading={isLoading}
                loadingContent={(ref) => (
                    <div className="flex w-full justify-center">
                        <Spinner color="white" ref={ref} />
                    </div>
                )}
            />
            <ModifyRestockModal isOpen={isOpen} onOpenChange={onOpenChange} />
        </div>

    )

}