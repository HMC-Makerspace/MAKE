import { TCheckout } from "common/checkout";
import { TInventoryItem } from "common/inventory";

// TODO: probably improve this to take a Checkout object itself and do more with it
const ExpiredCheckoutTemplate = (
    checkout_obj: TCheckout,
    items: TInventoryItem[],
) => (
    <>
        <h1>Item Checkout Notification</h1>
        <p>
            Your checkout of the following items has not been checked back in:
            <br />
            <ul>
                {items.map((item) => (
                    <li>{item.name}</li>
                ))}
            </ul>
            <br />
            Please check these tools back in as soon as possible.
        </p>

        <footer>
            <i>This email was sent automatically by MAKE</i>
        </footer>
    </>
);

export default ExpiredCheckoutTemplate;
