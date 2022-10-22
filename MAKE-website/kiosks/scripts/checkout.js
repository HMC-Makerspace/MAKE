var state = {
    page: "inventory",
    inventory: null,
    checkouts: null,
    users: null,
    cart: [],
    current_id_number: 0,
}

document.documentElement.setAttribute('data-theme', 'dark');
localStorage.setItem("theme", "dark");

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
    setInterval(fetchUsers, 100000);

    fetchInventory(true).then(() => {
        submitSearch(kiosk_mode=true);
        document.getElementById("inventory-search-input").addEventListener("keyup", () => {submitSearch(kiosk_mode=true)});
        document.getElementById("inventory-in-stock").addEventListener("change", () => {submitSearch(kiosk_mode=true)});
        document.getElementById("room-select").addEventListener("change", () => {submitSearch(kiosk_mode=true)});
        document.getElementById("tool-material-select").addEventListener("change", () => {submitSearch(kiosk_mode=true)});
    });

    fetchUsers().then(() => {
        submitUserSearch();
        document.getElementById("users-search-input").addEventListener("keyup", submitUserSearch);
        fetchCheckouts();
    });

    document.addEventListener("keyup", (e) => {
        // If the key is is ';', focus the input on id-input and switch to
        // the inventory page
        
        if (e.key === ";") {
            e.preventDefault();
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

    
    document.getElementById("restock-dialog").addEventListener("click", function (event) {
        if (event.target.id === "restock-dialog") {
            hideRestock()
        }
    });

}

function hideRestock() {
    document.getElementById("restock-dialog").classList.add("hidden");
}

function showRestock() {
    const els = document.getElementById("restock-inputs").getElementsByTagName("input");

    for (let el of els) {
        el.value = "";
        el.classList.remove("error");
        el.classList.remove("success");
    }

    document.getElementById("restock-dialog").classList.remove("hidden");
}

async function submitRestockNotice() {
    const inputs = document.getElementById("restock-inputs").getElementsByTagName("input");

    const steward_email = inputs[0].value;
    const name = inputs[1].value;
    const current_quantity = inputs[2].value;
    const requested_quantity = inputs[3].value;
    const notes = inputs[4].value;

    let is_error = false;

    if (steward_email === "") {
        inputs[0].classList.add("error");
        is_error = true;
    }

    if (name.trim() === "") {
        inputs[1].classList.add("error");
        is_error = true;
    }

    if (current_quantity.trim() === "") {
        inputs[2].classList.add("error");
        is_error = true;
    }

    if (requested_quantity.trim() === "") {
        inputs[3].classList.add("error");
        is_error = true;
    }

    if (is_error === true) {
        setTimeout(() => {
            for (let el of inputs) {
                el.classList.remove("error");
            }
        }, 400);
        return;
    }

    const response = await fetch(`${API}/inventory/add_restock_notice/${api_key}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name: name,
            current_quantity: current_quantity,
            requested_quantity: requested_quantity,
            notes: notes,
            notified: false,
            steward_email: steward_email,
        })
    });

    if (response.status === 201) {
        for (let input of inputs) {
            input.classList.add("success")
        }

        setTimeout(() => {
            hideRestock();
            fetchInventory(kiosk_mode=true);
        }, 400);
    } else {
        alert(result.message);
    }
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

const user_search_options = {
    limit: 1000, // don't return more results than you need!
    allowTypo: true, // if you don't care about allowing typos
    threshold: -10000, // don't return bad results
    keys: ['name', 'college_id', 'college_email', 'auth_level'], // keys to search
    all: true,
}

function submitUserSearch() {
    if (state.users === null) {
        return;
    }

    const search = document.getElementById("users-search-input").value;

    const search_results = searchUsers(search);

    const users = document.getElementById("users-results");

    let divs = [];
    for (let user of search_results) {
        divs.push(createUserDiv(user.obj));
    }

    removeAllChildren(users);
    appendChildren(users, divs);
}

function searchUsers(search) {
    if (state.users === null) {
        return [];
    }

    const results = fuzzysort.go(search, Object.values(state.users), user_search_options);

    const results_norm = results.sort((a, b) => b.score - a.score);

    return results_norm;
}

function createUserDiv(user) {
    let div = document.createElement("div");
    div.classList.add("user-result");

    let name = document.createElement("div");
    name.classList.add("user-result-name");
    name.innerHTML = user.name;

    let id = document.createElement("div");
    id.classList.add("user-result-id");
    id.innerHTML = user.college_id;

    let email = document.createElement("div");
    email.classList.add("user-result-email");
    email.innerHTML = user.college_email;

    let auth = document.createElement("div");
    auth.classList.add("user-result-auth");
    auth.innerHTML = user.auth_level;

    let passed_quizzes = document.createElement("div");
    passed_quizzes.classList.add("user-result-passed-quizzes");
    for (let quiz of user.passed_quizzes) {
        let quiz_div = document.createElement("div");
        quiz_div.innerHTML = quiz;
        passed_quizzes.appendChild(quiz_div);
    }

    div.appendChild(name);
    div.appendChild(id);
    div.appendChild(email);
    div.appendChild(auth);
    div.appendChild(passed_quizzes);

    return div;
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

    // Reverse order of both lists
    current_divs.reverse();
    history_divs.reverse();

    removeAllChildren(current);
    removeAllChildren(history);
    
    appendChildren(current, current_divs);
    appendChildren(history, history_divs);

}

async function fetchUserInfo(id_number) {
    const response = await fetch(`${API}/users/info/${id_number}`);

    if (response.status === 200) {


        const user_info = await response.json();

        if (user_info === null) {
            return null;
        }

        return user_info;
    } else {
        return null;
    }
}

function createUserInfo(user_info) {
    if (user_info === null) {            
        document.getElementById("id-error").innerHTML = "Invalid ID/User not yet in system.<br>They might have not taken the General Safety Quiz";
        document.getElementById("id-error").classList.remove("hidden");
        document.getElementById("id-input").focus();
    } else {
        document.getElementById("id-error").classList.add("hidden");
        document.getElementById("user-info-content").innerHTML = `
            <div id="user-info-name">${user_info.name}</div>
            <div id="user-info-id">${user_info.college_id}</div>
            <div id="user-info-email">${user_info.college_email}</div>
            <div id="user-info-auth" class="${user_info.auth_level}">Auth: ${user_info.auth_level}</div>
            <div id="user-info-pending-checkouts">Pending Checkouts: ${user_info.pending_checkouts.length}</div>
            <div id="user-info-all-checkouts">All Checkouts: ${user_info.all_checkouts.length}</div>
            <div id="user-info-passed-quizzes">${createListDivs(user_info.passed_quizzes)}</div>
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
                    <input id="time-1-week" type="radio" name="time-length" value="4"><label for="time-1-week">1 Week</label>
                </div>
            </div>

            <div id="bottom-buttons">
                <button id="commit-checkout" onclick="commitCheckout()">Add Checkout</button>
                <button id="commit-reserve" onclick="commitReservation()">Add Reservation</button>
                <input id="reserve-date" type="date">
            </div>
        `;
    }
}

function createListDivs(list) {
    let div = "";
    for (let item of list) {
        div += `<div>${item}</div>`;
    }

    return div;
}

function clearUser() {
    document.getElementById("user-info-content").innerHTML = "";
    document.getElementById("id-input").value = "";
    document.getElementById("id-input").focus();
    document.getElementById("id-error").classList.add("hidden");
    state.current_id_number = 0;
    state.cart = [];
    updateSelectedItems();
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
        document.getElementById("inventory-search-input").select();
    } else if (state.page === "checkout") {
        c_button.classList.add("selected");
        c_page.classList.remove("hidden");
    } else if (state.page === "users") {
        u_button.classList.add("selected");
        u_page.classList.remove("hidden");
        document.getElementById("users-search-input").focus();
        document.getElementById("users-search-input").select();
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

    state.cart = [...state.cart, item];
    updateSelectedItems();
    updateCartHTML();
}

function updateSelectedItems() {
    const selected_els = document.getElementsByClassName("inventory-result");
    for (let i = 1; i < selected_els.length; i++) {
        const el = selected_els[i];

        if (state.cart.filter(item => item.index == el.id.split("-")[2]).length > 0) {
            el.classList.add("selected");
        } else {
            el.classList.remove("selected");
        }
    }
}

function removeFromCart(name) {
    // Remove the first instance of the item from the cart
    // leave the rest though
    
    // Reverse the cart so that the first instance of the item is the last one
    // in the array
    state.cart.reverse();
    const index = state.cart.findIndex(item => item.name === name);
    state.cart.splice(index, 1);
    state.cart.reverse();

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

// Sun, Mon, Tue, Wed, Thu, Fri, Sat
const close_key = [21, 22, 22, 22, 22, 19, 19];

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
            const day_of_week = new Date().getDay();
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes();
            const seconds = now.getSeconds();

            const close_hour = close_key[day_of_week];

            const seconds_until_close = (close_hour - hours) * 3600 + (0 - minutes) * 60 + (0 - seconds);

            if (seconds_until_close < 0) {
                // If it's past the closing time, add 24 hours
                return seconds_until_close + 3600 * 24;
            } else {
                return seconds_until_close;
            }
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
            items: state.cart.map(item => item.name)
        })
    });

    if (response.status === 201) {
        displaySuccessInCart();

        // Clear the cart
        setTimeout(() => {
            clearUser();
            updateSelectedItems();
        }, 100);
    } else {
        displayErrorInCart(response);
    }


    await fetchCheckouts();
}

async function commitReservation() {
    if (state.cart.length === 0) {
        return;
    }

    // Get the length
    let sec_length = getCheckoutLength();

    // Get the date to start from
    const date_el = document.getElementById("reserve-date");
    const date = date_el.value;

    console.log(date);

    if (date === "") {
        date_el.classList.add("error");
        return;
    }

    const date_parts = date.split("-");
    const year = date_parts[0];
    const month = date_parts[1];
    const day = date_parts[2];
    const start_date = new Date(year, month - 1, day);

    const start_date_unix = start_date.getTime() / 1000;

    const response = await fetch(`${API}/checkouts/add_reservation/${state.current_id_number}/${start_date_unix}/${sec_length}/${api_key}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            items: state.cart.map(item => item.name)
        })
    });

    if (response.status === 201) {
        displaySuccessInCart();

        // Clear the cart
        setTimeout(() => {
            clearUser();
            updateSelectedItems();
        }, 100);
    } else {
        displayErrorInCart(response);
    }

    await fetchCheckouts();
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

async function checkIn(uuid) {
    const response = await fetch(`${API}/checkouts/check_in_entry/${uuid}/${api_key}`,
        { method: "POST" }
    );

    if (response.status === 200) {
        displaySuccessInCheckout(uuid);
    } else {
        displayErrorInCheckout(uuid);
    }

    setTimeout(() => {
        const el = document.getElementById(`checkout-${uuid}`);

        if (el.classList.contains("success")) {
            fetchCheckouts();
        } else {
            el.classList.remove("error");
        }
    }, 500);
}

function displaySuccessInCheckout(uuid) {
    const el = document.getElementById(`checkout-${uuid}`);
    el.classList.add("success");
}

function displayErrorInCheckout(uuid) {
    const el = document.getElementById(`checkout-${uuid}`);
    el.classList.add("error");
}

authenticate();
