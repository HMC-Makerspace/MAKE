import {
    Selection,
    Button,
    DropdownTrigger,
    Dropdown,
    DropdownMenu,
    DropdownItem,
    Modal,
    Spinner,
    ModalContent,
    useDisclosure,
    ModalBody,
    ModalFooter,
    ModalHeader,
    Accordion,
    AccordionItem
} from "@heroui/react";
import {
    ChevronDownIcon,
    ArrowPathRoundedSquareIcon,
    PencilSquareIcon,
    UserPlusIcon
} from "@heroicons/react/24/outline";
import {
    RESTOCK_REQUEST_STATUS,
    TRestockRequest,
} from "../../../../../common/restock";
import MAKETable from "../../../Table";
import RestockType from "./RestockType";
import RestockEditor from "./RestockEditor";
import RestockUserList from "./RestockUserList";
import RestockStatusLogs from "./RestockStatusLogs";
import ItemInfo from "../inventory/ItemInfo";
import React from "react";
import { UserChip } from "../../../user/UserChip";
import { convertTimestampToDate } from "../../../../utils";
import { TArea } from "common/area";
import { TCertification } from "common/certification";
import { TInventoryItem } from "common/inventory";
import { TUser, TUserRole } from "common/user";

const columns = [
    { name: "UUID", id: "uuid" },
    { name: "Requested Time", id: "time_requested" },
    { name: "Requesting User", id: "requesting_user" },
    { name: "Item", id: "item_uuid" },
    { name: "Requested #", id: "quantity_requested" },
    { name: "Reason for Request", id: "reason" },
    { name: "Current Status", id: "current_status" },
    { name: "Updated Time", id: "time_updated" },
    { name: "Completion Note", id: "completion_note" },
    { name: "Logs", id: "log_button" },
];

const defaultColumns = [
    "time_requested",
    "item_uuid",
    "quantity_requested",
    "reason",
    "requesting_user",
    "current_status",
    "time_updated",
    "completion_note",
    "log_button",
];

const statusOptions = [
    {
        value: RESTOCK_REQUEST_STATUS.PENDING_APPROVAL,
        label: "Pending Approval",
    },
    {
        value: RESTOCK_REQUEST_STATUS.APPROVED_WAITING,
        label: "Approved Waiting",
    },
    {
        value: RESTOCK_REQUEST_STATUS.APPROVED_ORDERED,
        label: "Approved Ordered",
    },
    { value: RESTOCK_REQUEST_STATUS.RESTOCKED, label: "Restocked" },
    { value: RESTOCK_REQUEST_STATUS.DENIED, label: "Denied" },
];

// modal for editor
function ModifyRestockModal({
    restocksSelected,
    editIsOpen,
    editOnOpenChange,
}: {
    restocksSelected: TRestockRequest[];
    editIsOpen: boolean;
    editOnOpenChange: () => void;
}) {
    return (
        <Modal
            isOpen={editIsOpen}
            placement="top-center"
            onOpenChange={editOnOpenChange}
            className="flex flex-col justify-center"
        >
            <ModalContent className="flex flex-col justify-center">
                {(onClose) =>
                    restocksSelected ? (
                        <RestockEditor
                            onClose={onClose}
                            restocks={restocksSelected}
                        />
                    ) : null
                }
            </ModalContent>
        </Modal>
    );
}

function PastStatusLogs({
    restockSelected,
    logsIsOpen,
    logsOnOpenChange,
}: {
    restockSelected: TRestockRequest | null;
    logsIsOpen: boolean;
    logsOnOpenChange: () => void;
}) {
    return (
        //modal holding restock logs content
        <Modal
            isOpen={logsIsOpen}
            placement="top-center"
            onOpenChange={logsOnOpenChange}
            className="flex flex-col justify-center overflow-auto"
            classNames={{
                base: "w-full max-w-3xl overflow-auto",
            }}
        >
            <ModalContent className="overflow-auto">
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            Restock Status Log
                        </ModalHeader>
                        <ModalBody className="overflow-auto">
                            {restockSelected ? (
                                <RestockStatusLogs restock={restockSelected} />
                            ) : (
                                <div>No restock selected</div>
                            )}
                        </ModalBody>
                        <ModalFooter className="flex justify-center">
                            <div className="flex-row gap-2 flex justify-center">
                                <Button color="primary" onPress={onClose}>
                                    Done
                                </Button>
                            </div>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}

function RestockUserSelect({
    restockSelected,
    restockUserIsOpen,
    restockUserOnOpenChange,
    users,
    isLoading,
}: {
    restockSelected: TRestockRequest | null;
    restockUserIsOpen: boolean;
    restockUserOnOpenChange: () => void;
    users: TUser[];
    isLoading: boolean;
}) {
    return (
        <Modal
            isOpen={restockUserIsOpen}
            placement="top-center"
            onOpenChange={restockUserOnOpenChange}
            size="3xl"
            scrollBehavior="inside"
            className="flex flex-col justify-center"
        >
            <ModalContent className="flex flex-col justify-center">
                {(onClose) =>
                    restockSelected ? (
                        <RestockUserList
                            users={users}
                            onClose={onClose}
                            prevRestock={restockSelected}
                            isLoading={isLoading}
                        />
                    ) : null
                }
            </ModalContent>
        </Modal>
    );
}



export default function RestockTable({
    restocks,
    inventory,
    users,
    areas,
    certs,
    isLoading,
}: {
    restocks: TRestockRequest[];
    inventory: TInventoryItem[];
    users: TUser[];
    areas: TArea[];
    certs: TCertification[];
    isLoading: boolean;
}) {
    const [selectedRestocks, setSelectedRestocks] = React.useState<Selection>(
        new Set(),
    );

    const [visibleColumns, setVisibleColumns] = React.useState<Selection>(
        new Set(defaultColumns),
    );

    const [statusFilter, setStatusFilter] = React.useState<Selection>(
        new Set(),
    );

    // The list of items after filtering and sorting

    const filteredRestocks = React.useMemo(() => {
        let filteredRestocks = [...restocks];

        // filtering by status
        if (
            statusFilter !== "all" &&
            statusFilter.size !== 0 &&
            Array.from(statusFilter).length !== statusOptions.length
        ) {
            filteredRestocks = restocks.filter((restock) => {
                return Array.from(statusFilter).includes(
                    String(restock.current_status),
                );
            });
        }

        // sorting by status and then by time updated
        filteredRestocks.sort((a, b) => {
            let statusDiff = a.current_status - b.current_status;
            if (statusDiff !== 0) {
                return statusDiff;
            } else {
                return (
                    (b.status_logs.at(-1)?.timestamp ?? 0) -
                    (a.status_logs.at(-1)?.timestamp ?? 0)
                );
            }
        });
        return filteredRestocks;
    }, [restocks, statusFilter]);

    const [restockSelected, setRestockSelected] =
        React.useState<TRestockRequest | null>(null);

    // Editor for modifying restocks status
    // Modal state for editor
    const {
        isOpen: editIsOpen,
        onOpen: editOnOpen,
        onOpenChange: editOnOpenChange,
    } = useDisclosure(); // Manage modal state

    // Past status logs section
    // Modal state for logs
    const {
        isOpen: logsIsOpen,
        onOpen: logsOnOpen,
        onOpenChange: logsOnOpenChange,
    } = useDisclosure();

    // Past status logs section
    // Modal state for logs
    const {
        isOpen: restockUserIsOpen,
        onOpen: restockUserOnOpen,
        onOpenChange: restockUserOnOpenChange,
    } = useDisclosure();

    // table returned
    return (
        <div className="flex flex-col max-h-full overflow-auto w-full">
            <div className="flex  flex-col content-center items-center">
                <h1 className="text-xl font-bold text-foreground-900 mb-2">
                    Restocks
                </h1>
                <h3 className="text-l text-foreground-900 mb-4">
                    View, approve, and deny restock requests.
                </h3>

                <div className="static mb-4 md:absolute md:right-10 md:top-20 flex gap-2">
                    <Button
                        color="warning"
                        startContent={<PencilSquareIcon className="size-5" />}
                        isDisabled={
                            selectedRestocks !== "all" &&
                            selectedRestocks.size === 0
                        }
                        onPress={editOnOpen}
                    >
                        Edit
                    </Button>
                    <Dropdown>
                        <DropdownTrigger className="hidden sm:flex">
                            <Button
                                color="default"
                                endContent={
                                    <ChevronDownIcon className="size-6" />
                                }
                            >
                                Filter Status
                                <div className="flex flex-row gap-1 m-2">
                                    {statusFilter === "all" ||
                                    statusFilter.size === 0
                                        ? statusOptions.map((status) => (
                                              <RestockType
                                                  request_status={status.value}
                                                  size="sm"
                                              />
                                          ))
                                        : Array.from(statusFilter)
                                              .map(Number)
                                              .sort((a, b) => a - b)
                                              .map((status) => (
                                                  <RestockType
                                                      request_status={status}
                                                      size="sm"
                                                  />
                                              ))}
                                </div>
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu
                            aria-label="Table Columns"
                            closeOnSelect={false}
                            selectedKeys={statusFilter}
                            selectionMode="multiple"
                            onSelectionChange={setStatusFilter}
                        >
                            {statusOptions.map((status) => (
                                <DropdownItem
                                    key={status.value}
                                    className="capitalize"
                                >
                                    <RestockType
                                        request_status={status.value}
                                    />
                                </DropdownItem>
                            ))}
                        </DropdownMenu>
                    </Dropdown>
                </div>
            </div>
            <MAKETable
                key={filteredRestocks.length}
                content={filteredRestocks}
                columns={columns}
                visibleColumns={visibleColumns}
                selectedKeys={selectedRestocks}
                onSelectionChange={setSelectedRestocks}
                multiSelect={true}
                emptyContent={"No Restock Requests Found"}
                customColumnComponents={{
                    reason: (restock) => (
                        <div className="max-w-[15vw] break-words overflow-auto">
                            {restock.reason}
                        </div>
                    ),
                    time_requested: (restock) => (
                        <span>
                            {convertTimestampToDate(
                                restock.status_logs.at(0)?.timestamp,
                            )}
                        </span>
                    ),
                    time_updated: (restock) => (
                        <span>
                            {convertTimestampToDate(
                                restock.status_logs.at(-1)?.timestamp,
                            )}
                        </span>
                    ),
                    completion_note: (restock) => (
                        <span style={{ overflowWrap: "anywhere" }}>
                            {restock.status_logs.at(-1)?.message}
                        </span>
                    ),
                    requesting_user: (restock) => (
                        <div className="flex flex-row gap-2 items-center justify-between items-fit min-w-[10vw]">
                            <Accordion
                                className="py-0"
                                itemClasses={{
                                    trigger: "py-0",
                                    indicator: "size-6",
                                }}
                            >
                                <AccordionItem
                                    startContent={
                                        <UserChip
                                            user_uuid={restock.requesting_user}
                                            popoverPlacement="bottom"
                                            className="w-full justify-start"
                                        />
                                    }
                                    isCompact
                                    textValue="restock mailing list"
                                >
                                    {restock.mailing_list.map((uuid, index) => {
                                        return (
                                            <div className="pb-1 w-[80%]">
                                                <UserChip
                                                    user_uuid={uuid}
                                                    popoverPlacement="bottom"
                                                    className="justify-start w-full"
                                                />
                                            </div>
                                        );
                                    })}
                                    <div className="w-full flex  py-1">
                                        <Button
                                            color="primary"
                                            size="sm"
                                            onPress={() => {
                                                setRestockSelected(restock);
                                                restockUserOnOpen();
                                            }}
                                            className="w-full"
                                            startContent={
                                                <UserPlusIcon className="size-5" />
                                            }
                                        >
                                            Add User
                                        </Button>
                                    </div>
                                </AccordionItem>
                            </Accordion>
                        </div>
                    ),
                    item_uuid: (restock) => (
                        <div>
                            <ItemInfo
                                key={restock.item_uuid + "-" + inventory.length}
                                item_data={inventory.find(
                                    (item) => item.uuid === restock.item_uuid,
                                )}
                                areas={areas}
                                certs={certs}
                            />
                        </div>
                    ),
                    current_status: (restock) => (
                        <div>
                            <RestockType
                                request_status={restock.current_status}
                            />
                        </div>
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
                        ></Button>
                    ),
                }}
                isLoading={isLoading}
                loadingContent={(ref) => (
                    <div className="flex w-full justify-center">
                        <Spinner color="white" ref={ref} />
                    </div>
                )}
            />

            <ModifyRestockModal
                restocksSelected={
                    selectedRestocks === "all"
                        ? filteredRestocks
                        : filteredRestocks.filter((r) =>
                              selectedRestocks.has(r.uuid),
                          )
                }
                editIsOpen={editIsOpen}
                editOnOpenChange={editOnOpenChange}
            />
            <PastStatusLogs
                restockSelected={restockSelected}
                logsIsOpen={logsIsOpen}
                logsOnOpenChange={logsOnOpenChange}
            />
            <RestockUserSelect
                restockSelected={restockSelected}
                restockUserIsOpen={restockUserIsOpen}
                restockUserOnOpenChange={restockUserOnOpenChange}
                users={users}
                isLoading={isLoading}
            />
        </div>
    );
}
