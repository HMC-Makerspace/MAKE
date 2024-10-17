async function start() {
    if (state.cx_id !== null) {
        displayLoggedIn(start=true);
        await updateUserInfo();
    } else {
        displayLoggedOut(start=true);
    }

    //animateChangeFonts();

    
    renderQuizInfo();
    renderCheckouts();
    renderEquipment();

    // Url param, get page
    const url_params = new URLSearchParams(window.location.search);
    const page = url_params.get("p");
    if (page !== null) {
        setPage(page);
    }

    await fetchQuizIDs();

    const promises = [
        fetchInventory().then(() => {
            submitSearch(kiosk_mode = false);
            // While kiosk_mode = false is the default value, we explicitly set it here
            // to make it clear that we are not in kiosk mode. Further, we can't just use
            // submitSearch as the callback function because then the keyboard event
            // is passed to the function, which incorrectly overrides the kiosk_mode value.
            document.getElementById("inventory-search-input").addEventListener("keyup", () => { submitSearch(kiosk_mode = false) });
            document.getElementById("container-input").addEventListener("keyup", () => { submitSearch(kiosk_mode = false) });
            document.getElementById("room-select").addEventListener("change", () => { submitSearch(kiosk_mode = false) });
            document.getElementById("tool-material-select").addEventListener("change", () => { submitSearch(kiosk_mode = false) });
        }),
        fetchSchedule(),
        fetchWorkshops(),
        fetchCheckouts(),
        fetchPrinters(),
    ];

    document.addEventListener("keydown", function (event) {
        // If user is not focused on an input, and the user presses the k key, show quick-nav
        if (event.key.toLowerCase() === "k" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
            showPopup("quick-nav");
        }
    })

    // Register esc to close popup
    document.addEventListener("keyup", (e) => {
        if (e.key === "Escape") {
            closePopup();
        }
    });

    document.getElementById("page-schedule").addEventListener("click", (e) => {
        // If the target does not contain class "proficiency", return
        if (e.target.classList.contains("steward") || e.target.classList.contains("proficiency")) {
            return;
        }
        removeHighlightProficiency();
    });
        
    // Hide fader
    document.getElementById("fader").classList.add("fade-out");
    document.getElementById("main-title-ani").classList.add("show");

    // Await all promises
    await Promise.all(promises);
}

async function fetchQuizIDs() {
    const response = await fetch(`${API}/misc/get_quiz_ids`);

    if (response.status == 200) {
        const quiz_ids = await response.json();

        state.quiz_ids = quiz_ids;

        saveState();
    } else {
        console.log("Error fetching quizzes");
    }
}

window.onpopstate = onHashChange;

start();