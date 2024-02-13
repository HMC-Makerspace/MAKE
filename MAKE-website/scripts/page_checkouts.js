async function fetchCheckouts() {
    if (state.user_object === null) {
        return;
    }

    const response = await fetch(`${API}/checkouts/get_checkouts_for_user/${state.user_object.uuid}`);

    if (response.status == 200) {
        const checkouts = await response.json();

        state.user_checkouts = checkouts;

        saveState();

        renderCheckouts();
    }
}

function renderCheckouts() {
    if (state.user_checkouts === null) {
        return;
    }

    const container = document.getElementById("checkouts");
    removeAllChildren(container);

    // Add current checkouts
    let current = document.createElement("div");
    current.id = "current-checkouts";
    current.classList.add("checkouts-section");
    current.innerHTML = "<h2>Current Checkouts</h2>";

    container.appendChild(current);

    container.appendChild(createUserCheckoutTable(current = true));

    // Add checkout history
    let history = document.createElement("div");
    history.id = "checkout-history";
    history.classList.add("checkouts-section");
    history.innerHTML = "<h2>Checkout History</h2>";
    container.appendChild(history);

    container.appendChild(createUserCheckoutTable(current = false));
}

function createUserCheckoutTable(current = true) {
    let table = document.createElement("table");
    table.classList.add("checkout-table");

    let out_icon = `<span class="material-symbols-outlined">shopping_cart_checkout</span>`;
    let in_icon = `<span class="material-symbols-outlined">keyboard_return</span>`;
    let due_icon = `<span class="material-symbols-outlined">event_upcoming</span>`

    let checkouts;
    let header;

    if (!current) {
        checkouts = state.user_checkouts.filter((checkout) => checkout.timestamp_in !== null);
        header = `<tr><th>${out_icon}</th><th>${in_icon}</th><th>Items</th><th>Times Notified</th></tr>`;
    } else {
        checkouts = state.user_checkouts.filter((checkout) => checkout.timestamp_in === null);
        header = `<tr><th>${out_icon}</th><th>${due_icon}</th><th>Items</th><th>Times Notified</th></tr>`;
    }

    table.innerHTML = header;

    // Reverse checkouts
    checkouts = checkouts.reverse();

    for (let checkout of checkouts) {
        let row = document.createElement("tr");

        let t_out = document.createElement("td");
        t_out.innerHTML = checkoutFormatDate(new Date(checkout.timestamp_out * 1000));
        row.appendChild(t_out);

        let t_due = document.createElement("td");
        if (checkout.timestamp_in !== null) {
            t_due.innerHTML = checkoutFormatDate(new Date(checkout.timestamp_in * 1000));
        } else {
            t_due.innerHTML = checkoutFormatDate(new Date(checkout.timestamp_due * 1000));
        }

        let items = document.createElement("td");
        items.classList.add("checkout-entry-items");
        for (let uuid of Object.keys(checkout.items)) {
            let item_div = document.createElement("div");
            item_div.classList.add("checkout-entry-item");
            let name = (state.inventory.find((item) => item.uuid === uuid) ?? { name: "" }).name;

            item_div.innerHTML = `${checkout.items[uuid]}x ${name ?? `[${uuid}]`}`;
            items.appendChild(item_div);
        }

        let times_notified = document.createElement("td");
        times_notified.innerHTML = `Emails sent: <b>${checkout.notifications_sent}</b>`;

        row.appendChild(t_out);
        row.appendChild(t_due);
        row.appendChild(items);
        row.appendChild(times_notified);

        table.appendChild(row);
    }

    return table;
}