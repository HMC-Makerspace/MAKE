setInterval(fetchStudentStorage, 100000);
fetchStudentStorage();

async function fetchStudentStorage() {
    if (state.college_id !== null) {
        const response = await fetch(`${API}/student_storage/user/${state.college_id}`);

        if (response.status == 200) {
            const student_storage = await response.json();

            state.student_storage = student_storage;

            saveState();

            renderStudentStorage();
        }
    }
}

function renderStudentStorage() {
    if (state.student_storage === null || state.college_id === null) {
        return;
    }

    const storage = document.getElementById("overall-student-storage");

    removeAllChildren(storage);
    appendChildren(storage, generateStudentStorageDivs(state.student_storage.slots));

}

async function releaseStudentStorage(slot_id) {
    const response = await fetch(`${API}/student_storage/release/${state.college_id}/${slot_id}`, {
        method: "POST"
    });

    if (response.status == 201) {
        await fetchStudentStorage();

        renderStudentStorage();
    }
}

async function renewStudentStorage(slot_id) {
    const response = await fetch(`${API}/student_storage/renew/${state.college_id}/${slot_id}`, {
        method: "POST"
    });

    if (response.status == 201) {
        await fetchStudentStorage();

        renderStudentStorage();
    }
}

function generateStudentStorageDivs(slots) {
    const divs = [];

    for (const slot of slots) {
        const div = document.createElement("div");

        div.classList.add("student-storage-slot");

        let slot_text = "Empty";
        let expire_div = "";

        if (slot.occupied_details !== null) {
            div.classList.add("occupied");

            expire_div += `<div class="student-storage-slot-expire">Expires ${timestampToDate(slot.occupied_details.timestamp_end)}</div>`;

            if (slot.occupied_details.college_id === state.college_id) {
                div.classList.add("user");
                expire_div += `<button onclick="releaseStudentStorage('${slot.id}')">Release</button>
                <button onclick="renewStudentStorage('${slot.id}')">Renew</button>`;
                slot_text = "";
            } else {
                slot_text = `<div class="student-storage-slot-status">Occupied</div>`;
            }
        }


        div.innerHTML = `
            <div class="student-storage-slot-id">${slot.id}</div>
            ${slot_text}
            ${expire_div}
        `;

        divs.push(div);
    }

    return divs;
}