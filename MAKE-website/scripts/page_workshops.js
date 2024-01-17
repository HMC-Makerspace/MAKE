async function fetchWorkshops() {
    let uuid = "anon";

    if (state.user_object !== null) {
        uuid = state.user_object.uuid;
    }

    const response = await fetch(`${API}/workshops/get_workshops_for_user/${uuid}`);

    if (response.status == 200) {
        const workshops = await response.json();

        state.workshops = workshops;

        renderWorkshops();
    }
}

function renderWorkshops() {
    const upcoming_workshops = document.getElementById("upcoming-workshops");
    const previous_workshops = document.getElementById("previous-workshops");

    removeAllChildren(upcoming_workshops);
    removeAllChildren(previous_workshops);

    const now = new Date();

    let sorted_workshops = state.workshops.sort((a, b) => {
        return b.timestamp_start - a.timestamp_start;
    });

    sorted_workshops.reverse();

    for (let workshop of sorted_workshops) {
        // if the workshop has past, append it to another element
        // However, add a 24 hour buffer to the date, so that workshops that are
        // scheduled for the same day as the current date will still be shown
        // as upcoming
        const parsed_date = new Date(workshop.timestamp_start * 1000);

        // Add 24 hours to the date
        parsed_date.setDate(parsed_date.getDate() + 1);

        if (parsed_date < now) {
            previous_workshops.prepend(generateWorkshopDiv(workshop, true));
        } else {
            upcoming_workshops.appendChild(generateWorkshopDiv(workshop));
        }
    }

    // If there are no upcoming workshops, display a message
    if (upcoming_workshops.children.length == 0) {
        const no_workshops = document.createElement("p");
        no_workshops.innerText = "No upcoming workshops!";
        upcoming_workshops.appendChild(no_workshops);
    }
}

function generateWorkshopDiv(workshop, is_past=false) {
    // Has fields of title, date, time, instructor, description, and signup link
    const div = document.createElement("div");
    div.classList.add("workshop");

    const title = document.createElement("h2");
    title.innerText = workshop.title;
    title.classList.add("title");
    div.appendChild(title);

    const date = document.createElement("p");
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
    div.appendChild(date);

    const instructor = document.createElement("p");
    instructor.innerHTML = `<b>Taught by:</b> <i>${workshop.instructors}</i>`;
    instructor.classList.add("instructor");
    div.appendChild(instructor);

    const description = document.createElement("p");
    description.innerHTML = `${workshop.description}`;
    description.classList.add("description");
    div.appendChild(description);

    const capacity = document.createElement("p");
    capacity.innerHTML = `<b>Capacity: ${workshop.capacity} slots`;
    console.log(workshop);

    if (workshop.position !== undefined && workshop.signups !== undefined) {
        capacity.innerHTML = `<b>Signups: ${workshop.signups} / ${workshop.capacity} slots`;

        if (workshop.position !== -1) {
            capacity.innerHTML += `<br> <b>Position:</b> ${workshop.position + 1}`;
        }
    }

    // Add rsvp list button if rsvp_list exists
    if (workshop.rsvp_list) {
        const rsvp_list = document.createElement("button");
        rsvp_list.classList.add("rsvp-list");
        rsvp_list.innerText = "View RSVP List";

        rsvp_list.onclick = () => {
            showRSVPList(workshop.uuid);
        };

        capacity.appendChild(rsvp_list);
    }
    
    capacity.classList.add("capacity");
    div.appendChild(capacity);

    const required_quizzes = document.createElement("p");
    required_quizzes.innerHTML = `<b>Required Quizzes:</b> ${workshop.required_quizzes.join(", ")}`;
    required_quizzes.classList.add("required-quizzes");
    div.appendChild(required_quizzes);

    if (!is_past) {
        // Add signup button
        const signup = document.createElement("button");
        signup.classList.add("big");
        signup.classList.add("signup");
        signup.id =`signup-${workshop.uuid}`

        if (workshop.position === -1) {
            signup.innerText = "RSVP";
            signup.addEventListener("click", () => {
                rsvpToWorkshop(workshop.uuid);
            });
        } else {
            signup.innerText = "Cancel RSVP";
            signup.addEventListener("click", () => {
                cancelRsvpToWorkshop(workshop.uuid);
            });
        }

        div.appendChild(signup);
    } else {
        const signup = document.createElement("h3");
        signup.classList.add("signup");
        signup.innerText = "This workshop has passed.";
        div.appendChild(signup);
    }

    return div;
}

async function rsvpToWorkshop(workshop_uuid) {
    if (state.user_object === null) {
        alert("You must be logged in to RSVP to a workshop!");
        return;
    }

    const signup_button = document.getElementById(`signup-${workshop_uuid}`);
    signup_button.setAttribute("disabled", "disabled");

    const response = await fetch(`${API}/workshops/rsvp_to_workshop`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                workshop_uuid: workshop_uuid,
                user_uuid: state.user_object.uuid
            })
        }
    );

    signup_button.removeAttribute("disabled");

    if (response.status == 201) {
        await fetchWorkshops();
    } else {
        const error = await response.json();
        alert("Error: " + error.detail);
    }
}

async function cancelRsvpToWorkshop(workshop_uuid) {
    const response = await fetch(`${API}/workshops/cancel_rsvp_to_workshop`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                workshop_uuid: workshop_uuid,
                user_uuid: state.user_object.uuid
            })
        }
    );

    if (response.status == 201) {
        await fetchWorkshops();
    }
}

async function showRSVPList(workshop_uuid) {
    const workshop = state.workshops.find((workshop) => workshop.uuid == workshop_uuid);

    const el = document.getElementById("rsvp-list-details");

    removeAllChildren(el);
    
    let header = document.createElement("tr");
    header.innerHTML = `<th>Name</th><th>Email</th>`;
    el.appendChild(header);

    showPopup("rsvp-list");

    for (let user_uuid of workshop.rsvp_list) {
        let request = await fetch(`${API}/users/get_user/${user_uuid}`);

        if (request.status == 200) {
            let user = await request.json();

            let user_el = document.createElement("tr");

            let name_el = document.createElement("td");
            name_el.innerText = user.name;
            user_el.appendChild(name_el);

            let email_el = document.createElement("td");
            email_el.innerText = user.email;
            user_el.appendChild(email_el);

            el.appendChild(user_el);
        }
    }
}

async function signupForMailingList() {
    /*
    <div id="mc_embed_shell">
    <div id="mc_embed_signup">
        <form action="https://hmc.us21.list-manage.com/subscribe/post?u=68887a68081c3fca3f7e8bc07&amp;id=e616cca7f1&amp;f_id=004de0e6f0" method="post" id="mc-embedded-subscribe-form" name="mc-embedded-subscribe-form" class="validate" target="_self" novalidate="">
            <div id="mc_embed_signup_scroll"><h2>Subscribe</h2>
                <div class="indicates-required"><span class="asterisk">*</span> indicates required</div>
                <div class="mc-field-group"><label for="mce-EMAIL">Email Address <span class="asterisk">*</span></label><input type="email" name="EMAIL" class="required email" id="mce-EMAIL" required="" value=""></div>
    <div hidden=""><input type="hidden" name="tags" value="2962934"></div>
            <div id="mce-responses" class="clear">
                <div class="response" id="mce-error-response" style="display: none;"></div>
                <div class="response" id="mce-success-response" style="display: none;"></div>
            </div><div style="position: absolute; left: -5000px;" aria-hidden="true"><input type="text" name="b_68887a68081c3fca3f7e8bc07_e616cca7f1" tabindex="-1" value=""></div><div class="clear"><input type="submit" name="subscribe" id="mc-embedded-subscribe" class="button" value="Subscribe"></div>
        </div>
    </form>
    </div>
    </div>
    */

    // Get email
    const email = document.getElementById("mailing-list-email").value;

    // Send request using the post and formdata from above to the mailing list
    const request = await fetch(`${API}/workshops/subscribe`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: email
        })
    });

    if (request.status == 201) {
        alert("Successfully subscribed to mailing list!");
    } else {
        const error = await request.json();
        alert("Error: " + error.detail);
    }
}