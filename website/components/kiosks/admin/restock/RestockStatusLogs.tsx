import {

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
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    getKeyValue,
} from "@heroui/react";
import { RESTOCK_REQUEST_STATUS, TRestockRequest, TRestockRequestLog } from "../../../../../common/restock";
import { useInfiniteScroll } from "@heroui/use-infinite-scroll";


import MAKETable from "../../../Table";
import React from "react"

const columns = [
    { name: "Timestamp", id: "timestamp" },
    { name: "Status", id: "status"},
    { name: "Message", id: "message" }
];

const statusType = ["Pending Approval", "Approved Waiting", "Approved Ordered", "Restocked", "Denied"];

export default function RestockStatusLog({onClose, restock} : {onClose:() => void; restock: TRestockRequest}) {
    // getting the status logs
    const statusLogs = restock.status_logs.sort((a, b) => b.timestamp - a.timestamp);
    
    //converting timestamp to date
    function convertTimestampToDate(timestamp?: number): string {
        if (!timestamp) {
            return "N/A";
        }
        return new Date((timestamp) * 1000).toLocaleString();
    }

    return (
        <>
            <ModalHeader className="flex flex-col gap-1">Restock Status Log</ModalHeader>
                <ModalBody>
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
                                    <TableCell>{convertTimestampToDate(statusLog.timestamp)}</TableCell>
                                    <TableCell>{statusType[statusLog.status]}</TableCell>
                                    <TableCell>{statusLog.message ? statusLog.message : "No message"}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ModalBody>

                <ModalFooter className="flex justify-center">
                    <div className='flex-row gap-2 flex justify-center'>
                        <Button color="primary" onPress={onClose} >
                            Done
                        </Button>
                        
                    </div>
                </ModalFooter>
            
        </>
    )
}