async function fetchWorkshops() {
    const response = await fetch(`${API}/workshops`);
    if (response.status == 200) {
        const workshops = await response.json();
        
        state.workshops = workshops.workshops;

        renderWorkshops();
    }
}

function renderWorkshops() {
    const upcoming_workshops = document.getElementById("upcoming-workshops");
    const previous_workshops = document.getElementById("previous-workshops");

    const now = new Date();

    for (let workshop of state.workshops) {
        // if the workshop has past, append it to another element
        // However, add a 24 hour buffer to the date, so that workshops that are
        // scheduled for the same day as the current date will still be shown
        // as upcoming
        const parsed_date = new Date(workshop.date);

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

    // Add h2 headers to each section
    const upcoming_header = document.createElement("h2");
    upcoming_header.innerText = "Upcoming Workshops";
    upcoming_workshops.prepend(upcoming_header);

    const previous_header = document.createElement("h2");
    previous_header.innerText = "Previous Workshops";
    previous_workshops.prepend(previous_header);
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
    date.innerText = `${workshop.date} @ ${workshop.time != "" ? workshop.time : "TBD"}`;
    date.classList.add("date");
    div.appendChild(date);

    const instructor = document.createElement("p");
    instructor.innerHTML = `<b>Taught by:</b> <i>${workshop.instructor}</i>`;
    instructor.classList.add("instructor");
    div.appendChild(instructor);

    const description = document.createElement("p");
    description.innerHTML = `<b>Learning Outcome:</b> ${workshop.description}`;
    description.classList.add("description");
    div.appendChild(description);

    const slots_available = document.createElement("p");
    slots_available.innerHTML = `<b>Capacity:</b> ${workshop.slots_available}`;
    slots_available.classList.add("capacity");
    div.appendChild(slots_available);

    if (!is_past) {
        // Create add to calendar buttons
        const calendar_buttons = document.createElement("div");
        calendar_buttons.classList.add("calendar-buttons");
        
        const google_button = document.createElement("button");
        google_button.classList.add("calendar-button");
        google_button.classList.add("google");
        google_button.innerText = "Add to gCal";
        google_button.onclick = () => {
            openInNewTab(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${workshop.title}&dates=${workshop.date}T${workshop.time.replace(":", "")}00Z/${workshop.date}T${workshop.time.replace(":", "")}00Z&details=${workshop.description}&location=Makerspace&sf=true&output=xml`);
        };

        calendar_buttons.appendChild(google_button);

        const ics_button = document.createElement("button");
        ics_button.classList.add("calendar-button");
        ics_button.classList.add("ics");
        ics_button.innerText = "Add to iCal";
        ics_button.onclick = () => {
            openInNewTab(`data:text/calendar;charset=utf8,${encodeURIComponent(`BEGIN:VCALENDAR
            VERSION:2.0
            BEGIN:VEVENT
            URL:${window.location.href}
            DTSTART:${workshop.date}T${workshop.time.replace(":", "")}00Z
            DTEND:${workshop.date}T${workshop.time.replace(":", "")}00Z
            SUMMARY:${workshop.title}
            DESCRIPTION:${workshop.description}
            LOCATION:Makerspace
            END:VEVENT
            END:VCALENDAR`)}`);
        };

        calendar_buttons.appendChild(ics_button);

        div.appendChild(calendar_buttons);
    } else {
        const signup = document.createElement("h3");
        signup.classList.add("signup");
        signup.innerText = "This workshop has passed.";
        div.appendChild(signup);
    }

    return div;
}