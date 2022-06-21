/*

Constants

*/

const API = '/api/v1';


/*

Global variables

*/

var state = {
    college_id_number: null,
    auth_keys: {
        checkout: null,
        student_storage: null,
        printer: null
    },
    user_object: null,
    settings: null,
    inventory: null,
}

// Function to load/save state from localstorage
function loadState() {
    const new_state = JSON.parse(localStorage.getItem('state'));
    state = validateState(new_state);
}

function validateState(new_state) {
    for (let key in state) {
        if (new_state[key] === undefined) {
            new_state[key] = state[key];
        }
    }

    return new_state;
}

function saveState() {
    localStorage.setItem('state', JSON.stringify(state));
}