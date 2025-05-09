const school_names = {
    1: "Pomona",
    2: "Scripps",
    3: "CMC",
    4: "HMC",
    5: "Pitzer"
};

const QUIZ_NAME_TO_ID = {
    "General": "66546920",
    "3D": "577888883",
    "Laser": "677552423",
    // "Laser3D": "1524924728", // Old 3D/Laser quiz
    "SprayPaint": "1841312496",
    "Composite": "913890505",
    "Welding": "482685426",
    "Studio": "2079405017",
    "Waterjet": "2100779718",
    "Loom": "1235553349",
}

const QUIZ_ID_TO_NAME = {
    "66546920": "General",
    "577888883": "3D",
    "677552423": "Laser",
    // "1524924728": "Laser3D", // Old 3D/Laser quiz
    "1841312496": "SprayPaint",
    "913890505": "Composite",
    "482685426": "Welding",
    "2079405017": "Studio",
    "2100779718": "Waterjet",
    "1235553349": "Loom",
}

const QUIZ_NAME_TO_READABLE = {
    "General": "General Safety Quiz",
    "3D": "3D Printer Safety Quiz",
    "Laser": "Laser Cutter Safety Quiz",
    // "Laser3D": "3D Printer & Laser Cutter Safety Quiz", // Old 3D/Laser quiz
    "SprayPaint": "Spray Paint Booth Safety Quiz",
    "Composite": "Composite Room Safety Quiz",
    "Welding": "Welding Area Safety Quiz",
    "Studio": "Studio Safety Quiz",
    "Waterjet": "Waterjet Safety Quiz",
    "Loom": "Loom Safety Quiz",
}

const QUIZ_ID_TO_READABLE = {
    "66546920": "General Safety Quiz",
    "577888883": "3D Printer Safety Quiz",
    "677552423": "Laser Cutter Safety Quiz",
    // "1524924728": "3D Printer & Laser Cutter Safety Quiz", // Old 3D/Laser quiz
    "1841312496": "Spray Paint Booth Safety Quiz",
    "913890505": "Composite Room Safety Quiz",
    "482685426": "Welding Area Safety Quiz",
    "2079405017": "Studio Safety Quiz",
    "2100779718": "Waterjet Safety Quiz",
    "1235553349": "Loom Safety Quiz",
}
/*
The correct link for the form (after "/d/e/") can also be found in this url, which is different
from the normal edit link in the url bar when editing the form.
*/
const QUIZ_ID_TO_OBJECT = {
    "66546920": {
        name: "General",
        description: "Provides building and student storage access, permission to work in the Makerspace, and tool checkout ability.",
        icon: "tools_power_drill",
        reference: "https://docs.google.com/document/d/1-pycsGqeUptorvEH-Ti66ssmvKLrtopvLRZ9YNMSMKo/edit",
        form: "1FAIpQLSfW3l2cxem3JwKqX3RJjjhJXKzAdwY9x4dYeXvOATGA-dhWzA",
        autofills: [382887588, 1395074003, 1482318217]
    },
    "577888883": {
        name: "3D",
        description: "Must be completed before gaining access to the 3D Printer/Laser Cutter room.",
        icon: "view_in_ar",
        reference: "https://docs.google.com/document/d/1P8ANYjpi3USbBGqlTxAZjM13yGebQL4fTTedh64FtQI/edit",
        form: "1FAIpQLSfkiVD2PfOYFThht0YOeV7-qUoR_Ot7sU75BUK2EwwOUaFKVA",
        autofills: [382887588, 1395074003, 1482318217]
    },
    "677552423": {
        name: "Laser",
        description: "Must be completed before gaining access to the 3D Printer/Laser Cutter room.",
        icon: "stylus_laser_pointer",
        reference: "https://docs.google.com/document/d/1-MjMIR0GWLGws6HAIEd_lilhaoMGJicK_Rhr4bm6DUQ/edit",
        form: "1FAIpQLSfJpCxhjoVcismSm_ZekKre-7-FCYPVt7Z6RMTrxb-Oe30cVQ",
        autofills: [382887588, 1395074003, 1482318217]
    },
    "1841312496": {
        name: "SprayPaint",
        description: "Provides access to the spray paint booth.",
        icon: "colors",
        reference: "https://docs.google.com/document/d/1rWhhCfDzNkxNpQC1f5lGxxvZ7KNCTyGIw4CS1ixTPic/edit",
        form: "1FAIpQLScjlDfT9sXZzq_IbqKTrjn3H2H81B5c7uL9aucRB_rEOLbGMg",
        autofills: [382887588, 1395074003, 1482318217]
    },
    "913890505": {
        name: "Composite",
        description: "Provides access to the composite room.",
        icon: "layers",
        reference: "https://docs.google.com/document/d/1vf5Pw24-stQF0I0EhXi-4wItHGNquIOZGPalTngE7B8/edit",
        form: "1FAIpQLSfJTAr-E4TT-wYCfgvDqTYdssBY7ZfSLGBOv0oTtZBl_H_PJw",
        autofills: [382887588, 1395074003, 1482318217]
    },
    "482685426": {
        name: "Welding",
        icon: "bolt",
        description: "Prerequisite to in-person welding training, which is required to use the welding area.",
        reference: "https://docs.google.com/document/d/13k30JUPOOKK707lYuoaa8Pd3ICvUOBFMly4v8zQqU-Y/edit",
        form: "1FAIpQLSet-S7ZIHVRydmc-J_zXSV4knCr50AryDbq0aUv1s5FB2ZGmg",
        autofills: [382887588, 1395074003, 1482318217]
    },
    "2079405017": {
        name: "Studio",
        description: "Provides access to the studio.",
        icon: "camera",
        reference: "https://docs.google.com/document/d/1pqknkaGRO2VQL6vkdeRkVYewqo_WKNh6-tpEloCPW5c/edit",
        form: "1FAIpQLSdikBUUUXV2RMTD1LGdGHcSzVXgzokmguET0vedSR8JqNGm0Q",
        autofills: [382887588, 1395074003, 1482318217]
    },
    "2100779718": {
        name: "Waterjet",
        description: "Required to use the waterjet cutter, located in the 3D printer / laser cutter room.",
        icon: "water_pump",
        reference: "https://docs.google.com/document/d/1a-hPM5qB79ONJ-7k06pvIZVxz1_ONLAD/edit",
        form: "1FAIpQLSev6cU296gQyqFxOxi2LFmJPCDthz_QBMYkP52AbKcr-7HFFg",
        autofills: [382887588, 1395074003, 1482318217]
    },
    "1235553349": {
        name: "Loom",
        description: "Required to use the digital jacquard loom.",
        icon: "view_quilt",
        reference: "https://docs.google.com/document/d/1T7UWdbl9iEGJ31fNZpCOMRPS3_PBd1ioztRqxQduCKY/edit",
        form: "1FAIpQLSdbzUnLeSloX5LDFGJP0tg-8oK3MadUkEaeKOtBy2AZ918g2Q",
        autofills: [1421487221, 216407767, 1881621455]
    }
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
    "Analog Loom",
    "Cricut",
    "Digital Loom",
    "Embroidery",
    "Large Format Printer",
    "Laser Cutter",
    "Leather Sewing Machine",
    "Oscilloscopes",
    "Printing Press",
    "Sergers",
    "Sewing",
    "Soldering",
    "Spray Paint",
    "Studio (Audio)",
    "Studio (Video)",
    "Waterjet",
    "Welding",
] // Keep this sorted

WORKING_HOURS = {
    "Sunday": {
        start: 14,
        end: 23,
    },
    "Monday": {
        start: 14,
        end: 23,
    },
    "Tuesday": {
        start: 14,
        end: 23,
    },
    "Wednesday": {
        start: 14,
        end: 23,
    },
    "Thursday": {
        start: 14,
        end: 23,
    },
    "Friday": {
        start: 14,
        end: 20,
    },
    "Saturday": {
        start: 14,
        end: 20,
    },
}

function getEarliestWorkingHour() {
    return Math.min(...Object.values(WORKING_HOURS).map(hours => hours.start));
}

function getLatestWorkingHour() {
    return Math.max(...Object.values(WORKING_HOURS).map(hours => hours.end));
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const TWENTY_FOUR_HOURS_TO_STRING = {0: "12:00 AM",  1: "1:00 AM", 2: "2:00 AM", 3: "3:00 AM",  4: "4:00 AM", 5: "5:00 AM", 6: "6:00 AM", 7: "7:00 AM",  8: "8:00 AM",  9: "9:00 AM", 10: "10:00 AM", 11: "11:00 AM",  12: "12:00 PM", 13: "1:00 PM", 14: "2:00 PM", 15: "3:00 PM", 16: "4:00 PM", 17: "5:00 PM", 18: "6:00 PM", 19: "7:00 PM", 20: "8:00 PM", 21: "9:00 PM", 22: "10:00 PM", 23: "11:00 PM" }

const DAYS_TO_INDEX = {"Sunday": 0, "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6}

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

/**
 * Determine if the current user has passed a given quiz by name.
 * @param {string} quiz_name The string name of the quiz, first letter capitalized
 * @returns true if the current user has passed the quiz, false otherwise.
 */
function hasCurrentUserPassedQuizByName(quiz_name) {
    // We must have a current user
    if (!state.user_object) {
        return false;
    }
    // Find the id of the given quiz
    const quiz_id = QUIZ_NAME_TO_ID[quiz_name];
    // Find the timestamp the user passed the given quiz
    const date_passed = Object.keys(state.user_object.passed_quizzes).find(
        (key) => state.user_object.passed_quizzes[key] == quiz_id
    );
    // If no timestamp is found, the user hasn't passed the quiz
    if (!date_passed) {
        return false;
    }
    // Otherwise, check if the quiz was passed recently
    return determineValidQuizDate(date_passed);
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
    state.page = page;
    
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
        element.removeChild(element.childNodes[keep_first_n]);
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

    // Sort by name
    const results_norm = results.sort((a, b) => {
        return a.obj.name.localeCompare(b.obj.name);
    });

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
    keys: ['name', obj=>obj.cx_id.toString(), 'email', 'role'], // keys to search - passes ids as a string
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

function unformatHour(hour_str) {
    let hour = parseInt(hour_str.split(":")[0]);
    let am_pm = hour_str.split(" ")[1];
    
    if (am_pm === "PM" && hour !== 12) {
        hour += 12;
    }

    if (am_pm === "AM" && hour === 12) {
        hour = 0;
    }

    if (hour === 24) {
        hour = 0;
    }

    return hour;
}

function showPopup(element_id) {
    document.getElementById("popup-container").classList.remove("hidden");
    document.getElementById(element_id).classList.remove("hidden");
}

function closePopup() {
    document.getElementById("popup-container").classList.add("hidden");
    const content = document.getElementById("popup-content");

    for (let child of content.children) {
        child.classList.add("hidden");
    }

    try {
        if (shifts_updated) {
            renderScheduleAdmin();
            pushShiftsAdmin();
            shifts_updated = false;
        }
    } catch (e) {
        return;
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

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Get date as .toLocaleString() but with <br> instead of comma.
// Then convert a timestamp like 3/25/2023, 12:17:09 PM
// to 3/25/2023 <br> 12:17 PM
function checkoutFormatDate(date) {
    let date_str = date.toLocaleString().replace(", ", "<br>");
    let date_arr = date_str.split(":");

    let time = date_arr[0] + ":" + date_arr[1] + " " + date_arr[2].split(" ")[1];

    return time;
}

function debounce(func, wait, immediate) {
    let timeout;
    return function () {
        let context = this, args = arguments;
        let later = function () {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        let callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

function determineColorText(background_hex) {
    background_hex = background_hex.replace("#", "");

    let r = parseInt(background_hex.substring(0, 2), 16);
    let g = parseInt(background_hex.substring(2, 4), 16);
    let b = parseInt(background_hex.substring(4, 6), 16);

    let brightness = Math.round(((r * 299) + (g * 587) + (b * 114)) / 1000);

    return brightness > 125 ? "black" : "white";
}

async function fetchCertifications() {
    const response = await fetch(`${API}/certifications/`);

    if (response.status == 200) {
        const certifications = await response.json();

        state.certifications = certifications;
    }
}