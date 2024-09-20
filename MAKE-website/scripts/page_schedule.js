async function fetchSchedule() {
    const response = await fetch(`${API}/shifts/get_shift_schedule`);
    if (response.status == 200) {
        const schedule = await response.json();
        
        state.schedule = schedule;
        renderSchedule(schedule);
    }
}

function renderSchedule(schedule) {
    const schedule_table = document.getElementById("schedule-table");
    
    removeAllChildren(schedule_table);
    
    appendChildren(schedule_table, generateScheduleDivs(state.schedule));
}

function generateScheduleDivs(schedule) {
    const info = document.getElementById("schedule-info");

    if (info.children.length < 3) {
        generateAllProfs(schedule);
    }

    let divs = [];

    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const time_start = 14;
    const time_end = 23;

    // Append header of days to table
    const header = document.createElement("tr");

    const day_header = document.createElement("th");
    day_header.innerText = "Time";
    header.appendChild(day_header);

    for (let day of days) {
        const day_header = document.createElement("th");
        day_header.innerText = day;
        header.appendChild(day_header);
    }

    divs.push(header);

    for (let i = time_start; i < time_end; i++) {
        const row = document.createElement("tr");

        const time = document.createElement("th");
        time.innerText = `${formatHour(i)} - ${formatHour(i + 1)}`;

        row.appendChild(time);

        for (let day of days) {
            const cell = document.createElement("td");

            const inner_div = document.createElement("div");
            inner_div.classList.add("schedule-shift");

            const shift = state.schedule.find(shift => shift.day === day && shift.timestamp_start === formatHour(i));

            if (shift) {
                inner_div.classList.add("proficiency");
                inner_div.classList.add(`stewards-${shift.stewards.length}`);
                
                for (let steward_obj of shift.stewards) {

                    if (steward_obj.role == "head_steward") {
                        inner_div.classList.add("head-steward");
                    }

                    const user_div = document.createElement("span");
                    user_div.innerText = steward_obj.name;
                    user_div.classList.add("steward");

                    inner_div.appendChild(user_div);

                    for (let proficiency of steward_obj.proficiencies ?? []) {
                        inner_div.classList.add(toCSSSafeString(proficiency));
                        if (!inner_div.dataset.proficiencies) {
                            inner_div.dataset.proficiencies = "";
                        }
                        inner_div.dataset.proficiencies += `${toCSSSafeString(proficiency)} `;
                    }
                }

                cell.onclick = () => {
                    removeHighlightProficiency();
                    inner_div.classList.add("highlight");
                    for (let steward_obj of shift.stewards) {
                        highlightSourceProfs(steward_obj.proficiencies);
                    }   
                };
            }

            cell.appendChild(inner_div);
            row.appendChild(cell);
        }

        divs.push(row);
    }
    
    return divs;
}

function generateAllProfs() {
    const info = document.getElementById("schedule-info");

    const profs_to_append = generateProficiencyDivs(PROFICIENCIES);

    appendChildren(info, profs_to_append);
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

    for (const prof of proficiencies_sorted) {
        let prof_div = document.createElement("button");
        prof_div.classList.add("switch");
        prof_div.classList.add("trigger");
        prof_div.classList.add("proficiency");
        prof_div.classList.add(toCSSSafeString(prof));
        prof_div.innerText = prof;
        
        prof_div.addEventListener("click", () => {
            removeHighlightProficiency();
            highlightProficiency(prof);
        });

        profs.push(prof_div);
    }
    return profs;
}

function highlightProficiency(proficiency) {
    const all_schedule_shifts = document.getElementsByClassName("schedule-shift");
    const css_safe_prof = toCSSSafeString(proficiency);

    for (let shift of all_schedule_shifts) {
        if (!shift.classList.contains(css_safe_prof)) {
            shift.classList.add("grayed-out");
            continue;
        }

        // Count how many times the classname string has the proficiency string in it
        // Max it out at 3
        // make sure to only search for whole words matching whole words, don't check inside of other words
        const regex = new RegExp(`\\b${css_safe_prof}\\b`, "g");
        const count = Math.min((shift.dataset.proficiencies.match(regex) ?? []).length, 3);
        
        if (count > 0) {
            shift.classList.add(`highlight-${count}`);
        } else {
            shift.classList.add("grayed-out");
        }
    }

    const trigger_prof = document.querySelector(`.trigger.${css_safe_prof}`);
    trigger_prof.classList.add("highlight");
}

function highlightSourceProfs(proficiencies) {
    for (let proficiency of proficiencies ?? []) {
        const els = document.querySelectorAll(`.trigger.${toCSSSafeString(proficiency)}`);

        for (let el of els) {
            el.classList.add("highlight");
        }
    }
}

function removeHighlightProficiency() {
    const profs = document.getElementsByClassName("proficiency");

    for (let prof of profs) {
        prof.classList.remove("highlight-1");
        prof.classList.remove("highlight-2");
        prof.classList.remove("highlight-3");
        prof.classList.remove("highlight");
        prof.classList.remove("grayed-out");
    }
}