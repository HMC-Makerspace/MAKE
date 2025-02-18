import { Card } from "@heroui/react";
import clsx from "clsx";
import {
    RESTOCK_REQUEST_STATUS,
    RESTOCK_REQUEST_STATUS_LABELS,
} from "../../../../../common/restock";

export default function RestockType({
    request_status,
    size = "md",
}: {
    request_status: RESTOCK_REQUEST_STATUS;
    size?: "sm" | "md";
}) {
    // card colors
    const type_colors = {
        [RESTOCK_REQUEST_STATUS.PENDING_APPROVAL]: "bg-default-400",
        [RESTOCK_REQUEST_STATUS.APPROVED_WAITING]: "bg-warning-400",
        [RESTOCK_REQUEST_STATUS.APPROVED_ORDERED]: "bg-primary-400",
        [RESTOCK_REQUEST_STATUS.RESTOCKED]: "bg-success-400",
        [RESTOCK_REQUEST_STATUS.DENIED]: "bg-danger-400",
    };

    // if it is a card (medium), return a card, else return a small circle
    if (size === "md") {
        return (
            <Card
                className={clsx([
                    "p-1.5 flex flex-row gap-1 w-fit px-2.5",
                    type_colors[request_status],
                ])}
            >
                <h1
                    style={{
                        color: "black",
                    }}
                >
                    {RESTOCK_REQUEST_STATUS_LABELS[request_status].short_label}
                </h1>
            </Card>
        );
    } else {
        // size === "sm"
        return (
            <div
                className={clsx([
                    "w-5 h-5 rounded-full",
                    type_colors[request_status],
                ])}
            ></div>
        );
    }
}
