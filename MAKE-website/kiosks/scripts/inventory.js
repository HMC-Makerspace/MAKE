var state = {
    inventory: null,
    current_search_results: null,
    certifications: null,
}

const API = '/api/v2';

const EMPTY_ITEM = {
    "uuid": null,
    "name": null,
    "long_name": null,
    "role": null,
    "access_type": null,
    "quantity_total": null,
    "quantity_available": null,
    "locations": [{room: "", container: "", specific: ""}],
    "reorder_url": null,
    "serial_number": null,
    "kit_contents": null,
    "keywords": null,
}

const ROOMS_HTML = (function (value) {return `
<option ${value === "" ? "selected" : ""} value="">-- Select Room --</option>
<option ${value === "Main" ? "selected" : ""} value="Main">Main Makerspace</option>
<option ${value === "Laser3D" ? "selected" : ""} value="Laser3D">3D Printer & Laser Cutter Room</option>
<option ${value === "Studio" ? "selected" : ""} value="Studio">Studio</option>
<option ${value === "Cage" ? "selected" : ""} value="Cage">The Cage</option>
<option ${value === "Welding" ? "selected" : ""} value="Welding">Welding Area</option>
<option ${value === "Electronics" ? "selected" : ""} value="Electronics">Electronics Benches</option>
<option ${value === "Composite" ? "selected" : ""} value="Composite">Composite Room</option>
<option ${value === "Outdoor Storage" ? "selected" : ""} value="Outdoor Storage">Outdoor Storage</option>
<option ${value === "Backstock" ? "selected" : ""} value="Backstock">Backstock</option>
<option ${value === "The Crypt" ? "selected" : ""} value="The Crypt">The Crypt</option>
<option ${value === "Other" ? "selected" : ""} value="Other">Other</option>
`});

document.documentElement.setAttribute('data-theme', 'dark');
localStorage.setItem("theme", "dark");

async function authenticate() {
    // Get api keys from url params
    const params = new URLSearchParams(window.location.search);

    api_key = params.get('api_key') ?? localStorage.getItem('inventory_api_key');

    if (api_key === null) {
        alert("No API key provided.");
    }

    // Fetch api scope
    const response = await fetch(`${API}/misc/get_api_key_scopes`,
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

        if (body.scopes.includes("admin") || body.scopes.includes("inventory")) {
            console.log("Authenticated");
            localStorage.setItem('inventory_api_key', api_key);

            // Remove api key from url, but keep the rest of the url
            window.history.replaceState({}, document.title, window.location.pathname);
        } else {
            alert("API key does not have proper scope.");
        }
    } else {
        // If API key is invalid, alert the user and redirect to the home page.
        alert("Invalid API key.");
        window.location.href = "/";
    }

    // TODO: Ask wil

    await fetchCertifications();
    await fetchRestockRequests();
    await fetchEditableInventory();

    submitEditableSearch();

    document.getElementById("edit-inventory-search-input").addEventListener("keyup", submitEditableSearch);
    document.getElementById("container-input").addEventListener("keyup", submitEditableSearch);
    document.getElementById("room-select").addEventListener("change", submitEditableSearch);
    document.getElementById("tool-material-select").addEventListener("change", submitEditableSearch);
    document.getElementById("submit-kiosk-restock").addEventListener("click", submitKioskRestockRequest);


    // Register esc to close popup
    document.addEventListener("keyup", (e) => {
        if (e.key === "Escape") {
            closePopup();
        }
    });
}

async function fetchRestockRequests() {
    const response = await fetch(`${API}/inventory/get_restock_requests`, {
        headers: {
            "Content-Type": "application/json",
            "api-key": api_key,
        }
    });

    if (response.status === 200) {
        state.restock_requests = await response.json();
    } else {
        console.error("Failed to fetch restock requests");
    }
}


authenticate();

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

    // Filter the inventory based on the inputted search
    // Kiosk mode is true so that access type level 5 items are still visible
    const items = searchInventory(search, getInventoryFilters(), kiosk_mode = "inventory_editor");
    
    state.current_search_results = [];
    console.log("items:", items)
    for (let item of items) {
        state.current_search_results.push(generateEditableInventoryDiv(item));
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
        "uuid": "3658b36d-9ba3-4391-ae21-3d9510db2f2d",
        "name": "Random Robot Kit",
        "long_name": "",
        "role": "M",
        "access_type": 2,
        "quantity_total": 1,
        "quantity_available": 1,
        "locations": [
            {
                "room": "Cage",
                "container": null,
                "specific": "1b"
            }
        ],
        "reorder_url": "",
        "serial_number": "",
        "kit_contents": [
            ""
        ],
        "keywords": ""
        "certifications": {
            "uuid of cert": timestamp_added,
        }
    }
    */


    const div = document.createElement("div");
    div.classList.add("edit-inventory-item");
    div.id = `edit-inventory-item-${item.uuid}`;

    div.addEventListener("click", () => {
        highlightEditableInventoryItem(item.uuid);
        editInventoryItem(item.uuid);
    });

    const name = document.createElement("h2");
    name.innerText = item.name;
    div.appendChild(name);

    const role = document.createElement("h3");

    if (item.role == "M") {
        role.innerText = "Material";
    } else if (item.role == "T") {
        role.innerText = "Tool";
    } else if (item.role == "K"){
        role.innerText = "Kit";
    } else {
        role.innerText = "Unknown";
    }

    div.appendChild(role);

    const quantity = document.createElement("h3");
    if (item.quantity_available !== item.quantity_total) {
        quantity.innerText = `Quantity: ${item.quantity_available}/${item.quantity_total}`;
    } else {
        if (item.quantity_total < 0) {
            if (item.quantity_total === -1) {
                quantity.innerText = "Quantity: Low";
            } else if (item.quantity_total === -2) {
                // Used to be "Medium", but changed to "High" for consistency with the other values
                quantity.innerText = "Quantity: High"; 
            } else if (item.quantity_total === -3) {
                quantity.innerText = "Quantity: High";
            }
        } else {
            quantity.innerText = `Quantity: ${item.quantity_total}`;
        }
    }
    div.appendChild(quantity);
    
    const location = document.createElement("h3");
    for (let loc of item.locations) {
        location.innerText += `${loc.room}${loc.container ? " " + loc.container : ""}${loc.specific ? " " + loc.specific: ""}, `
    }

    location.innerText = location.innerText.slice(0, -2);

    div.appendChild(location);

    const access_type = document.createElement("h3");
    access_type.classList.add(`access-type-${item.access_type}`);
    let text = `${item.access_type}: `;
    switch (item.access_type) {
        case 0:
            text += "In the space";
            break;
        case 1:
            text += "Can check out for use in the space";
            break;
        case 2:
            text += "Can check out and take home";
            break;
        case 3:
            text += "Can take home without checking out";
            break;
        case 4:
            text += "Needs approval to check out";
            break;
        case 5:
            text += "Staff only use";
            break;
        default:
            text += "Unknown";
    }

    access_type.innerText = text;
    div.appendChild(access_type);

    const certifications = document.createElement("h3");
    certifications.classList.add("certifications");
    if (item.certifications) {
        for (let cert of item.certifications) {
            const cert_name = state.certifications.find((c) => c.uuid === cert)?.name ?? "Unknown";
            certifications.innerText += `${cert_name}, `;
        }
        certifications.innerText = certifications.innerText.slice(0, -2);
    } else {
        certifications.innerText = "N/A";
    }
    div.appendChild(certifications);

    const delete_button = document.createElement("button");
    delete_button.classList.add("delete");
    delete_button.innerText = "Delete";
    delete_button.addEventListener("click", () => {
        showDeleteItemPopup(item.uuid);
    });
    div.appendChild(delete_button);

    // Remove any existing banner first
    // document.querySelectorAll(".restock-banner").forEach(banner => banner.remove());
    // ^^ this line should not be here but should be in the other functions because this is 
    // called everytime we save something - so when we press the 'low' button, it 
    // triggers this function and the above line would have removed the bannersß
    div.querySelectorAll(".restock-banner").forEach(banner => banner.remove());


    // Check for pending restock request
    const hasPendingRestock = state.restock_requests?.some(req =>
        req.item_uuid === item.uuid && req.timestamp_ordered === null && req.timestamp_completed === null
    );

    if (hasPendingRestock) {
        div.classList.add("restock-pending");
    }

    // Check for ordered restock request
    const hasOrderedRestock = state.restock_requests?.some(req =>
        req.item_uuid === item.uuid && req.timestamp_ordered && req.timestamp_completed === null
    );

    if (hasOrderedRestock) {
        div.classList.add("restock-ordered");
    }

    return div;
}

function highlightEditableInventoryItem(uuid) {
    document.querySelectorAll(".highlight").forEach((el) => {
        el.classList.remove("highlight");
    });

    const item = document.getElementById(`edit-inventory-item-${uuid}`);
    item.classList.add("highlight");
}

async function showDeleteItemPopup(uuid) {
    const result = prompt(`Are you sure you want to delete this item? Type "delete" to confirm.`);
    if (result === "delete") {
        const response = await fetch(`${API}/inventory/delete_inventory_item/${uuid}`,
            {
                headers: {
                    "Content-Type": "application/json",
                    "api-key": api_key,
                },
                method: "DELETE",
            }
        );

        if (response.status == 200) {
            fetchEditableInventory().then(() => {
                submitEditableSearch();
            });
        }
    } else {
        alert("Delete cancelled.");
    }
}


function createInventoryItem() {
    const uuid = self.crypto.randomUUID();

    editInventoryItem(uuid, create_item=true);
}

function editInventoryItem(uuid, create_item=false) {
    /*
    class InventoryItem(BaseModel):
    _id: Optional[PyObjectId] = Field(alias="_id")
    """
    Main attributes
    """
    uuid: str
    # Short name of item
    name: str
    # Contains brand, exact type, etc.
    long_name: Union[str, None]
    # Tool, Material, Kit (T/M/K)
    role: str
    # 0: cannot check out, in the space
    # 1: can check out for use in the space
    # 2: can check out and take home
    # 3: can take home without checking out
    # 4: needs approval to check out (welders, loom computer, cameras, etc.)
    # 5: staff only use
    access_type: int

    """
    Physical Attributes
    """
    # Quantity above 0, or -1 for low, -2 for medium, -3 for high
    quantity_total: int
    # Updated when checked out, checked in, or restocked
    # If it's negative, just assign it to the quantity_total
    quantity_available: int
    # Location of the item
    locations: List[Location]

    """
    Data Attributes
    """
    # URL to reorder the item
    reorder_url: Union[str, None]
    # Serial Number
    serial_number: Union[str, None]
    # Kit Contents, list of uuids of other items in the kit
    # if the item is a kit (K)
    kit_contents: Union[List[str], None]
    # Keywords for searching
    keywords: Union[str, None]
    # Certifications required to use the item
    certifications: Union[List[str], None] = None
    */

    const item = state.inventory.find((item) => item.uuid == uuid) ?? EMPTY_ITEM;
    item.uuid = uuid;

    const container = document.getElementById("edit-inventory-item");
    container.classList.remove("hidden");
    
    const attributes = ["uuid", "name", "long_name", "role", "access_type", "quantity_total", "reorder_url", "serial_number", "kit_contents", "keywords"];
    for (let attr of attributes) {
        const input = document.getElementById(`edit-${attr}`);
        if (input) {
            input.value = item[attr] ?? "";
        }
    }

    const certifications = document.getElementById("edit-certifications");
    certifications.innerHTML = "";

    for (let cert of state.certifications) {
        const div = document.createElement("div");
        div.classList.add("edit-proficiency-container");
        const label = document.createElement("label");
        label.innerText = cert.name;

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `edit-cert-${cert.uuid}`;
        checkbox.checked = item.certifications && item.certifications.includes(cert.uuid);

        div.appendChild(checkbox);
        div.appendChild(label);
        certifications.appendChild(div);
    }

    const locations = container.querySelector(".locations");
    locations.innerHTML = "";
    for (let i = 0; i < item.locations.length; i++) {
        const loc_div = createLocationEditor(item.locations[i], i);
        locations.appendChild(loc_div);
    }
    locations.innerHTML += `<div id="button-container"><button class="big" onclick="addLocationEditor()">Add Location</button></div>`;


    const highBtn = document.getElementById("btn-high");
    const lowBtn = document.getElementById("btn-low");
    const quantityInput = document.getElementById("edit-quantity_total");

    if (highBtn && lowBtn && quantityInput) {
        // When clicking the highBtn, set the quantity to high and bubble up
        // an event so we can correctly trigger changeEventListener
        highBtn.onclick = () => {
            const latestItem = state.inventory.find(i => i.uuid === item.uuid);
            if (latestItem && latestItem.reorder_url) {
                quantityInput.value = -3;
                const index = state.inventory.findIndex(i => i.uuid === item.uuid);
                state.inventory[index].automated_restock = true;
        
                // flag this as being part of automated_restock UI (not actually sending a restock request!)
                // item.automated_restock = true;
                // ^^ above line is not good enough because only sets it in local copy, not state
                quantityInput.dispatchEvent(new Event("change", { bubbles: true }));

            } else {
                // Otherwise, ask the editor to put a reorder URL
                alert(
                    "A reorder url is needed for this item! Please find an appropriate link "
                    + "for this item and paste it into the Reorder URL before marking the item as high."
                )
            }
        };
    
        lowBtn.onclick = () => {
            // If the item has a reorder URL, mark it as low (which will automatically)
            // submit a restock request
            const latestItem = state.inventory.find(i => i.uuid === item.uuid);
            if (latestItem && latestItem.reorder_url) {
                showRestockPopupFromKiosk(latestItem);
                // quantityInput.value = -1;
                // quantityInput.dispatchEvent(new Event("change", { bubbles: true }));
            } else {
                // Otherwise, ask the editor to put a reorder URL
                alert(
                    "A reorder url is needed for this item! Please find an appropriate link "
                    + "for this item and paste it into the Reorder URL before marking the item as low."
                )
            }
        };
    }

    const inputs = container.querySelectorAll("input, select");

    for (let input of inputs) {
        input.onchange = (e) => {
            changeEventListener(e, item.uuid);
        }
    }

    // Remove any existing banner first
    document.querySelectorAll(".restock-banner").forEach(banner => banner.remove());


    // Check for pending restock request
    const hasPendingRestock = state.restock_requests?.some(req =>
        req.item_uuid === item.uuid && req.timestamp_ordered === null && req.timestamp_completed === null
    );


    if (hasPendingRestock) {
        const banner = document.createElement("div");
        banner.classList.add("restock-banner");
        banner.innerText = "Restock Request Submitted";
    
        const container = document.getElementById("edit-inventory-item");
        container.prepend(banner);
    }

    // Check for ordered restock request
    const hasOrderedRestock = state.restock_requests?.some(req =>
        req.item_uuid === uuid && req.timestamp_ordered && req.timestamp_completed === null
    );

    if (hasOrderedRestock) {
        const banner = document.createElement("div");
        banner.classList.add("restock-banner", "ordered");
        banner.innerText = "Restock Request Ordered";
    
        const container = document.getElementById("edit-inventory-item");
        container.prepend(banner);
    }

}

async function submitKioskRestockRequest() {
    console.log("submitKioskRestockRequest called");

    const container = document.getElementById("popup-container");
    const quantity = document.getElementById("popup-quantity").value;
    const note = document.getElementById("popup-note").value;
    const item_uuid = container.dataset.itemUuid;

    if (!quantity.trim()) {
        alert("Please enter a quantity.");
        return;
    }

    const item = state.inventory.find(i => i.uuid === item_uuid);

    const updatedItem = {
        ...item,
        quantity_total: -1,
        quantity_available: -1,
        automated_restock: true,
        restock_quantity: quantity,  
        restock_note: note           
    };

    const updateResponse = await fetch(`${API}/inventory/update_inventory_item`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "api-key": api_key
        },
        body: JSON.stringify(updatedItem)
    });

    if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        alert("Error updating item: " + errorText);
        return;
    }

    // Update quantity input immediately like HighBtn does
    const quantityInput = document.getElementById("edit-quantity_total");
    if (quantityInput && item.uuid === item_uuid) {
        quantityInput.value = -1;
        quantityInput.dispatchEvent(new Event("change", { bubbles: true }));
    }

    const containerElement = document.getElementById("edit-inventory-item");
    const banner = document.createElement("div");
    banner.classList.add("restock-banner");
    banner.innerText = "Restock Request Submitted";
    containerElement.prepend(banner); // Add the banner at the top of the container

    container.classList.add("hidden");

    await fetchRestockRequests();
    await fetchEditableInventory();
    submitEditableSearch();
}


function showRestockPopupFromKiosk(item) {
    const container = document.getElementById("popup-container");
    container.dataset.itemUuid = item.uuid;
    const content = document.getElementById("popup-content");

    // fill in the form dynamically based on the database
    content.innerHTML = `
        <h2>Submit Restock Request</h2>
        <label>
            Item:
            <input type="text" id="popup-item" readonly value="${item.name}">
        </label>
        <label>
            Link:
            <input type="text" id="popup-link" readonly value="${item.reorder_url}">
        </label>
        <label>
            Quantity:
            <input type="number" id="popup-quantity" required>
        </label>
        <label>
            Note:
            <textarea id="popup-note"></textarea>
        </label>
        <div class="popup-buttons">
            <button onclick="submitKioskRestockRequest()">Submit</button>
            <button onclick="closePopup()">Cancel</button>
        </div>
    `;

    container.classList.remove("hidden");

    //  bind the submit click AFTER inserting HTML
    document.getElementById("submit-kiosk-restock")
    .addEventListener("click", submitKioskRestockRequest);
}



function closePopup() {
    document.getElementById("popup-container").classList.add("hidden");
}



function changeEventListener(event, item_uuid) {
    let input = document.getElementById(event.target.id);
    // If it's required and empty, return
    if (input.getAttribute("required") && input.value === "") {
        return;
    }

    // If it's a number and not a number, return
    if (input.type === "number" && (input.value === "" || isNaN(input.value))) {
        input.value = 0;
        return;
    }

    // Actually edit the item in state.inventory
    let index = state.inventory.findIndex((i) => i.uuid === item_uuid);
    
    if (index === -1) {
        index = state.inventory.length;
        state.inventory.push(EMPTY_ITEM);
        state.inventory[index].uuid = item_uuid;
    }

    let attr = input.id.split("-")[1];

    // Determine if parent of parent has class name of location-editor
    if (input.parentElement.parentElement.className === "location-editor") {
        const location_index = parseInt(input.id.split("-")[2]);
        const location_attr = input.id.split("-")[1];

        let loc_total_diff = location_index - (state.inventory[index].locations.length - 1);

        if (loc_total_diff > 0) {
            for (let i = 0; i < loc_total_diff; i++) {
                state.inventory[index].locations.push({room: "", container: "", specific: ""});
            }
        }

        state.inventory[index].locations[location_index][location_attr] = input.value;
    } else if (input.id === "role-select") {
        state.inventory[index].role = input.value;
    } else if (input.id === "access-type-select") {
        state.inventory[index].access_type = parseInt(input.value);
    } else if (input.id === "edit-kit_contents") {
        state.inventory[index][attr] = input.value.split(",");
    } else if (input.id.startsWith("edit-cert-")) {
        const cert_uuid = input.id.replace("edit-cert-", "");
        if (input.checked) {
            if (!state.inventory[index].certifications) {
                state.inventory[index].certifications = [];
            }

            if (!state.inventory[index].certifications.includes(cert_uuid)) {
                state.inventory[index].certifications.push(cert_uuid);
            }
        } else {
            if (state.inventory[index].certifications && state.inventory[index].certifications.includes(cert_uuid)) {
                state.inventory[index].certifications = state.inventory[index].certifications.filter((c) => c !== cert_uuid);
            }
        }
    } else if (input.type === "number") {
        state.inventory[index][attr] = parseInt(input.value);
    } else {
        // For name, long_name, reorder_url, serial_number, and keywords
        state.inventory[index][attr] = input.value;
    }

    // Save the item
    debounce(() => {
        saveInventoryItem(item_uuid);
        delete state.inventory[index].automated_restock;
    }, 100)();
    
}

function isInventoryItemValid(item) {
    // Validate name
    if (item.name === null || item.name === "") {
        return false;
    }
    // Validate role
    if (item.role === null || item.role === "") {
        return false;
    }
    // Validate access_type
    if (item.access_type === null || item.access_type === "") {
        return false;
    }
    // Validate quantity_total
    if (item.quantity_total === null || item.quantity_total === "") {
        return false;
    }
    // Validate that every room has a container
    for (let loc of item.locations) {
        if (loc.room === null || loc.room === "") {
            return false;
        }
    }
    return true;
}


async function saveInventoryItem(uuid) {
    const container = document.getElementById("save-status");
    const el = document.getElementById("last-saved");
    el.innerText = "Saving...";

    const item = state.inventory.find((item) => item.uuid === uuid);
    item.quantity_available = item.quantity_total;

    // Check if the edits to the item are valid
    if (!isInventoryItemValid(item)) {
        el.innerText = "Missing required fields";
        container.classList.add("error");
        container.classList.remove("saved");
        return;
    }


    const response = await fetch(`${API}/inventory/update_inventory_item`,
        {
            headers: {
                "Content-Type": "application/json",
                "api-key": api_key,
            },
            body: JSON.stringify(item),
            method: "POST",
        }
    );

    if (response.status == 200) {
        setTimeout(() => {
            el.innerText = `${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}`;
            container.classList.add("saved");
            container.classList.remove("error");
        }, 400);
    } else {
        const errorText = await response.text();
        alert("Error saving: " + errorText);  // Show the backend error message
        el.innerText = "Error saving";
        container.classList.add("error");
        container.classList.remove("saved");
    }

    await fetchRestockRequests();
    await fetchEditableInventory();

    // Remove any existing banner first
    document.querySelectorAll(".restock-banner").forEach(banner => banner.remove());

    // Check for pending restock request
    const hasPendingRestock = state.restock_requests?.some(req =>
        req.item_uuid === item.uuid && req.timestamp_ordered === null && req.timestamp_completed === null
    );

    if (hasPendingRestock) {
        const banner = document.createElement("div");
        banner.classList.add("restock-banner");
        banner.innerText = "Restock Request Submitted";
    
        const container = document.getElementById("edit-inventory-item");
        container.prepend(banner);
    }

    // Check for ordered restock request
    const hasOrderedRestock = state.restock_requests?.some(req =>
        req.item_uuid === uuid && req.timestamp_ordered && req.timestamp_completed === null
    );

    if (hasOrderedRestock) {
        const banner = document.createElement("div");
        banner.classList.add("restock-banner", "ordered");
        banner.innerText = "Restock Request Ordered";
    
        const container = document.getElementById("edit-inventory-item");
        container.prepend(banner);
    }

    submitEditableSearch();
}


function addLocationEditor() {
    const container = document.querySelector(".locations");
    const new_index = container.childElementCount - 1;
    const new_loc_editor = createLocationEditor({room: "", container: "", specific: ""}, new_index);
    
    new_loc_editor.addEventListener("change", (e) => {
        changeEventListener(e, document.getElementById("edit-uuid").value);
    });

    container.lastChild.before(new_loc_editor);
}

function deleteLocationEditor(id) {
    const uuid = document.getElementById("edit-uuid").value;
    document.getElementById(id).remove();
    const index = state.inventory.findIndex((i) => i.uuid === uuid);

    if (index !== -1) {
        state.inventory[index].locations.splice(parseInt(id.split("-")[2]), 1);
        editInventoryItem(uuid);
        debounce(saveInventoryItem, 100)(uuid);
    }
}


function createLocationEditor(loc, index) {
    const div = document.createElement("div");
    div.classList.add("location-editor");
    div.id = `location-editor-${index}`;

    const room = document.createElement("label");
    room.innerHTML = `Room: * <select id="edit-room-${index}" required>${ROOMS_HTML(loc.room)}</select>`;

    const delete_button = `<button onclick="deleteLocationEditor('${div.id}')"><span class="material-symbols-outlined">delete</span></button>`

    const container = document.createElement("label");
    container.innerHTML = `Container: <input id="edit-container-${index}" type="text" value="${loc.container ?? ""}">`;

    const specific = document.createElement("label");
    specific.innerHTML = `Specific: <input id="edit-specific-${index}" type="text" value="${loc.specific ?? ""}">`;

    div.appendChild(room);
    div.appendChild(container);
    div.appendChild(specific);
    div.innerHTML += delete_button;


    return div;
}

