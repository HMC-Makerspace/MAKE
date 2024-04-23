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

    await fetchQuizzes();

    const promises = [
        fetchInventory().then(() => {
            submitSearch();
            document.getElementById("inventory-search-input").addEventListener("keyup", submitSearch);
            document.getElementById("room-select").addEventListener("change", submitSearch);
            document.getElementById("tool-material-select").addEventListener("change", submitSearch);
        }),
        fetchSchedule(),
        fetchWorkshops(),
        fetchCheckouts()
    ];
    //fetchPrinters();

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

async function fetchQuizzes() {
    const response = await fetch(`${API}/misc/get_quizzes`);

    if (response.status == 200) {
        const quizzes = await response.json();

        state.quizzes = quizzes;

        saveState();
    } else {
        console.log("Error fetching quizzes");
    }
}

window.onpopstate = onHashChange;

start();