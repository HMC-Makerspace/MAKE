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

    console.log(shifts);

    let shift_container = document.getElementById("steward-shifts");
    let divs = [];
    for (let shift of shifts) {
       divs.push(await generateShiftDiv(shift));
    }

    removeAllChildren(shift_container);
    appendChildren(shift_container, divs);

    changes = await changes;

    let available_shifts = document.getElementById("steward-available-shifts");
    divs = [];
    for (let change of changes) {
        generateShiftChangeDiv(change);
    }

    removeAllChildren(available_shifts);
    if (divs.length == 0) {
        let no_shifts = document.createElement("h2");
        no_shifts.innerText = "No available shifts";
        divs.push(no_shifts);
    }

    appendChildren(available_shifts, divs);
}

async function generateShiftDiv(shift) {
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
    shift_time_date.innerText = `${shift.day} - ${shift.timestamp_start} to ${shift.timestamp_end}`;

    let shift_stewards = document.createElement("div");
    shift_stewards.classList.add("steward-shift-stewards");

    let s = stewards.length != 1 ? "s" : "";
    shift_stewards.innerText = `Shift partner${s}: `;
    for (let i = 0; i < stewards.length; i++) {
        shift_stewards.innerText += `${stewards[i].name}`;
        if (i != stewards.length - 1) {
            shift_stewards.innerText += ", ";
        }
    }

    let shift_drop_button = document.createElement("button");
    shift_drop_button.classList.add("steward-shift-drop-button");
    shift_drop_button.innerText = "Drop A Shift";
    shift_drop_button.onclick = async () => dropShift(shift);

    shift_div.appendChild(shift_time_date);
    shift_div.appendChild(shift_stewards);
    shift_div.appendChild(shift_drop_button);

    return shift_div;
}

function generateShiftChangeDiv(change) {
}

async function dropShift(shift) {
    document.getElementById("drop-shift-details").innerText = `${shift.day} - ${shift.timestamp_start} to ${shift.timestamp_end}`;   

    document.getElementById("edit-shift-submit").onclick = () => submitDropShift(shift);

    document.getElementById("drop-shift").classList.remove("hidden");
    document.getElementById("popup-container").classList.remove("hidden");
}

async function submitDropShift(shift) {
    // Check that the shift day and the input day match
    let day = shift.day; // Day of week, eg "Wednesday"

    let input_day = document.getElementById("drop-shift-date").value;
    input_day = new Date(input_day);

    let index = input_day.getDay();

    if (day != DAYS[index]) {
        alert("Shift day and input day do not match");
        return;
    } else {

    }
}