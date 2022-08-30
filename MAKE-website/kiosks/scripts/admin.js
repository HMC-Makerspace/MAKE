var state = {
    users: null,
};

const API = '/../api/v1';

async function authenticate() {
    // Get api keys from url params
    const params = new URLSearchParams(window.location.search);

    api_key = params.get('api_key');

    if (api_key === null) {
        return;
    }

    console.log(`Authenticating with admin key ${api_key}`);

    setInterval(fetchUsers, 5000);
    await fetchUsers();
    setInterval(renderAll(), 5000);
    renderAll();
    console.log(`System has ${state.users} users`);
}

authenticate();

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