const search_options = {
    // Previous limit was 1000 and loading times were perfectly fine,
    // but we only have ~1200 total items so no limit is needed
    // limit: 1500, 
    allowTypo: true, // if you don't care about allowing typos
    threshold: -10000, // don't return bad results
    keys: ['name', 'long_name', 'serial_number', 'keywords'], // keys to search
    all: true,
}

async function fetchInventory(kiosk_mode = false | "inventory_editor" | "checkout" | "steward") {
    const response = await fetch(`${API}/inventory/get_inventory`);

    if (response.status == 200) {
        const inventory = await response.json();

        state.inventory = inventory;

        inventory.forEach((element, index) => {
            element.index = index;
        });

        // Only save state if not in kiosk mode
        if (kiosk_mode === false) {
            saveState();
        }
    }
}

function submitSearch(kiosk_mode = false | "inventory_editor" | "checkout") {
    // If the current user is a steward, update the kiosk_mode to steward
    if (
        state.user_object
        && (state.user_object.role === "steward"
            || state.user_object.role === "head_steward"
            || state.user_object.role === "admin")
    ) {
        // Steward kiosk mode is used to show all items, including steward-only items,
        // items in Backstock, and items in Cage Shelf 5. 
        // It should only be enabled if search is submitted when a steward is logged in.
        kiosk_mode = "steward";
    }

    const search = document.getElementById("inventory-search-input").value;

    const filters = getInventoryFilters();

    const search_results = searchInventory(search, filters, kiosk_mode);
    const search_divs = generateInventoryDivs(search_results, kiosk_mode);

    state.current_search_results = search_divs;

    const results = document.getElementById("inventory-results");

    removeAllChildren(results);
    appendChildren(results, state.current_search_results.slice(0, 20));
    // If in the checkout kiosk, update which items are selected for checkout
    if (kiosk_mode === "checkout") {
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
        stock: false,
        room: document.getElementById("room-select").value,
        container: document.getElementById("container-input").value,
        tool_material: document.getElementById("tool-material-select").value,
    }

    return filters;
}

function searchInventory(search, filters = null, kiosk_mode = false | "inventory_editor" | "checkout" | "steward") {
    let results = fuzzysort.go(search, state.inventory, search_options);

    // Scores are all undefined, so this sorting is irrelevant
    // results.sort((a, b) => b.score - a.score);

    // Sort by the room, container, and specific of the first location, followed by name
    results.sort((a, b) =>  {
        return ((a.obj.locations[0] && b.obj.locations[0]) ? (a.obj.locations[0].room || "").localeCompare(b.obj.locations[0].room  || "") ||
            (a.obj.locations[0].container  || "").localeCompare(b.obj.locations[0].container  || "") ||
            (a.obj.locations[0].specific  || "").localeCompare(b.obj.locations[0].specific  || "") : 0) ||
            a.obj.name.localeCompare(b.obj.name);
    });

    // If not in any kiosk mode, filter out steward-only items
    if (kiosk_mode === false) {
        results = results.filter(inventory_item => {
            // Exclude items with access type 5 (steward-only)
            if (inventory_item.obj.access_type === 5
                // Exclude items that only have a location in Backstock or Cage 5
                || (inventory_item.obj.locations.length === 1
                    && inventory_item.obj.locations[0].room === "Backstock")
                || (inventory_item.obj.locations.length === 1
                    && inventory_item.obj.locations[0].room === "Cage"
                    && inventory_item.obj.locations[0].container
                    && inventory_item.obj.locations[0].container.includes("5"))
                ) {
                return false;
            }
            return true;
        });
    }

    if (filters !== null) {
        const results_filtered = results.filter(result => {
            const item = result.obj;

            if (filters.stock && item.quantity_available == 0) {
                return false;
            }

            if (filters.room) {
                for (let loc of item.locations) {
                    if (loc.room === filters.room) {
                        return true;
                    }
                }

                return false;
            }

            if (filters.tool_material && item.role !== filters.tool_material) {
                return false;
            }

            if (filters.container) {
                for (let loc of item.locations) {
                    // If not in kiosk mode, don't show items as being in Backstock or Cage 5
                    if (kiosk_mode === false
                        && (loc.room === "Backstock"
                            || (loc.room === "Cage"
                                && loc.container
                                && loc.container.includes("5")
                            ))
                        ) {
                        continue;
                    }
                    const search_str = `${loc.room ?? ""} ${loc.container ?? ""} ${loc.specific ?? ""}`.toLowerCase();

                    if (search_str.includes(filters.container.toLowerCase())) {
                        return true;
                    }
                }
                return false;
            }

            return true;

        });

        return results_filtered;
    }

    return results;
}

function generateInventoryDivs(results, kiosk_mode = false | "inventory_editor" | "checkout" | "steward") {
    const divs = [];

    divs.push(generateInventoryHeader(kiosk_mode));

    for (let i = 0; i < results.length; i++) {
        divs.push(generateInventoryDiv(results[i], kiosk_mode));
    }

    return divs;
}

function generateInventoryHeader(kiosk_mode = false | "inventory_editor" | "checkout" | "steward") {
    const div = document.createElement("div");
    div.classList.add("inventory-result");
    div.classList.add("header");
    // If in checkout kiosk mode, add the kiosk-mode class
    if (kiosk_mode === "checkout") {
        div.classList.add("kiosk-mode");
    }

    const header = document.createElement("div");
    header.classList.add("inventory-result-main");
    header.classList.add("inventory-header");

    // If in checkout kiosk mode, add the kiosk-mode class
    if (kiosk_mode === "checkout") {
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

function generateInventoryDiv(result, kiosk_mode = false | "inventory_editor" | "checkout" | "steward") {
    let div = document.createElement("div");
    div.classList.add("inventory-result");

    // If in checkout kiosk mode, add the kiosk-mode class
    if (kiosk_mode === "checkout") {
        div.classList.add("kiosk-mode");
    }

    const item = result.obj;

    div.id = `inventory-result-${item.uuid}`;

    if (item.role === "K") {
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

    if (item.role === "K") {
        const kit_items = document.createElement("div");
        kit_items.classList.add("kit-items");
        for (let kit_item of item.kit_contents) {
            const kit_item_div = document.createElement("div");
            // TODO: transform uuids into names
            kit_item_div.classList.add("kit-item");
            kit_item_div.innerText = kit_item;
            kit_items.appendChild(kit_item_div);
        }
        main_div.appendChild(kit_items);
    } else {
        const tool_material = document.createElement("div");
        tool_material.classList.add("inventory-result-tool-material");
        tool_material.classList.add(item.role === "M" ? "material" : "tool");
        tool_material.title = item.role === "M" ? "Material" : "Tool";
        
        if (item.role === "M") {
            tool_material.innerHTML = `<span class="material-symbols-outlined">category</span>`;
        } else {
            tool_material.innerHTML = `<span class="material-symbols-outlined">build</span>`;
        }

        main_div.appendChild(tool_material);
    }

    let location = document.createElement("div");
    location.classList.add("inventory-result-location");

    for (let loc of item.locations) {
        // If not in kiosk mode, don't show items as being in Backstock or Cage 5
        if (kiosk_mode === false
            && (loc.room === "Backstock"
                || (loc.room === "Cage"
                    && loc.container
                    && loc.container.includes("5")
                ))
            ) {
            continue;
        }
        
        // If the location is Cage Shelf 5, show it as Overstock
        if (loc.room && loc.room == "Cage" && loc.container && loc.container.includes("5")) {
            location.innerHTML += `<span class="room">Cage</span>`;
            location.innerHTML += `<span class="container">Overstock (${loc.container})</span>`;
            location.innerHTML += `<span class="specific">${loc.specific}</span>`;
            continue;
        }

        // All locations must have a room
        location.innerHTML += `<span class="room">${loc.room}</span>`;

        if (loc.container !== null && loc.container !== "") {
            location.innerHTML += `<span class="container">${loc.container}</span>`;
        }

        if (loc.specific !== null && loc.specific !== "") {
            location.innerHTML += `<span class="specific">${loc.specific}</span>`;
        }
    }

    main_div.appendChild(location);


    const quantity = document.createElement("div");
    quantity.classList.add("inventory-result-quantity");

    let quantity_available = 0

    item.locations.forEach(location => {
        quantity_available += location.quantity;
      })

    let quantity_total = quantity_available - item.quantity_checked_out


    if (quantity_total >= 0) {
        quantity.classList.add("number");
        if (quantity_available !== quantity_total) {
            quantity.innerText = `${quantity_available}/${quantity_total}`;
        } else {
            quantity.innerText = `${quantity_total}`;
        }
    } else {
        switch (quantity_total) {
            case -1:
                quantity.classList.add("low");
                quantity.innerText += "Low";
                break;
            case -2:
                quantity.classList.add("medium");
                quantity.innerText += "Medium";
                break;
            case -3:
                quantity.classList.add("high");
                quantity.innerText += "High";
                break;
            default:
                quantity.classList.add("unknown");
                quantity.innerText += quantity_total;
                break;
        }
    }

    main_div.appendChild(quantity);

    const lower_div = document.createElement("div");
    lower_div.id = `inventory-result-${item.index}-lower-div`;
    lower_div.classList.add("inventory-result-lower");
    lower_div.classList.add("not-shown");

    if (item.long_name !== null && item.long_name !== "") {
        const specific_name = document.createElement("div");
        specific_name.classList.add("inventory-result-lower-detail");
        specific_name.innerText = `Long Name: ${item.long_name}`;
        lower_div.appendChild(specific_name);
    }

    if (item.serial_number !== null && item.serial_number !== "") {
        const serial_number = document.createElement("div");
        serial_number.classList.add("inventory-result-lower-detail");
        serial_number.innerText = `Serial Number: ${item.serial_number}`;
        lower_div.appendChild(serial_number);
    }
    
    // Consider appending keywords here

    const show_lower_div_button = document.createElement("button");
    show_lower_div_button.classList.add("inventory-result-show-lower-div");
    show_lower_div_button.classList.add("grayed-out");
    // Add aria label to button
    show_lower_div_button.setAttribute("aria-label", "Show more information about this item");
    show_lower_div_button.innerHTML = "<span class='material-symbols-outlined'>expand_more</span>";

    if (lower_div.childNodes.length > 0) {
        show_lower_div_button.classList.remove("grayed-out");
        show_lower_div_button.addEventListener("click", () => {
            const lower_div = document.getElementById(`inventory-result-${item.index}-lower-div`);
            lower_div.classList.toggle("not-shown");
            show_lower_div_button.classList.toggle("flipped");
        });
    }

    main_div.appendChild(show_lower_div_button);

    // If in checkout kiosk mode, add a button to checkout the item
    if (kiosk_mode === "checkout") {
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

function showRestock() {
    if (state.user_object === null) {
        alert("You must be logged to request a restock!");
        return;
    }

    showPopup("restock");
}

async function submitRestock() {
    const reason = document.getElementById("restock-reason").value;
    const quantity = document.getElementById("restock-quantity").value;
    const item = document.getElementById("restock-item").value;

    if (quantity.trim() === "") {
        alert("Please enter a quantity!");
        return;
    }

    if (item.trim() === "") {
        alert("Please enter an item!");
        return;
    }

    if (state.user_object === null) {
        alert("You must be logged in to request a restock!");
        return;
    }


    const body = JSON.stringify({
        user_uuid: state.user_object.uuid,
        reason: reason,
        quantity: quantity,
        item: item,
    });
    
    const response = await fetch(`${API}/inventory/add_restock_request`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: body
    });

    if (response.status == 201) {
        alert("Restock request submitted!");
        closePopup();
    } else {
        alert("Error submitting restock request: " + response.status);
    }
}