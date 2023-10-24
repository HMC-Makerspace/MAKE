function toggleSelf(event, el) {
    // If the event was triggered by a child element that is a "a" or a "button", return
    if (event.target !== el) {
        if (event.target.tagName === "A" || event.target.tagName === "BUTTON") {
            return;
        }
    }

    // Close all other open faq
    const faq_list = document.getElementsByClassName("faq-question");

    for (const faq of faq_list) {
        if (faq !== el) {
            faq.classList.remove("open");
        }
    }

    el.classList.toggle("open");
}

function addOnclickToAll() {
    const faq_list = document.getElementsByClassName("faq-question");

    for (const faq of faq_list) {
        faq.addEventListener("click", (event) => {
            toggleSelf(event, faq);
        });
    }
}

addOnclickToAll();