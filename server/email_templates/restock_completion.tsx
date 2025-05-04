import { TInventoryItem } from "common/inventory";
import { RESTOCK_REQUEST_STATUS_LABELS, TRestockRequest } from "common/restock";
import { TUser } from "common/user";

// TODO: Update this based on the new restock request format
export function RestockRequestTemplate(
    restock: TRestockRequest,
    user: TUser,
    item: TInventoryItem,
) {
    // Logs are sorted by time
    const initial_timestamp = restock.status_logs[0].timestamp * 1000;
    const initial_date = new Date(initial_timestamp);
    const latest_log = restock.status_logs[restock.status_logs.length - 1];
    return (
        <>
            <h1>Updated Restock Request</h1>
            <p>
                Hello {user.name},
                <br />
                <br />
                The status of the restock request you submitted on{" "}
                {initial_date.toDateString()} for:
                <br />
                <span style={{ paddingLeft: "16px", fontWeight: 700 }}>
                    {item.name}
                </span>
                <br />
                has been updated.
                <br />
                <br />
                <span
                    style={{
                        paddingLeft: "16px",
                    }}
                >
                    New status:{" "}
                    <span style={{ fontWeight: 700 }}>
                        {
                            RESTOCK_REQUEST_STATUS_LABELS[latest_log.status]
                                .short_label
                        }
                    </span>
                    {latest_log.message ? (
                        <span>
                            <br />
                            <span
                                style={{
                                    paddingLeft: "16px",
                                }}
                            >
                                Message: <i>{latest_log.message}</i>
                            </span>
                        </span>
                    ) : (
                        ""
                    )}
                </span>
                <br />
                <br />
                Thank you,
                <br />
                Makerspace Management
            </p>

            <footer>
                <i>This email was sent automatically by MAKE</i>
            </footer>
        </>
    );
}

export default RestockRequestTemplate;
