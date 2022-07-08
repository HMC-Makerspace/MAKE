var student_storage_key = null;
var student_storage_state = null;
var first_render = true;
var slot_selected = null;

const API = '/../api/v1';

async function authenticate() {
    // Get api keys from url params
    const params = new URLSearchParams(window.location.search);

    student_storage_key = params.get('api_key');

    if (student_storage_key === null) {
        return;
    }

    console.log(`Authenticating with student storage key ${student_storage_key}`);

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

async function checkoutSlot() {
    const id_number = document.getElementById("checkout-id-input").value;

    if (id_number === "") {
        return;
    }

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
    const check_response = await fetch(`${API}/student_storage/add_entry/${id_number}/${slot_selected}/${student_storage_key}`,
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

document.addEventListener("click", function (event) {
    // Play tap sound
    const tap_sound = new Audio("/../kiosks/assets/tap.mp3");
    tap_sound.play();
});

authenticate();
