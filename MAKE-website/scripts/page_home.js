async function login() {
    const id = document.getElementById('college-id-input').value ?? "";

    let collegeID = parseCollegeID(id);

    if (collegeID !== null) {
        state.college_id = collegeID;

        await updateUserInfo();

        displayLoggedIn();
    }
}

function logout() {
    state.user_object = null;
    state.college_id = null;

    saveState();

    displayLoggedOut();
}