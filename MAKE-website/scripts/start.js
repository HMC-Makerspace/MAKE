async function start() {
    if (state.college_id !== null) {
        displayLoggedIn();
        await updateUserInfo();
    } else {
        displayLoggedOut();
    }

    getNowPlaying();

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

    setInterval(fetchInventory, 100000);
    setInterval(fetchStudentStorage, 10000);
    setInterval(fetchSchedule, 100000);
    //setInterval(fetchPrinters, 10000);

    fetchInventory().then(() => {
        submitSearch();
        document.getElementById("inventory-search-input").addEventListener("keyup", submitSearch);
        document.getElementById("inventory-in-stock").addEventListener("change", submitSearch);
        document.getElementById("room-select").addEventListener("change", submitSearch);
        document.getElementById("tool-material-select").addEventListener("change", submitSearch);
    });
    fetchStudentStorage();
    fetchSchedule();
    fetchWorkshops();
    //fetchPrinters();

    document.getElementById("restock-dialog").addEventListener("click", function (event) {
        if (event.target.id === "restock-dialog") {
            hideRestock()
        }
    });

    document.addEventListener("keydown", function (event) {
        console.log(event.key);
        // If user is not focused on an input, and the user presses the k key, show quick-nav
        if (event.key.toLowerCase() === "k" && document.activeElement.tagName !== "INPUT") {
            toggleQuickNav();
        }
    })

}   

window.onpopstate = onHashChange;

start();