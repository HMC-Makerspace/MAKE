var student_storage_key = null;
var student_storage_state = null;
var first_render = true;

const API = '/../api/v1';

async function authenticate() {
    // Get api keys from url params
    const params = new URLSearchParams(window.location.search);

    student_storage_key = params.get('api_key');

    if (student_storage_key === null) {
        return;
    }

    console.log(`Authenticating with student storage key ${student_storage_key}`);

    setInterval(fetchStudentStorage, 5000);

    fetchStudentStorage();
}

async function fetchStudentStorage() {
    if (student_storage_key === null) {
        return;
    }

    const response = await fetch(`${API}/student_storage/all/${student_storage_key}`);

    if (response.status == 200) {
        const student_storage = await response.json();

        student_storage_state = student_storage;

        updateStudentStorage();
    }
}

// Clears everything, then renders everything
function renderStudentStorage() {
    if (student_storage_state === null) {
        return;
    }

    const storage = document.getElementById("student-storage-slots");

    removeAllChildren(storage);

    appendChildren(storage, generateStudentStorageDivs(student_storage_state.slots));
}

// Allows user interaction while update is in progress
function updateStudentStorage() {
    if (first_render) {
        first_render = false;
        renderStudentStorage();
    }
}

function generateStudentStorageDivs(slots) {
    const divs = [];

    for (const slot of slots) {
        const div = document.createElement("div");

        div.classList.add("student-storage-slot");

        let slot_text = "Empty";
        let expire_div = "";

        if (slot.occupied_details !== null) {
            div.classList.add("occupied");

            expire_div += `<div class="student-storage-slot-expire">Expires ${timestampToDate(slot.occupied_details.timestamp_end)}</div>`;
            slot_text = `<div class="student-storage-slot-status">Occupied</div>`;
        }


        div.innerHTML = `
            <div class="student-storage-slot-id">${slot.id}</div>
            ${slot_text}
            ${expire_div}
        `;

        divs.push(div);
    }

    return divs;
}


authenticate();
