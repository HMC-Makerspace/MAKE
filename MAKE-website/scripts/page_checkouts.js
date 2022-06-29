function renderCheckouts() {
    const current = document.getElementById("checkouts-current");
    const history = document.getElementById("checkouts-history");

    removeAllChildren(current);
    removeAllChildren(history);

    if (state.user_object === null) {
        return;
    }

    for (let checkout of state.user_object.all_checkouts) {
        if (checkout.checked_in) {
            current.appendChild(createCheckDiv(checkout));
        } else {
            history.appendChild(createCheckDiv(checkout));
        }
    }
}

function createCheckDiv(checkout) {
    let div = document.createElement("div");
        div.classList.add("checkout-entry");

        let timestamp = document.createElement("div");
        timestamp.classList.add("checkout-entry-timestamp");
        timestamp.innerText = new Date(checkout.timestamp_start).toLocaleString();

        let item_name = document.createElement("div");
        item_name.classList.add("checkout-entry-item-name");
        item_name.innerText = checkout.item_name;

        let item_uuid = document.createElement("div");
        item_uuid.classList.add("checkout-entry-item-uuid");
        item_uuid.innerText = checkout.item_uuid ?? "";

        let checked_in = document.createElement("div");
        checked_in.classList.add("checkout-entry-checked");
        checked_in.classList.add("checked-" + (checkout.checked_in ? "in" : "out"));
        checked_in.innerText = checkout.checked_in ? "Checked In" : "Checked Out";
        

        div.appendChild(timestamp);
        div.appendChild(item_name);
        div.appendChild(item_uuid);
        div.appendChild(checked_in);
}