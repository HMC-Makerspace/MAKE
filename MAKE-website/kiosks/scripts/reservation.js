/*
uuid: str
items: Dict[str, int] #Dictionary of item's uuid and quantity
reserved_by: str
timestamp_created: float
timestamp_start: float
timestamp_end: float
*/

function setDefaultReservationTimes() {
    const now = new Date();

    // Set the current time as the default start time (ensure it's local time)
    const formattedStartTime = now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
    document.getElementById("reservation-start").value = formattedStartTime;

    // Calculate seconds until close for end time
    const secondsUntilEnd = getCheckoutLength(); // This returns seconds

    const endTime = new Date(now.getTime() + Math.max(secondsUntilEnd, 0) * 1000); // Use max to avoid negative

    // Set the end time as the default value
    const formattedEndTime = endTime.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
    document.getElementById("reservation-end").value = formattedEndTime;
}

async function fetchReservationsAdmin() {
    const response = await fetch(`${API}/reservations/get_reservations`,
        {
            method: 'GET',
            headers: {
                'api-key': api_key
            }
        }
    );
    const reservations = await response.json();

    if (reservations === null) {
        return null;
    }

    state.reservations = reservations;
    renderReservationsAdmin();
}

function renderReservationsAdmin() {
    const container = document.getElementById("reservations-page");

    removeAllChildren(container);

    container.appendChild(createAdminReservationTable(current = true));
    container.appendChild(createAdminReservationTable(current = false));
}

function openReservationPopup() {
    if (Object.keys(state.cart).length === 0) {
        document.getElementById("id-error").innerHTML = 'Error: Cart is empty';
        document.getElementById("id-error").classList.remove("hidden");
        return;
    } else {
        setDefaultReservationTimes();
        document.getElementById("popup-container").classList.remove("hidden");
        document.getElementById("reservation-date-input").classList.remove("hidden");
    }
}

async function commitReservation() {
    const start_date_el = document.getElementById("reservation-start");
    const end_date_el = document.getElementById("reservation-end");

    // Get start and end dates from user input
    const start_string = start_date_el.value;
    const end_string = end_date_el.value;

    // Validate start time
    if (!start_string || new Date(start_string).getTime() <= Date.now()) {
        start_date_el.classList.add("error");
        displayErrorInCart("Start time must be in the future.");
        return;
    }

    // Validate end time
    if (!end_string || new Date(end_string).getTime() <= Date.now() || new Date(end_string).getTime() <= new Date(start_string).getTime()) {
        end_date_el.classList.add("error");
        displayErrorInCart("End time must be in the future and after the start time.");
        return;
    }

    // Clear error styles if valid
    start_date_el.classList.remove("error");
    end_date_el.classList.remove("error");

    // Proceed with reservation if validations pass
    const start_date_unix = new Date(start_string).getTime() / 1000;
    const end_date_unix = new Date(end_string).getTime() / 1000;
    const uuid = self.crypto.randomUUID();

    try {
        const response = await fetch(`${API}/reservations/create_new_reservation`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api-key": api_key,
            },
            body: JSON.stringify({
                uuid: uuid,
                items: state.cart,
                reserved_by: state.current_user_info.uuid,
                timestamp_created: Date.now() / 1000,
                timestamp_start: start_date_unix,
                timestamp_end: end_date_unix
            })
        });

        if (response.status === 201) {
            displaySuccessInCart();
            setTimeout(() => {
                clearUser();
                updateSelectedItems();
            }, 100);
        } else {
            const errorText = await response.text();
            displayErrorInCart(errorText);
        }
    } catch (error) {
        console.error(error);
    }

    await fetchReservationsAdmin();
}

function createAdminReservationsTable(current = true) {
    let table = document.createElement("table");
    table.classList.add("checkout-table");

    let out_icon = `<span class="material-symbols-outlined">shopping_cart_checkout</span>`;
    let in_icon = `<span class="material-symbols-outlined">keyboard_return</span>`;
    let due_icon = `<span class="material-symbols-outlined">event_upcoming</span>`;
    let items_icon = `<span class="material-symbols-outlined">category</span>`;

    let reservations;
    let header;

    if (!current) {
        reservations = state.reservations.filter((reservation) => reservation.timestamp_end < (new Date().getTime() / 1000));
        header = `<tr><th>${out_icon}</th><th>${in_icon}</th><th>${items_icon}</th><th>Name</th></tr>`;
    } else {
        reservations = state.reservations.filter((reservation) => reservation.timestamp_end >= (new Date().getTime() / 1000));
        header = `<tr><th>${out_icon}</th><th>${due_icon}</th><th>${items_icon}</th><th>Name</th><th>Extend</th><th>Check In</th></tr>`;
    }

    let header_row = document.createElement("tr");
    header_row.innerHTML = header;
    table.appendChild(header_row);

    reservations = reservations.slice().reverse();

    for (let reservation of reservations) {
        let row = document.createElement("tr");
        row.id = `reservation-${reservation.uuid}`;

        let t_out = document.createElement("td");
        t_out.classList.add("checkout-entry-timestamp");
        t_out.innerHTML = checkoutFormatDate(new Date(reservation.timestamp_start * 1000));
        row.appendChild(t_out);

        if (current) {
            let t_due = document.createElement("td");
            t_due.classList.add("checkout-entry-timestamp");
            t_due.innerHTML = checkoutFormatDate(new Date(reservation.timestamp_end * 1000));
            row.appendChild(t_due);
        } else {
            let t_in = document.createElement("td");
            t_in.classList.add("checkout-entry-timestamp");
            t_in.innerHTML = reservation.timestamp_in === null ? "N/A" : checkoutFormatDate(new Date(reservation.timestamp_end * 1000));
            row.appendChild(t_in);
        }

        let items = document.createElement("td");
        items.classList.add("checkout-entry-items");
        for (let uuid of Object.keys(reservation.items)) {
            let item_div = document.createElement("div");
            item_div.classList.add("checkout-entry-item");
            let name = (state.inventory?.find((item) => item.uuid === uuid) ?? { name: "[Unknown Item]" }).name;

            item_div.innerHTML = `${reservation.items[uuid]}x ${name}`;
            items.appendChild(item_div);
        }
        row.appendChild(items);

        let name = document.createElement("td");
        let user = state.users?.find((user) => user.uuid === reservation.reserved_by);
        name.innerHTML = user ? (user.name ?? reservation.reserved_by) : reservation.reserved_by;
        row.appendChild(name);

        if (current) {
            let editCell = document.createElement("td");
            let edit_reservation_button = document.createElement("button");
            edit_reservation_button.innerHTML = `<span class="material-symbols-outlined">tune</span>`;
            edit_reservation_button.onclick = () => {
                editReservation(reservation.uuid);
            };
            editCell.appendChild(edit_reservation_button);
            row.appendChild(editCell);

            let deleteCell = document.createElement("td");
            let delete_reservation_button = document.createElement("button");
            delete_reservation_button.classList.add("delete");
            delete_reservation_button.innerHTML = `<span class="material-symbols-outlined">delete</span>`;
            delete_reservation_button.onclick = () => {
                checkIn(reservation.uuid);
            };
            deleteCell.appendChild(delete_reservation_button);
            row.appendChild(deleteCell);
        }

        table.appendChild(row);
    }

    return table;
}

function renderReservationsAdmin() {
    const container = document.getElementById("reservations-page");

    removeAllChildren(container);

    container.appendChild(createAdminReservationsTable(current = true));
    container.appendChild(createAdminReservationsTable(current = false));
}

function checkIfItemAvaliable(start_time, end_time) {
    for(reservation of state.reservations) {
        // Finds reservations that overlap with start and end times
        if(reservation.timestamp_end >= start_time && reservation.timestamp_start <= end_time) {
            for(item of Object.keys(state.cart)) {
                if(Object.keys(reservation.items).includes(item)) {
                    // check that quantity being checked out or reserved plus quantity of items
                    // already being checked out / reserved <= quantity in inventory
                    return false
                }
            }
        }
    }
    return true
}

/*
    whenever user wants to reserve or checkout item
        ->  dB query that gets all items in the reservations table such end time is greater than current time
            find the reservations such that this item is in the items of reservations AND the quantity of the inventory
            of the item is possible

            state.cart is a disctionary of items with uuid:quantity
*/