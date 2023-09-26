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
    const current = document.getElementById("checkouts-current");
    const history = document.getElementById("checkouts-history");

    removeAllChildren(current);
    removeAllChildren(history);
    current.innerHTML = "<h2>Current Checkouts</h2>";
    history.innerHTML = "<h2>Previous Checkouts</h2>";

    if (state.user_checkouts === null) {
        return;
    }

    let l = JSON.parse(JSON.stringify(state.user_checkouts));

    l.reverse();

    current.appendChild(createCheckoutHeader());
    history.appendChild(createCheckoutHeader());

    for (let checkout of l) {
        if (!checkout.timestamp_in) {
            current.appendChild(createCheckoutDiv(checkout));
        } else {
            history.appendChild(createCheckoutDiv(checkout));
        }
    }
}

// Create table header for checkouts
// - Checked out time
// - Checked in time/expected return time
// - Items
// - Times notified
// - Name
// - If in kiosk mode, check in button
function createCheckoutHeader(kiosk_mode=false, timestamp_in=false) {
    let div = document.createElement("div");
    div.classList.add("checkout-header");
    div.classList.add("checkout-entry");

    if (timestamp_in) {
        div.classList.add("checked-in");
    }

    if (kiosk_mode) {
        div.classList.add("kiosk-mode");
    }

    let t_out = document.createElement("div");
    t_out.classList.add("t-out");
    div.appendChild(t_out);

    let t_in = document.createElement("div");
    t_in.classList.add("t-in");
    if (timestamp_in) {
        t_in.classList.add("checked-in");
    } else {
        t_in.classList.add("checked-out");
    }
    div.appendChild(t_in);

    let item_name = document.createElement("div");
    item_name.classList.add("checkout-entry-items");
    item_name.innerHTML = "Items";
    div.appendChild(item_name);

    let times_notified = document.createElement("div");
    times_notified.classList.add("checkout-entry-times-notified");
    times_notified.innerHTML = "Times Notified";
    div.appendChild(times_notified);
    
    if (kiosk_mode) {
        let name = document.createElement("div");
        name.classList.add("checkout-entry-name");
        name.innerHTML = "Name";
        div.appendChild(name);
    }

    if (kiosk_mode && !timestamp_in) {
        let extend = document.createElement("div");
        extend.classList.add("checkout-entry-extend");
        extend.innerHTML = "Extend";
        div.appendChild(extend);

        let check_in = document.createElement("div");
        check_in.classList.add("checkout-entry-check-in");
        check_in.innerHTML = "Check In";
        div.appendChild(check_in);
    }

    return div;
}

// Get date as .toLocaleString() but with <br> instead of comma.
// Then convert a timestamp like 3/25/2023, 12:17:09 PM
// to 3/25/2023 <br> 12:17 PM
function checkoutFormatDate(date) {
    let date_str = date.toLocaleString().replace(", ", "<br>");
    let date_arr = date_str.split(":");

    let time = date_arr[0] + ":" + date_arr[1] + " " + date_arr[2].split(" ")[1];

    return time;
}

function createCheckoutDiv(checkout, kiosk_mode = false) {
    let div = document.createElement("div");
    div.id = "checkout-" + checkout.uuid;
    div.classList.add("checkout-entry");

    let t_out_info = document.createElement("div");
    t_out_info.classList.add("t-out-info");

    t_out_info.innerHTML = ` ${checkoutFormatDate(new Date(checkout.timestamp_out * 1000))}`;
    div.appendChild(t_out_info);

    let t_in_info = document.createElement("div");
    t_in_info.classList.add("t-in-info");
    if (checkout.timestamp_in !== null) {
        t_in_info.innerHTML = ` ${checkoutFormatDate(new Date(checkout.timestamp_in * 1000).toLocaleString())}`;
    } else {
        t_in_info.innerHTML = ` ${checkoutFormatDate(new Date(checkout.timestamp_due * 1000).toLocaleString())}`;
    }
    div.appendChild(t_in_info);


    let item_name = document.createElement("div");
    item_name.classList.add("checkout-entry-items");

    for (let uuid of Object.keys(checkout.items)) {
        let item_div = document.createElement("div");
        item_div.classList.add("checkout-entry-item");
        let name = (state.inventory.find((item) => item.uuid === uuid) ?? {name:""}).name;

        item_div.innerHTML = `${checkout.items[uuid]}x ${name ?? `[${uuid}]`}`;
        item_name.appendChild(item_div);
    }
    div.appendChild(item_name);

    let times_notified = document.createElement("div");
    times_notified.classList.add("checkout-entry-times-notified");
    times_notified.innerHTML = `Emails sent: <b>${checkout.notifications_sent}</b>`;
    div.appendChild(times_notified);

    if (!kiosk_mode) {
        if (checkout.timestamp_in) {
            div.classList.add("checked-in");
        }
    }

    if (kiosk_mode) {
        div.classList.add("kiosk-mode");

        let name = document.createElement("div");
        name.classList.add("checkout-entry-name");

        if (state.users !== null) {
            let user = state.users.find((user) => user.uuid === checkout.checked_out_by);
            
            name.innerHTML = `${user.name ?? checkout.checked_out_by}`;
        } else {
            name.innerHTML = `${checkout.checked_out_by}`;
        }

        div.appendChild(name);
        if (checkout.timestamp_in) {
            div.classList.add("checked-in");
        } else {
            let extend_button = document.createElement("button");
            extend_button.classList.add("extend-button");
            extend_button.innerHTML = "+ 24 Hours";
            extend_button.onclick = () => {
                extendCheckout(checkout.uuid);
            }

            div.appendChild(extend_button);

            let check_in_button = document.createElement("button");
            check_in_button.classList.add("check-in-button");
            check_in_button.innerHTML = "Check In";
            check_in_button.onclick = () => {
                checkIn(checkout.uuid);
            }

            div.appendChild(check_in_button);

        }

    }

    return div;
}
