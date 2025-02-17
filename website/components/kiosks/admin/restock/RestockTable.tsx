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
    useDisclosure,
} from "@heroui/react";
import {
    MagnifyingGlassIcon as SearchIcon,
    ChevronDownIcon,
    ArrowPathRoundedSquareIcon,
    PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { RESTOCK_REQUEST_STATUS, TRestockRequest, TRestockRequestLog } from "../../../../../common/restock";
import MAKETable from "../../../Table";
import RestockType from "./RestockType";
import RestockEditor from "./RestockEditor"
import RestockStatusLogs from "./RestockStatusLogs"
import React, { useState } from "react";
import { UnixTimestamp } from "common/global";
import { MAKEUser } from "../../../user/User";

const columns = [
    { name: "UUID", id: "uuid" },
    { name: "Requested Time", id: "time_requested"},
    { name: "Requesting User", id: "requesting_user" },
    { name: "Item UUID", id: "item_uuid" },
    { name: "Curr Quantity", id: "current_quantity",},
    { name: "Req Quantity", id: "quantity_requested",},
    { name: "Reason for Request", id: "reason" },
    { name: "Current Status", id: "current_status" },
    { name: "Updated Time", id: "time_updated" },
    { name: "Completion Note", id: "completion_note" },
    { name: "Edit", id: "edit_button" },
    { name: "Logs", id: "log_button" },
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
    "edit_button",
    "log_button"
];

const statusOptions = [
    { value: RESTOCK_REQUEST_STATUS.PENDING_APPROVAL, label: "Pending Approval" },
    { value: RESTOCK_REQUEST_STATUS.APPROVED_WAITING, label: "Approved Waiting" },
    { value: RESTOCK_REQUEST_STATUS.APPROVED_ORDERED, label: "Approved Ordered" },
    { value: RESTOCK_REQUEST_STATUS.RESTOCKED, label: "Restocked" },
    { value: RESTOCK_REQUEST_STATUS.DENIED, label: "Denied" },
]

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

    const [statusFilter, setStatusFilter] = React.useState<Selection>("all");

    // The list of items after filtering and sorting

    const filteredRestocks = React.useMemo(() => {
        
        let filteredRestocks = [...restocks];

        // filtering by status
        if (statusFilter !== "all" && Array.from(statusFilter).length !== statusOptions.length) {
            filteredRestocks = restocks.filter(restock => {
                return (Array.from(statusFilter)).includes(String(restock.current_status));    
            });
        }
        
        // sorting by status and then by time updated
        filteredRestocks.sort((a, b) => { 
            let statusDiff = (a.current_status) - (b.current_status);
            if (statusDiff !== 0) {
                return statusDiff;
            }
            else {
                return (b.status_logs.at(-1)?.timestamp ?? 0) - (a.status_logs.at(-1)?.timestamp ?? 0);
            }
        });
        return filteredRestocks;

    }, [restocks, statusFilter]);
    
    const modifiedSelectionChange = (selectedKeys: Selection) => {  // not using selection here
    };

    const [restockSelected, setRestockSelected] = React.useState<TRestockRequest | null>(null);

    // Editor for modifying restocks status
    // Modal state for editor
    const { isOpen: editIsOpen,
            onOpen: editOnOpen,
            onOpenChange: editOnOpenChange, 
        } = useDisclosure(); // Manage modal state

    // modal for editor
    function ModifyRestockModal({ editIsOpen, editOnOpenChange, }: { editIsOpen: boolean; editOnOpenChange: () => void; }) {
        return (
            <Modal isOpen={editIsOpen} placement="top-center" onOpenChange={editOnOpenChange} className="flex flex-col justify-center">
                <ModalContent className="flex flex-col justify-center">
                    {(onClose) => (
                        restockSelected ? <RestockEditor onClose={onClose} restock={restockSelected} /> : null
                    )}
                </ModalContent>
            </Modal>
        );

    }

    // Past status logs section
    // Modal state for logs
    const {
        isOpen: logsIsOpen,
        onOpen: logsOnOpen,
        onOpenChange: logsOnOpenChange
    } = useDisclosure();

    function PastStatusLogs({logsIsOpen, logsOnOpenChange}: {logsIsOpen: boolean; logsOnOpenChange: () => void;}) {
        return (
            //modal holding restock logs content
            <Modal isOpen={logsIsOpen} placement="top-center" onOpenChange={logsOnOpenChange} className="flex flex-col justify-center">
                <ModalContent>
                    {(onClose) => (
                        restockSelected ? <RestockStatusLogs onClose={onClose} restock={restockSelected}/>
                        : null
                        )
                    }
                </ModalContent>
            </Modal>
        )
    }

    //function to convert timestamp to date
    function convertTimestampToDate(timestamp?: number): string {
        if (!timestamp) {
            return "N/A";
        }
        return new Date((timestamp) * 1000).toLocaleString();
    }

    // table returned
    return  (
        <div>
            
            <div className="flex  flex-col content-center items-center">
                <h1 className="text-xl font-bold text-foreground-900 mb-2">Restocks</h1>
                <h3 className="text-l text-foreground-900 mb-4">View, approve, and deny restock requests.</h3>

                <div className="static mb-4 md:absolute md:right-10 md:top-20 ">
                    <Dropdown>
                        <DropdownTrigger className="hidden sm:flex">
                            <Button color="default" endContent={<ChevronDownIcon className="size-6" />}>
                                Filter Status
                                <div className='flex flex-row gap-1 m-2'>
                                    {statusFilter === "all" ? 
                                        statusOptions.map((status) => (<RestockType request_status={status.value} card={false} />)) : 
                                        Array.from(statusFilter).map(Number).sort((a, b) => a - b).map((status) => (<RestockType request_status={status} card={false} />))
                                    }
                                </div>
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu
                            disallowEmptySelection
                            aria-label="Table Columns"
                            closeOnSelect={false}
                            selectedKeys={statusFilter}
                            selectionMode="multiple"
                            onSelectionChange={setStatusFilter}
                        >
                            {statusOptions.map((status) => (
                            <DropdownItem key={status.value} className="capitalize">
                                <RestockType request_status={status.value} card={true} />
                            </DropdownItem>
                            ))}
                        </DropdownMenu>
                    </Dropdown>
                </div>
            </div>
            
            <MAKETable
                content={filteredRestocks}
                columns={columns}
                visibleColumns={visibleColumns}
                selectedKeys={selectedKeys}
                onSelectionChange={modifiedSelectionChange}
                multiSelect = {false}
                emptyContent={"No Restock Requests Found"}
                customColumnComponents={{
                    time_requested: (restock) => (
                        <span>
                            {convertTimestampToDate(restock.status_logs.at(0)?.timestamp)}
                        </span>
                    ),
                    time_updated: (restock) => (
                        <span>
                            {convertTimestampToDate(restock.status_logs.at(-1)?.timestamp)}
                        </span>
                    ),
                    completion_note: (restock) => (
                        <span>
                            {restock.status_logs.at(-1)?.message}
                        </span>
                    ),
                    requesting_user: (restock) => (
                        <div>
                            <MAKEUser user_uuid={restock.requesting_user} />
                        </div>
                    ),
                    current_status: (restock) => (
                        <div>
                            <RestockType request_status={restock.current_status} card={true}/>
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
                                editOnOpen();
                            }}
                            isIconOnly
                        >
                        </Button>
                    ),
                    log_button: (restock) => (
                        <Button
                            color="default"
                            startContent={
                                <ArrowPathRoundedSquareIcon className="size-6" />
                            }
                            onPress={() => {
                                setRestockSelected(restock);
                                logsOnOpen();
                            }}
                            isIconOnly
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
            <ModifyRestockModal editIsOpen={editIsOpen} editOnOpenChange={editOnOpenChange} />
            <PastStatusLogs logsIsOpen={logsIsOpen} logsOnOpenChange={logsOnOpenChange} />
        
        </div>

    )

}