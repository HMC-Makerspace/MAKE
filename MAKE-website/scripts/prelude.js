/*

Constants

*/

const API = '/api/v2';
const VER = "2.0.0"
const QUIZ_TO_NAME = {
    "General": "General Safety Quiz",
    "Laser3D": "3D Printer & Laser Cutter Quiz",
    "SprayPaint": "Spray Paint Quiz",
    "Composite": "Composite Room Quiz",
    "Welding": "Welding Quiz",
    "Studio": "Studio Quiz",
    "Waterjet": "Waterjet Quiz",
    "Loom": "Loom Quiz",
}

/*

Global variables

*/

var state = {
    cx_id: null,
    auth_keys: {
        checkout: null,
        student_storage: null,
        printer: null
    },
    user_object: null,
    user_checkouts: null,
    settings: null,
    inventory: null,
    student_storage: null,
    printers: null,
    workshops: null,
    current_search_results: null,
    quizzes: null,
    cached_colors: null,
}

// Function to load/save state from localstorage
function loadState() {
    const version = localStorage.getItem("make-version");

    if (version == VER) {
        const new_state = JSON.parse(localStorage.getItem('state')) ?? state;
        state = validateState(new_state);
    } else {
        console.log("Version has changed, wiping localstorage")
        saveState();
    }
}

function validateState(new_state) {
    for (let key of Object.keys(state)) {
        if (new_state[key] === undefined) {
            console.log(`State key ${key} is missing, adding default value`);
            new_state[key] = state[key];
        }
    }

    return new_state;
}

function saveState() {
    localStorage.setItem('state', JSON.stringify(state));
    localStorage.setItem('make-version', VER);
}

function displayLoggedIn(start = false) {
    const show_elements = document.getElementsByClassName('id-r');
    const hide_elements = document.getElementsByClassName('id-n');

    for (let el of show_elements) {
        el.classList.remove('hidden');
    }

    for (let el of hide_elements) {
        el.classList.add('hidden');
    }

    const name_el = document.getElementById('logged-in-name');

    if (state.user_object !== null) {
        name_el.innerText = state.user_object.name;
    }
    
    // Always try to display steward info
    displayStewardInfo();

    if (start === false) {
        try {
            fetchWorkshops();
            renderQuizInfo();
            renderCheckouts();
        } catch (e) {
            console.error(e);
        }
    }
}

function displayLoggedOut(start = false) {
    const hide_elements = document.getElementsByClassName('id-r');
    const show_elements = document.getElementsByClassName('id-n');

    for (let el of hide_elements) {
        el.classList.add('hidden');
    }

    for (let el of show_elements) {
        el.classList.remove('hidden');
    }

    if (start === false) {
        try {
            displayStewardInfo();
            fetchWorkshops();
            renderQuizInfo();
            renderCheckouts();
        } catch (e) {
            console.error(e);
        }
    }
}

async function displayStewardInfo() {
    const steward_button = document.getElementById('steward-button');
     
    if (state.user_object === null) {
        steward_button.classList.add('hidden');

        return;
    }

    if (state.user_object.role == "steward" || state.user_object.role == "head_steward" || state.user_object.role == "admin") {
        steward_button.classList.remove('hidden');

        await populateStewardPage();
    }
}

async function updateUserInfo() {
    if (state.cx_id === null) {
        return;
    }

    const login_button = document.getElementById('college-id-button');
    login_button.setAttribute('disabled', 'disabled');

    const response = await fetch(`${API}/users/get_user_by_cx_id/${state.cx_id}`);

    if (response.status == 200) {
        const user_object = await response.json();

        state.user_object = user_object;

        saveState();

        // Fetch/render appropriate data
        hideLoginError();
        // fetchStudentStorage(); // DEPRECATED
        renderQuizInfo();
        renderCheckouts();
        await fetchWorkshops();
        // End fetches

        login_button.removeAttribute('disabled');

        return true;
    } else {
        if (response.status == 429) {
            alert("You have submitted too many login requests. Please wait a few minutes and try again.")
        }
        
        login_button.removeAttribute('disabled');
        
        return false;
    }
}

function toggleQuickNav() {
    const quick_nav = document.getElementById('quick-nav');
    quick_nav.classList.toggle('hidden');
}

function openUtility(element, url, with_api_key = true) {
    // If with_api_key, get next element
    let api_key = "";

    if (with_api_key) {
        api_key = `?api_key=${element.nextElementSibling.value.trim()}`;

        if (api_key === "?api_key=") {
            api_key = "";
        }
    }

    // Open in current tab
    window.open(url + api_key, '_self');
}



loadState();