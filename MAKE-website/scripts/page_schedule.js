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
    const info = document.getElementById("schedule-info");

    if (info.children.length < 3) {
        generateAllProfs(schedule);
    }

    // Put last day first, Sunday
    let days = schedule.days;
    days.unshift(days.pop());

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

function generateAllProfs(schedule) {
    const info = document.getElementById("schedule-info");

    const profs = schedule.all_proficiencies;

    const profs_to_append = generateProficiencyDivs(profs);

    appendChildren(info, profs_to_append);
}

function generateScheduleShiftDiv(shift) {
    const shift_div = document.createElement("div");
    shift_div.classList.add("schedule-shift");
    shift_div.classList.add("proficiency");

    if (shift.num_stewards > 0) {
        shift_div.classList.add(`stewards-${shift.num_stewards}`);

        for (let steward of shift.stewards) {
            if (steward != "Steward") {
                shift_div.innerHTML += `<span class="steward">${steward}</span>`;
            }
        }

        for (let proficiency of shift.proficiencies) {
            shift_div.classList.add(toCSSSafeString(proficiency));
        }

        shift_div.addEventListener("mouseover", () => {
            highlightSourceProfs(shift.proficiencies);
        });

        shift_div.addEventListener("mouseleave", () => {
            removeHighlightProficiency();
        });

        shift_div.addEventListener("click", () => {
            highlightSourceProfs(shift.proficiencies);
        });
    }  

    return shift_div;
}

function toCSSSafeString(str) {
    // to lowercase, remove spaces, remove numbers, remove parentheses
    return str.toLowerCase().replace(/\s/g, "").replace(/\d/g, "").replace(/\(/g, "").replace(/\)/g, "");
}

function generateProficiencyDivs(proficiencies) {
    let profs = [];

    let proficiencies_sorted = proficiencies.sort((a, b) => {
        return a.localeCompare(b);
    });

    for (let proficiency of proficiencies_sorted) {
        let el = document.createElement("span");
        el.classList.add("proficiency");
        el.classList.add("trigger");

        // to lowercase, remove spaces, remove numbers
        const css_safe_prof = toCSSSafeString(proficiency);
        el.classList.add(css_safe_prof);
        el.innerText = proficiency;

        el.addEventListener("mouseover", () => {
            removeHighlightProficiency();
            highlightProficiency(proficiency);
        });

        el.addEventListener("click", () => {
            removeHighlightProficiency();
            highlightProficiency(proficiency);
        })

        el.addEventListener("mouseleave", () => {
            removeHighlightProficiency();
        });

        profs.push(el);
    }

    return profs;
}

function highlightProficiency(proficiency) {
    const css_safe_prof = toCSSSafeString(proficiency);

    const profs = document.getElementsByClassName(css_safe_prof);

    for (let prof of profs) {
        prof.classList.add("highlight");
    }
}

function highlightSourceProfs(proficiencies) {
    for (let proficiency of proficiencies) {
        const els = document.querySelectorAll(`.trigger.${toCSSSafeString(proficiency)}`);

        for (let el of els) {
            el.classList.add("highlight");
        }
    }
}

function removeHighlightProficiency() {
    const profs = document.getElementsByClassName("proficiency");

    for (let prof of profs) {
        prof.classList.remove("highlight");
    }
}
