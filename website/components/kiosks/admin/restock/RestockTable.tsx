import {
    Input,
    Selection,
    SortDescriptor,
    Button,
    DropdownTrigger,
    Dropdown,
    DropdownMenu,
    DropdownItem,
    Spinner,
} from "@heroui/react";
import {
    MagnifyingGlassIcon as SearchIcon,
    ChevronDownIcon,
    PlusIcon,
    PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { TRestockRequest, TRestockRequestLog } from "../../../../../common/restock";
import MAKETable from "../../../Table";
import Fuse from "fuse.js";
import React from "react";
import { UserUUID } from "common/user";

const columns = [
    { name: "UUID", id: "uuid" },
    { name: "Requested Timestamp", id: "time_requested"},
    { name: "Requesting User", id: "requesting_user" },
    { name: "Item UUID", id: "item_uuid" },
    { name: "Current Quantity", id: "current_quantity",},
    { name: "Quantity Requested", id: "quantity_requested",},
    { name: "Reason", id: "reason" },
    { name: "Current Status", id: "current_status" },
    { name: "Updated Timestamp", id: "time_updated" },
    { name: "Completion Note", id: "completion_note" },
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
    "completion_note"
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
    const filteredUsers = React.useMemo(() => {
        if (search) {
            return fuse.search(search).map((result) => result.item);
        } else {
            return restocks;
        }
    }, [restocks, fuse, search]);
    
    const numUsers = restocks.length;
    const numFilteredUsers = filteredUsers.length;

    const modifiedSelectionChange = (selectedKeys: Selection) => {
            if (selectedKeys === "all") {
                onSelectionChange(new Set(filteredUsers.map((user) => user.uuid)));
            } else {
                onSelectionChange(selectedKeys);
            }
    };

    return  (
        <div>
            <MAKETable
                content={filteredUsers}
                columns={columns}
                visibleColumns={visibleColumns}
                selectedKeys={selectedKeys}
                onSelectionChange={modifiedSelectionChange}
                multiSelect = {false}
                customColumnComponents={{
                    time_requested: (restock) => (
                        <span>{
                            restock.status_logs.at(0)?.timestamp
                        }
                        </span>
                    ),
                    time_updated: (restock) => (
                        <span>{
                            restock.status_logs.at(-1)?.timestamp
                        }
                        </span>
                    ),
                    completion_note: (restock) => (
                        <span>
                            {restock.status_logs.at(-1)?.message}
                        </span>
                    )
                }}
                isLoading={isLoading}
                loadingContent={(ref) => (
                    <div className="flex w-full justify-center">
                        <Spinner color="white" ref={ref} />
                    </div>
                )}
            />
        </div>

    )

}