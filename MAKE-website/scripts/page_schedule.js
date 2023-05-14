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

    const num_stewards = document.getElementById("num-stewards");

    // Get current number of stewards
    let now = new Date();

    let day = now.getDay();
    // Monday is 0, Sunday is 6
    if (day == 0) {
        day = 6;
    } else {
        day -= 1;
    }

    // Get current hour
    let hour = now.getHours();

    const current_shift = state.schedule.find((shift) => shift.day == DAYS[day] && formatHour(hour) == shift.timestamp_start);

    let num = 0;

    if (current_shift) {
        num = current_shift.stewards.length;
    }

    num_stewards.innerText = num;
    
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
    const time_start = 13;
    const time_end = 22;

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
                for (let name of shift.stewards) {

                    if (shift.head_steward) {
                        inner_div.classList.add("head-steward");
                    }

                    const user_div = document.createElement("span");
                    user_div.innerText = name;
                    user_div.classList.add("steward");

                    inner_div.appendChild(user_div);
                }

                
                for (let proficiency of shift.proficiencies) {
                    inner_div.classList.add(toCSSSafeString(proficiency));
                }

                cell.onclick = () => {
                    removeHighlightProficiency();
                    inner_div.classList.add("highlight");
                    highlightSourceProfs(shift.proficiencies);
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

    for (let proficiency of proficiencies_sorted) {
        let el = document.createElement("span");
        el.classList.add("proficiency");
        el.classList.add("trigger");

        // to lowercase, remove spaces, remove numbers
        const css_safe_prof = toCSSSafeString(proficiency);
        el.classList.add(css_safe_prof);
        el.innerText = proficiency;

        el.addEventListener("click", () => {
            removeHighlightProficiency();
            highlightProficiency(proficiency);
        })

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