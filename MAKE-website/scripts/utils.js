function parseCollegeID(collegeID) {
    collegeID = collegeID.trim();

    if (collegeID.length == 0) {
        return null;
    }

    if (collegeID.includes("-") || collegeID.includes("_") || collegeID.includes(" ")) {
        collegeID = collegeID.replace(/[_ ]/g, "-");

        return parseInt(collegeID.split("-")[0]);
    } else {
        return parseInt(collegeID);
    }
}

function setPage(page) {
    const all_pages = document.getElementsByClassName("main-content");
    for (let i = 0; i < all_pages.length; i++) {
        all_pages[i].classList.add("hidden");
    }

    const page_element = document.getElementById(`page-${page}`);
    if (page_element) {
        page_element.classList.remove("hidden");

        // Focus for certain pages
        if (page === "inventory") {
            document.getElementById("inventory-search-input").focus();
        }
    }
}

function removeAllChildren(element, keep_first_n = 0) {
    while (element.childNodes.length > keep_first_n) {
        element.removeChild(element.firstChild);
    }
}

function appendChildren(element, children) {
    for (let i = 0; i < children.length; i++) {
        element.appendChild(children[i]);
    }
}

function timestampToDate(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
}

function secondsToHoursMinutes(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    return `${hours}h ${minutes}m`;
}

function toggle_theme() {
	if (document.documentElement.getAttribute("data-theme") != "dark") {
		document.documentElement.setAttribute('data-theme', 'dark');
		localStorage.setItem("theme", "dark");
	}
	else {
		document.documentElement.setAttribute('data-theme', 'light');
		localStorage.setItem("theme", "light");
	}
}
