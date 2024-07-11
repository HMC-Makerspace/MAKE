var state = {
    current_cx_id: null,
    current_user_info: null,
    workshops: null,
}

const API = '/api/v2';

var correct_sequence = 0;

document.documentElement.setAttribute('data-theme', 'dark');
localStorage.setItem("theme", "dark");

async function authenticate() {
    setupScroller();

    // Get api keys from url params
    const params = new URLSearchParams(window.location.search);

    api_key = params.get('api_key') ?? localStorage.getItem('workshop_api_key');

    if (api_key === null) {
        alert("No API key provided.");
    }

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

        if (await body.scopes.includes("admin") || await body.scopes.includes("workshops")) {
            console.log("Authenticated");
            localStorage.setItem('workshop_api_key', api_key);

            // Remove api key from url, but keep the rest of the url
            window.history.replaceState({}, document.title, window.location.pathname);
        } else {
            alert("API key does not have proper scope.");
        }
    } else {
        // If API key is invalid, alert the user and redirect to the home page.
        alert("Invalid API key.");
        window.location.href = "/";
    }

    // Get workshops
    await fetchWorkshopsAdmin();

    document.addEventListener("keydown", (e) => {
        // If the key is is ';', focus the input on id-input and switch to
        // the inventory page

        if (e.key === ";") {
            e.preventDefault();
            correct_sequence = 0;
            setPage("sign-in");
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

        login();
    });
}

async function login() {
    document.getElementById("college-id-button").setAttribute("disabled", "disabled");

    const user_info = await fetchUserInfo(state.current_cx_id.replace(";", ""));
    state.current_user_info = user_info;

    if (state.current_user_info === null) {
        alert("User not found.");
        document.getElementById("college-id-button").removeAttribute("disabled");
        return;
    }

    await fetchWorkshopsAdmin();

    if (state.workshops === null) {
        alert("Workshops not found.");
        document.getElementById("college-id-button").removeAttribute("disabled");
        return;
    }

    renderSelectWorkshop(user_info.role === "admin" || user_info.role === "steward" || user_info.role === "head_steward");

    document.getElementById("college-id-button").removeAttribute("disabled");
    document.getElementById("id-input").value = "";
    
    setPage("select-workshop");
}

function renderSelectWorkshop(show_list = false) {
    const table = document.getElementById("workshop-table");

    // Get workshops up to 30 minutes before it starts,
    // and up until 30 minutes after it ends

    const now = new Date();

    let header = "<tr><th>Workshop</th><th>Instructor(s)</th><th>Time</th><th>Required Quizzes</th><th>Sign In</th>";

    if (show_list) {
        header += "<th>Attendees</th>";
    }
    
    header += "</tr>";
    
    table.innerHTML = header;

    for (const workshop of state.workshops) {
        console.log(workshop);
        if (workshop.is_live) {
            const start = new Date(workshop.timestamp_start * 1000);
            const end = new Date(workshop.timestamp_end * 1000);
    
            // Adjust start and end times
            start.setMinutes(start.getMinutes() - 30);
            end.setMinutes(end.getMinutes() + 30);

            if (now >= start && now <= end) {
                const tr = generateSelectWorkshopRow(workshop, show_list);
                table.appendChild(tr);
            }
        }
    }

    // if no workshops are found, display a message
    if (table.children.length === 1) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 5;
        td.style.height = "100px";
        td.textContent = "No workshops are currently available for sign-in. Check out upcoming workshops on make.hmc.edu!";
        tr.appendChild(td);
        table.appendChild(tr);
    }
}

function generateSelectWorkshopRow(workshop, show_list = false) {
    const tr = document.createElement("tr");

    const name_td = document.createElement("td");
    name_td.textContent = workshop.title;
    tr.appendChild(name_td);

    const instructor_td = document.createElement("td");
    instructor_td.textContent = workshop.instructors;
    tr.appendChild(instructor_td);

    const date = document.createElement("td");
    let start_time = new Date(workshop.timestamp_start * 1000);
    let end_time = new Date(workshop.timestamp_end * 1000);

    let start_time_string = start_time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    let end_time_string = end_time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

    let day_of_week = start_time.toLocaleDateString([], {weekday: 'long'});
    let month = start_time.toLocaleDateString([], {month: 'short'});
    let day = start_time.toLocaleDateString([], {day: 'numeric'});

    let day_suffix = "th";

    if (day === "1" || day === "21" || day === "31") {
        day_suffix = "st";
    } else if (day === "2" || day === "22") {
        day_suffix = "nd";
    } else if (day === "3" || day === "23") {
        day_suffix = "rd";
    }


    // Format as "Tuesday, Oct. 10th"
    let date_string = `${day_of_week}, ${month}. ${day}${day_suffix}`;

    date.innerHTML = `${date_string}<br>${start_time_string.replace(/^0+/, '')} - ${end_time_string.replace(/^0+/, '')}`;

    date.classList.add("date");
    tr.appendChild(date);

    // Required quizzes
    const required_quizzes_td = document.createElement("td");
    required_quizzes_td.classList.add("required-quizzes");
    /*
        const required_quizzes = document.createElement("p");
    required_quizzes.innerHTML = `<b>Required Quizzes:</b>`;
    

    for (let quiz of workshop.required_quizzes) {
        if (state.user_object === null) {
            required_quizzes.innerHTML += `<span>${quiz}</span>`;
            continue;
        }
        
        let has_passed = Object.values(state.user_object.passed_quizzes).includes(QUIZ_NAME_TO_ID[quiz]);
        required_quizzes.innerHTML += `<span class='${has_passed ? "passed" : "failed"}'>${quiz}</span>`;
    }

    required_quizzes.classList.add("required-quizzes");
    div.appendChild(required_quizzes);
    */

    for (let quiz of workshop.required_quizzes) {
        let has_passed = Object.values(state.current_user_info.passed_quizzes).includes(QUIZ_NAME_TO_ID[quiz]);
        required_quizzes_td.innerHTML += `<span class='${has_passed ? "passed" : "failed"}'>${quiz}</span>`;
    }

    tr.appendChild(required_quizzes_td);

    const button_td = document.createElement("td");
    const button = document.createElement("button");
    button.innerHTML = "<span class='material-symbols-outlined'>login</span>";

    button.addEventListener("click", () => {
        signIntoWorkshop(workshop);
    });
    button_td.appendChild(button);
    tr.appendChild(button_td);

    if (show_list) {
        const attendees_td = document.createElement("td");
        const attendees_button = document.createElement("button");
        attendees_button.textContent = "View";
        attendees_button.addEventListener("click", () => {
            showAttendeesPopup(workshop);
        });
        attendees_td.appendChild(attendees_button);
        tr.appendChild(attendees_td);
    }

    return tr;
}

async function showAttendeesPopup(workshop) {
    const table = document.getElementById("attendees-table");
    table.innerHTML = "<tr><th>#</th><th>Name</th><th>Email</th><th>CX ID</th></tr>";
    // Put a line at workshop.capacity if the number of attendees is greater than or equal to workshop.capacity

    if (workshop.sign_in_list.length == 0) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 5;
        td.style.height = "100px";
        td.textContent = "No attendees are currently signed in.";
        tr.appendChild(td);
        table.appendChild(tr);
    } else {
        let i = 0;
        for (let attendee of workshop.sign_in_list) {
            // attendee is uuid, fetch it

            let request = await fetch(`${API}/users/get_user/${attendee}`);

            if (request.status !== 200) {
                continue;
            }

            const user_info = await request.json();

            attendee = user_info;

            if (i == workshop.capacity) {
                const tr = document.createElement("tr");
                const td = document.createElement("td");
                td.colSpan = 4;
                td.style.height = "100px";
                td.textContent = "--- Capacity Reached ---";
                tr.appendChild(td);
                table.appendChild(tr);
            }

            const tr = document.createElement("tr");
            
            const num_td = document.createElement("td");
            num_td.textContent = `${i + 1}.`
            tr.appendChild(num_td);

            const name_td = document.createElement("td");
            name_td.textContent = attendee.name;
            tr.appendChild(name_td);

            const email_td = document.createElement("td");
            email_td.textContent = attendee.email;
            tr.appendChild(email_td);

            const cx_id_td = document.createElement("td");
            cx_id_td.textContent = attendee.cx_id;
            tr.appendChild(cx_id_td);

            table.appendChild(tr);
            i++;
        }
    }


    showPopup("workshop-attendees", workshop);
}

async function signIntoWorkshop(workshop) {
    // Check all required quizzes
    for (let quiz of workshop.required_quizzes) {
        if (!Object.values(state.current_user_info.passed_quizzes).includes(QUIZ_NAME_TO_ID[quiz])) {
            alert(`You have not passed the required quiz: ${quiz}`);
            return;
        }
    }

    const response = await fetch(`${API}/workshops/sign_in`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "api-key": api_key,
        },
        body: JSON.stringify({
            workshop_uuid: workshop.uuid,
            user_uuid: state.current_user_info.uuid,
        }),
    });

    if (response.status === 201) {
        alert("You've been signed into the workshop!");
        setPage("sign-in");
    } else {
        const json = await response.json();
        alert("Failed to sign into the workshop: " + json.detail);
    }
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

async function fetchWorkshopsAdmin() {
    const response = await fetch(`${API}/workshops/get_workshops`,
        {
            headers: {
                "Content-Type": "application/json",
                "api-key": api_key,
            },
        }
    );

    if (response.status == 200) {
        const workshops = await response.json();

        state.workshops = workshops;
    }
}


function repeatContent(el, till) {
    let html = el.innerHTML;
    let counter = 0; // prevents infinite loop
  
    while (el.offsetWidth < till && counter < 50) {
      el.innerHTML += html;
      counter += 1;
    }
  }
  
function setupScroller() {
    let outer = document.querySelector("#workshop-outer");
    let content = outer.querySelector('#workshop-loop-content');

    repeatContent(content, outer.offsetWidth);

    let el = outer.querySelector('#workshop-loop');
    el.innerHTML = el.innerHTML + el.innerHTML;
}

authenticate();