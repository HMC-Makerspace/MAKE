async function fetchStudentStorage(kiosk_mode=false) {
    if (kiosk_mode) {
        const response = await fetch(`${API}/student_storage/all/${api_key}`);

        if (response.status == 200) {
            const student_storage = await response.json();

            student_storage_state = student_storage;
            
            renderStudentStorage(kiosk_mode);
            
            setPageShown();
        }

        return;
    }

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

function renderStudentStorage(kiosk_mode=false) {
    const storage = document.getElementById("overall-student-storage");

    removeAllChildren(storage);

    if (kiosk_mode) {
        appendChildren(storage, generateStudentStorageDivs(student_storage_state.slots, kiosk_mode=true));   
    } else {
        if (state.student_storage === null || state.college_id === null) {
            return;
        } else {
            appendChildren(storage, generateStudentStorageDivs(state.student_storage.slots));
        }
    }

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

        Toast.fire({
            title: 'Renewed storage slot',
            icon: 'success'
        });
    } else {
        const reason = await response.text();
        Toast.fire({
            title: 'Failed to renew: ' + reason,
            icon: 'error'
        });
    }
}

function generateStudentStorageDivs(slots, kiosk_mode=false) {
    const divs = [];
    let current_group = document.createElement("div");
    current_group.classList.add("student-storage-group");
    let last_group = "A";

    for (const slot of slots) {
        if (!slot.id.startsWith(last_group)) {
            let container = document.createElement("div");
            container.classList.add("student-storage-group-container");
            
            let header = document.createElement("div");
            header.classList.add("student-storage-group-header");
            header.innerText = `Section ${last_group}`;
            container.appendChild(header);

            container.appendChild(current_group);
            divs.push(container);
            
            current_group = document.createElement("div");
            current_group.classList.add("student-storage-group");
            last_group = slot.id.charAt(0);
        }

        const div = document.createElement("div");

        div.classList.add("student-storage-slot");

        let slot_text = "Empty";
        let expire_div = "";
        
        if (slot.occupied_details !== null) {
            div.classList.add("occupied");

            expire_div += `<div class="student-storage-slot-expire">Expires ${timestampToDate(slot.occupied_details.timestamp_end)}</div>`;
            slot_text = `<div class="student-storage-slot-status">Occupied</div>`;

            if (!kiosk_mode) {
                if (slot.occupied_details.college_id === state.college_id) {
                    div.classList.add("user");
                    expire_div += `<button onclick="releaseStudentStorage('${slot.id}')">Release</button>
                    <button onclick="renewStudentStorage('${slot.id}')">Renew (${slot.occupied_details.renewals_left})</button>`;
                    slot_text = "";
                }
            }

        } else if (kiosk_mode) {
            div.addEventListener("click", () => {
                showCheckout(slot.id);
            });
        }


        div.innerHTML = `
            <div class="student-storage-slot-id">${slot.id}</div>
            ${slot_text}
            ${expire_div}
        `;

        current_group.appendChild(div);
    }

    return divs;
}
