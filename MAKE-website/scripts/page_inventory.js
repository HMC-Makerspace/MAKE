const search_options = {
    limit: 1000, // don't return more results than you need!
    allowTypo: true, // if you don't care about allowing typos
    threshold: -10000, // don't return bad results
    keys: ['name', 'specific_name', 'serial_number', 'model_number', 'brand', 'qr_code', 'kit'], // keys to search
    all: true,
}

async function fetchInventory(kiosk_mode = false) {
    const response = await fetch(`${API}/inventory/get_inventory`);

    if (response.status == 200) {
        const inventory = await response.json();

        state.inventory = inventory;

        inventory.forEach((element, index) => {
            element.index = index;
        });

        if (!kiosk_mode) {
            saveState();
        }
    }
}

function submitSearch(kiosk_mode = false) {
    const search = document.getElementById("inventory-search-input").value;

    const filters = getInventoryFilters();

    const search_results = searchInventory(search, filters, kiosk_mode);
    const search_divs = generateInventoryDivs(search_results, kiosk_mode);

    state.current_search_results = search_divs;

    const results = document.getElementById("inventory-results");

    removeAllChildren(results);
    appendChildren(results, state.current_search_results.slice(0, 20));
    if (kiosk_mode === true) {
        updateSelectedItems();
    }

    results.addEventListener("scroll", () => {
        if (results.scrollTop + results.clientHeight >= results.scrollHeight - 5) {
            // 20 more results
            const new_divs = state.current_search_results.slice(results.childElementCount, results.childElementCount + 20);
            appendChildren(results, new_divs);
        }
    })
}

function getInventoryFilters() {
    const filters = {
        stock: document.getElementById("inventory-in-stock").checked,
        room: document.getElementById("room-select").value,
        tool_material: document.getElementById("tool-material-select").value,
    }

    return filters;
}

function searchInventory(search, filters = null, kiosk_mode = false) {
    let results = fuzzysort.go(search, state.inventory, search_options);

    results.sort((a, b) => b.score - a.score);

    // If in kiosk mode, sort by number of times checked out
    if (kiosk_mode === true) {
        results.sort((a, b) =>  b.obj.num_times_checked - a.obj.num_times_checked);
    }

    if (filters !== null) {
        const results_filtered = results.filter(result => {
            const item = result.obj;

            if (filters.stock && item.quantity == 0) {
                return false;
            }

            if (filters.room && item.location_room !== filters.room) {
                return false;
            }

            if (filters.tool_material && item.is_material !== (filters.tool_material === "M")) {
                return false;
            }

            return true;

        });

        return results_filtered;
    }

    return results;
}

function generateInventoryDivs(results, kiosk_mode = false) {
    const divs = [];

    divs.push(generateInventoryHeader(kiosk_mode));

    for (let i = 0; i < results.length; i++) {
        divs.push(generateInventoryDiv(results[i], kiosk_mode));
    }

    return divs;
}

function generateInventoryHeader(kiosk_mode = false) {
    const div = document.createElement("div");
    div.classList.add("inventory-result");
    div.classList.add("header");
    if (kiosk_mode === true) {
        div.classList.add("kiosk-mode");
    }

    const header = document.createElement("div");
    header.classList.add("inventory-result-main");
    header.classList.add("inventory-header");

    if (kiosk_mode === true) {
        header.classList.add("kiosk-mode");
    }

    const name = document.createElement("div");
    name.classList.add("inventory-header-name");
    name.innerHTML = "Name";

    const tool_material = document.createElement("div");
    tool_material.classList.add("inventory-header-tool-material");
    tool_material.innerHTML = "Type";

    const location = document.createElement("div");
    location.classList.add("inventory-header-location");
    location.innerHTML = "Location";

    const quantity = document.createElement("div");
    quantity.classList.add("inventory-header-quantity");
    quantity.innerHTML = "Quantity";

    const more_details = document.createElement("div");
    more_details.classList.add("inventory-header-more-details");
    more_details.innerHTML = "Details";

    header.appendChild(name);
    header.appendChild(tool_material);
    header.appendChild(location);
    header.appendChild(quantity);
    header.appendChild(more_details);

    div.appendChild(header);
    return div;
}

function generateInventoryDiv(result, kiosk_mode = false) {
    let div = document.createElement("div");
    div.classList.add("inventory-result");

    if (kiosk_mode === true) {
        div.classList.add("kiosk-mode");
    }

    const item = result.obj;

    div.id = `inventory-result-${item.uuid}`;

    if (item.is_kit === true) {
        div.classList.add("kit");

        const kit_div = document.createElement("div");
        kit_div.classList.add("kit-div");
        kit_div.innerHTML = "Kit";
        div.appendChild(kit_div);
    }

    const main_div = document.createElement("div");
    main_div.classList.add("inventory-result-main");

    const name = document.createElement("div");
    name.classList.add("inventory-result-name");
    name.innerText = item.name;
    main_div.appendChild(name);

    // Add aria label for name
    div.setAttribute("aria-label", item.name);

    if (item.is_kit === true) {
        const kit_items = document.createElement("div");
        kit_items.classList.add("kit-items");
        for (let kit_item of item.kit_items) {
            const kit_item_div = document.createElement("div");
            kit_item_div.classList.add("kit-item");
            kit_item_div.innerText = kit_item;
            kit_items.appendChild(kit_item_div);
        }
        main_div.appendChild(kit_items);
    } else {
        const tool_material = document.createElement("div");
        tool_material.classList.add("inventory-result-tool-material");
        tool_material.classList.add(item.is_material ? "material" : "tool");
        tool_material.title = item.is_material ? "Material" : "Tool";
        main_div.appendChild(tool_material);
    }


    const location = document.createElement("div");
    location.classList.add("inventory-result-location");
    location.innerHTML = `<span class="room">${item.location_room}</span> <span class="area">${item.location_specific}</span>`;
    main_div.appendChild(location);


    if (item.kit_contents == null) {
        const quantity = document.createElement("div");
        quantity.classList.add("inventory-result-quantity");

        if (item.quantity >= 0) {
            quantity.classList.add("number");
            if (item.checked_quantity > 0) {
                quantity.innerText = `${item.quantity - item.checked_quantity}/${item.quantity}`;
            } else {
                quantity.innerText = `${item.quantity}`;
            }
        } else {
            switch (item.quantity) {
                case "-1":
                    quantity.classList.add("low");
                    quantity.innerText += "Low";
                    break;
                case "-2":
                    quantity.classList.add("medium");
                    quantity.innerText += "Medium";
                    break;
                case "-3":
                    quantity.classList.add("high");
                    quantity.innerText += "High";
                    break;
                default:
                    quantity.classList.add("unknown");
                    quantity.innerText += item.quantity;
                    break;
            }
        }
        main_div.appendChild(quantity);
    }

    const lower_div = document.createElement("div");
    lower_div.id = `inventory-result-${item.index}-lower-div`;
    lower_div.classList.add("inventory-result-lower");
    lower_div.classList.add("not-shown");

    if (item.serial_number !== null) {
        const serial_number = document.createElement("div");
        serial_number.classList.add("inventory-result-lower-detail");
        serial_number.innerText = `Serial Number: ${item.serial_number}`;
        lower_div.appendChild(serial_number);
    }

    if (item.model_number !== null) {
        const model_number = document.createElement("div");
        model_number.classList.add("inventory-result-lower-detail");
        model_number.innerText = `Model Number: ${item.model_number}`;
        lower_div.appendChild(model_number);
    }

    if (item.specific_name !== null) {
        const specific_name = document.createElement("div");
        specific_name.classList.add("inventory-result-lower-detail");
        specific_name.innerText = `Specific Name: ${item.specific_name}`;
        lower_div.appendChild(specific_name);
    }

    if (item.brand !== null) {
        const brand = document.createElement("div");
        brand.classList.add("inventory-result-lower-detail");
        brand.innerText = `Brand: ${item.brand}`;
        lower_div.appendChild(brand);
    }

    if (item.qr_code !== null) {
        const qr_code = document.createElement("div");
        qr_code.classList.add("inventory-result-lower-detail");
        qr_code.innerText = `QR Code(s): ${item.qr_code}`;
        lower_div.appendChild(qr_code);
    }

    const show_lower_div_button = document.createElement("button");
    show_lower_div_button.classList.add("inventory-result-show-lower-div");
    show_lower_div_button.classList.add("grayed-out");
    // Add aria label to button
    show_lower_div_button.setAttribute("aria-label", "Show more information about this item");

    if (lower_div.childNodes.length > 0) {
        show_lower_div_button.classList.remove("grayed-out");
        show_lower_div_button.addEventListener("click", () => {
            const lower_div = document.getElementById(`inventory-result-${item.index}-lower-div`);
            lower_div.classList.toggle("not-shown");
            show_lower_div_button.classList.toggle("flipped");
        });
    }

    main_div.appendChild(show_lower_div_button);

    if (kiosk_mode === true) {
        // Add checkout button
        const checkout_buttons = document.createElement("div");
        checkout_buttons.classList.add("inventory-result-checkout-container");

        const checkout_button_more = document.createElement("button");
        checkout_button_more.classList.add("inventory-result-checkout-more");
        checkout_button_more.innerText = "+";
        checkout_button_more.addEventListener("click", () => {
            addToCart(item.uuid);
        });

        const checkout_button_less = document.createElement("button");
        checkout_button_less.classList.add("inventory-result-checkout-less");
        checkout_button_less.innerText = "-";
        checkout_button_less.addEventListener("click", () => {
            removeFromCart(item.uuid);
        });

        checkout_buttons.appendChild(checkout_button_less);
        checkout_buttons.appendChild(checkout_button_more);

        main_div.appendChild(checkout_buttons);
    }

    div.appendChild(main_div);
    div.appendChild(lower_div);

    return div;
}


function hideRestock() {
    document.getElementById("restock-dialog").classList.add("hidden");
}

function showRestock() {
    const els = document.getElementById("restock-inputs").getElementsByTagName("input");

    for (let el of els) {
        el.value = "";
        el.classList.remove("error");
        el.classList.remove("success");
    }

    document.getElementById("restock-dialog").classList.remove("hidden");
}

async function submitRestockNotice() {
    const inputs = document.getElementById("restock-inputs").getElementsByTagName("input");

    const email = inputs[0].value;
    const name = inputs[1].value;
    const current_quantity = inputs[2].value;
    const requested_quantity = inputs[3].value;
    const notes = inputs[4].value;

    let is_error = false;

    if (email === "") {
        inputs[0].classList.add("error");
        is_error = true;
    }

    if (name.trim() === "") {
        inputs[1].classList.add("error");
        is_error = true;
    }

    if (current_quantity.trim() === "") {
        inputs[2].classList.add("error");
        is_error = true;
    }

    if (requested_quantity.trim() === "") {
        inputs[3].classList.add("error");
        is_error = true;
    }

    if (is_error === true) {
        setTimeout(() => {
            for (let el of inputs) {
                el.classList.remove("error");
            }
        }, 400);
        return;
    }

    const body = JSON.stringify({
        name: name,
        current_quantity: current_quantity,
        requested_quantity: requested_quantity,
        notes: notes,
        notified: false,
        email: email,
        authorized: api_key_exists,
    });

    const response = await fetch(`${API}/inventory/add_restock_notice`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: body,
    });
    

    if (response.status >= 200 && response.status < 300) {
        for (let input of inputs) {
            input.classList.add("success")
        }

        setTimeout(() => {
            hideRestock();
            fetchInventory(kiosk_mode = true);
        }, 400);
    } else {
        alert(result.message);
    }
}