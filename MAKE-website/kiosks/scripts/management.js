var state = {
    users: null,
    student_storage: null,
    workshops: null,
    shifts: null,
    shift_changes: null,
    inventory: null,
    restock_requests: null,
    quizzes: null,
    checkouts: null,
};

var shifts_updated = false;
var photo_queue = [];

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

    // Register esc to close popup
    document.addEventListener("keyup", (e) => {
        if (e.key === "Escape") {
            closePopup();
        }
    });

    setInterval(fetchUsers, 5000);
    setInterval(fetchStudentStorageAdmin, 5000);

    await fetchInventory(kiosk_mode = true);
    await fetchQuizzes();
    await fetchUsers();
    await fetchStudentStorageAdmin();
    await fetchShiftsAdmin();
    await fetchShiftChangesAdmin();
    await fetchWorkshopsAdmin();
    await fetchRestockRequests();
    await fetchCheckoutsAdmin();

    for (let key of Object.keys(state.users)) {
        state.users[key].cx_id_str = `${state.users[key].cx_id}`;
    }

    submitUserSearch(editable = true);

    setInterval(renderAll(), 5000);
    renderAll();
}

authenticate();

async function fetchCheckoutsAdmin() {
    const response = await fetch(`${API}/checkouts/get_checkouts`,
        {
            method: 'GET',
            headers: {
                'api-key': api_key
            }
        }
    );
    const checkouts = await response.json();

    if (checkouts === null) {
        return null;
    }

    state.checkouts = checkouts;
}

async function fetchQuizzes() {
    const response = await fetch(`${API}/misc/get_quizzes`,
        {
            headers: {
                "Content-Type": "application/json",
            },
        }
    );

    if (response.status == 200) {
        const quizzes = await response.json();

        state.quizzes = quizzes;
    }
}

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
    renderStudentStorage();
    renderScheduleAdmin();
    renderProficiencies();
    renderWorkshopsAdmin();
    renderRestockRequests();
    renderAvailability();
    renderStatistics();
}

function renderAvailability() {
    const availability_table = document.getElementById("steward-availability");
    const availability_table_list = document.getElementById("steward-availability-list");

    let schedule_divs = [];
    let list_divs = [];

    // Create header row
    const header = document.createElement("tr");
    header.innerHTML = "<th>Time</th>";

    for (let day of DAYS) {
        const day_header = document.createElement("th");
        day_header.innerText = day;
        header.appendChild(day_header);
    }
    
    schedule_divs.push(header);

    // Create list of stewards
    let header_list = document.createElement("tr");
    header_list.innerHTML = `<th>Name</th><th>CX ID</th><th>Email</th><th>Hours Available</th>`;
    list_divs.push(header_list);

    let stewards = state.users.filter(user => user.role == "steward" || user.role == "head_steward");
    // Sort by name
    stewards.sort((a, b) => a.name.localeCompare(b.name));

    for (let i = 12; i < 24; i++) {
        const row = document.createElement("tr");

        const time = document.createElement("th");
        time.innerText = formatHour(i);
        row.appendChild(time);

        for (let j = 0; j < 7; j++) {
            const cell = document.createElement("td");
            cell.classList.add("availability-cell");
            cell.id = `availability-cell-${j}-${i}`;

            let total_available = [];
            let total_filled_out = 0;

            for (let steward of stewards) {
                if (steward.availability === null) {
                    continue;
                }

                if (steward.availability[j][i]) {
                    total_available.push(steward);
                }

                total_filled_out++;
            }

            cell.innerText = `${total_available.length} / ${total_filled_out}`;

            if (total_available != 0) {
                cell.classList.add("available");
                cell.onclick = () => {
                    showAvailabilityPopup(j, i, total_available);
                }
            }

            row.appendChild(cell);
        }

        schedule_divs.push(row);
    }

    removeAllChildren(availability_table);
    appendChildren(availability_table, schedule_divs);

    for (let steward of stewards) {
        const row = document.createElement("tr");
        
        let hours_available = 0;

        if (steward.availability !== null) {
            for (let day of steward.availability) {
                for (let hour of day) {
                    if (hour) {
                        hours_available++;
                    }
                }
            }
        }

        let hours_class = "";

        if (hours_available < 2) {
            hours_class = "not-enough-hours";
        } else if (hours_available < 6) {
            hours_class = "too-many-hours";
        } else {
            hours_class = "good-hours";
        }

        row.innerHTML = `<td>${steward.name}</td><td>${steward.cx_id}</td><td>${steward.email}</td><td class='${hours_class}'>${hours_available}</td>`;

        row.onmouseenter = () => {
            if (steward.availability === null) {
                return;
            }

            for (let day = 0; day < 7; day++) {
                for (let hour = 0; hour < 24; hour++) {
                    if (steward.availability[day][hour]) {
                        document.getElementById(`availability-cell-${day}-${hour}`).classList.add("highlight");
                    }
                }
            }
        };

        row.onmouseleave = () => {
            let divs = document.getElementsByClassName("availability-cell");

            for (let div of divs) {
                div.classList.remove("highlight");
            }
        };


        list_divs.push(row);
    }

    removeAllChildren(availability_table_list);
    appendChildren(availability_table_list, list_divs);

}

function showAvailabilityPopup(day, hour, available) {
    const time = document.getElementById("single-availability-popup-time");
    const steward_table = document.getElementById("single-availability-popup-stewards");

    time.innerText = `${DAYS[day]} ${formatHour(hour)}`;

    removeAllChildren(steward_table);
    // Add header
    const header = document.createElement("tr");
    header.innerHTML = `<th>Name</th><th>CX ID</th><th>Email</th>`;
    steward_table.appendChild(header);

    for (let steward of available) {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${steward.name}</td><td>${steward.cx_id}</td><td>${steward.email}</td>`;
        steward_table.appendChild(row);
    }

    showPopup("single-availability-popup");
}


function renderStatistics() {
    const checkoutCountsByHour = new Array(24).fill(0);
    const checkoutCountsByItem = {};
    const dailyCounts = generateDailyCountsFromCheckouts();

    // Process each checkout to tally by hour
    state.checkouts.forEach(checkout => {
        const outDate = new Date(checkout.timestamp_out * 1000);
        checkoutCountsByHour[outDate.getHours()]++;

        // Tally checkouts by item
        Object.keys(checkout.items).forEach(itemUuid => {
            const itemCount = checkout.items[itemUuid];
            const itemName = state.inventory.find(item => item.uuid === itemUuid)?.name || 'Unknown Item';
            checkoutCountsByItem[itemName] = (checkoutCountsByItem[itemName] || 0) + itemCount;
        });
    });

    generateCheckoutHeatmap(checkoutCountsByHour);
    generateCheckoutItemsChart(checkoutCountsByItem);
    generateDailyCheckoutTrendsChart(dailyCounts);
    generateCheckoutsByUserRoleChart();
}

function generateDailyCountsFromCheckouts() {
    // Initialize an empty object to hold date: count mappings
    const dailyCounts = {};

    // Iterate through each checkout in the state.checkouts array
    state.checkouts.forEach(checkout => {
        // Convert UNIX timestamp to a Date object
        const dateOut = new Date(checkout.timestamp_out * 1000);

        // If it was more than 30 days ago, skip it
        if (dateOut < new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)) {
            return;
        }

        // Format the date as YYYY-MM-DD for consistency
        const dateString = dateOut.toISOString().split('T')[0];

        // If the date already exists in dailyCounts, increment the count, else initialize it to 1
        if (dailyCounts[dateString]) {
            dailyCounts[dateString] += 1;
        } else {
            dailyCounts[dateString] = 1;
        }
    });

    return dailyCounts;
}

function generateCheckoutHeatmap(checkoutCountsByHour) {
    const ctx = document.getElementById('checkout-heatmap');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Array.from({ length: 24 }, (_, i) => `${i}:00`), // `0:00`, `1:00`, ... `23:00
            datasets: [{
                label: 'Checkouts by Hour',
                data: checkoutCountsByHour,
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function generateCheckoutItemsChart(checkoutCountsByItem) {
    const sortedItems = Object.entries(checkoutCountsByItem).sort((a, b) => b[1] - a[1]).slice(0, 10); // top 10 items
    const itemNames = sortedItems.map(item => item[0]);
    const itemCounts = sortedItems.map(item => item[1]);

    const ctx = document.getElementById('checkout-items-chart');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: itemNames,
            datasets: [{
                label: 'Number of Checkouts',
                data: itemCounts,
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function generateDailyCheckoutTrendsChart(dailyCounts) {
    const ctx = document.getElementById('daily-checkout-trends-chart').getContext('2d');

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(dailyCounts), // Assuming dates are in 'YYYY-MM-DD' format
            datasets: [{
                label: 'Daily Checkouts',
                data: Object.values(dailyCounts),
                backgroundColor: 'rgba(100, 150, 100, 0.5)',
            }]
        },
        options: {
            scales: {
                x: {
                    type: 'time',
                    time: {
                        parser: 'YYYY-MM-DD',
                        // For Moment.js, you might use format: 'YYYY-MM-DD'
                        tooltipFormat: 'll',
                        unit: 'day'
                    },
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Checkouts'
                    }
                }
            }
        }
    });
}

function generateCheckoutsByUserRoleChart() {
    // Initialize a role count object
    const roleCounts = {
        user: 0,
        steward: 0,
        head_steward: 0,
        admin: 0
    };

    // Loop through each checkout
    state.checkouts.forEach(checkout => {
        // Find the user who checked out the item(s)
        const user = state.users.find(user => user.uuid === checkout.checked_out_by);
        if (user && roleCounts.hasOwnProperty(user.role)) {
            // If the user exists and has a valid role, increment the count for that role
            roleCounts[user.role]++;
        }
    });

    // Prepare for the chart
    const ctx = document.getElementById('checkouts-by-user-role-chart').getContext('2d');
    const labels = Object.keys(roleCounts);
    const data = Object.values(roleCounts);
    const backgroundColors = labels.map(() => `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.5)`);

    // Generate the chart
    new Chart(ctx, {
        type: 'pie', // Changed from 'polarArea' to 'pie'
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
            }],
        },
        options: {
            plugins: {
                legend: {
                    position: 'top',
                }
            }
        }
    });
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
    let pending = state.restock_requests.filter(request => request.timestamp_completed === null);
    pending.reverse();

    let divs = [];

    let header = document.createElement("tr");
    header.innerHTML = `<th>Timestamp Requested</th><th>Requested By</th><th>Item</th><th>Quantity</th><th>Reason</th><th>Complete</th>`;
    divs.push(header);


    for (let request of pending) {
        let div = document.createElement("tr");
        div.classList.add("restock-request");

        let timestamp_requested = document.createElement("td");
        timestamp_requested.classList.add("restock-request-timestamp_requested");
        timestamp_requested.innerText = new Date(request.timestamp_sent * 1000).toLocaleString();

        // Remove the seconds from the timestamp, but preserve the AM/PM
        timestamp_requested.innerText = timestamp_requested.innerText.replace(/:\d{2} /, " ");

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

        let quantity = document.createElement("td");
        quantity.classList.add("restock-request-quantity");
        quantity.innerText = request.quantity;
        div.appendChild(quantity);

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
    document.getElementById("complete-restock-request-item").innerHTML = "Item: " + replaceLinksWithA(request.item);
    document.getElementById("complete-restock-request-reason").innerText = "Reason: " + request.reason;
    document.getElementById("complete-restock-request-quantity").innerText = "Quantity: " + request.quantity;
    document.getElementById("complete-restock-request-notes").value = "";

    document.getElementById("complete-restock-request-approve").removeAttribute("disabled");
    document.getElementById("complete-restock-request-deny").removeAttribute("disabled");

    document.getElementById("complete-restock-request-approve").onclick = () => {
        completeRestockRequest(uuid, true);
    };

    document.getElementById("complete-restock-request-deny").onclick = () => {
        completeRestockRequest(uuid, false);
    };

    showPopup("complete-restock-request");
}

async function completeRestockRequest(uuid, is_approved) {
    document.getElementById("complete-restock-request-approve").setAttribute("disabled", "disabled");
    document.getElementById("complete-restock-request-deny").setAttribute("disabled", "disabled");

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

function generateCompletedRestockRequestDivs() {
    let completed = state.restock_requests.filter(request => request.timestamp_completed !== null);
    completed.reverse();

    let divs = [];

    let header = document.createElement("tr");
    header.innerHTML = `<th>Timestamp Requested</th><th>Requested By</th><th>Item</th><th>Quantity</th><th>Reason</th><th>Result</th><th>Timestamp Completed</th><th>Completion Note</th>`;
    divs.push(header);

    for (let request of completed) {
        let div = document.createElement("tr");
        div.classList.add("restock-request");

        let timestamp_requested = document.createElement("td");
        timestamp_requested.classList.add("restock-request-timestamp_requested");
        timestamp_requested.innerText = new Date(request.timestamp_sent * 1000).toLocaleString();

        // Remove the seconds from the timestamp, but preserve the AM/PM
        timestamp_requested.innerText = timestamp_requested.innerText.replace(/:\d{2} /, " ");
        
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

        let quantity = document.createElement("td");
        quantity.classList.add("restock-request-quantity");
        quantity.innerText = request.quantity;
        div.appendChild(quantity);

        let reason = document.createElement("td");
        reason.classList.add("restock-request-reason");
        reason.innerText = request.reason;
        div.appendChild(reason);

        let is_approved = document.createElement("td");
        is_approved.classList.add("restock-request-is_approved");
        is_approved.classList.add(request.is_approved ? "approved" : "denied");
        is_approved.innerText = request.is_approved ? "Approved" : "Denied";
        div.appendChild(is_approved);

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

    let header = document.createElement("tr");
    header.innerHTML = `<th>Title</th><th>Description</th><th>Instructors</th><th>Start Time</th><th>Capacity</th><th>Live</th><th>Signups</th><th>Attendees</th><th>Edit</th><th>Delete</th>`;
    divs.push(header);

    let sorted_workshops = state.workshops.sort((a, b) => b.timestamp_start - a.timestamp_start);

    // Group workshops by month-year
    let workshopsByMonthYear = {};
    for (let workshop of sorted_workshops) {
        let workshopMonthYear = new Date(workshop.timestamp_start * 1000).toLocaleString('default', { month: 'long', year: 'numeric' });

        if (!workshopsByMonthYear[workshopMonthYear]) {
            workshopsByMonthYear[workshopMonthYear] = [];
        }

        workshopsByMonthYear[workshopMonthYear].push(workshop);
    }

    for (let monthYear in workshopsByMonthYear) {
        let workshops = workshopsByMonthYear[monthYear];

        let separator = document.createElement("tr");
        separator.classList.add("workshop-month-separator");
        let separatorText = document.createElement("td");
        separatorText.setAttribute("colspan", "9");
        separatorText.innerText = `${monthYear} (${workshops.length} workshop${workshops.length > 1 ? "s" : ""})`;
        separator.appendChild(separatorText);
        divs.push(separator);

        for (let workshop of workshops) {
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

            let capacity = document.createElement("td");
            capacity.classList.add("workshop-capacity");
            capacity.innerText = `${workshop.capacity}`;
            div.appendChild(capacity);

            let is_live = document.createElement("td");
            is_live.classList.add("workshop-is_live");
            is_live.classList.add(workshop.is_live ? "published" : "unpublished");
            is_live.innerHTML = workshop.is_live ? "<span class='material-symbols-outlined'>published_with_changes</span>" : "<span class='material-symbols-outlined'>unpublished</span>";
            div.appendChild(is_live);

            let rsvp_list = document.createElement("td");
            rsvp_list.classList.add("workshop-rsvp_list");
            let rsvp_button = document.createElement("button");
            let total_rsvps = workshop.rsvp_list ? workshop.rsvp_list.length : 0;
            rsvp_button.innerHTML = `<span>${total_rsvps}</span><span class='material-symbols-outlined'>group</span>`;
            rsvp_button.onclick = () => {
                showRSVPListAdmin(workshop.uuid);
            };
            rsvp_list.appendChild(rsvp_button);
            div.appendChild(rsvp_list);

            let attendees = document.createElement("td");
            attendees.classList.add("workshop-attendees");
            let attendees_button = document.createElement("button");
            let total_attendees = workshop.sign_in_list ? workshop.sign_in_list.length : 0;
            attendees_button.innerHTML = `<span>${total_attendees}</span><span class='material-symbols-outlined'>people</span>`;
            attendees_button.onclick = () => {
                showWorkshopAttendees(workshop.uuid);
            };
            attendees.appendChild(attendees_button);
            div.appendChild(attendees);

            let edit_button_container = document.createElement("td");
            edit_button_container.classList.add("workshop-edit");
            
            let edit_button = document.createElement("button");
            edit_button.innerHTML = "<span class='material-symbols-outlined'>tune</span>"
            edit_button.onclick = () => {
                showCreateEditWorkshop(workshop.uuid);
            };

            edit_button_container.appendChild(edit_button);
            div.appendChild(edit_button_container);

            let delete_button_container = document.createElement("td");
            delete_button_container.classList.add("workshop-delete");
            
            let delete_button = document.createElement("button");
            delete_button.classList.add("delete");
            delete_button.innerHTML = "<span class='material-symbols-outlined'>delete</span>"
            delete_button.onclick = () => {
                deleteWorkshop(workshop.uuid);
            };

            delete_button_container.appendChild(delete_button);
            div.appendChild(delete_button_container);

            divs.push(div);
        }
    }

    return divs;
}

function openWorkshopPhotos(event) {
    // ensure that the click was on the div and not a button
    if (event.target.tagName === "BUTTON") {
        return;
    }
    
    document.getElementById("edit-workshop-photos-input").click();
}

function dragOverWorkshopPhotos(event) {
    event.preventDefault();
}

function dropWorkshopPhotos(event) {
    event.preventDefault();
    let files = event.dataTransfer.files;
    for (let i = 0; i < files.length; i++) {
        photo_queue.push(files[i]);
        addPhotoToQueue(files[i]);
    }
}

async function selectWorkshopPhotos(event) {
    let files = event.target.files;
    for (let i = 0; i < files.length; i++) {
        photo_queue.push(files[i]);
        addPhotoToQueue(files[i]);
    }
}

function addPhotoToQueue(file) {
    const editWorkshopPhotosDiv = document.getElementById("edit-workshop-photos");
  
    const photoBox = generateWorkshopPhotoDiv(file, uploaded = false);
  
    editWorkshopPhotosDiv.appendChild(photoBox);
}

function removePhotoFromQueue(file) {
    const index = photo_queue.indexOf(file);
    if (index > -1) {
        photo_queue.splice(index, 1);
    }
}

function showWorkshopAttendees(uuid) {
    let workshop = state.workshops.find(workshop => workshop.uuid === uuid);

    if (workshop) {
        const attendees = document.getElementById("attendees-table");

        removeAllChildren(attendees);

        let header = document.createElement("tr");
        header.innerHTML = `<th>Name</th><th>CX ID</th><th>Email</th>`;
        attendees.appendChild(header);

        if (!workshop.sign_in_list) {
            workshop.sign_in_list = [];
        }   

        if (workshop.sign_in_list.length === 0) {
            let div = document.createElement("tr");
            div.classList.add("workshop-attendee");
            div.innerHTML = "<td colspan='3'>No attendees</td>";
            attendees.appendChild(div);
        }

        for (let uuid of workshop.sign_in_list) {
            let user = state.users.find(user => user.uuid === uuid);

            if (user) {
                let div = document.createElement("tr");
                div.classList.add("workshop-attendee");
            
                let name = document.createElement("td");
                name.classList.add("workshop-attendee-name");
                name.innerText = user.name;
                div.appendChild(name);

                let cx_id = document.createElement("td");
                cx_id.classList.add("workshop-attendee-cx_id");
                cx_id.innerText = user.cx_id;
                div.appendChild(cx_id);

                let email = document.createElement("td");
                email.classList.add("workshop-attendee-email");
                email.innerText = user.email;
                div.appendChild(email);

                attendees.appendChild(div);
            }
        }

        showPopup("workshop-attendees");
    } else {
        alert("Error finding workshop with uuid " + uuid);
    }

}

function showRSVPListAdmin(uuid) {
    let workshop = state.workshops.find(workshop => workshop.uuid === uuid);

    if (workshop) {
        const rsvp_list = document.getElementById("workshop-signups-list");

        removeAllChildren(rsvp_list);

        let header = document.createElement("tr");
        header.innerHTML = `<th>Name</th><th>CX ID</th><th>Email</th>`;
        rsvp_list.appendChild(header);

        for (let uuid of workshop.rsvp_list) {
            let user = state.users.find(user => user.uuid === uuid);

            if (user) {
                let div = document.createElement("tr");
                div.classList.add("workshop-signup");
            
                let name = document.createElement("td");
                name.classList.add("workshop-signup-name");
                name.innerText = user.name;
                div.appendChild(name);

                let cx_id = document.createElement("td");
                cx_id.classList.add("workshop-signup-cx_id");
                cx_id.innerText = user.cx_id;
                div.appendChild(cx_id);

                let email = document.createElement("td");
                email.classList.add("workshop-signup-email");
                email.innerText = user.email;
                div.appendChild(email);

                rsvp_list.appendChild(div);
            }
        }

        document.getElementById("workshop-signups-send-email").onclick = () => {
            sendWorkshopEmail(workshop.uuid);
        };

        showPopup("workshop-signups");
    } else {
        alert("Error finding workshop with uuid " + uuid);
    }
}

async function sendWorkshopEmail(uuid) {
    let subject = document.getElementById("workshop-signups-email-subject").value;
    let body = document.getElementById("workshop-signups-email-body").value;

    if (subject.trim() === "" || body.trim() === "") {
        alert("Subject and/or body cannot be empty.");
        return;
    }

    document.getElementById("workshop-signups-send-email").setAttribute("disabled", "disabled");

    let request = await fetch(`${API}/workshops/send_custom_workshop_email`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api-key": api_key,
            },
            body: JSON.stringify({
                uuid: uuid,
                subject: subject,
                body: body,
            }),
        }
    );

    if (request.status == 201) {
        alert("Email sent successfully.");
    }

    document.getElementById("workshop-signups-send-email").removeAttribute("disabled");
}

function showCreateEditWorkshop(uuid) {
    let workshop = state.workshops.find(workshop => workshop.uuid === uuid);

    photo_queue = [];

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
        document.getElementById("edit-workshop-date").value = time_start.substr(0, 10);
        document.getElementById("edit-workshop-timestamp_start").value = time_start.substr(11, 5);
        document.getElementById("edit-workshop-timestamp_end").value = time_end.substr(11, 5);
        document.getElementById("edit-workshop-capacity").value = workshop.capacity;
        document.getElementById("edit-workshop-is_live").checked = workshop.is_live;
        document.getElementById("edit-workshop-save").onclick = () => {
            saveWorkshop(uuid);
        };

        const required_quizzes = document.getElementById("edit-workshop-required_quizzes");
     
        removeAllChildren(required_quizzes);
        appendChildren(required_quizzes, generateRequiredQuizDivs(workshop.required_quizzes));

        const photos = document.getElementById("edit-workshop-photos");
        removeAllChildren(photos, keep_first_n = 1);
        appendChildren(photos, generateWorkshopPhotoDivs(workshop));
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

        const required_quizzes = document.getElementById("edit-workshop-required_quizzes");
             
        removeAllChildren(required_quizzes);
        appendChildren(required_quizzes, generateRequiredQuizDivs());

        const photos = document.getElementById("edit-workshop-photos");
        removeAllChildren(photos, keep_first_n = 1);
    }

    // Open popup
    showPopup("edit-workshop");
}

function generateWorkshopPhotoDivs(workshop) {
    let divs = [];

    if (workshop.photos) {
        for (let photo of workshop.photos) {
            divs.push(generateWorkshopPhotoDiv(photo, uploaded = true, workshop = workshop));
        }
    }

    return divs;
}
    
function generateWorkshopPhotoDiv(file, uploaded = false, workshop = null) {
    const photoBox = document.createElement("div");
    photoBox.classList.add("photo-box");
  
    const closeButton = document.createElement("button");
    closeButton.classList.add("close-button");
    closeButton.innerText = "X";

    if (uploaded) {
        closeButton.addEventListener("click", async () => {
            // call delete photo endpoint
            let request = await fetch(`${API}/workshops/delete_photo_from_workshop`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "api-key": api_key,
                    },
                    body: JSON.stringify({ workshop_uuid: workshop.uuid, photo_uuid: file}),
                }
            );

            if (request.status == 201) {
                workshop.photos = workshop.photos.filter(photo => photo !== file);
                photoBox.remove();
            } else {
                alert("Error deleting photo: " + request.status);
            }
        });
    } else {
        closeButton.addEventListener("click", () => {
            removePhotoFromQueue(file);
            document.getElementById("edit-workshop-photos").removeChild(photoBox);
        });
    }

  
    const photo = document.createElement("img");
    if (uploaded) {
        photo.src = `${API}/workshops/download_photo/${file}`;
    } else {
        photo.src = URL.createObjectURL(file);
    }
  
    photoBox.appendChild(closeButton);
    photoBox.appendChild(photo);

    return photoBox;
}

async function deleteWorkshop(uuid) {
    // Confirm
    if (!confirm("Are you sure you want to delete this workshop?")) {
        return;
    }

    let request = await fetch(`${API}/workshops/delete_workshop`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api-key": api_key,
            },
            body: JSON.stringify({ uuid: uuid }),
        }
    );

    if (request.status == 200) {
        await fetchWorkshopsAdmin();
        renderWorkshopsAdmin();
    } else {
        alert("Error deleting workshop: " + request.status);
    }
}

function generateRequiredQuizDivs(required_quizzes = []) {
    let divs = [];

    for (let quiz of Object.keys(state.quizzes)) {
        let div = document.createElement("div");
        div.classList.add("checkbox-container");

        let checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `edit-workshop-quiz-${quiz}`;

        if (required_quizzes.includes(quiz)) {
            checkbox.checked = true;
        }

        let label = document.createElement("label");
        label.innerText = quiz;
        label.htmlFor = `edit-workshop-quiz-${quiz}`;

        div.appendChild(checkbox);
        div.appendChild(label);

        divs.push(div);
    }

    return divs;
}

async function saveWorkshop(uuid = null) {
    // disable save button
    document.getElementById("edit-workshop-save").setAttribute("disabled", "disabled");

    let create_new = false;

    if (uuid === null) {
        create_new = true;
        uuid = self.crypto.randomUUID();
    }

    const date = document.getElementById("edit-workshop-date").value;
    const timestamp_start = new Date(`${date}T${document.getElementById("edit-workshop-timestamp_start").value}`).getTime() / 1000;
    const timestamp_end = new Date(`${date}T${document.getElementById("edit-workshop-timestamp_end").value}`).getTime() / 1000;
    let required_quizzes = [];

    for (let child of document.getElementById("edit-workshop-required_quizzes").children) {
        if (child.children[0].checked) {
            required_quizzes.push(child.children[0].id.split("-")[3]);
        }
    }


    let workshop = {
        uuid: uuid,
        title: document.getElementById("edit-workshop-title").value,
        description: document.getElementById("edit-workshop-description").value,
        instructors: document.getElementById("edit-workshop-instructors").value,
        timestamp_start: timestamp_start,
        timestamp_end: timestamp_end,
        capacity: document.getElementById("edit-workshop-capacity").value,
        is_live: document.getElementById("edit-workshop-is_live").checked,
        rsvp_list: [],
        required_quizzes: required_quizzes
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
        if (photo_queue.length > 0) {
            await uploadWorkshopPhotos(uuid);
        }

        await fetchWorkshopsAdmin();
        renderWorkshopsAdmin();

        // Enable save button
        document.getElementById("edit-workshop-save").removeAttribute("disabled");
        closePopup();
    } else {
        document.getElementById("edit-workshop-save").removeAttribute("disabled");

        // Alert with details
        const body = await request.json();
        alert("Error saving workshop: " + request.status + "\n" + body.error);
    }
}

async function uploadWorkshopPhotos(uuid) {
    for (let photo of photo_queue) {
        let form = new FormData();
        form.append("workshop_uuid", uuid);
        form.append("file", photo);

        let request = await fetch(`${API}/workshops/add_photo_to_workshop`,
            {
                method: "POST",
                headers: {
                    "api-key": api_key,
                },
                body: form,
            }
        );

        if (request.status != 201) {
            alert("Error uploading photo: " + request.status);
        }
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

    showPopup("edit-user");

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
                state.users[key].cx_id_str = `${state.users[key].cx_id}`;
            }
    
            submitUserSearch(editable = true);
        });

        closePopup();
    } else {
        console.log("Error updating user");
    }
}

function showMassAssignRoles() {
    showPopup("mass-assign-roles");

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
                state.users[key].cx_id_str = `${state.users[key].cx_id}`;
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

function updateStewardList() {
    const steward_list = document.getElementById("stewards-list-shifts");

    let all_stewards = state.users.filter(user => user.role == "steward" || user.role == "head_steward");

    all_stewards.sort((a, b) => {
        if (a.name < b.name) {
            return -1;
        } else {
            return 1;
        }
    });

    removeAllChildren(steward_list);
    appendChildren(steward_list, generateStewardShiftList(all_stewards));
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

    let end_of_pay_period = document.getElementById("steward-list-date").value;

    let pay_period_hours = null;

    // If it's not set, just skip
    if (end_of_pay_period !== "") {
        pay_period_hours = {};

        // two weeks of hours
        for (let steward of all_stewards) {
            pay_period_hours[steward.uuid] = 2 * (stewards_hours[steward.uuid] ?? 0);
        }

        let end_date = new Date(end_of_pay_period);
        let two_weeks_before_end = new Date(end_date - 14 * 24 * 60 * 60 * 1000);

        // Filter out shift changes that are after the end of the pay period
        // and before two weeks before the end of the pay period
        let shift_changes_pay_period = state.shift_changes.filter(change => {
            let change_date = new Date(change.date);
            return change_date <= end_date && change_date >= two_weeks_before_end;
        });

        // Now go through the shift changes and add or subtract hours
        for (let change of shift_changes_pay_period) {
            let steward = all_stewards.find(steward => steward.uuid === change.steward);
            if (steward) {
                if (change.is_drop) {
                    pay_period_hours[steward.uuid] -= 1;
                } else {
                    pay_period_hours[steward.uuid] += 1;
                }
            }
        }
    }

    let rows = [];

    let thead = document.createElement("thead");
    let headerRow = document.createElement("tr");

    let headers = ["Name", "CX ID", "Email", "Scheduled Shift Hours", "Pay Period Hours"];
    for (let header of headers) {
        let th = document.createElement("th");
        th.innerText = header;
        headerRow.appendChild(th);
    }

    thead.appendChild(headerRow);
    rows.push(thead);

    for (let steward of all_stewards) {
        let row = document.createElement("tr");

        let nameCell = document.createElement("td");
        nameCell.innerText = steward.name;
        row.appendChild(nameCell);

        let cxIdCell = document.createElement("td");
        cxIdCell.innerText = steward.cx_id;
        row.appendChild(cxIdCell);

        let emailCell = document.createElement("td");
        emailCell.innerText = steward.email;
        row.appendChild(emailCell);

        let hours = stewards_hours[steward.uuid] ?? 0;

        let shiftsCell = document.createElement("td");
        shiftsCell.innerText = `${hours} shift hours`;

        if (hours < 2) {
            shiftsCell.classList.add("not-enough-hours");
        } else if (hours < 5) {
            shiftsCell.classList.add("good-hours");
        } else {
            shiftsCell.classList.add("too-many-hours");
        }

        row.appendChild(shiftsCell);

        let payPeriodCell = document.createElement("td");

        if (pay_period_hours) {
            let difference = pay_period_hours[steward.uuid] - (2 * stewards_hours[steward.uuid])
            let plus = difference >= 0 ? "+" : "";
    
            payPeriodCell.innerText = `${pay_period_hours[steward.uuid]} worked hours (${plus}${difference})`;     
        } else {
            payPeriodCell.innerText = "-";
        }


        row.appendChild(payPeriodCell);

        rows.push(row);
    }


    document.getElementById("total-hours").innerText = total_shift_hours;

    return rows;
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

    const time_start = 12;
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

    showPopup("edit-shift");

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

        shift_stewards.appendChild(generateEditStewardShiftDiv(user, true, day, hour, stewards_hours));
    }

    // "Valid" stewards are stewards who are available 
    const show_valid_stewards = document.getElementById("show-valid-stewards").checked;

    // Then add all stewards not on shift
    for (let user of all_stewards) {
        if (show_valid_stewards) {
            if (user.availability === null) {
                continue;
            }

            let int_day = DAYS.indexOf(day);


            if (user.availability[int_day][hour] === false) {
                continue;
            }
        }

        if (!shift.stewards.includes(user.uuid)) {
            other_stewards.appendChild(generateEditStewardShiftDiv(user, false, day, hour, stewards_hours));
        }
    }
}

function generateEditStewardShiftDiv(user, on_shift, day, hour, stewards_hours) {
    const user_div = document.createElement("div");
    user_div.classList.add("add-remove-steward-info");
    // Append name and cx_id
    
    let hours_available = 0;
    
    if (user.availability !== null) {
        for (let i = 0; i < 7; i++) {
            for (let j = 12; j < 24; j++) {
                if (user.availability[i][j] === true) {
                    hours_available++;
                }
            }
        }
    }

    let hours_scheduled = stewards_hours[user.uuid] ?? 0;

    const hours_scheduled_div = document.createElement("span");
    hours_scheduled_div.classList.add("hours-scheduled");
    hours_scheduled_div.innerText = `${hours_scheduled}S`;

    if (hours_scheduled < 2) {
        hours_scheduled_div.classList.add("not-enough-hours");
    } else if (hours_scheduled < 5) {
        hours_scheduled_div.classList.add("good-hours");
    }
    else {
        hours_scheduled_div.classList.add("too-many-hours");
    }

    const hours_available_div = document.createElement("span");
    hours_available_div.classList.add("hours-available");
    hours_available_div.innerText = `${hours_available}A`;

    if (hours_available < 2) {
        hours_available_div.classList.add("not-enough-hours");
    } else if (hours_available < 6) {
        hours_available_div.classList.add("too-many-hours");
    } else {
        hours_available_div.classList.add("good-hours");
    }

    const name = document.createElement("span");
    name.innerText = `${user.name} (${user.email})`;

    if (on_shift) {
        user_div.classList.add("on-shift");

        user_div.onclick = () => {
            deleteStewardFromShift(user.uuid, day, hour);
        }

        user_div.append(name);
        user_div.append(hours_available_div);
        user_div.append(hours_scheduled_div);

    } else {
        user_div.appendChild(hours_scheduled_div);
        user_div.appendChild(hours_available_div);
        user_div.appendChild(name);

        user_div.classList.add("off-shift");

        user_div.onclick = () => {
            addStewardToShift(user.uuid, day, hour);
        }

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

function downloadMailchimp() {
    // Download all users as a CSV formatted as:
    // Email Address, First Name, Last Name
    // Format name of csv as YYYY-MM-DD-mailchimp.csv
    let csv = "Email Address,First Name,Last Name\n";

    for (let user of state.users) {
        csv += `${user.email},${user.name.split(" ")[0]},${user.name.split(" ")[1]}\n`;
    }

    let date = new Date();
    let formatted_date = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

    // Now download the file
    downloadFile(`${formatted_date}-mailchimp.csv`, csv);
}