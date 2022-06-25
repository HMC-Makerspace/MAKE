async function login() {
    const id = document.getElementById('college-id-input').value ?? "";

    let collegeID = parseCollegeID(id);

    if (collegeID !== null) {
        const response = await fetch(`${API}/user_info/${collegeID}`);

        if (response.status == 200) {
            const user_object = await response.json();

            state.user_object = user_object;

            state.college_id = user_object.college_id;

            console.log(state.user_object);

            saveState();

            displayLoggedIn();
        }
    }
}

function logout() {
    state.user_object = null;
    state.college_id = null;

    saveState();

    displayLoggedOut();
}