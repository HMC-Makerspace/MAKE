let mouseDown = false; // Tracks if the mouse is currently down
let initialState = false; // Tracks the initial state being toggled
let startCell = null; // Keeps track of where the drag started
let endCell = null; // Keeps track of the current cell during drag
let changedCells = []; // Array to keep track of all cell changes

document.addEventListener("mousedown", (e) => {
    if (state.user_object === null) {
        return;
    }

    if (!state.user_object.availability) {
        state.user_object.availability = [];
    
        for (let i = 0; i < 7; i++) {
            state.user_object.availability.push([]);
    
            for (let j = 0; j < 24; j++) {
                state.user_object.availability[i].push(false);
            }
        }
    }

    if (e.target.classList.contains('availability-cell')) {
        mouseDown = true;
        initialState = !e.target.classList.contains('available');
        startCell = getCellIndices(e.target);
        // Store that the cell state has been toggled without calling the API immediately
        changedCells.push({ element: e.target, initial: initialState });
        updateCell(e.target, initialState);
    }
}, true);

document.addEventListener("mouseenter", (e) => {
    if (mouseDown && e.target.classList.contains('availability-cell')) {
        endCell = getCellIndices(e.target);
        // Immediately update visual state & store all changed cells, if not already stored
        updateSelectionRectangle();
    }
}, true);

document.addEventListener("mouseleave", (e) => {
    if (mouseDown && e.target.classList.contains('availability-cell')) {
        endCell = getCellIndices(e.target);
        // Immediately update visual state & store all changed cells, if not already stored
        updateSelectionRectangle();
    }
}, true);

document.addEventListener("mouseup", (e) => {
    mouseDown = false;
    if (startCell) {
        if (e.target.classList.contains('availability-cell')) {
            endCell = getCellIndices(e.target); // New end cell
        }
        updateSelectionRectangle(endCell); // Make sure the last cell is also updated, pass `endCell` for explicitness
        batchUpdateAvailability(changedCells);
        // Reset for next operation
        startCell = null;
        endCell = null;
        changedCells = [];
    }
}, true);

// Helper function to get the day and hour indices of a cell
function getCellIndices(cellElement) {
    const idParts = cellElement.id.split('-');
    return { day: parseInt(idParts[2], 10), hour: parseInt(idParts[3], 10) };
}

// Helper function to update a single cell's availability
function updateCell(cellElement, makeAvailable) {
    cellElement.classList.toggle('available', makeAvailable);
}

// Helper function to update the cells inside the selection rectangle
function updateSelectionRectangle(lastUpdateCell) {
    if (!startCell || !(endCell || lastUpdateCell)) return;

    // If lastUpdateCell is provided, use it over endCell
    const end = lastUpdateCell || endCell;

    const minDay = Math.min(startCell.day, end.day);
    const maxDay = Math.max(startCell.day, end.day);
    const minHour = Math.min(startCell.hour, end.hour);
    const maxHour = Math.max(startCell.hour, end.hour);

    for (let day = minDay; day <= maxDay; day++) {
        for (let hour = minHour; hour <= maxHour; hour++) {
            const cellElement = document.getElementById(`availability-cell-${day}-${hour}`);
            if (cellElement) {
                const cellChanged = !cellElement.classList.contains('available') !== initialState;
                updateCell(cellElement, initialState);
                if (cellChanged && !changedCells.some(cell => cell.element === cellElement)) {
                    changedCells.push({ element: cellElement, initial: initialState });
                }
            }
        }
    }
}

async function batchUpdateAvailability(cellChanges) {
    let updates = cellChanges.map(({ element, initial }) => {
        const { day, hour } = getCellIndices(element);
        return {
            day: day,
            hour: hour,
            available: initial
        };
    });

    let new_user_object = { ...state.user_object};

    new_user_object.availability = applyCellChangesToAvailability(new_user_object.availability, updates);

    const response = await fetch(`${API}/users/update_user_by_uuid`, {
        method: "POST",
        body: JSON.stringify(new_user_object)
    });

    if (response.status == 201) {
        state.user_object = new_user_object;
        saveState();
    } else {
        // Roll back the DOM to reflect that the updates weren't successful
        cellChanges.forEach(({ element, initial }) => {
            element.classList.toggle('available', !initial);
        });
        alert('Error updating availability. Please try again.');
    }
}


function applyCellChangesToAvailability(availability, updates) {
    for (let { day, hour, available } of updates) {
        availability[day][hour] = available;
    }
    
    return availability;
}


async function fetchStewardShifts() {
    const response = await fetch(`${API}/shifts/get_shifts_for_steward/${state.user_object.uuid}`, {
        method: "GET",
    });

    if (response.status == 200) {
        const shifts = await response.json();

        return shifts;
    }
}

async function fetchShiftChanges() {
    const response = await fetch(`${API}/shifts/get_shift_changes`, {
        method: "GET",
    });

    if (response.status == 200) {
        const changes = await response.json();

        return changes;
    }
}

async function updateStewardProficiencies() {
    let profs = [];

    for (let prof of PROFICIENCIES) {
        if (document.getElementById(`edit-user-proficiency-${prof}`).checked) {
            profs.push(prof);
        }
    }

    let new_user_object = state.user_object;

    new_user_object.proficiencies = profs;

    const response = await fetch(`${API}/users/update_user_by_uuid`, {
        method: "POST",
        body: JSON.stringify(new_user_object)
    });

    if (response.status == 201) {
        state.user_object = new_user_object;

        saveState();
    }
}

async function populateStewardPage() {
    let shifts = fetchStewardShifts();
    let changes = fetchShiftChanges();

    const prof_container = document.getElementById("steward-proficiencies");
    removeAllChildren(prof_container);

    for (let prof of PROFICIENCIES) {
        let prof_div = document.createElement("div");
        prof_div.classList.add("edit-proficiency-container");

        let prof_checkbox = document.createElement("input");
        prof_checkbox.type = "checkbox";
        if (state.user_object.proficiencies) {
            prof_checkbox.checked = state.user_object.proficiencies.includes(prof);
        } else {
            prof_checkbox.checked = false;
        }
        prof_checkbox.id = `edit-user-proficiency-${prof}`;

        prof_checkbox.onchange = updateStewardProficiencies;
        let prof_label = document.createElement("label");
        prof_label.innerText = prof;
        prof_label.htmlFor = `edit-user-proficiency-${prof}`;

        prof_div.appendChild(prof_checkbox);
        prof_div.appendChild(prof_label);

        prof_container.appendChild(prof_div);
    }

    shifts = await shifts;
    let all_changes = await changes;

    let now = new Date();
    now.setDate(now.getDate() - 1);

    let my_changed_shifts = all_changes.filter((change) => {
        if (change.is_pickup && change.steward == state.user_object.uuid) {
            // Only return shifts that are today or in the future
            let change_date = new Date(change.date);

            return change_date >= now;
        }
    });

    let shift_container = document.getElementById("steward-shifts");
    let divs = [];
    
    let header = document.createElement("tr");
    header.innerHTML = "<th>Shift</th><th>Partner</th><th>Drop</th>";
    
    divs.push(header);

    for (let shift of shifts) {
       divs.push(await generateShiftDiv(shift));
    }

    for (let shift of my_changed_shifts) {
        shift.stewards = [state.user_object.uuid];
        shift.day = DAYS[new Date(shift.date + "T00:00:00-08:00").getDay()];
    
        divs.push(await generateShiftDiv(shift, change=true));
    }

    removeAllChildren(shift_container);
    appendChildren(shift_container, divs);

    // This hide all shifts that are pickups or in the past
    let drop_changes = all_changes.filter((change) => {
        if (change.is_pickup) {
            return false;
        }

        // Only show changes that are today or in the future
        let change_date = new Date(change.date);

        return change_date >= now;
    });

    // Now, hide all shifts that are drops but have a correspoding pickup
    drop_changes = drop_changes.filter((change) => {
        let pickup_changes = all_changes.filter((pickup) => {
            return pickup.is_pickup && pickup.date == change.date && pickup.timestamp_start == change.timestamp_start && pickup.timestamp_end == change.timestamp_end;
        });

        return pickup_changes.length == 0;
    });

    drop_changes.sort((a, b) => {
        let a_date = new Date(a.date + " " + a.timestamp_start);
        let b_date = new Date(b.date + " " + b.timestamp_start);
        
        if (a_date < b_date) {
            return 1;
        } else {
            return -1;
        }
    });

    let available_shifts = document.getElementById("steward-available-shifts");
    header = document.createElement("tr");
    header.innerHTML = "<th>Shift</th><th>Dropped by</th><th>Pickup</th>";
    divs = [];

    divs.push(header);

    for (let change of drop_changes) {
        divs.push(await generateShiftChangeDiv(change));
    }

    removeAllChildren(available_shifts);
    if (divs.length == 0) {
        let no_shifts = document.createElement("h2");
        no_shifts.innerText = "No available shifts";
        divs.push(no_shifts);
    }

    appendChildren(available_shifts, divs);

    // Generate and add availability
    const availability_table = document.getElementById("steward-availability");

    divs = [];

    // Create header row
    header = document.createElement("tr");
    header.innerHTML = "<th>Time</th>";

    for (let day of DAYS) {
        const day_header = document.createElement("th");
        day_header.innerText = day;
        header.appendChild(day_header);
    }
    
    divs.push(header);

    for (let i = 14; i < 23; i++) {
        const row = document.createElement("tr");

        const time = document.createElement("th");
        time.innerText = `${formatHour(i)} - ${formatHour(i + 1)}`;
        row.appendChild(time);

        for (let j = 0; j < 7; j++) {
            const cell = document.createElement("td");
            cell.classList.add("availability-cell");
            cell.id = `availability-cell-${j}-${i}`;

            if (state.user_object.availability) {
                if (state.user_object.availability[j][i]) {
                    cell.classList.add("available");
                }
            }

            row.appendChild(cell);
        }

        divs.push(row);
    }

    removeAllChildren(availability_table);
    appendChildren(availability_table, divs);
}

async function updateStewardAvailability(day, hour, available) {
    let new_user_object = state.user_object;

    new_user_object.availability[day][hour] = available;

    const response = await fetch(`${API}/users/update_user_by_uuid`, {
        method: "POST",
        body: JSON.stringify(new_user_object)
    });

    if (response.status == 201) {
        state.user_object = new_user_object;

        saveState();
    }
}

async function generateShiftDiv(shift, change=false) {
    let stewards = [];

    for (let steward of shift.stewards) {
        if (state.user_object !== null) {
            if (steward == state.user_object.uuid) {
                continue;
            }
        }

        let steward_response = await fetch(`${API}/users/get_user/${steward}`);

        if (steward_response.status == 200) {
            stewards.push(await steward_response.json());
        }
    }

    let shift_div = document.createElement("tr");

    let shift_time_date = document.createElement("td");

    if (change) {
        shift_time_date.innerHTML = `(${shift.date}) <br>`;
    }
    shift_time_date.innerHTML += `${shift.day} <br> ${shift.timestamp_start} to ${shift.timestamp_end}`;

    let shift_stewards = document.createElement("td");

    if (change) {
        shift_stewards.innerText = `Shift Change: ${shift.is_drop ? "Drop" : "Pickup"}`;
    } else {
        let s = stewards.length != 1 ? "s" : "";
        for (let i = 0; i < stewards.length; i++) {
            shift_stewards.innerHTML += `${stewards[i].name} (${stewards[i].email})`;
            if (i != stewards.length - 1) {
                shift_stewards.innerHTML += "<br>";
            }
        }
    }
    

    let shift_drop_container = document.createElement("td");

    let shift_drop_button = document.createElement("button");
    shift_drop_button.classList.add("with-icon");

    if (change) {
        shift_drop_button.innerHTML = "<span class='material-symbols-outlined'>undo</span>Cancel";
        shift_drop_button.onclick = async () => cancelShiftChange(shift);
    } else {
        shift_drop_button.innerHTML = "<span class='material-symbols-outlined'>move_down</span>Drop";
        shift_drop_button.onclick = async () => dropShift(shift);
    }
    shift_drop_container.appendChild(shift_drop_button);

    shift_div.appendChild(shift_time_date);
    shift_div.appendChild(shift_stewards);
    shift_div.appendChild(shift_drop_container);

    return shift_div;
}

async function generateShiftChangeDiv(change) {
    let shift_div = document.createElement("tr");

    let shift_time_date = document.createElement("td");

    let date = new Date(change.date + "T00:00:00-08:00");
    shift_time_date.innerHTML = `(${change.date}) <br> ${DAYS[date.getDay()]} <br> ${change.timestamp_start} to ${change.timestamp_end}`;
    shift_div.appendChild(shift_time_date);

    let dropped_by = document.createElement("td");

    let dropped_by_response = await fetch(`${API}/users/get_user/${change.steward}`);

    if (dropped_by_response.status == 200) {
        let dropped_by_user = await dropped_by_response.json();

        dropped_by.innerText = `Dropped by ${dropped_by_user.name} (${dropped_by_user.email})`;
    }

    shift_div.appendChild(dropped_by);

    let shift_change_container = document.createElement("td");
    let shift_change_button = document.createElement("button");
    shift_change_button.classList.add("with-icon");

    if (change.steward === state.user_object.uuid) {
        shift_change_button.innerHTML = "<span class='material-symbols-outlined'>undo</span>Cancel";
        shift_change_button.onclick = async () => cancelShiftChange(change);
    } else {
        shift_change_button.innerHTML = "<span class='material-symbols-outlined'>move_up</span>Pickup";
        shift_change_button.onclick = async () => pickUpShift(change);
    }

    shift_change_container.appendChild(shift_change_button);
    shift_div.appendChild(shift_change_container);

    return shift_div;
}

async function showPreviousShiftChanges() {
    document.getElementById("view-previous-shift-changes").setAttribute("disabled", "disabled");

    const table = document.getElementById("previous-shift-changes-details");

    // Show previous 10 shift changes with button to show more
    let sorted_shifts = await fetchShiftChanges();

    sorted_shifts.sort((a, b) => {
        let a_date = new Date(a.date);
        let b_date = new Date(b.date);

        if (a.date == b.date) {
            console.log(a, b);
            // Sort by having drops first
            if (a.is_drop && !b.is_drop) {
                return 1;
            } else if (!a.is_drop && b.is_drop) {
                return -1;
            } else {
                // Sort by time
                let a_time = new Date(a.date + "T" + a.timestamp_start);
                let b_time = new Date(b.date + "T" + b.timestamp_start);

                if (a_time < b_time) {
                    return 1;
                } else {
                    return -1;
                }
            }
        }

        if (a_date < b_date) {
            return 1;
        } else {
            return -1;
        }
    });

    let divs = [];

    let header = document.createElement("tr");
    header.innerHTML = "<th>Shift</th><th>Partner</th><th>Pickup/Drop</th>";
    divs.push(header);

    for (let i = 0; i < 10; i++) {
        if (i >= sorted_shifts.length) {
            break;
        }

        divs.push(await createShiftChangeDiv(sorted_shifts[i]));
    }

    // Create button that loads 10 more shifts
    let button_row = document.createElement("tr");
    button_row.id = "load-more-shifts";

    let button_container = document.createElement("td");
    button_container.colSpan = 3;
    button_container.style.textAlign = "center";

    let button = document.createElement("button");
    button.classList.add("with-icon");
    button.innerHTML = "<span class='material-symbols-outlined'>expand_more</span>Load more";
    button.onclick = async () => {
        const btn = document.getElementById("load-more-shifts");
        btn.setAttribute("disabled", "disabled");

        const table = document.getElementById("previous-shift-changes-details");

        // Count number of divs, remove one for header
        let shifts = table.querySelectorAll("tr").length - 1;

        let divs = [];

        for (let i = shifts; i < shifts + 10; i++) {
            if (i >= sorted_shifts.length) {
                break;
            }

            divs.push(await createShiftChangeDiv(sorted_shifts[i]));
        }

        appendChildren(table, divs);

        // Move button to the end
        table.appendChild(btn);

        btn.removeAttribute("disabled");
    }

    button_container.appendChild(button);
    button_row.appendChild(button_container);
    divs.push(button_row);

    removeAllChildren(table);
    appendChildren(table, divs);

    document.getElementById("view-previous-shift-changes").removeAttribute("disabled");


    showPopup("previous-shift-changes");
}

async function createShiftChangeDiv(shift) {
    let shift_div = document.createElement("tr");

        /*
        let div = document.createElement("div");
        div.classList.add("shift-change-list-item");
        
        let date = document.createElement("div");
        date.classList.add("shift-change-list-item-date");
        date.innerText = `${change.date} @ ${change.timestamp_start} - ${change.timestamp_end}`;
        div.appendChild(date);

        let name = document.createElement("div");
        name.classList.add("name");
        // Get steward uuid from change and find steward
        let steward = all_stewards.find(steward => steward.uuid === change.steward) ?? {name: "Unknown steward", email: "Unknown steward", cx_id: "Unknown steward"};
        name.innerText = steward.name;
        div.appendChild(name);

        let cx_id = document.createElement("div");
        cx_id.classList.add("cx_id");
        cx_id.innerText = steward.cx_id;
        div.appendChild(cx_id);

        let email = document.createElement("div");
        email.classList.add("email");
        email.innerText = steward.email;
        div.appendChild(email);

        let drop_or_pickup = document.createElement("div");
        drop_or_pickup.classList.add("drop-or-pickup");
        drop_or_pickup.classList.add(change.is_drop ? "drop" : "pickup");
        drop_or_pickup.innerText = change.is_drop ? "Drop" : "Pickup";
        div.appendChild(drop_or_pickup);

        divs.push(div);

        {
            date: "2023-09-13"
​​
            is_drop: true
            ​​
            is_pickup: false
            ​​
            steward: "bad6e0b0c37943dc8a7c4e47e6aee1b0"
            ​​
            timestamp_end: "3:00 PM"
            ​​
            timestamp_start: "2:00 PM"
            ​​
            uuid: "b36ff032-3a78-497a-809e-38b45d01e1bf"
        }
        */

    let shift_time_date = document.createElement("td");
    shift_time_date.innerHTML = `(${shift.date}) <br> ${DAYS[new Date(shift.date + "T00:00:00-08:00").getDay()]} <br> ${shift.timestamp_start} to ${shift.timestamp_end}`;

    let shift_steward = document.createElement("td");

    let steward_response = await fetch(`${API}/users/get_user/${shift.steward}`);

    if (steward_response.status == 200) {
        let steward = await steward_response.json();

        shift_steward.innerText = `${steward.name} (${steward.email})`;
    } else {
        shift_steward.innerText = "Unknown steward";
    }
    

    let shift_pickup_drop = document.createElement("td");

    if (shift.is_pickup) {
        shift_pickup_drop.innerText = "Pickup";
    } else {
        shift_pickup_drop.innerText = "Drop";
    }

    shift_div.appendChild(shift_time_date);
    shift_div.appendChild(shift_steward);
    shift_div.appendChild(shift_pickup_drop);

    return shift_div;
}

async function dropShift(shift) {
    document.getElementById("drop-shift-details").innerText = `${shift.day} - ${shift.timestamp_start} to ${shift.timestamp_end}`;   

    document.getElementById("edit-shift-submit").onclick = () => submitDropShift(shift);

    showPopup("drop-shift");
}

async function pickUpShift(shift) {
    document.getElementById("pickup-shift-details").innerText = `Are you sure you want to pickup the shift on ${shift.date} (${DAYS[new Date(shift.date + "T00:00:00-08:00").getDay()]}) - ${shift.timestamp_start} to ${shift.timestamp_end}`;

    document.getElementById("pickup-shift-submit").onclick = () => submitPickUpShift(shift);

    showPopup("pickup-shift");
}

async function submitDropShift(shift) {
    // Check that the shift day and the input day match
    let day = shift.day; // Day of week, eg "Wednesday"

    let input_day = document.getElementById("drop-shift-date").value;

    let input_day_obj = new Date(input_day + "T00:00:00-08:00");

    let index = input_day_obj.getDay();

    if (day != DAYS[index]) {
        alert("Shift day and input day do not match");
        return;
    } else {
        // Call the API to drop the shift
        const response = await fetch(`${API}/shifts/drop_shift`, {
            method: "POST",
            body: JSON.stringify({
                // Create random uuid
                uuid: self.crypto.randomUUID(),
                steward: state.user_object.uuid,
                is_pickup: false,
                is_drop: true,
                date: input_day,
                timestamp_start: shift.timestamp_start,
                timestamp_end: shift.timestamp_end,
            })
        }); 
        
        if (response.status == 201) {
            alert("Shift dropped successfully");
            await populateStewardPage();
            closePopup();
        } else {
            let error = await response.json();
            
            alert("Error dropping shift: " + error.detail);
        }
    }
}

async function submitPickUpShift(shift) {
    // Call the API to drop the shift
    const response = await fetch(`${API}/shifts/pickup_shift`, {
        method: "POST",
        body: JSON.stringify({
            // Create random uuid
            uuid: self.crypto.randomUUID(),
            steward: state.user_object.uuid,
            is_pickup: true,
            is_drop: false,
            date: shift.date,
            timestamp_start: shift.timestamp_start,
            timestamp_end: shift.timestamp_end,
        })
    }); 
    
    if (response.status == 201) {
        alert("Shift picked up successfully");
        await populateStewardPage();
        closePopup();
    } else {
        let error = await response.json();
        
        alert("Error picking up shift: " + error.detail);
    }
}

async function cancelShiftChange(shift) {
    // Call the API to drop the shift
    const response = await fetch(`${API}/shifts/cancel_shift_change`, {
        method: "POST",
        body: JSON.stringify({
            uuid: shift.uuid,
            steward: state.user_object.uuid,
        })
    }); 
    
    if (response.status == 201) {
        alert("Shift change canceled successfully");
        await populateStewardPage();
        closePopup();
    } else {
        let error = await response.json();
        
        alert("Error canceling shift change: " + error.detail);
    }
}