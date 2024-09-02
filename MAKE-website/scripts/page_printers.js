async function printersLooper() {
    if (state.page === "printers") {
        await fetchPrinters();
    }

    setTimeout(printersLooper, 10000);
}


async function fetchPrinters() {
    const response = await fetch(`${API}/machines/get_printers`);

    if (response.status == 200) {
        const printers = await response.json();

        state.printers = printers;

        saveState();
        renderPrinters();
    }
}

function renderPrinters() {
    const printers_div = document.getElementById("printers");

    removeAllChildren(printers_div);

    appendChildren(printers_div, generatePrinterDivs(state.printers));
}

function generatePrinterDivs(printers) {
    let divs = [];
 
    let names = Object.keys(printers);
    // Sort them alphabetically
    names.sort();

    for (let name of names) {
        let printer = printers[name];
        // Can be FINISH, RUNNING, PAUSE, FAILED, IDLE
        let status = printer.printer_json["gcode_state"];

        switch (printer.printer_json["gcode_state"]) {
            case "FINISH":
                status = "Finished";
                break;
            case "RUNNING":
                status = "Running";
                break;
            case "IDLE":
                status = "Idle";
                break;
            case "PAUSE":
                status = "Paused";
                break;
            case "FAILED":
                status = "Failed";
                break;
            default:
                break;
        }

        let is_online = printer.printer_online;
        
        let current_file = printer.printer_json["subtask_name"];

        let ams_filaments = [null, null, null, null];

        if (printer.printer_json["ams"] && printer.printer_json["ams"]["ams"] && printer.printer_json["ams"]["ams"].length > 0) {
            for (let i = 0; i < printer.printer_json["ams"]["ams"][0]["tray"].length; i++) {
                let tray = printer.printer_json["ams"]["ams"][0]["tray"][i];

                if (tray["tray_color"] && tray["tray_type"]) {
                    ams_filaments[i] = {
                        color: tray["tray_color"],
                        type: tray["tray_type"]
                    };
                }
            }
        }

        let hotend_temp = printer.printer_json["nozzle_temper"];
        let bed_temp = printer.printer_json["bed_temper"];

        let div = document.createElement("div");
        div.classList.add("bambu-printer");

        let name_div = document.createElement("div");
        name_div.classList.add("name");
        name_div.innerText = printer.printer_name;

        let status_div = document.createElement("div");
        status_div.classList.add("status");
        status_div.classList.add(is_online ? "online" : "offline");
        status_div.classList.add(status.toLowerCase());
        status_div.innerHTML = `<b>${is_online ? "Online" : "Offline"}:</b>&nbsp;${status}`;

        let current_file_div = document.createElement("div");
        current_file_div.classList.add("current-file");
        current_file_div.innerText = `${current_file ?? "No active print"}`;

        let layer_num = printer.printer_json["layer_num"];
        let total_layer_num = printer.printer_json["total_layer_num"];
        let progress = Math.floor(printer.printer_json["mc_percent"]);
        let remaining_time_mins = printer.printer_json["mc_remaining_time"];

        let progress_div = document.createElement("div");
        progress_div.classList.add("progress");
        progress_div.innerHTML = generateProgressBar(progress);

        let progress_text_div = document.createElement("div");
        progress_text_div.classList.add("progress-text");

        if (progress == 100 || (progress == 0 && remaining_time_mins == 0)) {
            progress_text_div.classList.add("progress-text");
            progress_text_div.innerHTML = `<b>ETA</b> --:-- | ---%`;
        } else {
            let now = new Date();
            let eta = new Date(now.getTime() + remaining_time_mins * 60000);
            eta = eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            let hours_remaining = Math.floor(remaining_time_mins / 60);
            let remaining_time_hours = hours_remaining > 0 ? `${hours_remaining}h ` : "";
            remaining_time_mins = remaining_time_mins % 60;

            progress_text_div.innerHTML = `<b>ETA</b> ${eta} (~${remaining_time_hours}${remaining_time_mins}m) | ${progress}%`;
        }

        let temp_div = document.createElement("div");
        temp_div.classList.add("temp");
        temp_div.innerHTML = `<span>Hotend ${hotend_temp}°C</span> <span>Bed ${bed_temp}°C</span>`;

        let ams_div = document.createElement("div");
        ams_div.classList.add("ams");

        let number = 1;
        
        for (let filament of ams_filaments) {
            let filament_div = document.createElement("div");
            filament_div.classList.add("filament");

            let upper_left = document.createElement("div");
            upper_left.classList.add("upper-left");
            upper_left.innerText = `A${number}`;

            if (filament) {
                filament_div.style.backgroundColor = `#${filament.color}`;
                filament_div.style.color = determineColorText(filament.color);
                filament_div.innerText = filament.type;
            } else {
                filament_div.innerText = "?";
            }

            filament_div.appendChild(upper_left);

            ams_div.appendChild(filament_div);
            number++;
        }

        div.appendChild(name_div);
        div.appendChild(status_div);
        div.appendChild(current_file_div);
        div.appendChild(progress_div);
        div.appendChild(progress_text_div);
        div.appendChild(temp_div);
        div.appendChild(ams_div);

        divs.push(div);
    }

    return divs;
}

function generateProgressBar(progress) {
    return `
    <div class="progress-bar">
        <div class="progress-bar-fill" style="width: ${progress}%"></div>
    </div>
    `;
}

printersLooper()