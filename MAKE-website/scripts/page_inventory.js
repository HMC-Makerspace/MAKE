const search_options = {
    limit: 1000, // don't return more results than you need!
    allowTypo: true, // if you don't care about allowing typos
    threshold: -10000, // don't return bad results
    keys: ['name', 'specific_name', 'serial_number', 'model_number', 'brand', 'uuids_joined'], // keys to search
    all: true,
}

async function fetchInventory(kiosk_mode = false) {
    const response = await fetch(`${API}/inventory`);

    if (response.status == 200) {
        const inventory = await response.json();

        state.inventory = inventory;

        inventory.items.forEach(element => {
            element.uuids_joined = element.uuids.join(" ");
        });

        if (!kiosk_mode) {
            saveState();
        }
    }
}

function submitSearch(kiosk_mode=false) {
    const search = document.getElementById("inventory-search-input").value;

    const filters = getInventoryFilters();

    const search_results = searchInventory(search, filters);
    const search_divs = generateInventoryDivs(search_results, kiosk_mode);

    const results = document.getElementById("inventory-results");

    removeAllChildren(results);
    appendChildren(results, search_divs);
}

function getInventoryFilters() {
    const filters = {
        stock: document.getElementById("inventory-in-stock").checked,
        room: document.getElementById("room-select").value,
        tool_material: document.getElementById("tool-material-select").value,
    }

    return filters;
}

function searchInventory(search, filters = null) {
    const results = fuzzysort.go(search, state.inventory.items, search_options);

    const results_norm = results.sort((a, b) => b.score - a.score);

    if (filters !== null) {
        const results_filtered = results_norm.filter(result => {
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

    return results_norm;
}

function generateInventoryDivs(results, kiosk_mode=false) {
    const divs = [];

    for (let i = 0; i < results.length; i++) {
        divs.push(generateInventoryDiv(results[i], i, kiosk_mode));
    }

    return divs;
}

function generateInventoryDiv(result, index, kiosk_mode=false) {
    let div = document.createElement("div");
    div.classList.add("inventory-result");
    if (kiosk_mode) {
        div.classList.add("kiosk-mode");
    }
    div.id = `inventory-result-${index}`;

    const item = result.obj;

    const main_div = document.createElement("div");
    main_div.classList.add("inventory-result-main");

    const name = document.createElement("div");
    name.classList.add("inventory-result-name");
    name.innerText = item.name;
    main_div.appendChild(name);

    const tool_material = document.createElement("div");
    tool_material.classList.add("inventory-result-tool-material");
    tool_material.classList.add(item.is_material ? "material" : "tool");
    tool_material.title = item.is_material ? "Material" : "Tool";
    main_div.appendChild(tool_material);

    const location = document.createElement("div");
    location.classList.add("inventory-result-location");
    location.innerHTML = `<span class="room">${item.location_room}</span> <span class="area">${item.location_area}</span>`;
    main_div.appendChild(location);

    const quantity = document.createElement("div");
    quantity.classList.add("inventory-result-quantity");
    if (item.quantity >= 0) {
        quantity.classList.add("number");
        quantity.innerText = `${item.quantity}`;
    } else {
        switch (item.quantity) {
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
        }
    }
    main_div.appendChild(quantity);

    const lower_div = document.createElement("div");
    lower_div.id = `inventory-result-${index}-lower-div`;
    lower_div.classList.add("inventory-result-lower");
    lower_div.classList.add("hidden");

    if (item.serial_number !== "") {
        const serial_number = document.createElement("div");
        serial_number.classList.add("inventory-result-lower-detail");
        serial_number.innerText = `Serial Number: ${item.serial_number}`;
        lower_div.appendChild(serial_number);
    }

    if (item.model_number !== "") {
        const model_number = document.createElement("div");
        model_number.classList.add("inventory-result-lower-detail");
        model_number.innerText = `Model Number: ${item.model_number}`;
        lower_div.appendChild(model_number);
    }

    if (item.specific_name !== "") {
        const specific_name = document.createElement("div");
        specific_name.classList.add("inventory-result-lower-detail");
        specific_name.innerText = `Specific Name: ${item.specific_name}`;
        lower_div.appendChild(specific_name);
    }

    if (item.brand !== "") {
        const brand = document.createElement("div");
        brand.classList.add("inventory-result-lower-detail");
        brand.innerText = `Brand: ${item.brand}`;
        lower_div.appendChild(brand);
    }

    if (item.uuids_joined !== "") {
        const uuid = document.createElement("div");
        uuid.classList.add("inventory-result-lower-detail");
        uuid.innerText = `UUID(s): ${item.uuids_joined}`;
        lower_div.appendChild(uuid);
    }

    const show_lower_div_button = document.createElement("button");
    show_lower_div_button.classList.add("inventory-result-show-lower-div");
    show_lower_div_button.classList.add("grayed-out");
    show_lower_div_button.innerText = "Details";

    if (lower_div.childNodes.length > 0) {
        show_lower_div_button.classList.remove("grayed-out");
        show_lower_div_button.addEventListener("click", () => {
            const lower_div = document.getElementById(`inventory-result-${index}-lower-div`);
            lower_div.classList.toggle("hidden");
        });
    }

    main_div.appendChild(show_lower_div_button);

    if (kiosk_mode) {
        // Add checkout button
        const checkout_button = document.createElement("button");
        checkout_button.classList.add("inventory-result-checkout");
        checkout_button.innerText = "Checkout";
        checkout_button.addEventListener("click", () => {
            addToCart(item.name);
        });
        main_div.appendChild(checkout_button);
    }

    div.appendChild(main_div);
    div.appendChild(lower_div);

    return div;
}  