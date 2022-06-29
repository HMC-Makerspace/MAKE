async function start() {
    if (state.college_id !== null) {
        displayLoggedIn();
        await updateUserInfo();
    } else {
        displayLoggedOut();
    }
}

start();