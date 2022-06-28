renderQuizPerm();

function renderQuizPerm() {
    if (state.college_id === null) {
        return;
    }

    const auth = document.getElementById("auth-level-text");
    auth.innerText = state.user_object.auth_level;
    auth.classList.add("auth-level-" + state.user_object.auth_level);

    for (let quiz of state.user_object.passed_quizzes) {
        const el = document.getElementById("quiz-" + quiz);
        el.classList.add("quiz-passed");
        const status = el.getElementsByClassName("status")[0];
        status.innerText = "Passed";
        status.classList.add("status-passed");
    }
}