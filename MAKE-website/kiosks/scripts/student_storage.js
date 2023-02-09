var api_key = null;
var student_storage_state = null;
var first_render = true;
var slot_selected = null;
var current_page = 0;

const API = '/api/v1';

async function authenticate() {
    // Get api keys from url params
    const params = new URLSearchParams(window.location.search);

    api_key = params.get('api_key') ?? localStorage.getItem('student_storage_api_key');

    if (api_key === null) {
        alert("No API key provided.");
    }

    // Remove api key from url, but keep the rest of the url
    window.history.replaceState({}, document.title, window.location.pathname);

    // Save api key to local storage
    localStorage.setItem('student_storage_api_key', api_key);

    console.log(`Authenticating with student storage key ${api_key}`);

    setInterval(fetchStudentStorage, 5000, kiosk_mode = true);

    fetchStudentStorage(kiosk_mode = true);
}

function showCheckout(slot_id) {
    document.body.style.top = `-${window.scrollY}px`;
    document.body.style.position = 'fixed';

    document.getElementById("checkout-popup").classList.remove("hidden");
    document.getElementById("checkout-error").classList.add("hidden");
    document.getElementById("checkout-id-input").focus();
    document.getElementById("checkout-id-input").value = "";
    document.getElementById("slot-selected").innerText = slot_id;
    slot_selected = slot_id;

    checkout_timeout = setTimeout(() => {
        hideCheckout();
    }, 60000);
}

function hideCheckout() {
    document.getElementById("checkout-popup").classList.add("hidden");
    document.getElementById("checkout-error").classList.add("hidden");
    clearTimeout(checkout_timeout);

    const scrollY = document.body.style.top;
    document.body.style.position = '';
    document.body.style.top = '';
    window.scrollTo(0, parseInt(scrollY || '0') * -1);
}

async function checkoutSlot(e) {
    // Prevent form from submitting
    e.preventDefault();

    // If event equals numpadenter or enter, check it out
    if (!(e.key === "Enter" || e.key === "NumpadEnter")) {
        return;
    }

    let id_number = document.getElementById("checkout-id-input").value;

    // Remove all non-numeric characters
    id_number = parseCollegeID(id_number);

    if (id_number == null) {
        return;
    }

    document.getElementById("checkout-id-input").value = id_number;

    // Get user info
    const response = await fetch(`${API}/users/info/${id_number}`);

    if (response.status != 200) {
        showCheckoutError("Invalid ID number");
        return;
    }

    const user_info = await response.json();

    if (user_info.auth_level === "Banned") {
        showCheckoutError("User has been banned");
        return;
    }

    // Now, we can check out the slot
    const check_response = await fetch(`${API}/student_storage/add_entry/${id_number}/${slot_selected}/${api_key}`,
        {
            method: "POST"
        });


    if (check_response.status != 201) {
        showCheckoutError("Error checking out slot. Please contact makerspace-management-l@g.hmc.edu");
        return;
    }

    // Update student storage
    await fetchStudentStorage(kiosk_mode = true);

    // Hide popup
    hideCheckout()
}

function showCheckoutError(error_message) {
    document.getElementById("checkout-error").innerText = error_message;
    document.getElementById("checkout-error").classList.remove("hidden");
}

document.getElementById("checkout-popup").addEventListener("click", function (event) {
    if (event.target.id === "checkout-popup") {
        hideCheckout()
    }
});


function setPageShown() {
    const els = document.getElementsByClassName("student-storage-group-container");

    for (const el of els) {
        el.classList.add("hidden");
    }

    els[current_page].classList.remove("hidden");
}

function nextPage() {
    const els = document.getElementsByClassName("student-storage-group-container");

    if (current_page < (els.length - 1)) {
        current_page++;
        setPageShown();
    }
}

function prevPage() {
    if (current_page > 0) {
        current_page--;
        setPageShown();
    }
}

authenticate();
