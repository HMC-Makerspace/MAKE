// TODO: probably improve this to take a Checkout object itself and do more with it
const ExpiredCheckoutTemplate = (text_list: string[]) => (
    <>
        <h1>Tool Checkout Notification</h1>
        <p>
            Your checkout of the following tools have not been checked back in:
            <br />
            <ul>
                {text_list.map((text) => (
                    <li>{text}</li>
                ))}
            </ul>
            <br />
            Please check these tools back in during steward hours at the
            Makerspace.
        </p>

        <footer>
            <i>This email was sent automatically by MAKE</i>
        </footer>
    </>
);

export default ExpiredCheckoutTemplate;
