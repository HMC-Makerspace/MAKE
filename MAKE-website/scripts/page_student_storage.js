setInterval(fetchStudentStorage, 100000);
fetchStudentStorage().then(() => {
    renderStudentStorage();
});

async function fetchStudentStorage() {
    if (state.college_id !== null) {
        const response = await fetch(`${API}/student_storage/user/${state.college_id}`);

        if (response.status == 200) {
            const student_storage = await response.json();

            state.student_storage = student_storage;

            saveState();
        }
    }
}

function renderStudentStorage() {
    if (state.student_storage !== null && state.college_id !== null) {
        const current_storage = document.getElementById("current-student-storage-status");
        const other_storage = document.getElementById("overall-student-storage-status");

        const user_slots = state.student_storage.slots.filter(slot => {
            if (slot.occupied_details !== null) {
                return slot.occupied_details.user_id === state.college_id;
            } else {
                return false;
            }
        });

        
    }
}