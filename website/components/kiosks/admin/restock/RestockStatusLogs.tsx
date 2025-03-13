import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
} from "@heroui/react";
import {
    TRestockRequest,
    RESTOCK_REQUEST_STATUS_LABELS,
} from "../../../../../common/restock";
import { convertTimestampToDate } from "../../../../utils";

const columns = [
    { name: "Timestamp", id: "timestamp" },
    { name: "Status", id: "status" },
    { name: "Message", id: "message" },
];

//converting timestamp to date
export function convertTimestampToDate(timestamp?: number): string {
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
    // sort the status logs
    const sortedLogs = restock.status_logs.sort(
        (a, b) => b.timestamp - a.timestamp,
    );

    return (
        <Table
            isHeaderSticky
            aria-label="A table for restock status logs"
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
                {sortedLogs.map((statusLog) => (
                    <TableRow key={statusLog.timestamp}>
                        <TableCell>
                            {convertTimestampToDate(statusLog.timestamp)}
                        </TableCell>
                        <TableCell>
                            {
                                RESTOCK_REQUEST_STATUS_LABELS[statusLog.status]
                                    .label
                            }
                        </TableCell>
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
