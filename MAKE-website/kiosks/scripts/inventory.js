var state = {
    inventory: null,
    current_search_results: null,
}

const API = '/api/v2';

const EMPTY_ITEM = {
    "uuid": null,
    "name": null,
    "role": null,
    "quantity": null,
    "location_room": null,
    "location_specific": null,
    "reorder_url": null,
    "specific_name": null,
    "serial_number": null,
    "brand": null,
    "model_number": null,
    "qr_code": null,
    "kit_ref": null,
    "kit_contents": null
}

document.documentElement.setAttribute('data-theme', 'dark');
localStorage.setItem("theme", "dark");

async function authenticate() {
    // Get api keys from url params
    const params = new URLSearchParams(window.location.search);

    api_key = params.get('api_key') ?? localStorage.getItem('admin_api_key');

    if (api_key === null) {
        alert("No API key provided.");
    }

    // Fetch api scope
    const response = await fetch(`${API}/misc/api_key_scope`,
        {
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ api_key: api_key }),
            method: "POST",
        }
    );

    if (response.status == 200) {
        const body = await response.json();

        if (body.scope == "admin" || body.scope == "inventory") {
            console.log("Authenticated");
        } else {
            alert("API key does not have proper scope.");
        }
    } else {
        alert("Invalid API key.");
    }
    
    fetchEditableInventory().then(() => {
        submitEditableSearch();
        document.getElementById("edit-inventory-search-input").addEventListener("keyup", submitEditableSearch);
        document.getElementById("room-select").addEventListener("change", submitEditableSearch);
        document.getElementById("tool-material-select").addEventListener("change", submitEditableSearch);
    });

    // Register esc to close popup
    document.addEventListener("keyup", (e) => {
        if (e.key === "Escape") {
            closePopup();
        }
    });
}

async function fetchEditableInventory() {
    const response = await fetch(`${API}/inventory/get_inventory`);

    if (response.status == 200) {
        const inventory = await response.json();

        state.inventory = inventory;
    }
}

function submitEditableSearch() {
    const search = document.getElementById("edit-inventory-search-input").value;

    const results = document.getElementById("edit-inventory-results");

    const items = searchInventory(search, getInventoryFilters(), false);

    console.log(items);
    
    state.current_search_results = [];
    for (let item of items) {
        state.current_search_results.push(generateEditableInventoryDiv(item.obj));
    }

    removeAllChildren(results);
    appendChildren(results, state.current_search_results.slice(0, 20));

    results.addEventListener("scroll", () => {
        if (results.scrollTop + results.clientHeight >= results.scrollHeight - 5) {
            // 20 more results
            const new_divs = state.current_search_results.slice(results.childElementCount, results.childElementCount + 20);
            appendChildren(results, new_divs);
        }
    })
}

function generateEditableInventoryDiv(item) {
    /*
    Create a div that display the name, role, quantity, and location of an item.
    It should have an edit button that calls editInventoryItem(item.uuid), and a delete button that calls deleteInventoryItem(item.uuid)
    
    Item example:
    {
        "uuid": "90794786-f80b-40a1-830f-b27c99111740",
        "name": "1000 ft Blue Cable (Thick)",
        "role": "M",
        "quantity": "-3",
        "location_room": "Cage",
        "location_specific": "1b",
        "reorder_url": null,
        "specific_name": "CAT6 UTP Cable (4Pair 26AWG 1/0.57mm. CCA PVC Jacket",
        "serial_number": "618000000000.0",
        "brand": "Dripstone",
        "model_number": null,
        "qr_code": null,
        "kit_ref": null,
        "kit_contents": null
    }
    */

    const div = document.createElement("div");
    div.classList.add("edit-inventory-item");

    const name = document.createElement("h2");
    name.innerText = item.name;
    div.appendChild(name);

    const role = document.createElement("h3");
    role.innerText = item.role == "M" ? "Material" : "Tool";
    div.appendChild(role);

    const quantity = document.createElement("h3");
    quantity.innerText = "Quantity: " + item.quantity;
    div.appendChild(quantity);
    
    const location = document.createElement("h3");
    location.innerText = `${item.location_room} ${item.location_specific}`;
    div.appendChild(location);
    
    const edit_button = document.createElement("button");
    edit_button.classList.add("edit");
    edit_button.innerText = "Edit";
    edit_button.addEventListener("click", () => {
        editInventoryItem(item.uuid);
    });
    div.appendChild(edit_button);

    const delete_button = document.createElement("button");
    delete_button.classList.add("delete");
    delete_button.innerText = "Delete";
    delete_button.addEventListener("click", () => {
        showDeleteItemPopup(item.uuid);
    });
    div.appendChild(delete_button);

    return div;
}

function createInventoryItem() {
    const uuid = self.crypto.randomUUID();

    editInventoryItem(uuid, create_item=true);
}

function editInventoryItem(uuid, create_item=false) {
    const item = state.inventory.find((item) => item.uuid == uuid) ?? EMPTY_ITEM;

    const edit_div = document.getElementById("edit-item");
    /*
    Target is following div:
    <div id="edit-item" class="hidden">
        <h1>Edit Item</h1>
        
        <p id="uuid"></p>
        <input id="edit-item-name">
        <input id="edit-item-specific-name">

        <select id="edit-item-role">
            <option value="M">Material</option>
            <option value="T">Tool</option>
        </select>
        
        <p>Note: Quantities of -1 = Low, -2 = Medium, -3 = High</p>
        <input id="edit-item-quantity" type="number">

        <input id="edit-item-location-room">
        <input id="edit-item-location-specific">

        <input id="edit-item-reorder-url">
        <input id="edit-item-serial-number">
        <input id="edit-item-brand">
        <input id="edit-item-qr-code">

        <div class="edit-buttons">
            <button id="edit-user-save" onclick="saveUser()">Save</button>
            <button id="edit-user-cancel" onclick="closePopup()">Cancel</button>
        </div>
    </div>
    */

    document.getElementById("edit-item-name").value = item.name;
    document.getElementById("edit-item-specific-name").value = item.specific_name;
    document.getElementById("edit-item-role").value = item.role;
    document.getElementById("edit-item-quantity").value = item.quantity;
    document.getElementById("edit-item-location-room").value = item.location_room;
    document.getElementById("edit-item-location-specific").value = item.location_specific;
    document.getElementById("edit-item-reorder-url").value = item.reorder_url;
    document.getElementById("edit-item-serial-number").value = item.serial_number;
    document.getElementById("edit-item-brand").value = item.brand;
    document.getElementById("edit-item-qr-code").value = item.qr_code;

    edit_div.classList.remove("hidden");
    document.getElementById("popup-container").classList.remove("hidden");

    document.getElementById("edit-item-save").onclick = () => {
        saveItem(uuid, create_item);
    }
}

function showDeleteItemPopup(uuid) {
    const delete_div = document.getElementById("delete-item");

    delete_div.classList.remove("hidden");
    document.getElementById("popup-container").classList.remove("hidden");
}

async function saveItem(uuid, create_item=false) {
    // Gather all the data, null if empty after trim
    const item = {
        "uuid": uuid,
        "name": document.getElementById("edit-item-name").value.trim() || null,
        "specific_name": document.getElementById("edit-item-specific-name").value.trim() || null,
        "role": document.getElementById("edit-item-role").value || null,
        "quantity": document.getElementById("edit-item-quantity").value || null,
        "location_room": document.getElementById("edit-item-location-room").value.trim() || null,
        "location_specific": document.getElementById("edit-item-location-specific").value.trim() || null,
        "reorder_url": document.getElementById("edit-item-reorder-url").value.trim() || null,
        "serial_number": document.getElementById("edit-item-serial-number").value.trim() || null,
        "brand": document.getElementById("edit-item-brand").value.trim() || null,
        "qr_code": document.getElementById("edit-item-qr-code").value.trim() || null,
    }

    let create_update = "update";

    if (create_item) {
        create_update = "create";
    }

    // Send the data to the server
    const response = await fetch(`${API}/inventory/${create_update}_inventory_item`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "api-key": api_key
        },
        body: JSON.stringify(item)
    });

    if (response.status != 200) {
        let error = await response.text();
        alert("Error updating item: " + error);
        return;
    }

    // Update the inventory
    await fetchEditableInventory();
    submitEditableSearch();

    
    // Close the popup
    closePopup();
}

authenticate();