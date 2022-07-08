async function login() {
    const id = document.getElementById('college-id-input').value ?? "";

    let collegeID = parseCollegeID(id);

    if (collegeID !== null) {
        state.college_id = collegeID;

        const result = await updateUserInfo();

        if (result) {
            displayLoggedIn();
        } else {
            displayLoginError();
        }
    }
}

function displayLoginError() {
    const login_error = document.getElementById('login-error');

    login_error.classList.remove('hidden');
}

function hideLoginError() {
    const login_error = document.getElementById('login-error');

    login_error.classList.add('hidden');    
}

function logout() {
    state.user_object = null;
    state.college_id = null;

    saveState();

    displayLoggedOut();
}