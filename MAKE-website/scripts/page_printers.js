async function fetchPrinters() {
    if (state.college_id !== null) {
        const response = await fetch(`${API}/printers/${state.college_id}`);

        if (response.status == 200) {
            const printers = await response.json();

            state.printers = printers;

            saveState();

            renderPrinters();
        }
    }
}


function renderPrinters() {
    const el = document.getElementById("printers-current");

    removeAllChildren(el);

    for (let printer of state.printers.printers) {
        const div = createPrinterDiv(printer);

        el.appendChild(div);
    }

    const queue_el = document.getElementById("queue-info");
    const queue_button = document.getElementById("queue-button");
    if (state.printers.pos_in_queue !== null) {
        queue_el.innerHTML = `You are <b>${state.printers.pos_in_queue + 1}/${state.printers.total_in_queue}</b> in queue`;
        queue_button.innerHTML = "Leave queue";
        queue_button.onclick = leaveQueue;
        queue_button.classList.add("joined");
    } else {
        queue_el.innerHTML = `There are <b>${state.printers.total_in_queue}</b> people in queue`;
        queue_button.innerHTML = "Join queue";
        queue_button.onclick = joinQueue;
        queue_button.classList.remove("joined");
    }
}

function createPrinterDiv(printer) {
    const div = document.createElement("div");

    div.classList.add("printer");

    const name = document.createElement("div");
    name.classList.add("printer-id");
    name.innerText = printer.id;

    const icon = document.createElement("img");
    icon.classList.add("printer-icon");
    icon.src = "../img/printer-icon.svg";

    const status = document.createElement("div");
    status.classList.add("printer-status");
    status.innerText = printer.status;

    const last_updated = document.createElement("div");
    last_updated.classList.add("printer-last-updated");
    last_updated.innerText = printer.last_updated == 0 ? "---" : printer.last_updated;

    const current_time_left = document.createElement("div");
    current_time_left.classList.add("printer-current-time-left");
    current_time_left.innerText = printer.current_time_left == 0 ? "---" : printer.current_time_left;

    div.appendChild(name);
    div.appendChild(icon);
    div.appendChild(status);
    div.appendChild(last_updated);
    div.appendChild(current_time_left);

    return div;
}

async function joinQueue() {
    if (state.college_id !== null) {
        const response = await fetch(`${API}/printers/join_queue/${state.college_id}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (response.status == 201) {
            await fetchPrinters();
        }
    }
}

async function leaveQueue() {
    if (state.college_id !== null) {
        const response = await fetch(`${API}/printers/leave_queue/${state.college_id}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (response.status == 201) {
            await fetchPrinters();
        }
    }
}