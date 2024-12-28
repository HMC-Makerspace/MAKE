// TODO: Update this based on the new restock request format
const RestockRequestTemplate = (
    name: string,
    date: string,
    item: string,
    approved_or_denied: string,
) => (
    <>
        <h1>Completed Restock Request</h1>
        <p>
            Hello {name},
            <br />
            <br />
            Your restock request you submitted on {date} for:
            <br />
            {item}
            <br />
            has been {approved_or_denied}.
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

export default RestockRequestTemplate;
