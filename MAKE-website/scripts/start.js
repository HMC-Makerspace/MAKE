async function start() {
    if (state.cx_id !== null) {
        displayLoggedIn();
        await updateUserInfo();
    } else {
        displayLoggedOut();
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
        if (event.key.toLowerCase() === "k" && document.activeElement.tagName !== "INPUT") {
            document.getElementById("quick-nav").classList.remove("hidden");
            document.getElementById("popup-container").classList.remove("hidden");
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

    // Await all promises
    await Promise.all(promises);

    // Hide fader
    document.getElementById("fader").classList.add("fade-out");
}   

window.onpopstate = onHashChange;

start();