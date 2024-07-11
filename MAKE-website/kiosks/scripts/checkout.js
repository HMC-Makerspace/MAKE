var state = {
    page: "inventory",
    inventory: null,
    checkouts: null,
    users: null,
    cart: {},
    current_cx_id: 0,
    current_user_info: null,
}

document.documentElement.setAttribute('data-theme', 'dark');
localStorage.setItem("theme", "dark");

const API = '/api/v2';

var correct_sequence = 0;

async function authenticate() {
    // Get api keys from url params
    const params = new URLSearchParams(window.location.search);

    api_key = params.get('api_key') ?? localStorage.getItem('checkout_api_key');

    if (api_key === null) {
        alert("No API key provided.");
    }

    // Remove api key from url, but keep the rest of the url
    window.history.replaceState({}, document.title, window.location.pathname);

    // Fetch api scope
    const response = await fetch(`${API}/misc/get_api_key_scopes`,
        {
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ api_key: api_key }),
            method: "POST",
        }
    );

    if (response.status == 200) {
        const body = await response.json();

        if (body.scopes.includes("admin") || body.scopes.includes("checkouts")) {
            console.log("Authenticated with checkout permissions");
        } else {
            alert("API key does not have checkout scope.");
        }
    } else {
        // If API key is invalid, alert the user and redirect to the home page.
        alert("Invalid API key.");
        window.location.href = "/";
    }

    // Save api key to local storage
    localStorage.setItem('checkout_api_key', api_key);

    console.log(`Authenticating with checkout key ${api_key}`);

    setInterval(fetchInventory, 100000, kiosk_mode = "checkout");
    setInterval(fetchCheckoutsAdmin, 100000);
    setInterval(fetchUsers, 100000);

    fetchInventory(true).then(() => {
        submitSearch(kiosk_mode = "checkout");
        document.getElementById("inventory-search-input").addEventListener("keyup", () => { submitSearch(kiosk_mode = "checkout") });
        document.getElementById("container-input").addEventListener("keyup", () => { submitSearch(kiosk_mode = "checkout") });
        document.getElementById("room-select").addEventListener("change", () => { submitSearch(kiosk_mode = "checkout") });
        document.getElementById("tool-material-select").addEventListener("change", () => { submitSearch(kiosk_mode = "checkout") });
    });

    fetchUsers().then(() => {
        for (let key of Object.keys(state.users)) {
            state.users[key].cx_id_str = `${state.users[key].cx_id}`;
        }

        submitUserSearch();
        document.getElementById("users-search-input").addEventListener("keyup", () => { submitUserSearch(editable = false) });
        fetchCheckoutsAdmin();
    });

    document.addEventListener("keydown", (e) => {
        // If the key is is ';', focus the input on id-input and switch to
        // the inventory page

        if (e.key === ";") {
            e.preventDefault();
            correct_sequence = 0;
            setPage("inventory");
            state.cart = {};
            document.getElementById("id-input").value = "";
            document.getElementById("id-input").focus();
        }

        // Additionally, for tap to checkout, if the sequence starts with
        // a %E?; then we want to focus the input on id-input and switch
        // to the inventory page
        // To do this, increment correct_sequence by 1 for each keypress
        // If the sequence is correct, then reset correct_sequence to 0
        // and focus the input on id-input and switch to the inventory page
        // If the sequence is incorrect, then reset correct_sequence to 0
        if ((e.key === "%" && correct_sequence === 0)
            || (e.key === "E" && correct_sequence === 1)
            || (e.key === "?" && correct_sequence === 2)
        ) {
            e.preventDefault();
            correct_sequence += 1;
        } else {
            correct_sequence = 0;
        }

        // If the tap errors out, it'll start with a newline
        // We should disable keystrokes for the next 500ms
        // to prevent the newline from being added to the input
        if (e.key === "\n") {
            document.getElementById("id-input").focus();
            document.getElementById("id-input").disabled = true;

            setTimeout(() => {
                document.getElementById("id-input").disabled = false;
            }, 500);
        }
    });

    document.getElementById("id-input").addEventListener("change", (e) => {
        // Remove the last two chars if last one is ?
        if (e.target.value.endsWith("?")) {
            e.target.value = e.target.value.substring(0, e.target.value.length - 2);
        }

        state.current_cx_id = e.target.value;

        fetchUserInfo(state.current_cx_id.replace(";", "")).then((user_info) => {
            state.current_user_info = user_info;
            createUserInfo(user_info)
        });
    });
}

async function fetchCheckoutsAdmin() {
    const response = await fetch(`${API}/checkouts/get_checkouts`,
        {
            method: 'GET',
            headers: {
                'api-key': api_key
            }
        }
    );
    const checkouts = await response.json();

    if (checkouts === null) {
        return null;
    }

    state.checkouts = checkouts;
    renderCheckoutsAdmin();
}

function renderCheckoutsAdmin() {
    const container = document.getElementById("checkouts-page");

    removeAllChildren(container);

    container.appendChild(createAdminCheckoutTable(current = true));
    container.appendChild(createAdminCheckoutTable(current = false));
}

function createAdminCheckoutTable(current = true) {
    let table = document.createElement("table");
    table.classList.add("checkout-table");

    let out_icon = `<span class="material-symbols-outlined">shopping_cart_checkout</span>`;
    let in_icon = `<span class="material-symbols-outlined">keyboard_return</span>`;
    let due_icon = `<span class="material-symbols-outlined">event_upcoming</span>`
    let emails_icon = `<span class="material-symbols-outlined">forward_to_inbox</span>`;
    let items_icon = `<span class="material-symbols-outlined">category</span>`;

    let checkouts;
    let header;

    if (!current) {
        checkouts = state.checkouts.filter((checkout) => checkout.timestamp_in !== null);
        header = `<tr><th>${out_icon}</th><th>${in_icon}</th><th>${items_icon}</th><th>${emails_icon}</th><th>Name</th><th>Undo</th></tr>`;
    } else {
        checkouts = state.checkouts.filter((checkout) => checkout.timestamp_in === null);
        header = `<tr><th>${out_icon}</th><th>${due_icon}</th><th>${items_icon}</th><th>${emails_icon}</th><th>Name</th><th>Extend</th><th>Check In</th></tr>`;
    }

    let header_row = document.createElement("tr");
    header_row.innerHTML = header;
    table.appendChild(header_row);

    // Reverse the checkouts so that the most recent checkouts are at the top
    checkouts = checkouts.reverse();

    for (let checkout of checkouts) {
        let row = document.createElement("tr");
        row.id = `checkout-${checkout.uuid}`;

        let t_out = document.createElement("td");
        t_out.classList.add("checkout-entry-timestamp");
        t_out.innerHTML = checkoutFormatDate(new Date(checkout.timestamp_out * 1000));
        row.appendChild(t_out);

        if (current) {
            let t_due = document.createElement("td");
            t_due.classList.add("checkout-entry-timestamp");
            t_due.innerHTML = checkoutFormatDate(new Date(checkout.timestamp_due * 1000));
            row.appendChild(t_due);
        } else {
            let t_in = document.createElement("td");
            t_in.classList.add("checkout-entry-timestamp");
            t_in.innerHTML = checkout.timestamp_in === null ? "N/A" : checkoutFormatDate(new Date(checkout.timestamp_in * 1000));
            row.appendChild(t_in);
        }


        let items = document.createElement("td");
        items.classList.add("checkout-entry-items");
        for (let uuid of Object.keys(checkout.items)) {
            let item_div = document.createElement("div");
            item_div.classList.add("checkout-entry-item");
            let name = (state.inventory.find((item) => item.uuid === uuid) ?? { name: "" }).name;

            item_div.innerHTML = `${checkout.items[uuid]}x ${name ?? `[${uuid}]`}`;
            items.appendChild(item_div);
        }
        row.appendChild(items);

        let times_notified = document.createElement("td");
        times_notified.innerHTML = checkout.notifications_sent;
        row.appendChild(times_notified);

        let name = document.createElement("td");
        if (state.users !== null) {
            let user = state.users.find((user) => user.uuid === checkout.checked_out_by);

            name.innerHTML = `${user ? (user.name ?? checkout.checked_out_by) : checkout.checked_out_by}`;
        } else {
            name.innerHTML = `${checkout.checked_out_by}`;
        }

        row.appendChild(name);

        if (!current) {
            let undo = document.createElement("td");
            let undo_button = document.createElement("button");
            undo_button.innerHTML = `<span class="material-symbols-outlined">undo</span>`;
            undo_button.onclick = () => {
                undoCheckout(checkout.uuid);
            }

            undo.appendChild(undo_button);
            row.appendChild(undo);
        } else {
            let extend = document.createElement("td");
            let extend_button = document.createElement("button");
            extend_button.innerHTML = `<span class="material-symbols-outlined">more_time</span>`;
            extend_button.onclick = () => {
                extendCheckout(checkout.uuid);
            }

            extend.appendChild(extend_button);
            row.appendChild(extend);

            let check_in = document.createElement("td");
            let check_in_button = document.createElement("button");
            check_in_button.classList.add("check-in-button");
            check_in_button.innerHTML = `<span class="material-symbols-outlined">keyboard_return</span>`;
            check_in_button.onclick = () => {
                checkIn(checkout.uuid);
            }

            check_in.appendChild(check_in_button);
            row.appendChild(check_in);
        }

        table.appendChild(row);
    }

    return table;
}

async function fetchUserInfo(id_number) {
    const response = await fetch(`${API}/users/get_user_by_cx_id/${id_number}`, headers={
        "api-key": api_key,
    });

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
        // Look at all checkouts for overdue checkouts
        // Ensure that we only look at checkouts that are currently checked out, 
        // so filter out checkouts that have a timestamp_in
        let checkouts = state.checkouts.filter((checkout) => checkout.checked_out_by === user_info.uuid && checkout.timestamp_in === null);
        let now = new Date();

        let total_overdue = 0;

        for (let checkout of checkouts) {
            let checkout_time = new Date(checkout.timestamp_due * 1000);

            if (checkout_time < now) {
                total_overdue += 1;
            }
        }

        document.getElementById("id-error").classList.add("hidden");
        document.getElementById("user-info-content").innerHTML = `
            <div id="user-info-name">${user_info.name}</div>
            <div id="user-info-id">${user_info.cx_id}</div>
            <div id="user-info-email">${user_info.email}</div>
            <div id="user-info-auth" class="${user_info.role}">${ROLE_TO_READABLE[user_info.role] ?? user_info.role}</div>
            <div id="user-info-pending-checkouts">Overdue Checkouts: ${total_overdue}</div>
            <div id="user-info-all-checkouts">All Checkouts: ${checkouts.length}</div>
            <div id="user-info-passed-quizzes">${createPassedQuizzes(user_info.passed_quizzes)}</div>
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
                    <input id="time-break" type="radio" name="time-length" value="4"><label for="time-break">For Break</label>
                </div>
            </div>

            <div id="bottom-buttons">
                <button id="commit-checkout" onclick="commitCheckout()">Add Checkout</button>
                <button id="commit-reserve" onclick="commitReservation()">Add Reservation</button>
                <input id="reserve-date" type="date">
            </div>
        `;

        if (total_overdue > 0) {
            document.getElementById("user-info-pending-checkouts").classList.add("error");
        }
    }
}

function createPassedQuizzes(list) {
    let added_quizzes = [];

    let html = "";
    for (let timestamp of Object.keys(list)) {
        if (determineValidQuizDate(timestamp)) {
            let quiz = QUIZ_ID_TO_NAME[list[timestamp]];

            if (added_quizzes.includes(quiz)) {
                continue;
            }

            html += `<div>${quiz}</div>`;

            added_quizzes.push(quiz);
        }
    }

    if (html === "") {
        html = "No quizzes passed";
    }

    return html;
}

function clearUser() {
    document.getElementById("user-info-content").innerHTML = "";
    document.getElementById("id-input").value = "";
    document.getElementById("id-input").focus();
    document.getElementById("id-error").classList.add("hidden");
    state.current_cx_id = 0;
    state.cart = {};
    updateSelectedItems();
}

function setPage(page) {
    state.page = page;

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

function addToCart(uuid) {
    if (state.current_cx_id === 0) {
        return;
    }

    if (state.cart[uuid] === undefined) {
        state.cart[uuid] = 1;
    } else {
        state.cart[uuid] += 1;
    }

    updateSelectedItems();
    updateCartHTML();
}

function updateSelectedItems() {
    const selected_els = document.querySelectorAll(".inventory-result.selected");
    
    for (let el of selected_els) {
        el.classList.remove("selected");
    }

    for (let uuid of Object.keys(state.cart)) {
        const el = document.getElementById(`inventory-result-${uuid}`);

        if (el !== null) {
            el.classList.add("selected");
        }
    }
}

function removeFromCart(uuid) {
    if (state.cart[uuid] === undefined) {
        return;
    }

    if (state.cart[uuid] <= 1) {
        delete state.cart[uuid];
    } else {
        state.cart[uuid] -= 1;
    }

    updateSelectedItems();
    updateCartHTML();
}

function updateCartHTML() {
    const el = document.getElementById("cart-content");

    el.innerHTML = "";

    for (let uuid of Object.keys(state.cart)) {
        const item = state.inventory.find((item) => item.uuid === uuid);

        el.innerHTML += `
            <div class="cart-item">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-quantity">
                    <input id="cart-item-quantity-${uuid}" class="cart-item-quantity-input" type="" value="${state.cart[uuid]}"
                    onchange="updateCartQuantity('${uuid}')">
                </div>
            </div>
        `;
    }
}

function updateCartQuantity(uuid) {
    const el = document.getElementById(`cart-item-quantity-${uuid}`);
    const value = parseInt(el.value);

    if (value <= 0) {
        delete state.cart[uuid];
    } else {
        state.cart[uuid] = value;
    }

    updateCartHTML();
    updateSelectedItems();
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
            // This is a checkout for breaks specifically, so it should 
            // check out the item until 11:59pm on the next upcoming
            // monday
            const day = new Date().getDay();

            const days_until_monday = (day === 0) ? 1 : (day === 6) ? 2 : 8 - day;

            return days_until_monday * 24 * 3600;
    }
}

async function commitCheckout() {
    if (state.cart.length === 0) {
        return;
    }

    // Get the length
    let sec_length = getCheckoutLength();

    // Generate new uuid
    const uuid = self.crypto.randomUUID();

    const response = await fetch(`${API}/checkouts/create_new_checkout`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "api-key": api_key,
        },
        body: JSON.stringify({
            uuid: uuid,
            items: state.cart,
            timestamp_out: (new Date().getTime()) / 1000,
            timestamp_in: null,
            timestamp_due: ((new Date().getTime()) / 1000) + sec_length,
            checked_out_by: state.current_user_info.uuid,
            notifications_sent: 0,
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


    await fetchCheckoutsAdmin();
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

    const uuid = self.crypto.randomUUID();

    const response = await fetch(`${API}/checkouts/create_new_checkout`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "api-key": api_key,
        },
        body: JSON.stringify({
            uuid: uuid,
            items: state.cart,
            timestamp_out: start_date_unix,
            timestamp_in: null,
            timestamp_due: ((new Date().getTime())) / 1000 + sec_length,
            checked_out_by: state.current_user_info.uuid,
            notifications_sent: 0,
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

    await fetchCheckoutsAdmin();
}

function displaySuccessInCart() {
    const els = document.getElementsByClassName("cart-item");
    for (let item of els) {
        item.classList.add("success");
    }
}

async function displayErrorInCart(err) {
    const els = document.getElementsByClassName("cart-item");
    for (let item of els) {
        item.classList.add("error");
    }

    // Try to get detail from body
    let body = await err.json();

    if (body.detail !== undefined) {
        document.getElementById("id-error").innerHTML = `Error: ${body.detail}`;
    } else {
        document.getElementById("id-error").innerHTML = `Error: ${err.status} ${err.statusText}`;
    }

    document.getElementById("id-error").classList.remove("hidden");

}

function displaySuccessInCheckout(uuid) {
    const el = document.getElementById(`checkout-${uuid}`);
    el.classList.add("success");
}

function displayErrorInCheckout(uuid) {
    const el = document.getElementById(`checkout-${uuid}`);
    el.classList.add("error");
}


async function checkIn(checkout_uuid) {
    const response = await fetch(`${API}/checkouts/check_in_checkout/${checkout_uuid}`,
        {
            method: "POST",
            headers: {
                "api-key": api_key,
            },
        }
    );

    if (response.status === 201) {
        displaySuccessInCheckout(checkout_uuid);
    } else {
        displayErrorInCheckout(checkout_uuid);
    }

    setTimeout(() => {
        const el = document.getElementById(`checkout-${checkout_uuid}`);

        if (el.classList.contains("success")) {
            fetchCheckoutsAdmin();
        } else {
            el.classList.remove("error");
        }
    }, 500);
}

async function undoCheckout(checkout_uuid) {
    let checkout = state.checkouts.find((checkout) => checkout.uuid === checkout_uuid);

    // Set timestamp_in to null
    checkout.timestamp_in = null;

    const response = await fetch(`${API}/checkouts/update_checkout/${checkout_uuid}`,
        {
            method: "POST",
            headers: {
                "api-key": api_key,
            },
            body: JSON.stringify(checkout)
        }
    );

    if (response.status === 200) {
        await fetchCheckoutsAdmin();
    }
}

async function extendCheckout(checkout_uuid) {
    let checkout = state.checkouts.find((checkout) => checkout.uuid === checkout_uuid);

    // Add 24 hours to the timestamp_due
    checkout.timestamp_due = String(Number(checkout.timestamp_due) + (24 * 3600));

    const response = await fetch(`${API}/checkouts/update_checkout/${checkout_uuid}`,
        {
            method: "POST",
            headers: {
                "api-key": api_key,
            },
            body: JSON.stringify(checkout)
        }
    );

    if (response.status === 200) {
        await fetchCheckoutsAdmin();
    }
}

authenticate();