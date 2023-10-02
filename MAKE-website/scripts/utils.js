const Toast = Swal.mixin({
    toast: true,
    position: 'bottom',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
})

const school_names = {
    1: "Pomona",
    2: "Scripps",
    3: "CMC",
    4: "HMC",
    5: "Pitzer"
};

const school_pops = {
    1: 1747,
    2: 958,
    3: 1262,
    4: 905,
    5: 922,
}

const QUIZ_NAME_TO_ID = {
    "General": "66546920",
    "Laser3D": "1524924728",
    "SprayPaint": "1841312496",
    "Composite": "913890505",
    "Welding": "482685426",
    "Studio": "2079405017",
    "Waterjet": "2100779718",
    "Loom": "1235553349",
}

const QUIZ_ID_TO_NAME = {
    "66546920": "General",
    "1524924728": "Laser3D",
    "1841312496": "SprayPaint",
    "913890505": "Composite",
    "482685426": "Welding",
    "2079405017": "Studio",
    "2100779718": "Waterjet",
    "1235553349": "Loom",
}

const ROLE_TO_READABLE = {
    "admin": "Admin",
    "user": "User",
    "steward": "Steward",
    "head_steward": "Head Steward",
}

const PROFICIENCIES = [
    "3D Printing",
    "Advanced 3D Printing",
    "Large Format Printer",
    "Laser Cutter",
    "Leather Sewing Machine",
    "Loom",
    "Oscilloscopes",
    "Printing Press",
    "Sergers",
    "Sewing",
    "Soldering",
    "Spray Paint",
    "Studio (Audio)",
    "Studio (Video)",
    "Waterjet",
    "Welding"
];

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];


// Cut off date for quizzes is on June 1st yearly
// If a quiz was taken before this date, it is not counted
// if there 
function determineValidQuizDate(quiz_timestamp) {
    // Get quiz date
    const quiz_date = new Date(Number(quiz_timestamp) * 1000);

    // Get current year
    const current_year = new Date().getFullYear();

    // Create cutoff date for quiz
    const cutoff_date = new Date(current_year, 5, 1);

    if (quiz_date < cutoff_date) {
        return true;
    } else if (quiz_date > cutoff_date && quiz_date.getFullYear() == current_year) {
        return true;
    }

    return false;
}

function parseCollegeID(collegeID) {
    collegeID = collegeID.trim();

    if (collegeID.length == 0) {
        return null;
    }

    if (collegeID.includes("-") || collegeID.includes("_") || collegeID.includes(" ")) {
        collegeID = collegeID.replace(/[_ ]/g, "-");

        return parseInt(collegeID.split("-")[0]);
    } else {
        return parseInt(collegeID);
    }
}

function setPage(page, create_history = true) {
    const all_pages = document.getElementsByClassName("main-content");
    for (let i = 0; i < all_pages.length; i++) {
        all_pages[i].classList.add("hidden");
    }

    const page_element = document.getElementById(`page-${page}`);
    if (page_element) {
        page_element.classList.remove("hidden");
    }
    for (let b of document.getElementsByClassName("active-button")) {
        b.classList.remove("active-button");
    }
    const button = document.getElementById(`${page}-button`);
    if (button) {
        button.classList.add("active-button");
    }

    if (create_history) {
        // Add to url params
        const url = new URL(window.location.href);
        url.searchParams.set("p", page);
        window.history.pushState({}, "", url.href);
    }

    const menu = document.getElementById('left-bar');

    if (menu) {
        menu.classList.remove('show');
    }
}

function onHashChange() {
    const url = new URL(window.location.href);
    const page = url.searchParams.get("p");

    if (page) {
        setPage(page, false);
    } else {
        setPage("home", false);
    }
}

function removeAllChildren(element, keep_first_n = 0) {
    while (element.childNodes.length > keep_first_n) {
        element.removeChild(element.firstChild);
    }
}

function appendChildren(element, children) {
    for (let i = 0; i < children.length; i++) {
        element.appendChild(children[i]);
    }
}

function timestampToDate(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
}

function secondsToHoursMinutes(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    return `${hours}h ${minutes}m`;
}

function toggle_theme() {
    if (document.documentElement.getAttribute("data-theme") != "dark") {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem("theme", "dark");
    }
    else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem("theme", "light");
    }
}

async function renderMD(file_path, title, to_insert = null) {
    const equipmentDiv = document.getElementById(`${title}-content`);

    const el = document.createElement("div");

    el.id = `${title}-text`;
    el.classList.add("md");

    let req = await fetch(file_path);

    let text = await req.text();

    let converter = new showdown.Converter();

    let html = converter.makeHtml(text);

    el.innerHTML = html;

    equipmentDiv.appendChild(el);

    // Check each child to see if it has a img, if so, add md-img-container class
    let text_div = document.getElementById(`${title}-text`);

    for (let i = 0; i < text_div.childNodes.length; i++) {
        let child = text_div.childNodes[i];

        if (child.firstChild) {
            if (child.firstChild.tagName === "IMG") {
                child.classList.add("md-img-container");
            }
        }
    }

    if (to_insert) {
        // Should be key-pair value of what to insert
        // Key can be found by searching for {{key}}
        // Value is what to replace it with
        for (let key of Object.keys(to_insert)) {
            const regex = new RegExp(`{{${key}}}`, "g");
            equipmentDiv.innerHTML = equipmentDiv.innerHTML.replace(regex, to_insert[key]);
        }
    }
}

async function fetchUsers() {
    const response = await fetch(`${API}/users/get_users`, {
        method: "GET",
        headers: {
            "api-key": api_key,
        },
    });
    const users = await response.json();

    if (users === null) {
        return null;
    }

    state.users = users;
}

function openInNewTab(url) {
    const encoded = encodeURI(url);
    var win = window.open(encoded, '_blank');
    win.focus();
}

function searchUsers(search) {
    if (state.users === null) {
        return [];
    }

    const results = fuzzysort.go(search, Object.values(state.users), user_search_options);

    const results_norm = results.sort((a, b) => b.score - a.score);

    return results_norm;
}

function createUserDiv(user, editable = false) {
    let div = document.createElement("div");
    div.classList.add("user-result");

    let name = document.createElement("div");
    name.classList.add("user-result-name");
    name.innerHTML = user.name;

    let id = document.createElement("div");
    id.classList.add("user-result-id");
    id.innerHTML = user.cx_id;

    let email = document.createElement("div");
    email.classList.add("user-result-email");
    email.innerHTML = user.email;

    let auth = document.createElement("div");
    auth.classList.add("user-result-auth");
    auth.innerHTML = ROLE_TO_READABLE[user.role] ?? "Unknown: " + user.role;

    let passed_quizzes = document.createElement("div");

    let quizzes_used = [];

    passed_quizzes.classList.add("user-result-passed-quizzes");
    for (let timestamp of Object.keys(user.passed_quizzes)) {
        if (!quizzes_used.includes(user.passed_quizzes[timestamp])
            && determineValidQuizDate(Number(timestamp))) {
            let quiz_div = document.createElement("div");
            quiz_div.innerHTML = QUIZ_ID_TO_NAME[user.passed_quizzes[timestamp]];

            quizzes_used.push(user.passed_quizzes[timestamp]);
            passed_quizzes.appendChild(quiz_div);
        }
    }

    div.appendChild(name);
    div.appendChild(id);
    div.appendChild(email);
    div.appendChild(auth);
    div.appendChild(passed_quizzes);

    if (editable) {
        div.classList.add("editable");

        let edit = document.createElement("button");
        edit.classList.add("user-result-edit");
        edit.innerHTML = "Edit";
        edit.addEventListener("click", () => {
            showEditUser(user.uuid);
        });

        div.appendChild(edit);
    }

    return div;
}
const user_search_options = {
    limit: 100, // don't return more results than you need!
    allowTypo: true, // if you don't care about allowing typos
    threshold: -10000, // don't return bad results
    keys: ['name', 'cx_id_str', 'email', 'role'], // keys to search
    all: true,
}

function submitUserSearch(editable = false) {
    if (state.users === null) {
        return;
    }

    const search = document.getElementById("users-search-input").value;

    const search_results = searchUsers(search);

    const users = document.getElementById("users-results");

    let divs = [];
    for (let user of search_results) {
        divs.push(createUserDiv(user.obj, editable));
    }

    removeAllChildren(users);
    appendChildren(users, divs);
}

function formatHour(hour_num) {
    if (hour_num > 12) {
        return `${hour_num - 12}:00 PM`;
    } else if (hour_num == 12) {
        return `${hour_num}:00 PM`;
    } else if (hour_num == 0) {
        return `12:00 AM`;
    } else {
        return `${hour_num}:00 AM`;
    }
}

function closePopup() {
    document.getElementById("popup-container").classList.add("hidden");
    const content = document.getElementById("popup-content");

    for (let child of content.children) {
        child.classList.add("hidden");
    }

    if (shifts_updated) {
        renderScheduleAdmin();
        pushShiftsAdmin();
        shifts_updated = false;
    }
}

function downloadFile(filename, data) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(data));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}