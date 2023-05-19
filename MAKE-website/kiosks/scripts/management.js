var state = {
    users: null,
    student_storage: null,
    workshops: null,
    shifts: null,
    inventory: null,
};

var shifts_updated = false;

const API = '/api/v2';

window.onpopstate = onHashChange;

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

        if (body.scope == "admin") {
            console.log("Authenticated as admin");
        } else {
            alert("API key does not have admin scope.");
        }
    } else {
        alert("Invalid API key.");
    }

    // Remove api key from url, but keep the rest of the url
    window.history.replaceState({}, document.title, window.location.pathname);

    // Save api key to local storage
    localStorage.setItem('admin_api_key', api_key);

    setInterval(fetchUsers, 5000);
    setInterval(fetchStudentStorageAdmin, 5000);

    await fetchUsers();
    await fetchStudentStorageAdmin();
    await fetchShiftsAdmin();

    for (let key of Object.keys(state.users)) {
        state.users[key].cx_id_str = state.users[key].cx_id.toString();
    }

    submitUserSearch(editable = true);

    setInterval(renderAll(), 5000);
    renderAll();

    // Register esc to close popup
    document.addEventListener("keyup", (e) => {
        if (e.key === "Escape") {
            closePopup();
        }
    });
}

authenticate();

async function fetchShiftsAdmin() {
    const response = await fetch(`${API}/shifts/get_full_shift_schedule`,
        {
            headers: {
                "Content-Type": "application/json",
                "api-key": api_key,
            },
        }
    );

    if (response.status == 200) {
        const shifts = await response.json();

        state.shifts = shifts;
    }
}

async function fetchStudentStorageAdmin() {
    const response = await fetch(`${API}/student_storage/get_student_storage`,
        {
            headers: {
                "Content-Type": "application/json",
                "api-key": api_key,
            },
        }
    );

    if (response.status == 200) {
        const student_storage = await response.json();

        state.student_storage = student_storage;

        console.log(state.student_storage);
    }
}

function renderAll() {
    renderStats();
    renderStudentStorage();
    renderScheduleAdmin();
    renderProficiencies();
}

function renderProficiencies() {
    const proficiencies = document.getElementById("proficiencies-list");

    removeAllChildren(proficiencies);
    appendChildren(proficiencies, generateProficiencyDivs(state.users));
}

function generateProficiencyDivs(users) {
    const divs = [];

    const proficiencies = {};

    return divs;
}

function renderStats() {
    const stats = document.getElementById("stats-info");

    removeAllChildren(stats);
    appendChildren(stats, generateStatsDivs(state.users));
}

function generateStatsDivs(users) {
    const divs = [];

    // First, total quiz stats
    const total_div = document.createElement("h2");
    total_div.innerText = `Total Unique Quiz Takers`;
    divs.push(total_div);
    const total_count = document.createElement("table");
    total_count.id = "total-count-table";

    const total_count_header = document.createElement("tr");
    total_count_header.innerHTML = `<th>School</th><th>Count</th><th>Percent of school</th>`;
    total_count.appendChild(total_count_header);

    const all_count = document.createElement("tr");
    const all_count_users = Object.keys(state.users).length;
    const total_pops = Object.values(school_pops).reduce((acc, cur) => acc + cur, 0);
    const all_count_percent = Math.round((all_count_users / total_pops) * 100);

    all_count.innerHTML = `<td>All</td><td>${all_count_users}</td><td>${all_count_percent}%</td>`;
    total_count.appendChild(all_count);
        
    for (let school_id of Object.keys(school_names)) {
        const count = document.createElement("tr");
        const school_count = Object.values(state.users).filter(user => `${user.cx_id}`.startsWith(school_id)).length;
        const school_perc = Math.round((school_count / school_pops[school_id]) * 100);

        count.innerHTML = `<td>${school_names[school_id]}</td><td>${school_count}</td><td>${school_perc}%</td>`;

        total_count.appendChild(count);
    }

    divs.push(total_count);

    return divs;
}

function showEditUser(uuid) {
    let user = state.users.find(user => user.uuid === uuid);

    document.getElementById("popup-container").classList.remove("hidden");
    document.getElementById("edit-user").classList.remove("hidden");

    document.getElementById("edit-user-name").value = user.name;
    document.getElementById("edit-user-email").value = user.email;
    document.getElementById("edit-user-cx_id").value = user.cx_id;
    document.getElementById("edit-user-role").value = user.role;

    document.getElementById("edit-user-proficiencies").innerHTML = "";

    if (user.role == "steward" || user.role == "head_steward") {
        for (let prof of PROFICIENCIES) {
            let prof_div = document.createElement("div");
            prof_div.classList.add("edit-proficiency-container");

            let prof_checkbox = document.createElement("input");
            prof_checkbox.type = "checkbox";
            if (user.proficiencies) {
                prof_checkbox.checked = user.proficiencies.includes(prof);
            } else {
                prof_checkbox.checked = false;
            }
            prof_checkbox.id = `edit-user-proficiency-${prof}`;

            let prof_label = document.createElement("label");
            prof_label.innerText = prof;
            prof_label.htmlFor = `edit-user-proficiency-${prof}`;

            prof_div.appendChild(prof_checkbox);
            prof_div.appendChild(prof_label);

            document.getElementById("edit-user-proficiencies").appendChild(prof_div);
        }
    }
        

    document.getElementById("edit-user-save").onclick = () => {
        saveUser(uuid);
    }
}

async function saveUser(uuid) {
    let prev_user = state.users.find(user => user.uuid === uuid);

    let user = {
        uuid: uuid,
        name: document.getElementById("edit-user-name").value,
        email: document.getElementById("edit-user-email").value,
        cx_id: Number(document.getElementById("edit-user-cx_id").value),
        role: document.getElementById("edit-user-role").value,
    }

    let profs = [];

    if (prev_user.role == "steward" || prev_user.role == "head_steward") {
        for (let prof of PROFICIENCIES) {
            if (document.getElementById(`edit-user-proficiency-${prof}`).checked) {
                profs.push(prof);
            }
        }

        user.proficiencies = profs;
    }


    let request = await fetch(`${API}/users/update_user`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api-key": api_key,
            },
            body: JSON.stringify(user)
        }
    );

    if (request.status == 200) {
        console.log("User updated");
        fetchUsers().then(() => {
            for (let key of Object.keys(state.users)) {
                state.users[key].cx_id_str = state.users[key].cx_id.toString();
            }
    
            submitUserSearch(editable = true);
        });

        closePopup();
    } else {
        console.log("Error updating user");
    }
}

function showMassAssignRoles() {
    document.getElementById("popup-container").classList.remove("hidden");
    document.getElementById("mass-assign-roles").classList.remove("hidden");

    document.getElementById("mass-assign-roles-save").onclick = () => {
        massAssignRoles();
    }
}

async function massAssignRoles() {
    let users_to_update = [];
    
    const role = document.getElementById("mass-assign-roles-selection").value;
    const identifiers = document.getElementById("mass-assign-roles-text").value.split("\n");
    let errors = [];

    for (let identifier of identifiers) {
        let user = state.users.find(user => String(user.cx_id) === identifier || user.email === identifier || user.uuid === identifier);

        if (user) {
            user.role = role;
            users_to_update.push(user);
        } else {
            errors.push({
                identifier: identifier,
                error: "User not found"
            });
        }   
    }


    for (let user of users_to_update) {
        let request = await fetch(`${API}/users/update_user`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "api-key": api_key,
                    },
                    body: JSON.stringify(user)
                }
            );

        if (request.status != 200) {
            errors.push({
                identifier: user.cx_id,
                error: "Error updating user: " + request.status
            });
        }
    } 

    const status = document.getElementById("mass-assign-roles-status");

    if (errors.length == 0) {
        status.innerText = `${users_to_update.length} users updated`;
        fetchUsers().then(() => {
            for (let key of Object.keys(state.users)) {
                state.users[key].cx_id_str = state.users[key].cx_id.toString();
            }
    
            submitUserSearch(editable = true);
        });
    }
    else {
        console.log("Error updating users");
        console.log(errors);

        status.innerText = `${users_to_update.length - errors.length} users updated, ${errors.length} errors:`;

        for (let error of errors) {
            status.innerHTML += `<br>${error.identifier}: ${error.error}`;
        }
    }

}

async function pushShiftsAdmin() {
    const response = await fetch(`${API}/shifts/update_shift_schedule`,
        {
            headers: {
                "Content-Type": "application/json",
                "api-key": api_key,
            },
            method: "POST",
            body: JSON.stringify(state.shifts),
        }
    );

    if (response.status == 201) {
        console.log("Shifts updated");
    } else {
        console.log("Error updating shifts");
    }
}

function renderScheduleAdmin() {
    const schedule = document.getElementById("schedule-table");

    removeAllChildren(schedule);
    appendChildren(schedule, generateScheduleDivsAdmin());

    const steward_list = document.getElementById("stewards-list-shifts");

    removeAllChildren(steward_list);
    appendChildren(steward_list, generateStewardShiftList());
}

function generateStewardShiftList() {
    // Generate list of stewards and mark how many shifts they have
    let all_stewards = state.users.filter(user => user.role == "steward" || user.role == "head_steward");

    all_stewards.sort((a, b) => {
        if (a.name < b.name) {
            return -1;
        } else {
            return 1;
        }
    });

    let stewards_hours = {};
    let total_shift_hours = 0;

    for (let shift of state.shifts) {
        for (let uuid of shift.stewards) {
            if (uuid in stewards_hours) {
                stewards_hours[uuid] += 1;
            } else {
                stewards_hours[uuid] = 1;
            }

            total_shift_hours++;
        }
    }

    let divs = [];

    for (let steward of all_stewards) {
        let div = document.createElement("div");
        div.classList.add("steward-shift-list-item");

        let name = document.createElement("div");
        name.classList.add("steward-shift-list-item-name");
        name.innerText = steward.name;
        div.appendChild(name);

        let cx_id = document.createElement("div");
        cx_id.classList.add("steward-shift-list-item-cx_id");
        cx_id.innerText = steward.cx_id;
        div.appendChild(cx_id);

        let email = document.createElement("div");
        email.classList.add("steward-shift-list-item-email");
        email.innerText = steward.email;
        div.appendChild(email);

        let hours = stewards_hours[steward.uuid] ?? 0;

        let shifts = document.createElement("div");
        shifts.classList.add("steward-shift-list-item-shifts");

        if (hours < 2) {
            shifts.classList.add("not-enough-hours");
        } else if (hours < 5) {
            shifts.classList.add("good-hours");
        } else {
            shifts.classList.add("too-many-hours");
        }

        shifts.innerText = `${hours} shift hours`;
        div.appendChild(shifts);

        divs.push(div);
    }
    
    document.getElementById("total-hours").innerText = total_shift_hours;
    
    return divs;
}

function generateScheduleDivsAdmin() {
    let divs = [];

    const time_start = 0;
    const time_end = 24;

    // Append header of days to table
    const header = document.createElement("tr");

    const day_header = document.createElement("th");
    day_header.innerText = "Time";
    header.appendChild(day_header);

    for (let day of DAYS) {
        const day_header = document.createElement("th");
        day_header.innerText = day;
        header.appendChild(day_header);
    }

    divs.push(header);

    for (let i = time_start; i < time_end; i++) {
        const row = document.createElement("tr");

        const time = document.createElement("th");
        time.innerText = `${formatHour(i)} - ${formatHour(i + 1)}`;

        row.appendChild(time);

        for (let day of DAYS) {
            const cell = document.createElement("td");

            const inner_div = document.createElement("div");
            inner_div.classList.add("schedule-shift");

            const shift = state.shifts.find(shift => shift.day === day && shift.timestamp_start === formatHour(i));

            if (shift) {
                inner_div.classList.add(`stewards-${shift.stewards.length}`);
                for (let uuid of shift.stewards) {
                    const user = state.users.find(user => user.uuid === uuid);

                    if (user.role == "head_steward") {
                        inner_div.classList.add("head-steward");
                    }

                    const user_div = document.createElement("span");
                    user_div.innerText = user.name;
                    user_div.classList.add("steward");

                    inner_div.appendChild(user_div);
                }
            }

            cell.appendChild(inner_div);

            cell.onclick = () => {
                showEditShift(day, i);
            };

            row.appendChild(cell);
        }

        divs.push(row);
    }
    
    return divs;
}

function showEditShift(day, hour) {
    let shift = state.shifts.find(shift => shift.day === day && shift.timestamp_start === formatHour(hour));

    let all_stewards = state.users.filter(user => user.role === "steward" || user.role === "head_steward");

    // Sort by name
    all_stewards.sort((a, b) => {
        if (a.name < b.name) {
            return -1;
        } else {
            return 1;
        }
    });

    document.getElementById("popup-container").classList.remove("hidden");
    document.getElementById("edit-shift").classList.remove("hidden");
    document.getElementById("edit-shift-day-time").innerText = `${day} @ ${formatHour(hour)}`;
    document.getElementById("show-valid-stewards").onchange = () => {
        showEditShift(day, hour);
    };

    renderShiftStewards(all_stewards, shift, day, hour);
}

function renderShiftStewards(all_stewards, shift, day, hour) {
    const shift_stewards = document.getElementById("edit-shifted-stewards");
    const other_stewards = document.getElementById("edit-unshifted-stewards");

    if (shift == undefined || shift == null) {
        shift = {
            stewards: [],
        };
    }
    
    let stewards_hours = {};

    for (let shift of state.shifts) {
        for (let uuid of shift.stewards) {
            if (uuid in stewards_hours) {
                stewards_hours[uuid] += 1;
            } else {
                stewards_hours[uuid] = 1;
            }
        }
    }

    removeAllChildren(shift_stewards);
    removeAllChildren(other_stewards);

    // First add all stewards on shift
    for (let uuid of shift.stewards) {
        // Search though users, not just stewards, in case a steward was demoted
        const user = state.users.find(user => user.uuid === uuid);

        shift_stewards.appendChild(generateEditStewardShiftDiv(user, true, day, hour));
    }

    // "Valid" stewards are stewards who have enough hours to be on shift,
    // ie they have at least 2 hours
    const show_valid_stewards = document.getElementById("show-valid-stewards").checked;

    // Then add all stewards not on shift
    for (let user of all_stewards) {
        if (show_valid_stewards && (stewards_hours[user.uuid] ?? 0) >= 2) {
            continue;
        }

        if (!shift.stewards.includes(user.uuid)) {
            other_stewards.appendChild(generateEditStewardShiftDiv(user, false, day, hour));
        }
    }
}

function generateEditStewardShiftDiv(user, on_shift, day, hour) {
    const user_div = document.createElement("div");
    user_div.classList.add("add-remove-steward-info");
    // Append name and cx_id
    const name = document.createElement("span");
    name.innerText = `${user.name} (${user.cx_id})`;
    user_div.appendChild(name);

    const add_remove_button = document.createElement("button");

    if (on_shift) {
        user_div.classList.add("on-shift");

        add_remove_button.innerText = "-";
        add_remove_button.onclick = () => {
            deleteStewardFromShift(user.uuid, day, hour);
        }

        // Add button to right side
        user_div.appendChild(add_remove_button);
    } else {
        user_div.classList.add("off-shift");

        add_remove_button.innerText = "+";
        add_remove_button.onclick = () => {
            addStewardToShift(user.uuid, day, hour);
        }

        // Add button to left side
        user_div.insertBefore(add_remove_button, user_div.firstChild);
    }

    return user_div;
}

function addStewardToShift(uuid, day, hour) {
    shifts_updated = true;

    let shift_index = state.shifts.findIndex(shift => shift.day === day && shift.timestamp_start === formatHour(hour));

    if (shift_index === -1) {
        shift = {
            day: day,
            timestamp_start: formatHour(hour),
            timestamp_end: formatHour(hour + 1),
            stewards: [uuid],
        };

        state.shifts.push(shift);
    } else {
        state.shifts[shift_index].stewards.push(uuid);
    }

    showEditShift(day, hour);
}

function deleteStewardFromShift(uuid, day, hour) {
    shifts_updated = true;

    let shift_index = state.shifts.findIndex(shift => shift.day === day && shift.timestamp_start === formatHour(hour));

    if (shift_index === -1) {
        // Something went wrong...
        return;
    }

    let user_index = state.shifts[shift_index].stewards.findIndex(user_uuid => user_uuid === uuid);

    if (user_index === -1) {
        return;
    }

    state.shifts[shift_index].stewards.splice(user_index, 1);

    showEditShift(day, hour);
}