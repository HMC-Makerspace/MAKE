import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
} from "@heroui/react";
import { TRestockRequest } from "../../../../../common/restock";

const columns = [
    { name: "Timestamp", id: "timestamp" },
    { name: "Status", id: "status" },
    { name: "Message", id: "message" },
];

const statusType = [
    "Pending Approval",
    "Approved Waiting",
    "Approved Ordered",
    "Restocked",
    "Denied",
];

//converting timestamp to date
function convertTimestampToDate(timestamp?: number): string {
    if (!timestamp) {
        return "N/A";
    }
    return new Date(timestamp * 1000).toLocaleString();
}

export default function RestockStatusLog({
    restock,
}: {
    restock: TRestockRequest;
}) {
    // getting the status logs
    const statusLogs = restock.status_logs.sort(
        (a, b) => b.timestamp - a.timestamp,
    );

    return (
        <Table
            isHeaderSticky
            aria-label="A table for content"
            classNames={{
                base: "max-h-full overflow-auto",
            }}
        >
            <TableHeader>
                {columns.map((column) => (
                    <TableColumn key={column.id}>{column.name}</TableColumn>
                ))}
            </TableHeader>
            <TableBody>
                {statusLogs.map((statusLog) => (
                    <TableRow key={statusLog.timestamp}>
                        <TableCell>
                            {convertTimestampToDate(statusLog.timestamp)}
                        </TableCell>
                        <TableCell>{statusType[statusLog.status]}</TableCell>
                        <TableCell>
                            {statusLog.message ? (
                                statusLog.message
                            ) : (
                                <i>No message</i>
                            )}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
