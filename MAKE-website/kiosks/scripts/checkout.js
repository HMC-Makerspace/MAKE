var state = {
    page: "inventory",
    inventory: null,
    checkouts: null,
    cart: [],
    current_id_number: 0,
}

const API = '/../api/v1';

async function authenticate() {
    // Get api keys from url params
    const params = new URLSearchParams(window.location.search);

    api_key = params.get('api_key');

    if (api_key === null) {
        return;
    }

    console.log(`Authenticating with checkout key ${api_key}`);

    setInterval(fetchInventory, 100000, kiosk_mode=true);
    setInterval(fetchCheckouts, 100000);

    fetchInventory(true).then(() => {
        submitSearch(kiosk_mode=true);
        document.getElementById("inventory-search-input").addEventListener("keyup", submitSearch, kiosk_mode=true);
        document.getElementById("inventory-in-stock").addEventListener("change", submitSearch, kiosk_mode=true);
        document.getElementById("room-select").addEventListener("change", submitSearch, kiosk_mode=true);
        document.getElementById("tool-material-select").addEventListener("change", submitSearch, kiosk_mode=true);
    });

    fetchCheckouts();

    document.addEventListener("keyup", (e) => {
        // If the key is is ';', focus the input on id-input and switch to
        // the inventory page

        if (e.key === ";") {
            setPage("inventory");
            state.cart = [];
            document.getElementById("id-input").value = "";
            document.getElementById("id-input").focus();
        }
    });

    document.getElementById("id-input").addEventListener("change", (e) => {
        // Remove the last two chars if last one is ?
        if (e.target.value.endsWith("?")) {
            e.target.value = e.target.value.substring(0, e.target.value.length - 2);
        }

        state.current_id_number = e.target.value;

        fetchUserInfo(state.current_id_number.replace(";","")).then((user_info) => {
            createUserInfo(user_info)
        });
    });
}

async function fetchCheckouts() {
    const response = await fetch(`${API}/checkouts/log/${api_key}`);
    const checkouts = await response.json();

    if (checkouts === null) {
        return null;
    }

    state.checkouts = checkouts;
    updateCheckoutsHTML();
}

function updateCheckoutsHTML() {
    if (state.checkouts === null) {
        return;
    }

    const current = document.getElementById("checkouts-current");
    const history = document.getElementById("checkouts-history");

    let current_divs = [];
    for (let checkout of state.checkouts.currently_checked_out) {
        current_divs.push(createCheckoutDiv(checkout, kiosk_mode=true));
    }

    let history_divs = [];
    for (let checkout of state.checkouts.checkout_history) {
        history_divs.push(createCheckoutDiv(checkout, kiosk_mode=true));
    }
    
    removeAllChildren(current);
    removeAllChildren(history);
    
    appendChildren(current, current_divs);
    appendChildren(history, history_divs);

}

async function fetchUserInfo(id_number) {
    const response = await fetch(`${API}/users/info/${id_number}`);
    const user_info = await response.json();

    if (user_info === null) {
        return null;
    }

    return user_info;
}

function createUserInfo(user_info) {
    if (user_info === null) {            
        document.getElementById("id-error").innerHTML = "Invalid ID/User not yet in system. They might have not taken the General Safety Quiz";
        document.getElementById("id-error").classList.remove("hidden");
        document.getElementById("id-input").focus();
    } else {
        document.getElementById("id-error").classList.add("hidden");
        document.getElementById("user-info-content").innerHTML = `
            <div id="user-info-name">Name: ${user_info.name}</div>
            <div id="user-info-id">College ID: ${user_info.college_id}</div>
            <div id="user-info-email">Email: ${user_info.college_email}</div>
            <div id="user-info-auth" class="${user_info.auth_level}">Auth: ${user_info.auth_level}</div>
            <div id="user-info-pending-checkouts">Pending Checkouts: ${user_info.pending_checkouts.length}</div>
            <div id="user-info-all-checkouts">All Checkouts: ${user_info.all_checkouts.length}</div>
            <div id="user-info-passed-quizzes">Passed Quizzes:<br>${user_info.passed_quizzes}</div>
            <div id="user-info-cart"><b>Cart</b><div id="cart-content"></div></div>
            <div id="time-length-radio">
                <div>
                    <input id="time-close" type="radio" name="time-length" value="1" checked><label for="time-close">Until Close</label>
                </div>
                <div>
                    <input id="time-24-hours" type="radio" name="time-length" value="2"><label for="time-24-hours">24 Hours</label>
                </div>
                <div>
                    <input id="time-3-days" type="radio" name="time-length" value="3"><label for="time-3-days">3 Days</label>
                </div>
                <div>
                    <input id="time-1-week" type="radio" name="time-length" value="3"><label for="time-1-week">1 Week</label>
                </div>
            </div>
            <button id="commit-checkout" onclick="commitCheckout()">Commit Checkout</button>
        `;
    }
}

function clearUser() {
    document.getElementById("user-info-content").innerHTML = "";
    document.getElementById("id-input").value = "";
    document.getElementById("id-input").focus();
    document.getElementById("id-error").classList.add("hidden");
    state.current_id_number = 0;
    state.cart = [];
}

function setPage(page) {
    switch (page) {
        case "checkout":
            state.page = "checkout";
            break;
        case "inventory":
            state.page = "inventory";
            break;
        case "users":
            state.page = "users";
            break;
    }

    updatePage();
}

function updatePage() {
    const i_button = document.getElementById("select-inventory-button");
    const c_button = document.getElementById("select-checkout-button");
    const u_button = document.getElementById("select-users-button");

    i_button.classList.remove("selected");
    c_button.classList.remove("selected");
    u_button.classList.remove("selected");
    
    const i_page = document.getElementById("inventory-page");
    const c_page = document.getElementById("checkouts-page");
    const u_page = document.getElementById("users-page");

    i_page.classList.add("hidden");
    c_page.classList.add("hidden");
    u_page.classList.add("hidden");

    if (state.page === "inventory") {
        i_button.classList.add("selected");
        i_page.classList.remove("hidden");
        document.getElementById("inventory-search-input").focus();
    } else if (state.page === "checkout") {
        c_button.classList.add("selected");
        c_page.classList.remove("hidden");
    } else if (state.page === "users") {
        u_button.classList.add("selected");
        u_page.classList.remove("hidden");
    }
}

function addToCart(name, index) {
    if (state.current_id_number === 0) {
        return;
    }

    const item = {
        name: name,
        index: index
    }

    if (state.cart.filter(i => i.name === item.name).length !== 0) {
        removeFromCart(item);
        return;
    }

    state.cart = [...state.cart, item];
    updateSelectedItems();
    updateCartHTML();
}

function updateSelectedItems() {
    const selected_els = document.getElementsByClassName("inventory-result");
    for (let i = 0; i < selected_els.length; i++) {
        const el = selected_els[i];
        const btn = el.getElementsByClassName("inventory-result-checkout")[0];

        if (state.cart.filter(item => item.index == el.id.split("-")[2]).length > 0) {
            el.classList.add("selected");
            btn.innerHTML = "-";
        } else {
            el.classList.remove("selected");
            btn.innerHTML = "+";
        }
    }
}

function removeFromCart(item) {
    state.cart = state.cart.filter(i => i.name !== item.name);
    updateSelectedItems();
    updateCartHTML();
}

function updateCartHTML() {
    const el = document.getElementById("cart-content");

    el.innerHTML = "";

    for (let item of state.cart) {
        el.innerHTML += `
            <div class="cart-item">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-remove" onclick="removeFromCart('${item.name}')">Remove</div>
            </div>
        `;
    }
}

function getCheckoutLength() {
    const radio = document.getElementsByName("time-length");
    let selection = 0;

    for (let i = 0; i < radio.length; i++) {
        if (radio[i].checked) {
            selection = radio[i].value;
        }
    }

    switch (selection) {
        case "1":
            // Find number of seconds between now and 11pm
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes();
            const seconds = now.getSeconds();
            const seconds_until_11pm = (23 - hours) * 3600 + (0 - minutes) * 60 + (0 - seconds);
            return seconds_until_11pm;
        case "2":
            return 24 * 3600;
        case "3":
            return 3 * 24 * 3600;
        case "4":
            return 7 * 24 * 3600;
    }
}

async function commitCheckout() {
    if (state.cart.length === 0) {
        return;
    }

    // Get the length
    let sec_length = getCheckoutLength();

    const response = await fetch(`${API}/checkouts/add_entry/${state.current_id_number}/${sec_length}/${api_key}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            items: state.cart
        })
    });

    if (response.status === 201) {
        displaySuccessInCart();

        // Clear the cart
        setTimeout(() => {
            clearUser();
        }, 500);
    } else {
        displayErrorInCart(response);
    }
}

function displaySuccessInCart() {
    const els = document.getElementsByClassName("cart-item");
    for (let item of els) {
        item.classList.add("success");
    }
}

function displayErrorInCart(err) {
    const els = document.getElementsByClassName("cart-item");
    for (let item of els) {
        item.classList.add("error");
    }

    document.getElementById("id-error").innerHTML = `Error: ${err.statusText}`;
    document.getElementById("id-error").classList.remove("hidden");
}

authenticate();
