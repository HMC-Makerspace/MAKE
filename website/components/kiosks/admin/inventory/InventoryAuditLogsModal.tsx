import { TInventoryItem } from "common/inventory";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
} from "@heroui/react";
import { convertTimestampToDate } from "../../../../utils";

const columns = [
    { name: "Timestamp", id: "timestamp" },
    { name: "Description", id: "description" },
];

export default function InventoryAuditLogsModal({
    item,
    isOpen,
    onOpenChange,
}: {
    item: TInventoryItem;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}) {
    // Sort the status logs
    const sortedLogs = (item.audit_logs ?? []).sort(
        (a, b) => b.timestamp - a.timestamp,
    );

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            backdrop="blur"
            size="lg"
            placement="center"
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader>{item.name} Audit Logs</ModalHeader>
                        <ModalBody>
                            <div className="max-h-[400px] overflow-y-auto">
                                <Table
                                    isHeaderSticky
                                    aria-label="A table for restock status logs"
                                >
                                    <TableHeader>
                                        {columns.map((column) => (
                                            <TableColumn key={column.id}>
                                                {column.name}
                                            </TableColumn>
                                        ))}
                                    </TableHeader>

                                    <TableBody
                                        emptyContent={"No audits for this item"}
                                    >
                                        {sortedLogs.map((statusLog) => (
                                            <TableRow key={statusLog.timestamp}>
                                                <TableCell>
                                                    {convertTimestampToDate(
                                                        statusLog.timestamp,
                                                    ).toString()}
                                                </TableCell>

                                                <TableCell>
                                                    {statusLog.description ? (
                                                        statusLog.description
                                                    ) : (
                                                        <i>No message</i>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </ModalBody>

                        <ModalFooter className="w-full justify-center">
                            <Button
                                variant="shadow"
                                color="primary"
                                onPress={onClose}
                            >
                                Done
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
