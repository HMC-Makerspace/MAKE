async function fetchSchedule() {
    const response = await fetch(`${API}/schedule`);
    if (response.status == 200) {
        const schedule = await response.json();
        
        state.schedule = schedule;

        renderSchedule(schedule);
    }
}

function renderSchedule(schedule) {
    const schedule_table = document.getElementById("schedule-table");
    
    removeAllChildren(schedule_table);
    
    appendChildren(schedule_table, generateScheduleDivs(schedule));
}

function generateScheduleDivs(schedule) {
    const days = schedule.days;

    const divs = [];

    // Find longest shift time
    let longest_shift = [];

    for (let day of days) {
        if (day.shifts.length > longest_shift.length) {
            longest_shift = day.shifts;
        }
    }

    // Append header of days to table
    const header = document.createElement("tr");

    const day_header = document.createElement("th");
    day_header.innerText = "";
    header.appendChild(day_header);

    for (let day of days) {
        const day_header = document.createElement("th");
        day_header.innerText = day.day;
        header.appendChild(day_header);
    }

    divs.push(header);

    // Use longest shift as base
    for (let i = 0; i < longest_shift.length; i++) {
        const row = document.createElement("tr");

        const shift_header = document.createElement("th");
        shift_header.innerText = longest_shift[i].time_string;
        row.appendChild(shift_header);

        for (let day of days) {
            const cell = document.createElement("td");

            cell.appendChild(generateScheduleShiftDiv(day.shifts[i] ?? {num_stewards: 0, proficiencies: []}));

            row.appendChild(cell);
        }

        divs.push(row);
    }

    return divs;
}

function generateScheduleShiftDiv(shift) {
    const shift_div = document.createElement("div");
    shift_div.classList.add("schedule-shift");

    if (shift.num_stewards > 0) {
        shift_div.classList.add(`stewards-${shift.num_stewards}`);

        const proficiencies = document.createElement("div");
        proficiencies.classList.add("proficiencies");
        proficiencies.innerText = shift.proficiencies.join(", ");
        
        shift_div.appendChild(proficiencies);
    }  

    return shift_div;
}