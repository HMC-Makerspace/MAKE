var state = {
    page: "inventory",
    inventory: null,
    printers: null,
    cart: [],
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
    setInterval(fetchPrinters, 10000, kiosk_mode=true);
    
    fetchInventory(true).then(() => {
        submitSearch(kiosk_mode=true);
        document.getElementById("inventory-search-input").addEventListener("keyup", submitSearch, kiosk_mode=true);
        document.getElementById("inventory-in-stock").addEventListener("change", submitSearch, kiosk_mode=true);
        document.getElementById("room-select").addEventListener("change", submitSearch, kiosk_mode=true);
        document.getElementById("tool-material-select").addEventListener("change", submitSearch, kiosk_mode=true);
    });
    fetchPrinters(true);

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

        let id_number = e.target.value;

        fetchUserInfo(id_number).then((user_info) => {
            if (user_info === null) {
                document.getElementById("id-error").classList.remove("hidden");
                document.getElementById("id-input").focus();
            } else {
                document.getElementById("id-error").classList.add("hidden");
                document.getElementById("id-input").blur();
                document.getElementById("user-info-content").innerHTML = `
                    <div id="user-info-name">Name: ${user_info.name}</div>
                    <div id="user-info-id">College ID: ${user_info.college_id}</div>
                    <div id="user-info-email">Email: ${user_info.college_email}</div>
                    <div id="user-info-auth" class="${user_info.auth_level}">Auth: ${user_info.auth_level}</div>
                    <div id="user-info-pending-checkouts">Pending Checkouts: ${user_info.pending_checkouts.length}</div>
                    <div id="user-info-all-checkouts">All Checkouts: ${user_info.all_checkouts.length}</div>
                    <div id="user-info-passed-quizzes">Passed Quizzes:<br>${user_info.passed_quizzes}</div>
                    <div id="user-info-cart"><b>Cart</b><div id="cart-content"></div></div>
                    <button id="commit-checkout">Commit Checkout</button>
                `;
            }
        });
    });
}

async function fetchUserInfo(id_number) {
    const response = await fetch(`${API}/users/info/${id_number}`);
    const user_info = await response.json();

    if (user_info === null) {
        return null;
    }

    return user_info;
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

    const i_page = document.getElementById("inventory-page");
    const c_page = document.getElementById("checkouts-page");
    const u_page = document.getElementById("users-page");

    if (state.page === "inventory") {
        i_button.classList.add("selected");
        c_button.classList.remove("selected");
        u_button.classList.remove("selected");

        i_page.classList.remove("hidden");
        c_page.classList.add("hidden");
        u_page.classList.add("hidden");

        document.getElementById("inventory-search-input").focus();
    } else if (state.page === "checkout") {
        i_button.classList.remove("selected");
        c_button.classList.add("selected");
        u_button.classList.remove("selected");
        
        i_page.classList.add("hidden");
        c_page.classList.remove("hidden");
        u_page.classList.add("hidden");
    } else if (state.page === "users") {
        i_button.classList.remove("selected");
        c_button.classList.remove("selected");
        u_button.classList.add("selected");

        i_page.classList.add("hidden");
        c_page.classList.add("hidden");
        u_page.classList.remove("hidden");
    }
}

function addToCart(item) {
    if (state.cart.includes(item)) {
        return;
    }
    state.cart = [...state.cart, item];
    updateCartHTML();
}

function removeFromCart(item) {
    state.cart = state.cart.filter(i => i !== item);
    updateCartHTML();
}

function updateCartHTML() {
    const el = document.getElementById("cart-content");

    el.innerHTML = "";

    for (let item of state.cart) {
        el.innerHTML += `
            <div class="cart-item">
                <div class="cart-item-name">${item}</div>
                <div class="cart-item-remove" onclick="removeFromCart('${item}')">Remove</div>
            </div>
        `;
    }
}

authenticate();
