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

        let prof_label = document.createElement("label");
        prof_label.innerText = prof;
        prof_label.htmlFor = `edit-user-proficiency-${prof}`;

        prof_div.appendChild(prof_checkbox);
        prof_div.appendChild(prof_label);

        prof_container.appendChild(prof_div);
    }

    shifts = await shifts;
    let all_changes = await changes;

    let today = new Date();
    today.setDate(today.getDate() - 1);

    let my_changed_shifts = all_changes.filter((change) => {
        if (change.is_pickup && change.steward == state.user_object.uuid) {
            // Only return shifts that are today or in the future
            let change_date = new Date(change.date);

            return change_date >= today;
        }
    });

    let shift_container = document.getElementById("steward-shifts");
    let divs = [];
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

        return change_date >= today;
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
    divs = [];
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
}

async function generateShiftDiv(shift, change=false) {
    let stewards = [];

    for (let steward of shift.stewards) {
        if (steward == state.user_object.uuid) {
            continue;
        }

        let steward_response = await fetch(`${API}/users/get_user/${steward}`);

        if (steward_response.status == 200) {
            stewards.push(await steward_response.json());
        }
    }

    let shift_div = document.createElement("div");
    shift_div.classList.add("steward-shift-container");

    let shift_time_date = document.createElement("div");
    shift_time_date.classList.add("steward-shift-time-date");

    if (change) {
        shift_time_date.innerText = `(${shift.date}) `;
    }
    shift_time_date.innerText += `${shift.day} - ${shift.timestamp_start} to ${shift.timestamp_end}`;

    let shift_stewards = document.createElement("div");
    shift_stewards.classList.add("steward-shift-stewards");

    if (change) {
        shift_stewards.innerText = `Shift Change: ${shift.is_drop ? "Dropped" : "Picked Up"}`;
    } else {
        let s = stewards.length != 1 ? "s" : "";
        shift_stewards.innerText = `Shift partner${s}: `;
        for (let i = 0; i < stewards.length; i++) {
            shift_stewards.innerText += `${stewards[i].name} (${stewards[i].email})`;
            if (i != stewards.length - 1) {
                shift_stewards.innerText += ", ";
            }
        }
    }
    

    let shift_drop_button = document.createElement("button");
    shift_drop_button.classList.add("steward-shift-drop-button");
    if (change) {
        shift_drop_button.innerText = "Cancel Shift Change";
        shift_drop_button.onclick = async () => cancelShiftChange(shift);
    } else {
        shift_drop_button.innerText = "Drop A Shift";
        shift_drop_button.onclick = async () => dropShift(shift);
    }

    shift_div.appendChild(shift_time_date);
    shift_div.appendChild(shift_stewards);
    shift_div.appendChild(shift_drop_button);

    return shift_div;
}

async function generateShiftChangeDiv(change) {
    let shift_div = document.createElement("div");
    shift_div.classList.add("shift-change-container");

    let shift_time_date = document.createElement("div");
    shift_time_date.classList.add("time-date");
    let date = new Date(change.date + "T00:00:00-08:00");
    shift_time_date.innerText = `(${change.date}) ${DAYS[date.getDay()]} - ${change.timestamp_start} to ${change.timestamp_end}`;
    shift_div.appendChild(shift_time_date);

    let dropped_by = document.createElement("div");
    dropped_by.classList.add("dropped-by");

    let dropped_by_response = await fetch(`${API}/users/get_user/${change.steward}`);

    if (dropped_by_response.status == 200) {
        let dropped_by_user = await dropped_by_response.json();

        dropped_by.innerText = `Dropped by ${dropped_by_user.name} (${dropped_by_user.email})`;
    }

    shift_div.appendChild(dropped_by);

    let shift_change_button = document.createElement("button");
    shift_change_button.classList.add("pickup-shift-button");

    if (change.steward === state.user_object.uuid) {
        shift_change_button.innerText = "Cancel Drop";
        shift_change_button.onclick = async () => cancelShiftChange(change);
    } else {
        shift_change_button.innerText = "Pick Up Shift";
        shift_change_button.onclick = async () => pickUpShift(change);
    }

    shift_div.appendChild(shift_change_button);

    return shift_div;
}

async function dropShift(shift) {
    document.getElementById("drop-shift-details").innerText = `${shift.day} - ${shift.timestamp_start} to ${shift.timestamp_end}`;   

    document.getElementById("edit-shift-submit").onclick = () => submitDropShift(shift);

    document.getElementById("drop-shift").classList.remove("hidden");
    document.getElementById("popup-container").classList.remove("hidden");
}

async function pickUpShift(shift) {
    document.getElementById("pickup-shift-details").innerText = `Are you sure you want to pickup the shift on ${shift.date} (${DAYS[new Date(shift.date + "T00:00:00-08:00").getDay()]}) - ${shift.timestamp_start} to ${shift.timestamp_end}`;

    document.getElementById("pickup-shift-submit").onclick = () => submitPickUpShift(shift);

    document.getElementById("pickup-shift").classList.remove("hidden");
    document.getElementById("popup-container").classList.remove("hidden");
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