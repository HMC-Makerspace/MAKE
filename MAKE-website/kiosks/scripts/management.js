var state = {
    users: null,
    student_storage: null,
    workshops: null,
    shifts: null,
    shift_changes: null,
    inventory: null,
    restock_requests: null,
    quiz_ids: null,
    quiz_results: null,
    checkouts: null,
    redirects: null,
    api_keys: null,
    all_api_key_scopes: null,
    certifications: null,
};

var shifts_updated = false;
var photo_queue = [];

var charts = {
    daily_checkout_trends: null,
    checkout_items: null,
    checkout_heatmap: null,
    checkouts_by_user_role: null,
    users_by_college: null,
    passed_quizzes: null,
    user_engagement: null,
};

const DINNER_START = 17;
const DINNER_END = 19;

const TRAINING_TIMES = [
    {
        "day": 5,
        "start": 10,
        "end": 12,
    },
    {
        "day": 5,
        "start": 16,
        "end": 18,
    }
]

const SCORES_MIN = 1;
const SCORES_MAX = 5;
const SCORES_KEY = [
    {
        name: "Core Values Alignment",
        info: [
            "Actively goes against several values",
            "Does not fit with many or all of the core values",
            "Fits with the vibe of the core values but not necessarily mentions them",
            "Mentions at least one core value- has clearly looked at the core values before",
            "Really leans into multiple of our core values and shows commitment to them",
        ]
    },
    {
        name: "Teaching Experience",
        info: [
            "Has examples in application of bad teaching",
            "Is uncomfortable teaching or has never taught other groups",
            "Has some experience with teaching but never taught technically",
            "Has experience teaching and some experience teaching technical skills",
            "Has significant experience teaching technical skills",
        ]
    },
    {
        name: "Excitement for the Makerspace",
        info: [
            "Shows a clear lack of enthusiasm for the Makerspace",
            "Hasn't been to the Makerspace before, and seems unaware of what we do",
            "Fairly aware of what we do, has been to the Makerspace",
            "Clearly excited about the Makerspace, has been to the Makerspace",
            "Cares about what we have to offer and has many ideas for how to improve the space",
        ]
    },
    {
        name: "Technical Background",
        info: [
            "Does not possess any notable technical skills that would be relevant to the Makerspace",
            "May have limited technical ability in one or two areas",
            "Technical experience in at least one technical field (3D Printing, Sewing, Welding, etc.)",
            "Has worked extensively with non relevant trades/arts and/or with one or more machines in the Makerspace",
            "Robust technical experience in multiple Makerspace-adjacent technical fields",
        ]
    },
    {
        name: "Passion for Making",
        info: [
            "Has never made anything or hates making things",
            "Has made very few things and does not actively pursue making",
            "Has considered making but does not actively pursue it",
            "Making is a significant part of their life. Has shown commitment to working through creative projects",
            "Outstanding passion for making. Promotes a spirit of making in their relationships / communities",
        ]
    }
]

const API = '/api/v2';

window.onpopstate = onHashChange;

document.documentElement.setAttribute('data-theme', 'dark');
localStorage.setItem("theme", "dark");

async function authenticate() {
    // Get api keys from url params
    const params = new URLSearchParams(window.location.search);

    api_key = params.get('api_key') ?? localStorage.getItem('admin_api_key');

    if (api_key === null) {
        alert("No API key provided.");
    }

    const page = params.get('p');

    // Remove api key from url, but keep the rest of the url
    window.history.replaceState({}, document.title, window.location.pathname);

    if (page !== null) {
        setPage(page);
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

        if (body.scopes.includes("admin")) {
            console.log("Authenticated as admin");
        } else {
            alert("API key does not have admin scope.");
        }
    } else {
        // If API key is invalid, alert the user and redirect to the home page.
        alert("Invalid API key.");
        window.location.href = "/";
    }

    // Fetch status
    const status_response = await fetch(`${API}/misc/status`,
        {
            headers: {
                "Content-Type": "application/json",
                "api-key": api_key,
            },
        }
    );

    if (status_response.status == 200) {
        const status = await status_response.json();

        document.getElementById("update-motd").value = status.motd;
        document.getElementById("update-is_open").checked = status.is_open;
        document.getElementById("update-stewards_on_duty").checked = status.stewards_on_duty;
    }

    // Save api key to local storage
    localStorage.setItem('admin_api_key', api_key);

    // Register esc to close popup
    document.addEventListener("keyup", (e) => {
        if (e.key === "Escape") {
            closePopup();
        }
    });

    setInterval(fetchUsers, 5000);

    const promises = [
        // While the management page isn't the inventory editor kiosk,
        // we're only using inventory for statistics, so fetching using
        // the standard inventory editor route is fine. 
        fetchInventory(kiosk_mode = "inventory_editor"),
        fetchUsers(),
        fetchQuizIDs(),
        fetchQuizResults(),
        fetchShiftsAdmin(),
        fetchShiftChangesAdmin(),
        fetchWorkshopsAdmin(),
        fetchRestockRequests(),
        fetchCheckoutsAdmin(),
        fetchRedirectsAdmin(),
        fetchCertifications(),
        fetchAPIKeysAdmin(),
        fetchAllAPIKeyScopesAdmin(),
    ];

    await Promise.all(promises);

    setInterval(renderAll(), 5000);
    renderAll();

    for (let key of Object.keys(state.users)) {
        state.users[key].cx_id_str = `${state.users[key].cx_id}`;
    }

    submitUserSearch(editable = true);

}

authenticate();

async function updateStatus() {
    const motd = document.getElementById("update-motd").value;
    const is_open = document.getElementById("update-is_open").checked;
    const stewards_on_duty = document.getElementById("update-stewards_on_duty").checked;

    const response = await fetch(`${API}/misc/update_status`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api-key": api_key,
            },
            body: JSON.stringify({ motd: motd, is_open: is_open, stewards_on_duty: stewards_on_duty }),
        }
    );

    if (response.status == 201) {
        alert("Status updated.");
    } else {
        alert("Error updating status.");
    }

}

async function fetchRedirectsAdmin() {
    const response = await fetch(`${API}/misc/get_redirects`,
        {
            headers: {
                "Content-Type": "application/json",
                "api-key": api_key,
            },
        }
    );

    if (response.status == 200) {
        const redirects = await response.json();

        state.redirects = redirects;
    }
}

async function fetchAPIKeysAdmin() {
    const response = await fetch(`${API}/misc/get_api_keys`,
        {
            headers: {
                "Content-Type": "application/json",
                "api-key": api_key,
            },
        }
    );

    if (response.status == 200) {
        const api_keys = await response.json();
        state.api_keys = api_keys;
    }
}

async function fetchAllAPIKeyScopesAdmin() {
    const response = await fetch(`${API}/misc/get_all_api_key_scopes`,
        {
            headers: {
                "Content-Type": "application/json",
                "api-key": api_key,
            },
        }
    );

    if (response.status == 200) {
        const all_api_key_scopes = await response.json();
        state.all_api_key_scopes = all_api_key_scopes;
    }
}

async function fetchCheckoutsAdmin() {
    const response = await fetch(`${API}/checkouts/get_checkouts`,
        {
            method: 'GET',
            headers: {
                'api-key': api_key
            }
        }
    );
    const checkouts = await response.json();

    if (checkouts === null) {
        return null;
    }

    state.checkouts = checkouts;
}

async function fetchQuizIDs() {
    const response = await fetch(`${API}/misc/get_quiz_ids`,
        {
            headers: {
                "Content-Type": "application/json",
            },
        }
    );

    if (response.status == 200) {
        const quiz_ids = await response.json();

        state.quiz_ids = quiz_ids;
    }
}

async function fetchQuizResults() {
    const response = await fetch(`${API}/misc/get_quiz_results`,
        {
            headers: {
                "Content-Type": "application/json",
                "api-key": api_key,
            },
        }
    );

    if (response.status == 200) {
        const quiz_results = await response.json();

        state.quiz_results = quiz_results;
    }
}

async function fetchShiftsAdmin() {
    const response = await fetch(`${API}/shifts/get_full_shift_schedule`,
        {
            headers: {
                "Content-Type": "application/json",
                "api-key": api_key,
            },
        }
    );

    if (response.status == 200) {
        const shifts = await response.json();
        state.shifts = shifts;
        // Enable the download shifts button.
        const downloadButton = document.getElementById("download-schedule-button");
        downloadButton.removeAttribute("disabled");
    }
}

async function fetchShiftChangesAdmin() {
    const response = await fetch(`${API}/shifts/get_shift_changes`,
        {
            headers: {
                "Content-Type": "application/json",
                "api-key": api_key,
            },
        }
    );

    if (response.status == 200) {
        const changes = await response.json();

        state.shift_changes = changes;
    }
}

/*
// DEPRECATED
async function fetchStudentStorageAdmin() {
    const response = await fetch(`${API}/student_storage/get_student_storage`,
        {
            headers: {
                "Content-Type": "application/json",
                "api-key": api_key,
            },
        }
    );

    if (response.status == 200) {
        const student_storage = await response.json();

        state.student_storage = student_storage;
    }
}
*/

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

async function fetchRestockRequests() {
    const response = await fetch(`${API}/inventory/get_restock_requests`,
        {
            headers: {
                "Content-Type": "application/json",
                "api-key": api_key,
            },
        }
    );

    if (response.status == 200) {
        const requests = await response.json();

        state.restock_requests = requests;
    }
}

function renderAll() {
    renderScheduleAdmin();
    renderProficiencies();
    renderWorkshopsAdmin();
    renderRestockRequests();
    renderAvailability();
    renderRedirects();
    renderAPIKeys();
    renderApplicants();
    renderCertificationsAdmin();

    // Stats take a while to load, so we'll render them last
    renderStatistics();
}

function renderCertificationsAdmin() {
    const certifications_table = document.getElementById("certifications-table");
    removeAllChildren(certifications_table);

    const cert_header = "<tr><th>Name</th><th>Description</th><th>Valid For</th><th># Certified</th><th>Edit</th><th>Delete</th></tr>";
    certifications_table.innerHTML = cert_header;

    const certs = []

    for (let cert of state.certifications) {
        let row = document.createElement("tr");

        let name = document.createElement("td");
        name.innerText = cert.name;
        row.appendChild(name);

        let description = document.createElement("td");
        description.innerText = cert.description;
        row.appendChild(description);

        let valid_for = document.createElement("td");
        if (cert.seconds_valid_for >= 365 * 24 * 60 * 60) {
            valid_for.innerText = `${cert.seconds_valid_for / (60 * 60 * 24 * 365)} years`;
        } else {
            valid_for.innerText = `${cert.seconds_valid_for / (60 * 60 * 24)} days`;
        }
        row.appendChild(valid_for);


        let count = document.createElement("td");
        let count_num = 0;
        for (let user of state.users) {
            if (user.certifications) {
                if (Object.keys(user.certifications).includes(cert.uuid)) {
                    count_num++;
                }
            }
        }

        count.innerText = count_num;
        row.appendChild(count);

        let edit_button = document.createElement("td");
        edit_button.classList.add("table-btn");
        let edit_button_button = document.createElement("button");
        edit_button_button.innerHTML = "<span class='material-symbols-outlined'>tune</span>";
        edit_button_button.onclick = () => {
            showCreateEditCertification(cert.uuid);
        };
        edit_button.appendChild(edit_button_button);

        row.appendChild(edit_button);

        let delete_button = document.createElement("td");
        delete_button.classList.add("table-btn");
        delete_button.classList.add("delete");
        let delete_button_button = document.createElement("button");
        delete_button_button.innerHTML = "<span class='material-symbols-outlined'>delete</span>";

        delete_button_button.onclick = () => {
            deleteCertification(cert.uuid);
        };
        delete_button.appendChild(delete_button_button);

        row.appendChild(delete_button);

        certs.push(row);
    }

    appendChildren(certifications_table, certs);
}

function showCreateEditCertification(uuid = null) {
    let cert = null;

    if (uuid !== null) {
        cert = state.certifications.find(cert => cert.uuid === uuid);
    } else {
        cert = {
            uuid: self.crypto.randomUUID(),
            name: "",
            description: "",
            seconds_valid_for: 60 * 60 * 24 * 365,
        };
    }

    document.getElementById("create-edit-certification-name").value = cert.name;
    document.getElementById("create-edit-certification-description").value = cert.description;
    const valid_for_selection = document.getElementById('create-edit-certification-valid-for');

    for (let i = 0; i < valid_for_selection.options.length; i++) {
        if (Number(valid_for_selection.options[i].value) == cert.seconds_valid_for / (60 * 60 * 24)) {
            valid_for_selection.selectedIndex = i;
            break;
        }
    }

    document.getElementById("create-edit-certification-save").onclick = () => {
        saveCertification(cert.uuid);
    };

    showPopup("create-edit-certification");
}

async function saveCertification(uuid) {
    let name = document.getElementById("create-edit-certification-name").value;

    let description = document.getElementById("create-edit-certification-description").value;

    let seconds_valid_for = Number(document.getElementById("create-edit-certification-valid-for").value) * 60 * 60 * 24;

    let request = {
        uuid: uuid,
        name: name,
        description: description,
        seconds_valid_for: seconds_valid_for,
    };

    let response = await fetch(`${API}/certifications/certification`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api-key": api_key,
            },
            body: JSON.stringify(request),
        }
    );

    if (response.status == 201) {
        await fetchCertifications();
        renderCertificationsAdmin();
    } else {
        const body = await response.json();
        alert("Error saving certification: " + response.status + "\n" + body.detail);
    }

    closePopup();
}

async function deleteCertification(uuid) {
    let result = prompt("Are you sure you want to delete this certification? Type 'delete' to confirm.");

    if (result === "delete") {
        const response = await fetch(`${API}/certifications/certification`,
            {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "api-key": api_key,
                },
                body: JSON.stringify({ uuid: uuid }),
            }
        );

        if (response.status == 204) {
            await fetchCertifications();
            renderCertificationsAdmin();
        } else {
            const body = await response.json();
            alert("Error deleting certification: " + response.status + "\n" + body.detail);
        }
    }
}


function renderApplicants() {
    // Load the applicants state from localstorage
    let reviews = JSON.parse(localStorage.getItem("reviews")) ?? [];

    const el = document.getElementById("previous-reviews");
    removeAllChildren(el);

    reviews.reverse();

    /* Reviews is a list of objects with the following structure:
    {
        name: "Fall 2024",
        reviewer: "Ethan Vazquez",
        csv_file: text of csv file,
        scores_key: ["Core Values Alignment", "Teaching Experience", etc],
        scores_min: 1,
        scores_max: 5,
        applications: [
            {
                timestamp: "3/23/2024 21:48:06",
                scores: [5, 4, etc]
            }
        ]
    }

    The following code will just render reviews in a grid,
    with a buttons to continue, download, and delete the review.
    */
    for (let review of reviews) {
        const reviewDiv = document.createElement("div");
        reviewDiv.classList.add("previous-review");

        const title = document.createElement("h3");
        title.innerText = review.name;
        reviewDiv.appendChild(title);

        const reviewer = document.createElement("p");
        reviewer.innerText = `Reviewed by ${review.reviewer}`;
        reviewDiv.appendChild(reviewer);

        const buttons = document.createElement("div");
        buttons.classList.add("review-buttons");

        const continueButton = document.createElement("button");
        continueButton.className = "with-icon";
        continueButton.innerHTML = "<span class='material-symbols-outlined'>arrow_forward</span>Continue";
        continueButton.onclick = () => continueReview(review);
        buttons.appendChild(continueButton);

        const downloadButton = document.createElement("button");
        downloadButton.className = "only-icon";
        downloadButton.innerHTML = "<span class='material-symbols-outlined'>download</span>";
        downloadButton.onclick = () => downloadReview(review);
        buttons.appendChild(downloadButton);

        const deleteButton = document.createElement("button");
        deleteButton.className = "only-icon";
        deleteButton.innerHTML = "<span class='material-symbols-outlined'>delete</span>";
        deleteButton.onclick = () => deleteReview(review);
        buttons.appendChild(deleteButton);

        reviewDiv.appendChild(buttons);
        el.appendChild(reviewDiv);
    }
}

function deleteReview(review) {
    let result = prompt("Are you sure you want to delete this review? Type 'delete' to confirm.");

    if (result !== "delete") {
        return;
    }

    let reviews = JSON.parse(localStorage.getItem("reviews"));

    for (let i = 0; i < reviews.length; i++) {
        if (reviews[i].uuid === review.uuid) {
            reviews.splice(i, 1);
            break;
        }
    }

    localStorage.setItem("reviews", JSON.stringify(reviews));
    renderApplicants();
}

function downloadReview(review) {
    // Create a csv file from the review, with columns for timestamps and scores
    let csv = "Timestamp," + SCORES_KEY.map(score => `"${score.name}"`).join(",") + "\n";

    for (let app of review.applications) {
        let average = app.scores.reduce((a, b) => Number(a) + Number(b), 0) / app.scores.length;
        csv += `"${app.timestamp}",${app.scores.join(",")},${average}\n`;
    }

    // Create a blob and download it
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `${review.name} - ${review.reviewer}.csv`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

async function downloadSchedule() {
    const downloadButton = document.getElementById("download-schedule-button");
    downloadButton.setAttribute("disabled", "disabled");

    const validShifts = state.shifts.filter(shift => shift.stewards && shift.stewards.length > 0)

    for (let shift of validShifts) {
        for (let i = 0; i < shift.stewards.length; i++) {
            shift.stewards[i] = state.users.find(user => user.uuid === shift.stewards[i]).name
        }
    }

    const hours = validShifts.map(shift => moment(shift.timestamp_start.split("-")[0], 'h:mm A').hour())
    const uniqueHours = [...new Set(hours)].sort()
    const now = moment();

    let hoursToIndex = {};
    uniqueHours.forEach((hour, index) => {
        hoursToIndex[hour] = index + 1;
    })

    let csvArray = [[" "].concat(DAYS)];

    for (let i = 1; i < uniqueHours.length + 1; i++) {
        csvArray[i] = [];
        for (let j = 0; j < 8; j++) {
            if (j == 0) {
                csvArray[i][j] = TWENTY_FOUR_HOURS_TO_STRING[uniqueHours[i - 1]]
            } else {
                csvArray[i][j] = "";
            }
        }
    }
    for (let shift of validShifts) {
        csvArray[hoursToIndex[moment(shift.timestamp_start.split("-")[0], 'h:mm A').hour()]][DAYS_TO_INDEX[shift.day]+1] = shift.stewards.join(" | ")
    }

    const csv = csvArray.map(row =>
        row.map(item => `${item}`).join(',')
    ).join('\n');

    // Create a blob and download it
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shift-schedule-${now.format('MM-DD-YYYY')}.csv`;
    document.body.appendChild(a);

    downloadButton.removeAttribute("disabled");

    a.click();
    document.body.removeChild(a);
}

function setApplicantPage(page) {
    renderApplicants();

    const pages = document.getElementById("page-applicants").getElementsByClassName("content-body");
    for (let p of pages) {
        p.classList.add("hidden");
    }

    document.getElementById(page).classList.remove("hidden");
}

function startNewReview() {
    setApplicantPage("applicant-new-review");
}

function uploadNewReview(event) {
    const file = event.target.files[0];

    // Use papaparse to parse the csv file
    Papa.parse(file, {
        header: true,
        complete: function (results) {
            // Save the results to localstorage
            localStorage.setItem("temp", JSON.stringify(results));

            let header = results.meta.fields;
            // Set the select with id "new-review-timestamp" to have the options in the header
            let timestamp_select = document.getElementById("new-review-timestamp");
            let returning_select = document.getElementById("new-review-returning");
            let questions_multiple_div = document.getElementById("new-review-questions");

            removeAllChildren(timestamp_select);
            removeAllChildren(returning_select);
            removeAllChildren(questions_multiple_div);

            for (let i = 0; i < header.length; i++) {
                let option = document.createElement("option");
                option.value = header[i];
                option.innerText = header[i].substring(0, 30) + (header[i].length > 30 ? "..." : "");
                timestamp_select.appendChild(option.cloneNode(true));
                returning_select.appendChild(option.cloneNode(true));

                let question_option = document.createElement("input");
                question_option.type = "checkbox";
                question_option.id = `question-${i}`;
                question_option.value = header[i];
                let label = document.createElement("label");
                label.htmlFor = `question-${i}`;
                label.innerText = header[i].substring(0, 30) + (header[i].length > 30 ? "..." : "");
                label.prepend(question_option);
                questions_multiple_div.appendChild(label);
            }

        }
    });
}

function startReview() {
    let timestamp_select = document.getElementById("new-review-timestamp");
    let returning_select = document.getElementById("new-review-returning");
    let questions_multiple_div = document.getElementById("new-review-questions");

    let timestamp_index = timestamp_select.value;
    let returning_index = returning_select.value;

    let questions = [];
    for (let question of questions_multiple_div.getElementsByTagName("input")) {
        if (question.checked) {
            questions.push(question.value);
        }
    }

    let reviews = JSON.parse(localStorage.getItem("reviews")) ?? [];

    let unscored_apps = [];
    let empty_score_list = [];

    for (let question of questions_multiple_div.getElementsByTagName("input")) {
        empty_score_list.push(null);
    }

    for (let app of JSON.parse(localStorage.getItem("temp")).data) {
        let application = {
            timestamp: app[timestamp_index],
            scores: empty_score_list,
        }

        unscored_apps.push(application);
    }

    let review = {
        uuid: self.crypto.randomUUID(),
        name: document.getElementById("new-review-name").value,
        reviewer: document.getElementById("new-review-reviewer").value,
        csv_file: JSON.parse(localStorage.getItem("temp")),
        timestamp: timestamp_index,
        returning: returning_index,
        questions: questions,
        scores_key: SCORES_KEY,
        scores_min: SCORES_MIN,
        scores_max: SCORES_MAX,
        resume_index: 0,
        applications: unscored_apps,
    };

    reviews.push(review);
    localStorage.setItem("reviews", JSON.stringify(reviews));

    continueReview(review);
}

function continueReview(review, applicant_index = null) {
    if (applicant_index === null) {
        applicant_index = review.resume_index;
    } else {
        review.resume_index = applicant_index;
    }

    setApplicantPage("applicant-continue-review");

    // Only review applications that answered "No" to the returning question
    let to_review = review.csv_file.data.filter(app => app[review.returning] === "No");


    document.getElementById("continue-review-name").innerText = review.name;
    document.getElementById("continue-review-progress").innerText = `${applicant_index + 1} / ${to_review.length}`;

    const questions_el = document.getElementById("continue-review-questions");
    removeAllChildren(questions_el);

    for (let question of review.questions) {
        let question_div = document.createElement("div");
        question_div.classList.add("question");
        question_div.innerText = question;

        let response_div = document.createElement("div");
        response_div.classList.add("response");
        let response_text = to_review[applicant_index][question];
        // Replace urls
        response_text = replaceLinksWithA(response_text);

        response_div.innerHTML = `${response_text}`;

        questions_el.appendChild(question_div);
        questions_el.appendChild(response_div);
    }

    // Now that we've rendered the questions, we need to render the scoring system
    const scores_el = document.getElementById("continue-review-scoring");
    removeAllChildren(scores_el);

    for (let i = 0; i < SCORES_KEY.length; i++) {
        let score_div = document.createElement("div");
        score_div.classList.add("score");

        let score_name = document.createElement("h3");
        score_name.innerText = SCORES_KEY[i].name;
        score_div.appendChild(score_name);

        let score_info = document.createElement("p");
        score_info.innerText = SCORES_KEY[i].info[0];
        score_div.appendChild(score_info);

        let score_slider = document.createElement("input");
        score_slider.type = "range";
        score_slider.min = SCORES_MIN;
        score_slider.max = SCORES_MAX;
        score_slider.value = review.applications[applicant_index].scores[i] ?? SCORES_MIN;
        score_slider.oninput = () => {
            score_info.innerText = SCORES_KEY[i].info[score_slider.value - SCORES_MIN];
            saveReview(review, applicant_index);
        };
        score_div.appendChild(score_slider);

        scores_el.appendChild(score_div);
    }

    // Make the review-back and review-next buttons work
    const buttons_divs = document.getElementsByClassName("continue-review-buttons");

    for (let div of buttons_divs) {
        const buttons = div.getElementsByTagName("button");
        buttons[0].onclick = () => {
            if (applicant_index > 0) {
                continueReview(saveReview(review, applicant_index - 1), applicant_index - 1);
            }
        }
        buttons[1].onclick = () => {
            if (applicant_index < to_review.length - 1) {

                continueReview(saveReview(review, applicant_index + 1), applicant_index + 1);
            }
        }
    }
}

function saveReview(review, applicant_index) {
    let scores = [];
    for (let score of document.getElementById("continue-review-scoring").getElementsByTagName("input")) {
        scores.push(score.value);
    }

    review.applications[review.resume_index].scores = scores;
    review.resume_index = applicant_index;

    let reviews = JSON.parse(localStorage.getItem("reviews"));

    for (let i = 0; i < reviews.length; i++) {
        if (reviews[i].uuid === review.uuid) {
            reviews[i] = review;
            break;
        }
    }

    localStorage.setItem("reviews", JSON.stringify(reviews));

    return review;
}

function renderRedirects() {
    const redirects_table = document.getElementById("redirects-table");

    const header = "<tr><th>From</th><th>To</th><th>Clicks</th><th>Edit</th><th>Delete</th></tr>"
    redirects_table.innerHTML = header;

    for (let redirect of state.redirects) {
        let row = document.createElement("tr");

        let from = document.createElement("td");
        from.innerHTML = `make.hmc.edu/<b>${redirect.path}</b>`;
        row.appendChild(from);

        let to = document.createElement("td");
        to.innerText = redirect.redirect;
        row.appendChild(to);

        let clicks = document.createElement("td");
        clicks.innerText = redirect.logs.length;
        row.appendChild(clicks);

        let edit_button = document.createElement("td");
        let edit_button_button = document.createElement("button");
        edit_button_button.innerHTML = "<span class='material-symbols-outlined'>tune</span>";
        edit_button_button.onclick = () => {
            showCreateEditRedirect(redirect.uuid);
        };
        edit_button.appendChild(edit_button_button);
        row.appendChild(edit_button);

        let delete_button = document.createElement("td");
        let delete_button_button = document.createElement("button");
        delete_button_button.innerHTML = "<span class='material-symbols-outlined'>delete</span>";
        delete_button_button.classList.add("delete");
        delete_button_button.onclick = () => {
            deleteRedirect(redirect.uuid);
        };
        delete_button.appendChild(delete_button_button);
        row.appendChild(delete_button);

        redirects_table.appendChild(row);
    }
}


function showCreateEditRedirect(uuid = null) {
    let redirect = null;

    if (uuid !== null) {
        redirect = state.redirects.find(redirect => redirect.uuid === uuid);
    } else {
        redirect = {
            uuid: self.crypto.randomUUID(),
            path: "",
            redirect: "",
            logs: [],
        };
    }

    document.getElementById("create-edit-redirect-from").value = redirect.path;
    document.getElementById("create-edit-redirect-to").value = redirect.redirect;

    document.getElementById("create-edit-redirect-save").onclick = () => {
        saveRedirect(redirect.uuid);
    };

    showPopup("create-edit-redirect");
}

async function saveRedirect(uuid) {
    let path = document.getElementById("create-edit-redirect-from").value;
    let redirect = document.getElementById("create-edit-redirect-to").value;

    let request = {
        uuid: uuid,
        path: path,
        redirect: redirect,
        logs: [],
    };

    let response = await fetch(`${API}/misc/update_redirect`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api-key": api_key,
            },
            body: JSON.stringify(request),
        }
    );

    if (response.status == 201) {
        await fetchRedirectsAdmin();
        renderRedirects();
    } else {
        const body = await response.json();
        alert("Error saving redirect: " + response.status + "\n" + body.detail);
    }

    closePopup();
}

async function deleteRedirect(uuid) {
    let result = prompt("Are you sure you want to delete this redirect? Type 'delete' to confirm.");

    if (result === "delete") {
        const response = await fetch(`${API}/misc/delete_redirect`,
            {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "api-key": api_key,
                },
                body: JSON.stringify({ uuid: uuid }),
            }
        );

        if (response.status == 204) {
            await fetchRedirectsAdmin();
            renderRedirects();
        } else {
            const body = await response.json();
            alert("Error deleting redirect: " + response.status + "\n" + body.detail);
        }
    }
}



/*
API KEYS
*/
function renderAPIKeys() {
    const api_keys_table = document.getElementById("api-keys-table");
    removeAllChildren(api_keys_table);

    const table_body = document.createElement("tbody");

    const header = "<tr><th>Name</th><th>Key</th><th>Access</th><th>Edit</th><th>Delete</th></tr>"
    table_body.innerHTML = header;

    for (let api_key of state.api_keys) {
        let row = document.createElement("tr");

        let name = document.createElement("td");
        name.innerText = api_key.name;
        row.appendChild(name);

        // Create a span with the key, and a button to reveal it
        let key_td = document.createElement("td");
        key_td.classList.add("api-key-key-td");
        let key = document.createElement("span");
        key.innerHTML = "Click to reveal key";
        key.style.width = "100%";
        let reveal_key = document.createElement("button");
        reveal_key.innerHTML = "<span class='material-symbols-outlined'>visibility_off</span>";
        // Add a click event to reveal the key and change the button icon
        reveal_key.onclick = () => {
            if (key.innerText === "Click to reveal key") {
                reveal_key.innerHTML = "<span class='material-symbols-outlined'>visibility</span>";
                key.innerText = api_key.key;
            } else {
                reveal_key.innerHTML = "<span class='material-symbols-outlined'>visibility_off</span>";
                key.innerText = "Click to reveal key";
            }
        };
        key_td.appendChild(reveal_key);
        key_td.appendChild(key);


        row.appendChild(key_td);

        let scopes = document.createElement("td");
        scopes.innerText = api_key.scopes.join(", ");
        row.appendChild(scopes);


        let edit_button = document.createElement("td");
        edit_button.classList.add("table-btn");
        let edit_button_button = document.createElement("button");
        edit_button_button.innerHTML = "<span class='material-symbols-outlined'>tune</span>";
        edit_button_button.classList.add("edit-api-key");
        // Disable delete button if it's the current api key
        if (api_key.key == localStorage.getItem("admin_api_key")) {
            edit_button_button.classList.add("edit-api-key-disabled");
        } else {
            edit_button_button.onclick = () => {
                showCreateEditAPIKey(api_key.uuid);
            };
        }
        edit_button.appendChild(edit_button_button);
        row.appendChild(edit_button);

        let delete_button = document.createElement("td");
        delete_button.classList.add("table-btn");
        let delete_button_button = document.createElement("button");
        delete_button_button.innerHTML = "<span class='material-symbols-outlined'>delete</span>";
        delete_button_button.classList.add("delete", "delete-api-key");
        // Disable delete button if it's the current api key
        if (api_key.key == localStorage.getItem("admin_api_key")) {
            delete_button_button.classList.add("delete-api-key-disabled");
        } else {
            delete_button_button.onclick = () => {
                deleteAPIKey(api_key.uuid);
            };
        }
        delete_button.appendChild(delete_button_button);
        row.appendChild(delete_button);

        table_body.appendChild(row);
    }
    api_keys_table.appendChild(table_body);
}


function showCreateEditAPIKey(uuid = null) {
    console.log("Creating api key", uuid)
    let api_key = null;

    if (uuid !== null) {
        api_key = state.api_keys.find(api_key => api_key.uuid === uuid);
    } else {
        api_key = {
            uuid: self.crypto.randomUUID(),
            name: "",
            key: "",
            scopes: [],
        };
    }

    document.getElementById("create-edit-api-key-name").value = api_key.name;
    document.getElementById("create-edit-api-key-key").value = api_key.key;
    const scopes_div = document.getElementById("create-edit-api-key-scopes");
    removeAllChildren(scopes_div);
    for (let scope of state.all_api_key_scopes) {
        let parent = document.createElement("div");
        parent.classList.add("scope-checkbox");
        let checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `create-edit-api-key-scopes-${scope}`;
        checkbox.value = scope;
        checkbox.checked = api_key.scopes.includes(scope);
        let label = document.createElement("label");
        label.innerText = scope;
        parent.appendChild(checkbox);
        parent.appendChild(label);
        scopes_div.appendChild(parent);
    }

    document.getElementById("create-edit-api-key-save").onclick = () => {
        saveAPIKey(api_key.uuid);
    };



    showPopup("create-edit-api-key");
}

async function saveAPIKey(uuid) {
    const admin_api_key = localStorage.getItem("admin_api_key");

    const name = document.getElementById("create-edit-api-key-name").value;
    const key = document.getElementById("create-edit-api-key-key").value;
    const scopes = [];
    for (let kiosk of state.all_api_key_scopes) {
        if (document.getElementById(`create-edit-api-key-scopes-${kiosk}`).checked) {
            scopes.push(kiosk);
        }
    }

    let new_api_key = {
        uuid: uuid,
        name: name,
        key: key,
        scopes: scopes,
    };

    let response = await fetch(`${API}/misc/update_api_key`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api-key": admin_api_key,
            },
            body: JSON.stringify(new_api_key),
        }
    );


    if (response.status == 200) {
        await fetchAPIKeysAdmin();
        renderAPIKeys();
    } else {
        const body = await response.json();
        alert("Error saving API key: " + response.status + "\n" + body);
    }

    closePopup();
}

async function deleteAPIKey(uuid) {
    let result = prompt("Are you sure you want to delete this redirect? Type 'delete' to confirm.");

    if (result === "delete") {
        const admin_api_key = localStorage.getItem("admin_api_key");
        const response = await fetch(`${API}/misc/delete_api_key`,
            {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "api-key": admin_api_key,
                },
                body: JSON.stringify({ uuid: uuid }),
            }
        );


        if (response.status == 200) {
            await fetchAPIKeysAdmin();
            renderAPIKeys();
        } else {
            const body = await response.json();
            alert("Error deleting API key: " + response.status + "\n" + body);
        }
    }
}






function renderAvailability() {
    const availability_table = document.getElementById("steward-availability");
    const availability_table_list = document.getElementById("steward-availability-list");

    let schedule_divs = [];
    let list_divs = [];

    // Create header row
    const header = document.createElement("tr");
    header.innerHTML = "<th>Time</th>";

    for (let day of DAYS) {
        const day_header = document.createElement("th");
        day_header.innerText = day;
        header.appendChild(day_header);
    }

    schedule_divs.push(header);

    // Create list of stewards
    let header_list = document.createElement("tr");
    header_list.innerHTML = `<th>Name</th><th>CX ID</th><th>Email</th><th>Hours Available</th>`;
    list_divs.push(header_list);

    let stewards = state.users.filter(user => user.role == "steward" || user.role == "head_steward");
    // Sort by name
    stewards.sort((a, b) => a.name.localeCompare(b.name));

    for (let i = 11; i < 24; i++) {
        const row = document.createElement("tr");

        const time = document.createElement("th");
        time.innerText = formatHour(i);
        row.appendChild(time);

        for (let j = 0; j < 7; j++) {
            const cell = document.createElement("td");
            cell.classList.add("availability-cell");
            cell.id = `availability-cell-${j}-${i}`;

            let total_available = [];
            let total_filled_out = 0;

            for (let steward of stewards) {
                if (steward.availability === null) {
                    continue;
                }

                if (steward.availability[j][i]) {
                    total_available.push(steward);
                }

                total_filled_out++;
            }

            cell.innerText = `${total_available.length} / ${total_filled_out}`;


            if (total_available.length > 0) {
                cell.onclick = () => {
                    showAvailabilityPopup(j, i, total_available);
                }

                // If more then 1/3 of stewards are available, add "available"
                // If less then 1/3 and more than 1/4 of stewards are available, add "medium-available"
                // If less then 1/4 of stewards are available, add "low-available"

                if (total_available.length / total_filled_out > 1 / 3) {
                    cell.classList.add("available");
                } else if (total_available.length / total_filled_out > 1 / 4) {
                    cell.classList.add("medium-available");
                } else {
                    cell.classList.add("low-available");
                }
            }

            row.appendChild(cell);
        }

        schedule_divs.push(row);
    }

    removeAllChildren(availability_table);
    appendChildren(availability_table, schedule_divs);

    for (let steward of stewards) {
        const row = document.createElement("tr");

        let hours_available = 0;

        if (steward.availability !== null) {
            for (let day of steward.availability) {
                for (let hour of day) {
                    if (hour) {
                        hours_available++;
                    }
                }
            }
        }

        let hours_class = "";

        if (hours_available < 2) {
            hours_class = "not-enough-hours";
        } else if (hours_available < 6) {
            hours_class = "too-many-hours";
        } else {
            hours_class = "good-hours";
        }

        row.innerHTML = `<td>${steward.name}</td><td>${steward.cx_id}</td><td>${steward.email}</td><td class='${hours_class}'>${hours_available}</td>`;

        row.onmouseenter = () => {
            if (steward.availability === null) {
                return;
            }

            for (let day = 0; day < 7; day++) {
                for (let hour = 0; hour < 24; hour++) {
                    if (steward.availability[day][hour]) {
                        document.getElementById(`availability-cell-${day}-${hour}`).classList.add("highlight");
                    }
                }
            }
        };

        row.onmouseleave = () => {
            let divs = document.getElementsByClassName("availability-cell");

            for (let div of divs) {
                div.classList.remove("highlight");
            }
        };


        list_divs.push(row);
    }

    removeAllChildren(availability_table_list);
    appendChildren(availability_table_list, list_divs);

}

function showAvailabilityPopup(day, hour, available) {
    const time = document.getElementById("single-availability-popup-time");
    const steward_table = document.getElementById("single-availability-popup-stewards");

    time.innerText = `${DAYS[day]} ${formatHour(hour)}`;

    removeAllChildren(steward_table);
    // Add header
    const header = document.createElement("tr");
    header.innerHTML = `<th>Name</th><th>CX ID</th><th>Email</th>`;
    steward_table.appendChild(header);

    for (let steward of available) {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${steward.name}</td><td>${steward.cx_id}</td><td>${steward.email}</td>`;
        steward_table.appendChild(row);
    }

    showPopup("single-availability-popup");
}


function renderStatistics() {
    // Get the start and end dates for the statistics
    let start_date = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // Default to 90 days ago
    if (document.getElementById("statistics-date-range-start").value) {
        start_date = new Date(
            document.getElementById("statistics-date-range-start").value
        );
    } else {
        // Update the date input to reflect the default date
        document.getElementById("statistics-date-range-start").value = start_date.toISOString().split('T')[0];
    }

    let end_date = new Date(new Date()); // Default to today
    if (document.getElementById("statistics-date-range-end").value) {
        end_date = new Date(
            document.getElementById("statistics-date-range-end").value
        );
    } else {
        // Update the date input to reflect the default date
        document.getElementById("statistics-date-range-end").value = end_date.toISOString().split('T')[0];
    }

    // Generate daily counts of checkouts
    const dailyCounts = generateDailyCountsFromCheckouts(start_date, end_date);

    // Initialize an array to hold the number of checkouts per hour
    const checkoutCountsByHour = new Array(24).fill(0);
    // Initialize an object to hold the number of checkouts per item
    const checkoutCountsByItem = {};
    // Initialize an object to hold the number of checkouts per user role
    const roleCounts = {
        user: 0,
        steward: 0,
        head_steward: 0,
        admin: 0
    };
    //
    const checkoutCountsByUser = {};

    // Process each checkout to tally by hour, role, item, and user
    state.checkouts.forEach(checkout => {
        const outDate = new Date(checkout.timestamp_out * 1000);
        // Skip checkouts that are outside the specified range
        if (outDate < start_date || outDate > end_date) {
            return;
        }

        // Increment the count for the hour the checkout occurred
        checkoutCountsByHour[outDate.getHours()]++;

        // Tally checkouts by item
        Object.keys(checkout.items).forEach(itemUuid => {
            const itemCount = checkout.items[itemUuid];
            let itemName = state.inventory.find(item => item.uuid === itemUuid)?.name || null;
            // Skip items that are no longer in the inventory
            if (!itemName) {
                return;
            }
            if (itemName.match(/^(Baby Lock|Brother|Singer) Sewing Machine/g)) {
                itemName = "Sewing Machine";
            }
            checkoutCountsByItem[itemName] = (checkoutCountsByItem[itemName] || 0) + itemCount;
        });

        // Find the user who checked out the item(s)
        const user = state.users.find(user => user.uuid === checkout.checked_out_by);
        if (user && roleCounts.hasOwnProperty(user.role)) {
            // If the user exists and has a valid role, increment the count for that role
            roleCounts[user.role]++;
        }
        // If the user is valid, add to their engagement count based on the number of items checked out
        if (user) {
            checkoutCountsByUser[user.cx_id] = (checkoutCountsByUser[user.cx_id] || 0) + Object.values(checkout.items).length;
        }
    });


    const email_to_college = {
        "hmc.edu": "HMC",
        "g.hmc.edu": "HMC",
        "scrippscollege.edu": "Scripps",
        "mymail.pomona.edu": "Pomona",
        "pomona.edu": "Pomona",
        "cmc.edu": "CMC",
        "students.pitzer.edu": "Pitzer",
        "pitzer.edu": "Pitzer",
        "cgu.edu": "CGU",
    }

    // Initialize objects to hold the number of passes and fails for each quiz
    const passedQuizzes = {};
    const failedQuizzes = {};
    // Initialize an array to hold the user IDs of those who passed the general safety quiz
    const generalSafetyQuizPassIDs = [];
    // Initialize an object to hold the number of users by college who have passed the general safety quiz
    const collegeCounts = {}

    // Create a mapping from quiz ID to quiz name
    const quizIDtoName = Object.entries(state.quiz_ids).reduce((acc, [name, id]) => {
        acc[id] = name;
        return acc;
    }, {});

    // Calculate the total number of passes and fails for each quiz and the number of
    // users by college who have passed the general safety quiz
    state.quiz_results.forEach(quiz => {
        const quiz_date = new Date(quiz.timestamp * 1000);
        const quiz_name = quizIDtoName[quiz.gid];

        // If the quiz was taken outside the specified range, skip it
        if (quiz_date < start_date || quiz_date > end_date) {
            return;
        }
        // Calculate the score as the number of correct answers.
        // Note, we cannot use the `passed` field as that signifies whether
        // the user passed the quiz in this academic year.
        const score = quiz.score.split("/")[0].trim();
        const outOf = quiz.score.split("/")[1].trim();
        if (score == outOf) {
            // Passed quiz
            passedQuizzes[quiz_name] = (passedQuizzes[quiz_name] || 0) + 1;
            if (quiz.gid === state.quiz_ids["General"] && !generalSafetyQuizPassIDs.includes(quiz.cx_id)) {
                generalSafetyQuizPassIDs.push(quiz.cx_id);
                // Get the user's college from their email handle
                const email = quiz.email.toLowerCase();
                const domain = email.substring(email.lastIndexOf("@") + 1);
                // If the user's email domain is not from the colleges, default to "Other"
                const college = email_to_college[domain] || "Other";
                // If the user's college is not already in the object, initialize it to 1, else increment it
                collegeCounts[college] = (collegeCounts[college] || 0) + 1;
            }
        } else {
            // Failed quiz
            failedQuizzes[quiz_name] = (failedQuizzes[quiz_name] || 0) + 1;
        }
    });

    generateCheckoutHeatmap(checkoutCountsByHour);
    generateCheckoutItemsChart(checkoutCountsByItem);
    generateDailyCheckoutTrendsChart(dailyCounts);

    generateUsersByCollegeChart(collegeCounts);

    generateCheckoutsByUserRoleChart(roleCounts);
    generatePassedQuizzesChart(passedQuizzes, failedQuizzes, quizIDtoName);
    // TODO: Add engagement based on workshop attendance
    generateUserEngagementChart(checkoutCountsByUser);
}

function generateUserEngagementChart(engagementsByUserID) {
    const ctx = document.getElementById('user-engagement-chart');

    // Destroy the existing chart if it exists
    if (charts.user_engagement) {
        charts.user_engagement.destroy();
    }

    const sorted_engagements = Object.keys(engagementsByUserID).sort(
        (a, b) => engagementsByUserID[b] - engagementsByUserID[a]
    );

    const user_engagement = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sorted_engagements,
            datasets: [{
                label: 'Engagement',
                data: engagementsByUserID,
                backgroundColor: 'rgba(0, 123, 255, 0.5)',
            }],
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    charts.user_engagement = user_engagement;
}

function generatePassedQuizzesChart(passedQuizzes, failedQuizzes, quizIDtoName) {

    const ctx = document.getElementById('passed-quizzes-chart');

    // Destroy the existing chart if it exists
    if (charts.passed_quizzes) {
        charts.passed_quizzes.destroy();
    }

    // Create a list of quiz names sorted by the number of times the quiz was passed
    const sorted_quiz_names = Object.values(quizIDtoName).sort(
        (a, b) => passedQuizzes[b] - passedQuizzes[a]
    );

    const passed_quizzes = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sorted_quiz_names,
            datasets: [{
                label: 'Passed',
                data: passedQuizzes,
                backgroundColor: 'rgba(80, 173, 59, 0.5)',
            }, {
                label: 'Failed',
                data: failedQuizzes,
                backgroundColor: 'rgba(209, 50, 79, 0.5)',
            }],
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    charts.passed_quizzes = passed_quizzes;
}

function generateUsersByCollegeChart(collegeCounts) {

    // Tally the total number of users
    const total_users = Object.values(collegeCounts).reduce((a, b) => a + b, 0);

    const college_to_color = {
        "HMC": "rgba(253, 185, 19, 0.5)",
        "Scripps": "rgba(52, 113, 91, 0.5)",
        "Pomona": "rgba(0, 87, 184, 0.5)",
        "CMC": "rgba(152, 26, 49, 0.5)",
        "Pitzer": "rgba(247, 148, 29, 0.5)",
        "CGU": "rgba(122, 15, 20, 0.5)",
        "Other": "rgba(128, 128, 128, 0.5)",
    }

    document.getElementById("total-users").innerText = total_users;

    // Prepare for the chart
    const ctx = document.getElementById('users-by-college-chart').getContext('2d');
    const labels = Object.keys(collegeCounts);
    const data = Object.values(collegeCounts);
    const backgroundColors = labels.map(college => college_to_color[college]);

    if (charts.users_by_college) {
        charts.users_by_college.destroy();
    }

    // Generate the chart
    const users_by_college = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
            }],
        },
        options: {
            plugins: {
                legend: {
                    position: 'top',
                }
            },
        }
    });
    charts.users_by_college = users_by_college;
}


function generateDailyCountsFromCheckouts(start_date, end_date) {
    // Initialize an empty object to hold date: count mappings
    const dailyCounts = {};

    // Iterate through each checkout in the state.checkouts array
    state.checkouts.forEach(checkout => {
        // Convert UNIX timestamp to a Date object
        const dateOut = new Date(checkout.timestamp_out * 1000);

        // If the date is outside the specified range, skip it
        if (dateOut < start_date || dateOut > end_date) {
            return;
        }

        // Format the date as YYYY-MM-DD for consistency
        const dateString = dateOut.toISOString().split('T')[0];

        // If the date already exists in dailyCounts, increment the count, else initialize it to 1
        if (dailyCounts[dateString]) {
            dailyCounts[dateString] += 1;
        } else {
            dailyCounts[dateString] = 1;
        }
    });

    return dailyCounts;
}

function generateCheckoutHeatmap(checkoutCountsByHour) {
    const ctx = document.getElementById('checkout-heatmap');

    // Destroy the existing chart if it exists
    if (charts.checkout_heatmap) {
        charts.checkout_heatmap.destroy();
    }

    const checkout_heatmap = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Array.from({ length: 24 }, (_, i) => `${i}:00`), // `0:00`, `1:00`, ... `23:00
            datasets: [{
                label: 'Checkouts by Hour',
                data: checkoutCountsByHour,
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    charts.checkout_heatmap = checkout_heatmap;
}

function generateCheckoutItemsChart(checkoutCountsByItem) {
    const sortedItems = Object.entries(checkoutCountsByItem).sort((a, b) => b[1] - a[1]).slice(0, 10); // top 10 items
    const itemNames = sortedItems.map(item => item[0]);
    const itemCounts = sortedItems.map(item => item[1]);

    const ctx = document.getElementById('checkout-items-chart');

    // Destroy the existing chart if it exists
    if (charts.checkout_items) {
        charts.checkout_items.destroy();
    }

    const checkout_items = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: itemNames,
            datasets: [{
                label: 'Number of Checkouts',
                data: itemCounts,
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    charts.checkout_items = checkout_items;
}

function generateDailyCheckoutTrendsChart(dailyCounts) {
    const ctx = document.getElementById('daily-checkout-trends-chart').getContext('2d');

    // Destroy the existing chart if it exists
    if (charts.daily_checkout_trends) {
        charts.daily_checkout_trends.destroy();
    }

    const daily_checkout_trends = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(dailyCounts), // Assuming dates are in 'YYYY-MM-DD' format
            datasets: [{
                label: 'Daily Checkouts',
                data: Object.values(dailyCounts),
                backgroundColor: 'rgba(100, 150, 100, 0.5)',
            }]
        },
        options: {
            scales: {
                x: {
                    type: 'time',
                    time: {
                        parser: 'YYYY-MM-DD',
                        // For Moment.js, you might use format: 'YYYY-MM-DD'
                        tooltipFormat: 'll',
                        unit: 'day'
                    },
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Checkouts'
                    }
                }
            }
        }
    });
    charts.daily_checkout_trends = daily_checkout_trends;
}

function generateCheckoutsByUserRoleChart(roleCounts) {
    // Prepare for the chart
    const ctx = document.getElementById('checkouts-by-user-role-chart');
    const labels = Object.keys(roleCounts);
    const data = Object.values(roleCounts);
    const backgroundColors = labels.map(() => `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.5)`);

    // Destroy the existing chart if it exists
    if (charts.checkouts_by_user_role) {
        charts.checkouts_by_user_role.destroy()
    }

    // Generate the chart
    checkouts_by_user_role = new Chart(ctx, {
        type: 'pie', // Changed from 'polarArea' to 'pie'
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
            }],
        },
        options: {
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            response: false,
        }
    });
    charts.checkouts_by_user_role = checkouts_by_user_role;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// AMBA NOTE:updated, now includes ordered_requests section
function renderRestockRequests() {
    const pending_requests = document.getElementById("pending-restock-requests-list");
    const ordered_requests = document.getElementById("ordered-restock-requests-list");
    const completed_requests = document.getElementById("completed-restock-requests-list");

    removeAllChildren(pending_requests);
    appendChildren(pending_requests, generatePendingRestockRequestDivs());

    removeAllChildren(ordered_requests);
    appendChildren(ordered_requests, generateOrderedRestockRequestDivs());

    removeAllChildren(completed_requests);
    appendChildren(completed_requests, generateCompletedRestockRequestDivs());
}

function replaceLinksWithA(str, shorten = false) {
    let matches = str.match(/(https?:\/\/[^\s]+)/g);
    if (matches === null) return str;

    for (let match of matches) {
        let a = document.createElement("a");
        a.href = match;
        a.target = "_blank";
        const base_url = new URL(match).hostname;
        a.innerText = shorten ? base_url : match;
        str = str.replace(match, a.outerHTML);
    }
    return str;
}

function showCompleteRestockRequest(uuid, requested_by_str) {
    let request = state.restock_requests.find(request => request.uuid === uuid);

    document.getElementById("complete-restock-request-user").innerText = requested_by_str;
    document.getElementById("complete-restock-request-item").innerHTML = "Item: " + replaceLinksWithA(request.item, true);
    document.getElementById("complete-restock-request-reason").innerText = "Reason: " + request.reason;
    document.getElementById("complete-restock-request-quantity").innerText = "Quantity: " + request.quantity;
    document.getElementById("complete-restock-request-notes").value = "";

    document.getElementById("complete-restock-request-order").removeAttribute("disabled");
    document.getElementById("complete-restock-request-deny").removeAttribute("disabled");

    document.getElementById("complete-restock-request-order").onclick = () => {
        completeRestockRequest(uuid, "order");
    };

    document.getElementById("complete-restock-request-deny").onclick = () => {
        completeRestockRequest(uuid, "deny");
    };

    showPopup("complete-restock-request");
}

async function completeRestockRequest(uuid, action) {
    document.getElementById("complete-restock-request-order").setAttribute("disabled", "disabled");
    document.getElementById("complete-restock-request-deny").setAttribute("disabled", "disabled");

    let completion_note = document.getElementById("complete-restock-request-notes").value;

    let request = {
        uuid: uuid,
        action: action,
        completion_note: completion_note,
    };

    try {
        let response = await fetch(`${API}/inventory/complete_restock_request`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api-key": api_key,
            },
            body: JSON.stringify(request),
        });

        if (response.status === 201) {
            await fetchRestockRequests();
            renderRestockRequests();
            closePopup();
        } else {
            const body = await response.json();
            alert("Error completing restock request: " + response.status + "\n" + body.detail);
        }
    } catch (error) {
        alert("Error completing restock request: " + error.message);
    }
}

function generatePendingRestockRequestDivs() {
    let pending = state.restock_requests.filter(request =>
        request.timestamp_ordered === null && request.timestamp_completed === null
    );
    pending.reverse();

    let divs = [];

    let header = document.createElement("div");
    header.classList.add("restock-request-pending", "restock-request-header");
    header.innerHTML = `
        <div class="restock-request-timestamp_requested">Timestamp Requested</div>
        <div class="restock-request-requested_by">Requested By</div>
        <div class="restock-request-item">Item</div>
        <div class="restock-request-quantity">Quantity</div>
        <div class="restock-request-complete">Action</div>
    `;
    divs.push(header);

    for (let request of pending) {
        let div = document.createElement("div");
        div.classList.add("restock-request", "restock-request-pending");

        let timestamp_requested = document.createElement("div");
        timestamp_requested.classList.add("restock-request-timestamp_requested");
        timestamp_requested.innerText = new Date(request.timestamp_sent * 1000).toLocaleString().replace(/:\d{2} /, " ");
        div.appendChild(timestamp_requested);

        let requested_by = document.createElement("div");
        requested_by.classList.add("restock-request-requested_by");
        let requested_by_str = "";
        
        if (request.user_uuid === "automatedrestock") {
            requested_by_str = "Automated Restock";
        } else if (request.user_uuid) {
            let user = state.users.find(user => user.uuid === request.user_uuid) ?? null;
            if (user) {
                requested_by_str = user.name + " (" + user.email + ")";
                if (["steward", "head_steward"].includes(user.role)) {
                    requested_by.classList.add("restock-request-requested_by-steward");
                }
            }
        } else {
            requested_by_str = "Checkout Computer";
            requested_by.classList.add("restock-request-requested_by-steward");
        }
        
        requested_by.innerText = requested_by_str;
        div.appendChild(requested_by);

        let item = document.createElement("div");
        item.classList.add("restock-request-item");
        let itemText = replaceLinksWithA(request.item, true);
        if (request.reason && request.reason.toLowerCase() !== "out of stock") {
            itemText += `<br><em>${request.reason}</em>`;
        }
        item.innerHTML = itemText;
        div.appendChild(item);

        let quantity = document.createElement("div");
        quantity.classList.add("restock-request-quantity");
        quantity.innerText = request.quantity;
        div.appendChild(quantity);

        let complete = document.createElement("div");
        complete.classList.add("restock-request-complete");
        let complete_button = document.createElement("button");
        complete_button.innerHTML = "<span class='material-symbols-outlined'>done</span>";
        complete_button.onclick = () => showCompleteRestockRequest(request.uuid, requested_by_str);
        complete.appendChild(complete_button);
        div.appendChild(complete);

        divs.push(div);
    }

    return divs;
}

function generateOrderedRestockRequestDivs() {
    // var state defined first thing at the top of this doc, contains restock_requests inside it 
    let ordered = state.restock_requests.filter(request =>
        request.timestamp_ordered !== null && request.timestamp_completed === null
    );
    ordered.reverse();

    let divs = [];

    let header = document.createElement("div");
    header.classList.add("restock-request-ordered", "restock-request-header");
    header.innerHTML = `
        <div class="restock-request-timestamp_ordered">Timestamp Ordered</div>
        <div class="restock-request-requested_by">Requested By</div>
        <div class="restock-request-item">Item</div>
        <div class="restock-request-quantity">Quantity</div>
        <div class="restock-request-note">Note</div>
        <div class="restock-request-complete">Action</div>
    `;
    divs.push(header);

    for (let request of ordered) {
        let div = document.createElement("div");
        div.classList.add("restock-request", "restock-request-ordered");

        let timestamp = document.createElement("div");
        timestamp.classList.add("restock-request-timestamp_ordered");
        timestamp.innerText = new Date(request.timestamp_ordered * 1000).toLocaleString().replace(/:\d{2} /, " ");
        div.appendChild(timestamp);

        let requested_by = document.createElement("div");
        requested_by.classList.add("restock-request-requested_by");
        let requested_by_str = "";
        
        if (request.user_uuid === "automatedrestock") {
            requested_by_str = "Automated Restock";
        } else if (request.user_uuid) {
            let user = state.users.find(user => user.uuid === request.user_uuid) ?? null;
            if (user) {
                requested_by_str = user.name + " (" + user.email + ")";
                if (["steward", "head_steward"].includes(user.role)) {
                    requested_by.classList.add("restock-request-requested_by-steward");
                }
            }
        } else {
            requested_by_str = "Checkout Computer";
            requested_by.classList.add("restock-request-requested_by-steward");
        }
        
        requested_by.innerText = requested_by_str;
        div.appendChild(requested_by);

        let item = document.createElement("div");
        item.classList.add("restock-request-item");
        let itemText = replaceLinksWithA(request.item, true);
        if (request.reason && request.reason.toLowerCase() !== "out of stock") {
            itemText += `<br><em>${request.reason}</em>`;
        }
        item.innerHTML = itemText;
        div.appendChild(item);

        let quantity = document.createElement("div");
        quantity.classList.add("restock-request-quantity");
        quantity.innerText = request.quantity;
        div.appendChild(quantity);

        let note = document.createElement("div");
        note.classList.add("restock-request-note");
        note.innerText = request.completion_note || "";
        div.appendChild(note);

        let complete = document.createElement("div");
        complete.classList.add("restock-request-complete");
        let completeBtn = document.createElement("button");
        completeBtn.innerHTML = "<span class='material-symbols-outlined'>done</span>";
        completeBtn.onclick = async () => {
            await completeRestockRequest(request.uuid, "complete");  // a new `"complete"` action we’ll handle below
        };        complete.appendChild(completeBtn);
        div.appendChild(complete);

        divs.push(div);
    }

    return divs;
}

function generateCompletedRestockRequestDivs() {
    let completed = state.restock_requests.filter(request => request.timestamp_completed !== null);
    completed.reverse();

    let divs = [];

    let header = document.createElement("div");
    header.classList.add("restock-request-completed", "restock-request-header");
    header.innerHTML = `
        <div class="restock-request-timestamp_completed">Timestamp Completed</div>
        <div class="restock-request-requested_by">Requested By</div>
        <div class="restock-request-item">Item</div>
        <div class="restock-request-quantity">Quantity</div>
        <div class="restock-request-note">Note</div>
    `;
    divs.push(header);

    for (let request of completed) {
        let div = document.createElement("div");
        div.classList.add("restock-request", "restock-request-completed");

        let timestamp_completed = document.createElement("div");
        timestamp_completed.classList.add("restock-request-timestamp_completed");
        timestamp_completed.innerText = new Date(request.timestamp_completed * 1000).toLocaleString().replace(/:\d{2} /, " ");
        div.appendChild(timestamp_completed);

        let requested_by = document.createElement("div");
        requested_by.classList.add("restock-request-requested_by");
        let requested_by_str = "";
        
        if (request.user_uuid === "automatedrestock") {
            requested_by_str = "Automated Restock";
        } else if (request.user_uuid) {
            let user = state.users.find(user => user.uuid === request.user_uuid) ?? null;
            if (user) {
                requested_by_str = user.name + " (" + user.email + ")";
                if (["steward", "head_steward"].includes(user.role)) {
                    requested_by.classList.add("restock-request-requested_by-steward");
                }
            }
        } else {
            requested_by_str = "Checkout Computer";
            requested_by.classList.add("restock-request-requested_by-steward");
        }
        
        requested_by.innerText = requested_by_str;
        div.appendChild(requested_by);

        let item = document.createElement("div");
        item.classList.add("restock-request-item");
        let itemText = replaceLinksWithA(request.item, true);
        if (request.reason && request.reason.toLowerCase() !== "out of stock") {
            itemText += `<br><em>${request.reason}</em>`;
        }
        item.innerHTML = itemText;
        div.appendChild(item);

        let quantity = document.createElement("div");
        quantity.classList.add("restock-request-quantity");
        quantity.innerText = request.quantity;
        div.appendChild(quantity);

        let note = document.createElement("div");
        note.classList.add("restock-request-note");
        let statusText = request.is_approved === true ? "Approved." : request.is_approved === false ? "Denied." : "";
        note.innerText = statusText + (request.completion_note ? ` ${request.completion_note}` : "");
        div.appendChild(note);

        divs.push(div);
    }

    return divs;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function renderWorkshopsAdmin() {
    const workshops = document.getElementById("workshops-list");

    removeAllChildren(workshops);
    appendChildren(workshops, generateWorkshopDivsAdmin());
}

function generateWorkshopDivsAdmin() {
    let divs = [];

    let header = document.createElement("tr");
    header.innerHTML = `<th>Title</th><th>Description</th><th>Instructors</th><th>Start Time</th><th>Capacity</th><th>Live</th><th>Signups</th><th>Attendees</th><th>Edit</th><th>Copy</th><th>Delete</th>`;
    divs.push(header);

    let sorted_workshops = state.workshops.sort((a, b) => b.timestamp_start - a.timestamp_start);

    // Group workshops by month-year
    let workshopsByMonthYear = {};
    for (let workshop of sorted_workshops) {
        let workshopMonthYear = new Date(workshop.timestamp_start * 1000).toLocaleString('default', { month: 'long', year: 'numeric' });

        if (!workshopsByMonthYear[workshopMonthYear]) {
            workshopsByMonthYear[workshopMonthYear] = [];
        }

        workshopsByMonthYear[workshopMonthYear].push(workshop);
    }

    for (let monthYear in workshopsByMonthYear) {
        let workshops = workshopsByMonthYear[monthYear];

        let separator = document.createElement("tr");
        separator.classList.add("workshop-month-separator");
        let separatorText = document.createElement("td");
        separatorText.setAttribute("colspan", "11");
        separatorText.innerText = `${monthYear} (${workshops.length} workshop${workshops.length > 1 ? "s" : ""})`;
        separator.appendChild(separatorText);
        divs.push(separator);

        for (let workshop of workshops) {
            let div = document.createElement("tr");
            div.classList.add("workshop-admin");

            let title = document.createElement("td");
            title.classList.add("workshop-title");
            title.innerText = workshop.title;
            div.appendChild(title);

            let description = document.createElement("td");
            description.classList.add("workshop-description");
            description.innerText = workshop.description;
            div.appendChild(description);

            let instructors = document.createElement("td");
            instructors.classList.add("workshop-instructors");
            instructors.innerText = workshop.instructors;
            div.appendChild(instructors);

            let timestamp_start = document.createElement("td");
            timestamp_start.classList.add("workshop-timestamp_start");
            timestamp_start.innerText = new Date(workshop.timestamp_start * 1000).toLocaleString();
            div.appendChild(timestamp_start);

            let capacity = document.createElement("td");
            capacity.classList.add("workshop-capacity");
            capacity.innerText = `${workshop.capacity}`;
            div.appendChild(capacity);

            let is_live = document.createElement("td");
            is_live.classList.add("workshop-is_live");

            if (workshop.is_live_timestamp !== null) {
                // Not live yet, but show the timestamp when it will go live
                is_live.classList.add("scheduled");
                is_live.innerText = new Date(workshop.is_live_timestamp * 1000).toLocaleString();
            } else {
                is_live.classList.add(workshop.is_live ? "published" : "unpublished");
                is_live.innerHTML = workshop.is_live ? "<span class='material-symbols-outlined'>published_with_changes</span>" : "<span class='material-symbols-outlined'>unpublished</span>";
            }

            div.appendChild(is_live);

            let rsvp_list = document.createElement("td");
            rsvp_list.classList.add("workshop-rsvp_list");
            let rsvp_button = document.createElement("button");
            let total_rsvps = workshop.rsvp_list ? workshop.rsvp_list.length : 0;
            rsvp_button.innerHTML = `<span>${total_rsvps}</span><span class='material-symbols-outlined'>group</span>`;
            rsvp_button.onclick = () => {
                showRSVPListAdmin(workshop.uuid);
            };
            rsvp_list.appendChild(rsvp_button);
            div.appendChild(rsvp_list);

            let attendees = document.createElement("td");
            attendees.classList.add("workshop-attendees");
            let attendees_button = document.createElement("button");
            let total_attendees = workshop.sign_in_list ? workshop.sign_in_list.length : 0;
            attendees_button.innerHTML = `<span>${total_attendees}</span><span class='material-symbols-outlined'>people</span>`;
            attendees_button.onclick = () => {
                showWorkshopAttendees(workshop.uuid);
            };
            attendees.appendChild(attendees_button);
            div.appendChild(attendees);

            let edit_button_container = document.createElement("td");
            edit_button_container.classList.add("workshop-edit");

            let edit_button = document.createElement("button");
            edit_button.innerHTML = "<span class='material-symbols-outlined'>tune</span>"
            edit_button.onclick = () => {
                showCreateEditWorkshop(workshop.uuid);
            };

            edit_button_container.appendChild(edit_button);
            div.appendChild(edit_button_container);

            let copy_button_container = document.createElement("td");
            copy_button_container.classList.add("workshop-copy");

            let copy_button = document.createElement("button");
            copy_button.innerHTML = "<span class='material-symbols-outlined'>content_copy</span>"
            copy_button.onclick = () => {
                copyWorkshop(workshop.uuid);
            };

            copy_button_container.appendChild(copy_button);
            div.appendChild(copy_button_container);

            let delete_button_container = document.createElement("td");
            delete_button_container.classList.add("workshop-delete");

            let delete_button = document.createElement("button");
            delete_button.classList.add("delete");
            delete_button.innerHTML = "<span class='material-symbols-outlined'>delete</span>"
            delete_button.onclick = () => {
                deleteWorkshop(workshop.uuid);
            };

            delete_button_container.appendChild(delete_button);
            div.appendChild(delete_button_container);

            divs.push(div);
        }
    }

    return divs;
}

function openWorkshopPhotos(event) {
    // ensure that the click was on the div and not a button
    if (event.target.tagName === "BUTTON") {
        return;
    }

    document.getElementById("edit-workshop-photos-input").click();
}

function dragOverWorkshopPhotos(event) {
    event.preventDefault();
}

function dropWorkshopPhotos(event) {
    event.preventDefault();
    let files = event.dataTransfer.files;
    for (let i = 0; i < files.length; i++) {
        photo_queue.push(files[i]);
        addPhotoToQueue(files[i]);
    }
}

async function selectWorkshopPhotos(event) {
    let files = event.target.files;
    for (let i = 0; i < files.length; i++) {
        photo_queue.push(files[i]);
        addPhotoToQueue(files[i]);
    }
}

function addPhotoToQueue(file) {
    const editWorkshopPhotosDiv = document.getElementById("edit-workshop-photos");

    const photoBox = generateWorkshopPhotoDiv(file, uploaded = false);

    editWorkshopPhotosDiv.appendChild(photoBox);
}

function removePhotoFromQueue(file) {
    const index = photo_queue.indexOf(file);
    if (index > -1) {
        photo_queue.splice(index, 1);
    }
}

function showWorkshopAttendees(uuid) {
    let workshop = state.workshops.find(workshop => workshop.uuid === uuid);

    if (workshop) {
        const attendees = document.getElementById("attendees-table");

        removeAllChildren(attendees);

        let header = document.createElement("tr");
        header.innerHTML = `<th>Name</th><th>CX ID</th><th>Email</th>`;
        attendees.appendChild(header);

        if (!workshop.sign_in_list) {
            workshop.sign_in_list = [];
        }

        if (workshop.sign_in_list.length === 0) {
            let div = document.createElement("tr");
            div.classList.add("workshop-attendee");
            div.innerHTML = "<td colspan='3'>No attendees</td>";
            attendees.appendChild(div);
        }

        for (let uuid of workshop.sign_in_list) {
            let user = state.users.find(user => user.uuid === uuid);

            if (user) {
                let div = document.createElement("tr");
                div.classList.add("workshop-attendee");

                let name = document.createElement("td");
                name.classList.add("workshop-attendee-name");
                name.innerText = user.name;
                div.appendChild(name);

                let cx_id = document.createElement("td");
                cx_id.classList.add("workshop-attendee-cx_id");
                cx_id.innerText = user.cx_id;
                div.appendChild(cx_id);

                let email = document.createElement("td");
                email.classList.add("workshop-attendee-email");
                email.innerText = user.email;
                div.appendChild(email);

                attendees.appendChild(div);
            }
        }

        showPopup("workshop-attendees");
    } else {
        alert("Error finding workshop with uuid " + uuid);
    }

}

function showRSVPListAdmin(uuid) {
    let workshop = state.workshops.find(workshop => workshop.uuid === uuid);

    if (workshop) {
        const rsvp_list = document.getElementById("workshop-signups-list");

        removeAllChildren(rsvp_list);

        let header = document.createElement("tr");
        header.innerHTML = `<th>Name</th><th>CX ID</th><th>Email</th>`;
        rsvp_list.appendChild(header);

        for (let uuid of workshop.rsvp_list) {
            let user = state.users.find(user => user.uuid === uuid);

            if (user) {
                let div = document.createElement("tr");
                div.classList.add("workshop-signup");

                let name = document.createElement("td");
                name.classList.add("workshop-signup-name");
                name.innerText = user.name;
                div.appendChild(name);

                let cx_id = document.createElement("td");
                cx_id.classList.add("workshop-signup-cx_id");
                cx_id.innerText = user.cx_id;
                div.appendChild(cx_id);

                let email = document.createElement("td");
                email.classList.add("workshop-signup-email");
                email.innerText = user.email;
                div.appendChild(email);

                rsvp_list.appendChild(div);
            }
        }

        document.getElementById("workshop-signups-send-email").onclick = () => {
            sendWorkshopEmail(workshop.uuid);
        };

        showPopup("workshop-signups");
    } else {
        alert("Error finding workshop with uuid " + uuid);
    }
}

async function sendWorkshopEmail(uuid) {
    let subject = document.getElementById("workshop-signups-email-subject").value;
    let body = document.getElementById("workshop-signups-email-body").value;

    if (subject.trim() === "" || body.trim() === "") {
        alert("Subject and/or body cannot be empty.");
        return;
    }

    document.getElementById("workshop-signups-send-email").setAttribute("disabled", "disabled");

    let request = await fetch(`${API}/workshops/send_custom_workshop_email`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api-key": api_key,
            },
            body: JSON.stringify({
                uuid: uuid,
                subject: subject,
                body: body,
            }),
        }
    );

    if (request.status == 201) {
        alert("Email sent successfully.");
    }

    document.getElementById("workshop-signups-send-email").removeAttribute("disabled");
}

function copyWorkshop(uuid) {
    let workshop = state.workshops.find(workshop => workshop.uuid === uuid);

    if (workshop) {
        let new_workshop = JSON.parse(JSON.stringify(workshop));
        new_workshop.title = "Copy of " + new_workshop.title;
        new_workshop.uuid = self.crypto.randomUUID();
        new_workshop.is_live = false;

        state.workshops.push(new_workshop);
        showCreateEditWorkshop(new_workshop.uuid);
    } else {
        alert("Error finding workshop with uuid " + uuid);
    }
}

function showCreateEditWorkshop(uuid) {
    let workshop = state.workshops.find(workshop => workshop.uuid === uuid);

    photo_queue = [];

    if (workshop) {
        let pacific_offset = new Date().getTimezoneOffset() * 60 * 1000;
        let time_start = new Date(workshop.timestamp_start * 1000) - pacific_offset;
        let time_end = new Date(workshop.timestamp_end * 1000) - pacific_offset;

        // Get ISO timestamp for Pacific time
        time_start = new Date(time_start).toISOString().split(".")[0];
        time_end = new Date(time_end).toISOString().split(".")[0];

        let is_live_timestamp = workshop.is_live_timestamp;
        if (is_live_timestamp) {
            // Offset for Pacific time
            is_live_timestamp = new Date(is_live_timestamp * 1000) - pacific_offset;
            document.getElementById("edit-workshop-is_live_timestamp").value = new Date(is_live_timestamp).toISOString().split(".")[0];
        }


        document.getElementById("edit-workshop-title").value = workshop.title;
        document.getElementById("edit-workshop-description").value = workshop.description;
        document.getElementById("edit-workshop-instructors").value = workshop.instructors;
        document.getElementById("edit-workshop-date").value = time_start.substr(0, 10);
        document.getElementById("edit-workshop-timestamp_start").value = time_start.substr(11, 5);
        document.getElementById("edit-workshop-timestamp_end").value = time_end.substr(11, 5);
        document.getElementById("edit-workshop-capacity").value = workshop.capacity;
        document.getElementById("edit-workshop-is_live").checked = workshop.is_live;
        document.getElementById("edit-workshop-save").onclick = () => {
            saveWorkshop(uuid);
        };

        const required_quizzes = document.getElementById("edit-workshop-required_quizzes");

        removeAllChildren(required_quizzes);
        appendChildren(required_quizzes, generateRequiredQuizDivs(workshop.required_quizzes));

        const photos = document.getElementById("edit-workshop-photos");
        removeAllChildren(photos, keep_first_n = 1);
        appendChildren(photos, generateWorkshopPhotoDivs(workshop));
    } else {
        document.getElementById("edit-workshop-is_live_timestamp").value = "";
        document.getElementById("edit-workshop-title").value = "";
        document.getElementById("edit-workshop-description").value = "";
        document.getElementById("edit-workshop-instructors").value = "";
        document.getElementById("edit-workshop-timestamp_start").value = "";
        document.getElementById("edit-workshop-timestamp_end").value = "";
        document.getElementById("edit-workshop-capacity").value = "";
        document.getElementById("edit-workshop-is_live").value = "";
        document.getElementById("edit-workshop-save").onclick = () => {
            saveWorkshop();
        };

        const required_quizzes = document.getElementById("edit-workshop-required_quizzes");

        removeAllChildren(required_quizzes);
        appendChildren(required_quizzes, generateRequiredQuizDivs());

        const photos = document.getElementById("edit-workshop-photos");
        removeAllChildren(photos, keep_first_n = 1);
    }

    // Open popup
    showPopup("edit-workshop");
}

function generateWorkshopPhotoDivs(workshop) {
    let divs = [];

    if (workshop.photos) {
        for (let photo of workshop.photos) {
            divs.push(generateWorkshopPhotoDiv(photo, uploaded = true, workshop = workshop));
        }
    }

    return divs;
}

function generateWorkshopPhotoDiv(file, uploaded = false, workshop = null) {
    const photoBox = document.createElement("div");
    photoBox.classList.add("photo-box");

    const closeButton = document.createElement("button");
    closeButton.classList.add("close-button");
    closeButton.innerText = "X";

    if (uploaded) {
        closeButton.addEventListener("click", async () => {
            // call delete photo endpoint
            let request = await fetch(`${API}/workshops/delete_photo`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "api-key": api_key,
                    },
                    body: JSON.stringify({ workshop_uuid: workshop.uuid, photo_uuid: file }),
                }
            );

            if (request.status == 201) {
                workshop.photos = workshop.photos.filter(photo => photo !== file);
                photoBox.remove();
            } else {
                alert("Error deleting photo: " + request.status);
            }
        });
    } else {
        closeButton.addEventListener("click", () => {
            removePhotoFromQueue(file);
            document.getElementById("edit-workshop-photos").removeChild(photoBox);
        });
    }


    const photo = document.createElement("img");
    if (uploaded) {
        photo.src = `${API}/workshops/download_photo/${file}`;
    } else {
        photo.src = URL.createObjectURL(file);
    }

    photoBox.appendChild(closeButton);
    photoBox.appendChild(photo);

    return photoBox;
}

async function deleteWorkshop(uuid) {
    // Confirm
    if (!confirm("Are you sure you want to delete this workshop?")) {
        return;
    }

    let request = await fetch(`${API}/workshops/delete_workshop`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api-key": api_key,
            },
            body: JSON.stringify({ uuid: uuid }),
        }
    );

    if (request.status == 200) {
        await fetchWorkshopsAdmin();
        renderWorkshopsAdmin();
    } else {
        alert("Error deleting workshop: " + request.status);
    }
}

function generateRequiredQuizDivs(required_quizzes = []) {
    let divs = [];

    for (let quiz of Object.keys(QUIZ_NAME_TO_ID)) {
        let div = document.createElement("div");
        div.classList.add("checkbox-container");

        let checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `edit-workshop-quiz-${quiz}`;

        if (required_quizzes.includes(quiz)) {
            checkbox.checked = true;
        }

        let label = document.createElement("label");
        label.innerText = quiz;
        label.htmlFor = `edit-workshop-quiz-${quiz}`;

        div.appendChild(checkbox);
        div.appendChild(label);

        divs.push(div);
    }

    return divs;
}

async function saveWorkshop(uuid = null) {
    // disable save button
    document.getElementById("edit-workshop-save").setAttribute("disabled", "disabled");

    let workshop = null;

    if (uuid === null) {
        uuid = self.crypto.randomUUID();
    } else {
        workshop = state.workshops.find(workshop => workshop.uuid === uuid);
    }

    const date = document.getElementById("edit-workshop-date").value;
    const timestamp_start = new Date(`${date}T${document.getElementById("edit-workshop-timestamp_start").value}`).getTime() / 1000;
    const timestamp_end = new Date(`${date}T${document.getElementById("edit-workshop-timestamp_end").value}`).getTime() / 1000;
    let required_quizzes = [];

    for (let child of document.getElementById("edit-workshop-required_quizzes").children) {
        if (child.children[0].checked) {
            required_quizzes.push(child.children[0].id.split("-")[3]);
        }
    }

    let is_live_timestamp = document.getElementById("edit-workshop-is_live_timestamp").value;

    if (is_live_timestamp) {
        is_live_timestamp = new Date(is_live_timestamp).getTime() / 1000;
    } else {
        is_live_timestamp = null;
    }

    let workshop_obj = {
        uuid: uuid,
        title: document.getElementById("edit-workshop-title").value,
        description: document.getElementById("edit-workshop-description").value,
        instructors: document.getElementById("edit-workshop-instructors").value,
        timestamp_start: timestamp_start,
        timestamp_end: timestamp_end,
        capacity: document.getElementById("edit-workshop-capacity").value,
        is_live: document.getElementById("edit-workshop-is_live").checked,
        rsvp_list: [],
        required_quizzes: required_quizzes,
        photos: workshop ? workshop.photos ?? [] : [],
        is_live_timestamp: is_live_timestamp,
    };

    let request = await fetch(`${API}/workshops/update_workshop`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api-key": api_key,
            },
            body: JSON.stringify(workshop_obj),
        }
    );

    if (request.status == 201) {
        if (photo_queue.length > 0) {
            await uploadWorkshopPhotos(uuid);
        }

        await fetchWorkshopsAdmin();
        renderWorkshopsAdmin();

        // Enable save button
        document.getElementById("edit-workshop-save").removeAttribute("disabled");
        closePopup();
    } else {
        document.getElementById("edit-workshop-save").removeAttribute("disabled");

        // Alert with details
        const body = await request.json();
        alert("Error saving workshop: " + request.status + "\n" + body.detail);
    }
}

async function uploadWorkshopPhotos(uuid) {
    for (let photo of photo_queue) {
        let form = new FormData();
        form.append("workshop_uuid", uuid);
        form.append("file", photo);

        let request = await fetch(`${API}/workshops/add_photo`,
            {
                method: "POST",
                headers: {
                    "api-key": api_key,
                },
                body: form,
            }
        );

        if (request.status != 201) {
            alert("Error uploading photo: " + request.status);
        }
    }
}



function renderProficiencies() {
    const proficiencies = document.getElementById("proficiencies-list");

    removeAllChildren(proficiencies);
    appendChildren(proficiencies, generateProficiencyDivs(state.users));
}

function generateProficiencyDivs(users) {
    const divs = [];

    users = users.filter(user => user.role == "steward" || user.role == "head_steward");

    // Add header
    const header = document.createElement("tr");
    header.innerHTML = `<th>Name</th><th>CX ID</th><th>Email</th>`;
    for (let prof of PROFICIENCIES) {
        header.innerHTML += `<th class='prof'>${prof.replaceAll(" ", "<br>")}</th>`;
    }

    divs.push(header);

    for (let steward of users) {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${steward.name}</td><td>${steward.cx_id}</td><td>${steward.email}</td>`;

        for (let prof of PROFICIENCIES) {
            const cell = document.createElement("td");
            cell.classList.add("proficiency-cell");

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = steward.proficiencies?.includes(prof) ?? false;
            if (checkbox.checked) {
                cell.classList.add("checked")
            }
            checkbox.disabled = true;

            cell.appendChild(checkbox);

            row.appendChild(cell);
        }

        divs.push(row);
    }


    return divs;
}

function showEditUser(uuid) {
    let user = state.users.find(user => user.uuid === uuid);

    showPopup("edit-user");

    document.getElementById("edit-user-name").value = user.name;
    document.getElementById("edit-user-email").value = user.email;
    document.getElementById("edit-user-cx_id").value = user.cx_id;
    document.getElementById("edit-user-role").value = user.role;

    document.getElementById("edit-user-proficiencies").innerHTML = "";
    document.getElementById("edit-user-new-steward").innerHTML = "";
    document.getElementById("edit-user-certifications").innerHTML = "";

    // Create certification checkboxes
    for (let cert of state.certifications) {
        const cert_div = document.createElement("div");
        cert_div.classList.add("edit-proficiency-container");

        const label = document.createElement("label");
        label.innerText = cert.name;

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `edit-cert-${cert.uuid}`;
        checkbox.checked = user.certifications?.hasOwnProperty(cert.uuid) ?? false;

        cert_div.appendChild(checkbox);
        cert_div.appendChild(label);

        document.getElementById("edit-user-certifications").appendChild(cert_div);
    }

    if (user.role == "steward" || user.role == "head_steward") {
        for (let prof of PROFICIENCIES) {
            let prof_div = document.createElement("div");
            prof_div.classList.add("edit-proficiency-container");

            let prof_checkbox = document.createElement("input");
            prof_checkbox.type = "checkbox";
            if (user.proficiencies) {
                prof_checkbox.checked = user.proficiencies.includes(prof);
            } else {
                prof_checkbox.checked = false;
            }
            prof_checkbox.id = `edit-user-proficiency-${prof}`;

            let prof_label = document.createElement("label");
            prof_label.innerText = prof;
            prof_label.htmlFor = `edit-user-proficiency-${prof}`;

            prof_div.appendChild(prof_checkbox);
            prof_div.appendChild(prof_label);

            document.getElementById("edit-user-proficiencies").appendChild(prof_div);
        }

        // Create checkbox set to user.new_steward
        let new_steward_div = document.createElement("div");
        new_steward_div.classList.add("edit-proficiency-container");

        let new_steward_checkbox = document.createElement("input");
        new_steward_checkbox.type = "checkbox";
        console.log(`${user.name} is a new steward? ${user.new_steward}`);

        new_steward_checkbox.checked = user.new_steward ?? false;
        new_steward_checkbox.id = "edit-user-new-steward-input";

        let new_steward_label = document.createElement("label");
        new_steward_label.innerText = "New Steward";
        new_steward_label.htmlFor = "edit-user-new-steward-input";

        new_steward_div.appendChild(new_steward_checkbox);
        new_steward_div.appendChild(new_steward_label);

        document.getElementById("edit-user-new-steward").appendChild(new_steward_div);
    }


    document.getElementById("edit-user-save").onclick = () => {
        saveUser(uuid);
    }
}

async function saveUser(uuid) {
    let prev_user = state.users.find(user => user.uuid === uuid);

    let user = {
        uuid: uuid,
        name: document.getElementById("edit-user-name").value,
        email: document.getElementById("edit-user-email").value,
        cx_id: Number(document.getElementById("edit-user-cx_id").value),
        role: document.getElementById("edit-user-role").value,
    }

    let profs = [];

    if (prev_user.role == "steward" || prev_user.role == "head_steward") {
        for (let prof of PROFICIENCIES) {
            if (document.getElementById(`edit-user-proficiency-${prof}`).checked) {
                profs.push(prof);
            }
        }

        user.proficiencies = profs;

        user.new_steward = document.getElementById("edit-user-new-steward-input").checked;

        console.log(user);
    }

    let timestamp_now = new Date().getTime() / 1000;

    if (!user.certifications) {
        user.certifications = {};
    }

    for (let cert of state.certifications) {
        if (document.getElementById(`edit-cert-${cert.uuid}`).checked) {
            // Only update timestamp if it doesn't exist
            // We don't want to constantly refresh a user's cert
            if (!user.certifications[cert.uuid]) {
                user.certifications[cert.uuid] = timestamp_now;
            }
        } else {
            if (user.certifications[cert.uuid]) {
                delete user.certifications[cert.uuid];
            }
        }
    }

    let request = await fetch(`${API}/users/update_user`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api-key": api_key,
            },
            body: JSON.stringify(user)
        }
    );

    if (request.status == 200) {
        console.log("User updated");
        fetchUsers().then(() => {
            for (let key of Object.keys(state.users)) {
                state.users[key].cx_id_str = `${state.users[key].cx_id}`;
            }

            submitUserSearch(editable = true);
        });

        closePopup();
    } else {
        console.log("Error updating user");
    }
}

function showMassAssignRoles() {
    showPopup("mass-assign-roles");

    document.getElementById("mass-assign-roles-save").onclick = () => {
        massAssignRoles();
    }
}

function toggleOnlyStewards() {
    const only_stewards = document.getElementById("only-stewards").checked;

    if (only_stewards) {
        document.getElementById("only-stewards-label").innerText = "Only stewards";
    } else {
        document.getElementById("only-stewards-label").innerText = "All users";
    }

    submitUserSearch(editable = true);
}

async function massAssignRoles() {
    let users_to_update = [];

    const role = document.getElementById("mass-assign-roles-selection").value;
    const identifiers = document.getElementById("mass-assign-roles-text").value.split("\n");
    let errors = [];

    for (let identifier of identifiers) {
        let user = state.users.find(user => String(user.cx_id) === identifier || user.email === identifier || user.uuid === identifier);

        if (user) {
            user.role = role;
            users_to_update.push(user);
        } else {
            errors.push({
                identifier: identifier,
                error: "User not found"
            });
        }
    }


    for (let user of users_to_update) {
        let request = await fetch(`${API}/users/update_user`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "api-key": api_key,
                },
                body: JSON.stringify(user)
            }
        );

        if (request.status != 200) {
            errors.push({
                identifier: user.cx_id,
                error: "Error updating user: " + request.status
            });
        }
    }

    const status = document.getElementById("mass-assign-roles-status");

    if (errors.length == 0) {
        status.innerText = `${users_to_update.length} users updated`;
        fetchUsers().then(() => {
            for (let key of Object.keys(state.users)) {
                state.users[key].cx_id_str = `${state.users[key].cx_id}`;
            }

            submitUserSearch(editable = true);
        });
    }
    else {
        console.log("Error updating users");
        console.log(errors);

        status.innerText = `${users_to_update.length - errors.length} users updated, ${errors.length} errors:`;

        for (let error of errors) {
            status.innerHTML += `<br>${error.identifier}: ${error.error}`;
        }
    }

}

async function pushShiftsAdmin() {
    const response = await fetch(`${API}/shifts/update_shift_schedule`,
        {
            headers: {
                "Content-Type": "application/json",
                "api-key": api_key,
            },
            method: "POST",
            body: JSON.stringify(state.shifts),
        }
    );

    if (response.status == 201) {
        console.log("Shifts updated");
    } else {
        console.log("Error updating shifts");
    }
}

function renderScheduleAdmin() {
    // Generate list of stewards and mark how many shifts they have
    let all_stewards = state.users.filter(user => user.role == "steward" || user.role == "head_steward");

    all_stewards.sort((a, b) => {
        if (a.name < b.name) {
            return -1;
        } else {
            return 1;
        }
    });

    const schedule_audit = document.getElementById("schedule-audit");

    removeAllChildren(schedule_audit);
    appendChildren(schedule_audit, generateScheduleAuditDivs());

    const schedule = document.getElementById("schedule-table");

    removeAllChildren(schedule);
    appendChildren(schedule, generateScheduleDivsAdmin());

    const steward_list = document.getElementById("stewards-list-shifts");

    removeAllChildren(steward_list);
    appendChildren(steward_list, generateStewardShiftList(all_stewards));

    const shift_change_list = document.getElementById("shift-change-list");

    removeAllChildren(shift_change_list);
    appendChildren(shift_change_list, generateShiftChangeList(all_stewards));
}

function generateScheduleAuditDivs() {
    /*

    This function checks the schedule to "audit" it. It looks for the following issues:
    - Stewards working for only one hour at a time
    - Working continuously between 5-7, as they need to eat
    - Working during both training shifts
    - Working outside of their availability
    
    */

    let issues = [];

    // Check for stewards working for only one hour at a time
    const stewards = state.users.filter(user => user.role == "steward" || user.role == "head_steward");

    const shifts = state.shifts;

    for (let steward of stewards) {
        const steward_shifts = shifts.filter(shift => shift.stewards.includes(steward.uuid));

        issues = [...issues, ...checkForOneHourShifts(steward, steward_shifts)];
        issues = [...issues, ...checkForDinnerShifts(steward, steward_shifts)];
        issues = [...issues, ...checkForAvailability(steward, steward_shifts)];
        issues = [...issues, ...checkForTrainingShifts(steward, steward_shifts)];
    }

    const header = document.createElement("tr");
    header.innerHTML = `<th>Steward</th><th>Shift</th><th>Issue</th>`;
    const divs = [header];

    for (let issue of issues) {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${issue.steward.name}</td><td>${issue.shift.day}, ${issue.shift.timestamp_start}-${issue.shift.timestamp_end}</td><td>${issue.issue}</td>`;
        divs.push(row);
    }

    if (issues.length == 0) {
        const row = document.createElement("tr");
        row.innerHTML = "<td colspan='3'>No issues found</td>";
        divs.push(row);
    }

    return divs;
}

function checkForOneHourShifts(steward, shifts) {
    let issues = [];

    for (let shift of shifts) {
        if (!shifts.find(other_shift =>
            other_shift.timestamp_start == shift.timestamp_end || other_shift.timestamp_end == shift.timestamp_start
        )) {
            issues.push({
                steward: steward,
                shift: shift,
                issue: "Steward working for only one hour"
            });
        }
    }

    return issues;
}

function checkForDinnerShifts(steward, shifts) {
    let issues = [];

    for (let day of DAYS) {
        let num_shifts = 0;
        let dinner_shift = null;

        for (let hour = 0; hour < DINNER_END - DINNER_START; hour++) {
            dinner_shift = shifts.find(shift => shift.day == day && shift.timestamp_start == formatHour(hour + DINNER_START));

            if (dinner_shift) {
                num_shifts += 1;
            }
        }

        if (num_shifts >= DINNER_END - DINNER_START) {
            issues.push({
                steward: steward,
                shift: dinner_shift,
                issue: "Steward working continuously during dinner"
            });
        }
    }

    return issues;
}

function checkForTrainingShifts(steward, shifts) {
    let issues = [];

    let training_shifts = 0;

    let shift_to_return = null;

    for (let training of TRAINING_TIMES) {
        let during_training = false;

        for (let time = 0; time < training.end - training.start; time++) {
            let found_shift = shifts.find(shift => shift.day == training.day && shift.timestamp_start == formatHour(time + training.start));

            if (found_shift) {
                during_training = true;
                shift_to_return = found_shift;
                break;
            }
        }

        if (during_training) {
            training_shifts += 1;
        }
    }

    if (training_shifts >= TRAINING_TIMES.length) {
        issues.push({
            steward: steward,
            shift: shift_to_return,
            issue: "Steward working during both training shifts"
        });
    }

    return issues;
}

function checkForAvailability(steward, shifts) {
    let issues = [];

    for (let shift of shifts) {
        if (steward.availability) {
            if (!steward.availability[DAYS.indexOf(shift.day)][unformatHour(shift.timestamp_start)]) {
                issues.push({
                    steward: steward,
                    shift: shift,
                    issue: "Steward working outside of their availability"
                });
            }
        }
    }

    return issues;
}

function updateStewardList() {
    const steward_list = document.getElementById("stewards-list-shifts");

    let all_stewards = state.users.filter(user => user.role == "steward" || user.role == "head_steward");

    all_stewards.sort((a, b) => {
        if (a.name < b.name) {
            return -1;
        } else {
            return 1;
        }
    });

    removeAllChildren(steward_list);
    appendChildren(steward_list, generateStewardShiftList(all_stewards));
}

function generateStewardShiftList(all_stewards) {
    let stewards_hours = {};
    let total_shift_hours = 0;

    for (let shift of state.shifts) {
        for (let uuid of shift.stewards) {
            if (uuid in stewards_hours) {
                stewards_hours[uuid] += 1;
            } else {
                stewards_hours[uuid] = 1;
            }

            total_shift_hours++;
        }
    }

    let end_of_pay_period = document.getElementById("steward-list-date").value;

    let pay_period_hours = null;

    // If it's not set, just skip
    if (end_of_pay_period !== "") {
        pay_period_hours = {};

        // two weeks of hours
        for (let steward of all_stewards) {
            pay_period_hours[steward.uuid] = 2 * (stewards_hours[steward.uuid] ?? 0);
        } f

        let end_date = new Date(end_of_pay_period);
        let two_weeks_before_end = new Date(end_date - 14 * 24 * 60 * 60 * 1000);

        // Filter out shift changes that are after the end of the pay period
        // and before two weeks before the end of the pay period
        let shift_changes_pay_period = state.shift_changes.filter(change => {
            let change_date = new Date(change.date);
            return change_date <= end_date && change_date >= two_weeks_before_end;
        });

        // Now go through the shift changes and add or subtract hours
        for (let change of shift_changes_pay_period) {
            let steward = all_stewards.find(steward => steward.uuid === change.steward);
            if (steward) {
                if (change.is_drop) {
                    pay_period_hours[steward.uuid] -= 1;
                } else {
                    pay_period_hours[steward.uuid] += 1;
                }
            }
        }
    }

    let rows = [];

    let thead = document.createElement("thead");
    let headerRow = document.createElement("tr");

    let headers = ["Name", "CX ID", "Email", "Scheduled Shift Hours", "Pay Period Hours"];
    for (let header of headers) {
        let th = document.createElement("th");
        th.innerText = header;
        headerRow.appendChild(th);
    }

    thead.appendChild(headerRow);
    rows.push(thead);

    for (let steward of all_stewards) {
        let row = document.createElement("tr");

        let nameCell = document.createElement("td");
        nameCell.innerText = steward.name;
        row.appendChild(nameCell);

        let cxIdCell = document.createElement("td");
        cxIdCell.innerText = steward.cx_id;
        row.appendChild(cxIdCell);

        let emailCell = document.createElement("td");
        emailCell.innerText = steward.email;
        row.appendChild(emailCell);

        let hours = stewards_hours[steward.uuid] ?? 0;

        let shiftsCell = document.createElement("td");
        shiftsCell.innerText = `${hours} shift hours`;

        if (hours < 2) {
            shiftsCell.classList.add("not-enough-hours");
        } else if (hours < 5) {
            shiftsCell.classList.add("good-hours");
        } else {
            shiftsCell.classList.add("too-many-hours");
        }

        row.appendChild(shiftsCell);

        let payPeriodCell = document.createElement("td");

        if (pay_period_hours) {
            let difference = pay_period_hours[steward.uuid] - (2 * stewards_hours[steward.uuid])
            let plus = difference >= 0 ? "+" : "";

            payPeriodCell.innerText = `${pay_period_hours[steward.uuid]} worked hours (${plus}${difference})`;
        } else {
            payPeriodCell.innerText = "-";
        }


        row.appendChild(payPeriodCell);

        rows.push(row);
    }


    document.getElementById("total-hours").innerText = total_shift_hours;

    return rows;
}

function generateShiftChangeList(all_stewards) {
    let divs = [];

    let sorted_shifts = state.shift_changes;

    // Sort shift changes by date, so that the newest are at the top
    sorted_shifts.sort((a, b) => {
        let a_date = new Date(a.date);
        let b_date = new Date(b.date);

        if (a_date < b_date) {
            return 1;
        } else {
            return -1;
        }
    });

    for (let change of sorted_shifts) {
        let div = document.createElement("div");
        div.classList.add("shift-change-list-item");

        let date = document.createElement("div");
        date.classList.add("shift-change-list-item-date");
        date.innerText = `${change.date} @ ${change.timestamp_start} - ${change.timestamp_end}`;
        div.appendChild(date);

        let name = document.createElement("div");
        name.classList.add("name");
        // Get steward uuid from change and find steward
        let steward = all_stewards.find(steward => steward.uuid === change.steward) ?? { name: "Unknown steward", email: "Unknown steward", cx_id: "Unknown steward" };
        name.innerText = steward.name;
        div.appendChild(name);

        let cx_id = document.createElement("div");
        cx_id.classList.add("cx_id");
        cx_id.innerText = steward.cx_id;
        div.appendChild(cx_id);

        let email = document.createElement("div");
        email.classList.add("email");
        email.innerText = steward.email;
        div.appendChild(email);

        let drop_or_pickup = document.createElement("div");
        drop_or_pickup.classList.add("drop-or-pickup");
        drop_or_pickup.classList.add(change.is_drop ? "drop" : "pickup");
        drop_or_pickup.innerText = change.is_drop ? "Drop" : "Pickup";
        div.appendChild(drop_or_pickup);

        divs.push(div);
    }

    return divs;
}

function generateScheduleDivsAdmin() {
    let divs = [];

    const time_start = 12;
    const time_end = 24;

    // Append header of days to table
    const header = document.createElement("tr");

    const day_header = document.createElement("th");
    day_header.innerText = "Time";
    header.appendChild(day_header);

    for (let day of DAYS) {
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

        for (let day of DAYS) {
            const cell = document.createElement("td");

            const inner_div = document.createElement("div");
            inner_div.classList.add("schedule-shift");

            const shift = state.shifts.find(shift => shift.day === day && shift.timestamp_start === formatHour(i));

            if (shift) {
                inner_div.classList.add(`stewards-${shift.stewards.length}`);
                for (let uuid of shift.stewards) {
                    const user = state.users.find(user => user.uuid === uuid);

                    if (!user) {
                        console.log(`Scheduled steward with uuid ${uuid} not found`);
                        continue;
                    }

                    if (user.role == "head_steward") {
                        inner_div.classList.add("head-steward");
                    }

                    const user_div = document.createElement("span");
                    user_div.innerText = user.name;
                    user_div.classList.add("steward");

                    inner_div.appendChild(user_div);
                }
            }

            cell.appendChild(inner_div);

            cell.onclick = () => {
                showEditShift(day, i);
            };

            row.appendChild(cell);
        }

        divs.push(row);
    }

    return divs;
}

function showEditShift(day, hour) {
    let shift = state.shifts.find(shift => shift.day === day && shift.timestamp_start === formatHour(hour));

    let all_stewards = state.users.filter(user => user.role === "steward" || user.role === "head_steward");

    // Sort by name
    all_stewards.sort((a, b) => {
        if (a.name < b.name) {
            return -1;
        } else {
            return 1;
        }
    });

    showPopup("edit-shift");

    document.getElementById("edit-shift-day-time").innerText = `${day} @ ${formatHour(hour)}`;
    document.getElementById("show-valid-stewards").onchange = () => {
        showEditShift(day, hour);
    };

    renderShiftStewards(all_stewards, shift, day, hour);
}

function renderShiftStewards(all_stewards, shift, day, hour) {
    const shift_stewards = document.getElementById("edit-shifted-stewards");
    const other_stewards = document.getElementById("edit-unshifted-stewards");

    if (shift == undefined || shift == null) {
        shift = {
            stewards: [],
        };
    }

    let stewards_hours = {};

    for (let shift of state.shifts) {
        for (let uuid of shift.stewards) {
            if (uuid in stewards_hours) {
                stewards_hours[uuid] += 1;
            } else {
                stewards_hours[uuid] = 1;
            }
        }
    }

    removeAllChildren(shift_stewards);
    removeAllChildren(other_stewards);

    // First add all stewards on shift
    for (let uuid of shift.stewards) {
        // Search though users, not just stewards, in case a steward was demoted
        const user = state.users.find(user => user.uuid === uuid);

        shift_stewards.appendChild(generateEditStewardShiftDiv(user, true, day, hour, stewards_hours));
    }

    // "Valid" stewards are stewards who are available 
    const show_valid_stewards = document.getElementById("show-valid-stewards").checked;

    // Then add all stewards not on shift
    for (let user of all_stewards) {
        if (show_valid_stewards) {
            if (user.availability === null) {
                continue;
            }

            let int_day = DAYS.indexOf(day);


            if (user.availability[int_day][hour] === false) {
                continue;
            }
        }

        if (!shift.stewards.includes(user.uuid)) {
            other_stewards.appendChild(generateEditStewardShiftDiv(user, false, day, hour, stewards_hours));
        }
    }
}

function generateEditStewardShiftDiv(user, on_shift, day, hour, stewards_hours) {
    const user_div = document.createElement("div");
    user_div.classList.add("add-remove-steward-info");
    // Append name and cx_id

    let hours_available = 0;

    if (user.availability !== null) {
        for (let i = 0; i < 7; i++) {
            for (let j = 12; j < 24; j++) {
                if (user.availability[i][j] === true) {
                    hours_available++;
                }
            }
        }
    }

    let hours_scheduled = stewards_hours[user.uuid] ?? 0;

    const hours_scheduled_div = document.createElement("span");
    hours_scheduled_div.classList.add("hours-scheduled");
    hours_scheduled_div.innerText = `${hours_scheduled}S`;

    if (hours_scheduled < 2) {
        hours_scheduled_div.classList.add("not-enough-hours");
    } else if (hours_scheduled < 5) {
        hours_scheduled_div.classList.add("good-hours");
    }
    else {
        hours_scheduled_div.classList.add("too-many-hours");
    }

    const hours_available_div = document.createElement("span");
    hours_available_div.classList.add("hours-available");
    hours_available_div.innerText = `${hours_available}A`;

    if (hours_available < 2) {
        hours_available_div.classList.add("not-enough-hours");
    } else if (hours_available < 6) {
        hours_available_div.classList.add("too-many-hours");
    } else {
        hours_available_div.classList.add("good-hours");
    }

    const name = document.createElement("span");
    name.innerText = `${user.name} (${user.email})`;

    if (on_shift) {
        user_div.classList.add("on-shift");

        user_div.onclick = () => {
            deleteStewardFromShift(user.uuid, day, hour);
        }

        user_div.append(name);
        user_div.append(hours_available_div);
        user_div.append(hours_scheduled_div);

    } else {
        user_div.appendChild(hours_scheduled_div);
        user_div.appendChild(hours_available_div);
        user_div.appendChild(name);

        user_div.classList.add("off-shift");

        user_div.onclick = () => {
            addStewardToShift(user.uuid, day, hour);
        }

    }

    return user_div;
}

function addStewardToShift(uuid, day, hour) {
    shifts_updated = true;

    let shift_index = state.shifts.findIndex(shift => shift.day === day && shift.timestamp_start === formatHour(hour));

    if (shift_index === -1) {
        shift = {
            day: day,
            timestamp_start: formatHour(hour),
            timestamp_end: formatHour(hour + 1),
            stewards: [uuid],
        };

        state.shifts.push(shift);
    } else {
        state.shifts[shift_index].stewards.push(uuid);
    }

    showEditShift(day, hour);
}

function deleteStewardFromShift(uuid, day, hour) {
    shifts_updated = true;

    let shift_index = state.shifts.findIndex(shift => shift.day === day && shift.timestamp_start === formatHour(hour));

    if (shift_index === -1) {
        // Something went wrong...
        return;
    }

    let user_index = state.shifts[shift_index].stewards.findIndex(user_uuid => user_uuid === uuid);

    if (user_index === -1) {
        return;
    }

    state.shifts[shift_index].stewards.splice(user_index, 1);

    showEditShift(day, hour);
}

function downloadMailchimp() {
    // Download all users as a CSV formatted as:
    // Email Address, First Name, Last Name
    // Format name of csv as YYYY-MM-DD-mailchimp.csv
    let csv = "Email Address,First Name,Last Name\n";

    for (let user of state.users) {
        csv += `${user.email},${user.name.split(" ")[0]},${user.name.split(" ")[1]}\n`;
    }

    let date = new Date();
    let formatted_date = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

    // Now download the file
    downloadFile(`${formatted_date}-mailchimp.csv`, csv);
}

async function clearAvailability() {
    let result = prompt("Type 'clear' to confirm clearing all availability");

    if (result !== "clear") {
        return;
    }

    let request = await fetch(`${API}/users/clear_all_availability`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api-key": api_key,
            },
        }
    );

    if (request.status == 201) {
        fetchUsers().then(() => {
            submitUserSearch(editable = true);
        });
    } else {
        console.log("Error clearing availability");
    }
}