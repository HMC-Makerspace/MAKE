function renderCheckouts() {
    const current = document.getElementById("checkouts-current");
    const history = document.getElementById("checkouts-history");

    removeAllChildren(current);
    removeAllChildren(history);
    current.innerHTML = "<h2>Current Checkouts</h2>";
    history.innerHTML = "<h2>Previous Checkouts</h2>";

    if (state.user_object === null) {
        return;
    }

    let l = JSON.parse(JSON.stringify(state.user_object.all_checkouts));

    l.reverse();

    for (let checkout of l) {
        if (!checkout.checked_in) {
            current.appendChild(createCheckDiv(checkout));
        } else {
            history.appendChild(createCheckDiv(checkout));
        }
    }
}

function createCheckDiv(checkout) {
    let div = document.createElement("div");
    div.classList.add("checkout-entry");

    let t_out = document.createElement("div");
    t_out.classList.add("t-out");
    t_out.innerHTML = `Checked out`;
    div.appendChild(t_out);
    let t_out_info = document.createElement("div");
    t_out_info.classList.add("t-out-info");
    t_out_info.innerHTML = ` ${new Date(checkout.timestamp_checked_out * 1000).toLocaleString()}`;
    div.appendChild(t_out_info);

    let t_in = document.createElement("div");
    t_in.classList.add("t-in");
    if (checkout.checked_in) {
        t_in.innerHTML = `Checked in`;
    } else {
        t_in.innerHTML = `Expires`;
    }
    div.appendChild(t_in);
    let t_in_info = document.createElement("div");
    t_in_info.classList.add("t-in-info");
    if (checkout.checked_in) {
        t_in_info.innerHTML = ` ${new Date(checkout.timestamp_checked_in * 1000).toLocaleString()}`;
    } else {
        t_in_info.innerHTML = ` ${new Date(checkout.timestamp_expires * 1000).toLocaleString()}`;
    }
    div.appendChild(t_in_info);


    let item_name = document.createElement("div");
    item_name.classList.add("checkout-entry-items");

    for (let item of checkout.items) {
        let item_div = document.createElement("div");
        item_div.classList.add("checkout-entry-item");
        item_div.innerHTML = `${item}`;
        item_name.appendChild(item_div);
    }
    
    div.appendChild(item_name);

    return div;
}