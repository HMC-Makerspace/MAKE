var state = {
    users: null,
    student_storage: null,
    college_id: 0,
};

const API = '/api/v1';

async function authenticate() {
    // Get api keys from url params
    const params = new URLSearchParams(window.location.search);

    api_key = params.get('api_key') ?? localStorage.getItem('admin_api_key');

    if (api_key === null) {
        alert("No API key provided.");
    }

    // Remove api key from url, but keep the rest of the url
    window.history.replaceState({}, document.title, window.location.pathname);

    // Save api key to local storage
    localStorage.setItem('admin_api_key', api_key);

    console.log(`Authenticating with admin key ${api_key}`);

    setInterval(fetchUsers, 5000);
    setInterval(fetchStudentStorageAdmin, 5000);
    await fetchUsers();
    await fetchStudentStorageAdmin();

    setInterval(renderAll(), 5000);
    renderAll();
    console.log(state.users);
}

authenticate();

async function fetchStudentStorageAdmin() {
    const response = await fetch(`${API}/student_storage/all/${api_key}`);

    if (response.status == 200) {
        const student_storage = await response.json();

        state.student_storage = student_storage;

        console.log(state.student_storage);

        renderStudentStorage();
    }
}

function renderAll() {
    renderStats();
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
        const school_count = Object.values(state.users).filter(user => `${user.college_id}`.startsWith(school_id)).length;
        const school_perc = Math.round((school_count / school_pops[school_id]) * 100);

        count.innerHTML = `<td>${school_names[school_id]}</td><td>${school_count}</td><td>${school_perc}%</td>`;

        total_count.appendChild(count);
    }

    divs.push(total_count);

    return divs;
}

async function updateStatus() {
    const status = document.getElementById("auth-type").value;

    const el = document.getElementById("auth-input");

    const text = el.value;

    let seperator = "\n";
    if (text.includes(",")) {
        seperator = ",";
    }

    const users = text.split(seperator);
    const results = [];

    for (let user of users) {
        const id = findID(user);

        if (id === null) {
            results.push(`${user} not found`);
            continue;
        } else {

            const response = await fetch(`${API}/auth/set_level/${id}/${status}/${api_key}`, {
                method: "POST",
            });

            if (response.status !== 201) {
                results.push(`${user} failed to set to ${status}`);
            }
        }
    }

    el.value += "\n\n";
    el.value += results.join("\n");
}

function findID(user) {
    user = user.trim().toLowerCase();

    for (let id of Object.keys(state.users)) {
        const name = state.users[id].name.toLowerCase();
        const name_parts = name.split(" ");
        const user_parts = user.split(" ");
        if (name === user || state.users[id].email === user || state.users[id].id == user) {
            return id;
        } else if (name_parts[0] === user_parts[0] && name_parts[name_parts.length - 1] === user_parts[user_parts.length - 1]) {
            return id;
        }
    }

    return null;
}