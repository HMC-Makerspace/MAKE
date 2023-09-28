var state = {
    users: null,
    student_storage: null,
    workshops: null,
    shifts: null,
    shift_changes: null,
    inventory: null,
    restock_requests: null,
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
    await fetchShiftChangesAdmin();
    await fetchWorkshopsAdmin();
    await fetchRestockRequests();

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

async function fetchShiftChangesAdmin() {
    const response = await fetch(`${API}/shifts/get_shift_changes`,
        {
            headers: {
                "Content-Type": "application/json",
                "api-key": api_key,
            },
        }
    );

    if (response.status == 200) {
        const changes = await response.json();

        state.shift_changes = changes;
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
    }
}

async function fetchWorkshopsAdmin() {
    const response = await fetch(`${API}/workshops/get_workshops`,
        {
            headers: {
                "Content-Type": "application/json",
                "api-key": api_key,
            },
        }
    );

    if (response.status == 200) {
        const workshops = await response.json();

        state.workshops = workshops;
    }
}

async function fetchRestockRequests() {
    const response = await fetch(`${API}/inventory/get_restock_requests`,
        {
            headers: {
                "Content-Type": "application/json",
                "api-key": api_key,
            },
        }
    );

    if (response.status == 200) {
        const requests = await response.json();

        state.restock_requests = requests;
    }
}

function renderAll() {
    renderStats();
    renderStudentStorage();
    renderScheduleAdmin();
    renderProficiencies();
    renderWorkshopsAdmin();
    renderRestockRequests();
}

function renderRestockRequests() {
    const pending_requests = document.getElementById("pending-restock-requests-list");
    const completed_requests = document.getElementById("completed-restock-requests-list");
    
    removeAllChildren(pending_requests);
    appendChildren(pending_requests, generatePendingRestockRequestDivs());

    removeAllChildren(completed_requests);
    appendChildren(completed_requests, generateCompletedRestockRequestDivs());
}

function replaceLinksWithA(str) {
    return str.replaceAll(/(https?:\/\/[^\s]+)/g, "<a href='$1'>$1</a>");
}

function generatePendingRestockRequestDivs() {
    const pending = state.restock_requests.filter(request => request.timestamp_completed === null);

    let divs = [];

    let header = document.createElement("tr");
    header.innerHTML = `<th>Timestamp Requested</th><th>Requested By</th><th>Item</th><th>Reason</th><th>Complete</th>`;
    divs.push(header);

        /*
    uuid: str
    item: str
    reason: str
    user_uuid: Union[str, None]
    authorized_request: bool
    timestamp_sent: str
    timestamp_completed: Union[str, None]
    rejection_reason: Union[str, None]
    */
    for (let request of pending) {
        let div = document.createElement("tr");
        div.classList.add("restock-request");

        let timestamp_requested = document.createElement("td");
        timestamp_requested.classList.add("restock-request-timestamp_requested");
        timestamp_requested.innerText = new Date(request.timestamp_sent * 1000).toLocaleString();
        div.appendChild(timestamp_requested);

        let requested_by = document.createElement("td");
        requested_by.classList.add("restock-request-requested_by");
        let requested_by_str = "";

        if (request.user_uuid) {
            let user = state.users.find(user => user.uuid === request.user_uuid) ?? null;

            if (user) {
                requested_by_str = user.name + " (" + user.email + ")";
            }
        } else {
            requested_by_str = "Checkout Computer";
        }

        requested_by.innerText = requested_by_str;
        div.appendChild(requested_by);

        let item = document.createElement("td");
        item.classList.add("restock-request-item");
        item.innerHTML = replaceLinksWithA(request.item);
        div.appendChild(item);

        let reason = document.createElement("td");
        reason.classList.add("restock-request-reason");
        reason.innerText = request.reason;
        div.appendChild(reason);

        let complete = document.createElement("td");
        complete.classList.add("restock-request-complete");

        let complete_button = document.createElement("button");
        complete_button.innerText = "Complete";
        complete_button.onclick = () => {
            showCompleteRestockRequest(request.uuid, requested_by_str);
        };

        complete.appendChild(complete_button);
        div.appendChild(complete);

        divs.push(div);
    }

    return divs;
}

function showCompleteRestockRequest(uuid, requested_by_str) {
    let request = state.restock_requests.find(request => request.uuid === uuid);

    document.getElementById("complete-restock-request-user").innerText = requested_by_str;
    document.getElementById("complete-restock-request-item").innerText = request.item;
    document.getElementById("complete-restock-request-reason").innerText = "Reason: " + request.reason;
    document.getElementById("complete-restock-request-quantity").innerText = "Quantity: " + request.quantity;
    document.getElementById("complete-restock-request-notes").value = "";

    document.getElementById("complete-restock-request-approve").onclick = () => {
        completeRestockRequest(uuid, true);
    };

    document.getElementById("complete-restock-request-deny").onclick = () => {
        completeRestockRequest(uuid, false);
    };

    document.getElementById("popup-container").classList.remove("hidden");
    document.getElementById("complete-restock-request").classList.remove("hidden");
}

async function completeRestockRequest(uuid, is_approved) {
    let completion_note = document.getElementById("complete-restock-request-notes").value;

    let request = {
        uuid: uuid,
        is_approved: is_approved,
        completion_note: completion_note,
    };

    let response = await fetch(`${API}/inventory/complete_restock_request`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api-key": api_key,
            },
            body: JSON.stringify(request),
        }
    );

    if (response.status == 201) {
        await fetchRestockRequests();
        renderRestockRequests();

        closePopup();
    } else {
        const body = await response.json();
        alert("Error completing restock request: " + response.status + "\n" + body.detail);
    }
}

function generateCompletedRestockRequestDivs(requests) {
    const completed = state.restock_requests.filter(request => request.timestamp_completed !== null);

    let divs = [];

    let header = document.createElement("tr");
    header.innerHTML = `<th>Timestamp Requested</th><th>Requested By</th><th>Item</th><th>Reason</th><th>Timestamp Completed</th><th>Completion Note</th>`;
    divs.push(header);

    for (let request of completed) {
        let div = document.createElement("tr");
        div.classList.add("restock-request");

        let timestamp_requested = document.createElement("td");
        timestamp_requested.classList.add("restock-request-timestamp_requested");
        timestamp_requested.innerText = new Date(request.timestamp_sent * 1000).toLocaleString();
        div.appendChild(timestamp_requested);

        let requested_by = document.createElement("td");
        requested_by.classList.add("restock-request-requested_by");
        if (request.user_uuid) {
            let user = state.users.find(user => user.uuid === request.user_uuid) ?? null;

            if (user) {
                requested_by.innerText = user.name + " (" + user.email + ")";
            }
        } else {
            requested_by.innerText = "Checkout Computer";
        }
        div.appendChild(requested_by);

        let item = document.createElement("td");
        item.classList.add("restock-request-item");
        item.innerHTML = replaceLinksWithA(request.item);
        div.appendChild(item);

        let reason = document.createElement("td");
        reason.classList.add("restock-request-reason");
        reason.innerText = request.reason;
        div.appendChild(reason);

        let timestamp_completed = document.createElement("td");
        timestamp_completed.classList.add("restock-request-timestamp_completed");
        timestamp_completed.innerText = new Date(request.timestamp_completed * 1000).toLocaleString();
        div.appendChild(timestamp_completed);

        let completion_note = document.createElement("td");
        completion_note.classList.add("restock-request-completion_note");
        completion_note.innerText = request.completion_note;
        div.appendChild(completion_note);

        divs.push(div);
    }

    return divs;
}

function renderWorkshopsAdmin() {
    const workshops = document.getElementById("workshops-list");

    removeAllChildren(workshops);
    appendChildren(workshops, generateWorkshopDivsAdmin());
}

function generateWorkshopDivsAdmin() {
    let divs = [];

    // Add header
    let header = document.createElement("tr");
    header.innerHTML = `<th>Title</th><th>Description</th><th>Instructors</th><th>Start Time</th><th>End Time</th><th>Capacity</th><th>Signups</th><th>Is Live</th><th>Edit</th>`;
    divs.push(header);

    for (let workshop of state.workshops) {
        let div = document.createElement("tr");
        div.classList.add("workshop-admin");

        let title = document.createElement("td");
        title.classList.add("workshop-title");
        title.innerText = workshop.title;
        div.appendChild(title);

        let description = document.createElement("td");
        description.classList.add("workshop-description");
        description.innerText = workshop.description;
        div.appendChild(description);

        let instructors = document.createElement("td");
        instructors.classList.add("workshop-instructors");
        instructors.innerText = workshop.instructors;
        div.appendChild(instructors);

        let timestamp_start = document.createElement("td");
        timestamp_start.classList.add("workshop-timestamp_start");
        timestamp_start.innerText = new Date(workshop.timestamp_start * 1000).toLocaleString();
        div.appendChild(timestamp_start);

        let timestamp_end = document.createElement("td");
        timestamp_end.classList.add("workshop-timestamp_end");
        timestamp_end.innerText = new Date(workshop.timestamp_end * 1000).toLocaleString();
        div.appendChild(timestamp_end);

        let capacity = document.createElement("td");
        capacity.classList.add("workshop-capacity");
        capacity.innerText = workshop.capacity;
        div.appendChild(capacity);

        let rsvp_list = document.createElement("td");
        rsvp_list.classList.add("workshop-rsvp_list");
        rsvp_list.innerText = workshop.rsvp_list.length;
        div.appendChild(rsvp_list);

        let is_live = document.createElement("td");
        is_live.classList.add("workshop-is_live");
        is_live.innerText = workshop.is_live;
        div.appendChild(is_live);

        let edit_button_container = document.createElement("td");
        edit_button_container.classList.add("workshop-edit");
        
        let edit_button = document.createElement("button");
        edit_button.innerText = "Edit";
        edit_button.onclick = () => {
            showCreateEditWorkshop(workshop.uuid);
        };

        edit_button_container.appendChild(edit_button);
        div.appendChild(edit_button_container);

        divs.push(div);
    }

    return divs;
}

function showCreateEditWorkshop(uuid) {
    let workshop = state.workshops.find(workshop => workshop.uuid === uuid);


    if (workshop) {
        let pacific_offset = new Date().getTimezoneOffset() * 60 * 1000;
        let time_start = new Date(workshop.timestamp_start * 1000) - pacific_offset;
        let time_end = new Date(workshop.timestamp_end * 1000) - pacific_offset;
    
        // Get ISO timestamp for Pacific time
        time_start = new Date(time_start).toISOString().split(".")[0];
        time_end = new Date(time_end).toISOString().split(".")[0];

        document.getElementById("edit-workshop-title").value = workshop.title;
        document.getElementById("edit-workshop-description").value = workshop.description;
        document.getElementById("edit-workshop-instructors").value = workshop.instructors;
        document.getElementById("edit-workshop-timestamp_start").value = time_start;
        document.getElementById("edit-workshop-timestamp_end").value = time_end;
        document.getElementById("edit-workshop-capacity").value = workshop.capacity;
        document.getElementById("edit-workshop-is_live").checked = workshop.is_live;
        document.getElementById("edit-workshop-save").onclick = () => {
            saveWorkshop(uuid);
        };
    } else {
        document.getElementById("edit-workshop-title").value = "";
        document.getElementById("edit-workshop-description").value = "";
        document.getElementById("edit-workshop-instructors").value = "";
        document.getElementById("edit-workshop-timestamp_start").value = "";
        document.getElementById("edit-workshop-timestamp_end").value = "";
        document.getElementById("edit-workshop-capacity").value = "";
        document.getElementById("edit-workshop-is_live").value = "";
        document.getElementById("edit-workshop-save").onclick = () => {
            saveWorkshop();
        };
    }

    // Open popup
    document.getElementById("popup-container").classList.remove("hidden");
    document.getElementById("edit-workshop").classList.remove("hidden");
}

async function saveWorkshop(uuid = null) {
    let create_new = false;

    if (uuid === null) {
        create_new = true;
        uuid = self.crypto.randomUUID();
    }

    let workshop = {
        uuid: uuid,
        title: document.getElementById("edit-workshop-title").value,
        description: document.getElementById("edit-workshop-description").value,
        instructors: document.getElementById("edit-workshop-instructors").value,
        timestamp_start: new Date(document.getElementById("edit-workshop-timestamp_start").value).getTime() / 1000,
        timestamp_end: new Date(document.getElementById("edit-workshop-timestamp_end").value).getTime() / 1000,
        capacity: document.getElementById("edit-workshop-capacity").value,
        is_live: document.getElementById("edit-workshop-is_live").checked,
        rsvp_list: [],
        required_quizzes: [],
    };  

    let create_update = "update_workshop";

    if (create_new) {
        create_update = "create_workshop";
    }

    let request = await fetch(`${API}/workshops/${create_update}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api-key": api_key,
            },
            body: JSON.stringify(workshop),
        }
    );

    if (request.status == 201) {
        await fetchWorkshopsAdmin();
        renderWorkshopsAdmin();

        closePopup();
    } else {
        // Alert with details
        const body = await request.json();
        alert("Error saving workshop: " + request.status + "\n" + body.error);
    }
}


function renderProficiencies() {
    const proficiencies = document.getElementById("proficiencies-list");

    removeAllChildren(proficiencies);
    appendChildren(proficiencies, generateProficiencyDivs(state.users));
}

function generateProficiencyDivs(users) {
    const divs = [];

    users = users.filter(user => user.role == "steward" || user.role == "head_steward");

    // Add header
    const header = document.createElement("tr");
    header.innerHTML = `<th>Name</th><th>CX ID</th><th>Email</th>`;
    for (let prof of PROFICIENCIES) {
        header.innerHTML += `<th class='prof'>${prof.replaceAll(" ", "<br>")}</th>`;
    }

    divs.push(header);

    for (let steward of users) {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${steward.name}</td><td>${steward.cx_id}</td><td>${steward.email}</td>`;

        for (let prof of PROFICIENCIES) {
            const cell = document.createElement("td");
            cell.classList.add("proficiency-cell");

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = steward.proficiencies?.includes(prof) ?? false;
            if (checkbox.checked) {
                cell.classList.add("checked")
            }
            checkbox.disabled = true;

            cell.appendChild(checkbox);

            row.appendChild(cell);
        }

        divs.push(row);
    }


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

function toggleOnlyStewards() {
    const only_stewards = document.getElementById("only-stewards").checked;

    if (only_stewards) {
        document.getElementById("only-stewards-label").innerText = "Only stewards";
    } else {
        document.getElementById("only-stewards-label").innerText = "All users";
    }

    submitUserSearch(editable = true);
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
    // Generate list of stewards and mark how many shifts they have
    let all_stewards = state.users.filter(user => user.role == "steward" || user.role == "head_steward");

    all_stewards.sort((a, b) => {
        if (a.name < b.name) {
            return -1;
        } else {
            return 1;
        }
    });
    
    const schedule = document.getElementById("schedule-table");

    removeAllChildren(schedule);
    appendChildren(schedule, generateScheduleDivsAdmin());

    const steward_list = document.getElementById("stewards-list-shifts");

    removeAllChildren(steward_list);
    appendChildren(steward_list, generateStewardShiftList(all_stewards));

    const shift_change_list = document.getElementById("shift-change-list");

    removeAllChildren(shift_change_list);
    appendChildren(shift_change_list, generateShiftChangeList(all_stewards));
}

function generateStewardShiftList(all_stewards) {
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

function generateShiftChangeList(all_stewards) {
    let divs = [];

    let sorted_shifts = state.shift_changes;

    // Sort shift changes by date, so that the newest are at the top
    sorted_shifts.sort((a, b) => {
        let a_date = new Date(a.date);
        let b_date = new Date(b.date);

        if (a_date < b_date) {
            return 1;
        } else {
            return -1;
        }
    });

    for (let change of sorted_shifts) {
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
    }

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
    name.innerText = `${user.name} (${user.email})`;
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
