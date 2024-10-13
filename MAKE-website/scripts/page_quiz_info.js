/*
Quizzes are stored in the following format:
- name: The unique name identifier for the quiz, which is shown in the checkouts page
- description: A brief description of the quiz shown on the quizzes page
- icon: The icon to display next to the quiz name on the quizzes page
- reference: A link to the manual for the quiz
- form: The form id for the quiz, found in the url of the prefilled form after "/d/e/"
- autofills: An array of the autofill ids for the quiz, found in the url of the prefilled form after "entry."

The steps for getting autofill information are:
- Go to the google form that you want to autofill
- Go to options in the top right and click "Get pre-filled link"
- Fill out the form with unique answers for each question you want
  to autofill.
- Click "Get link" and copy the link
- Find the id of the different questions by looking for the answers in the url. It should look like this:
  https://docs.google.com/forms/d/e/1FAIpQLSfJpCxhjoVcismSm_ZekKre-7-FCYPVt7Z6RMTrxb-Oe30cVQ/viewform?usp=pp_url&entry.382887588=My+Name&entry.1395074003=7777&entry.1482318217=test_email@gmail.com

The id's are the numbers after "entry." in the url. In this case, the form questions ask for
name first, then college id, then email, so 382887588 is the id for name, 1395074003 for college id, and 1482318217 for email.

*/
// const quizzes moved to utils.js

function renderQuizInfo() {
    const quiz_container = document.getElementById("quiz-list-container");
    const general_quiz_container = document.getElementById("general-quiz-container");

    let divs = [];

    // Add the general quiz to the general quiz container
    // so it is always at the top and appears larger
    let general_quiz = QUIZ_ID_TO_OBJECT[QUIZ_NAME_TO_ID["General"]];
    if (general_quiz !== undefined) {
        removeAllChildren(general_quiz_container);
        general_quiz_container.appendChild(generateQuizDiv(general_quiz));
    }



    for (let quiz of Object.values(QUIZ_ID_TO_OBJECT)) {
        if (quiz.name === "General") {
            continue;
        }
        // Add all quizzes except General to the normal quiz-list-container
        divs.push(generateQuizDiv(quiz));
    }

    removeAllChildren(quiz_container);
    appendChildren(quiz_container, divs);
}

function generateQuizDiv(quiz) {
    let div = document.createElement("div");
    div.classList.add("quiz-div");

    let name = document.createElement("h2");
    name.innerHTML = `<span class="material-symbols-outlined">${quiz.icon}</span> ${QUIZ_NAME_TO_READABLE[quiz.name]}`;
    div.appendChild(name);

    let description = document.createElement("p");
    description.innerText = quiz.description;
    div.appendChild(description);


    let reference = document.createElement("button");
    reference.innerText = "Manual";
    reference.classList.add("quiz-reference");
    reference.classList.add("big");
    reference.addEventListener("click", () => {
        openInNewTab(quiz.reference);
    });
    div.appendChild(reference);

    let take_quiz = document.createElement("button");
    take_quiz.innerText = "Take Quiz";
    take_quiz.classList.add("quiz-take");
    take_quiz.classList.add("big");
    take_quiz.addEventListener("click", () => {
        openQuiz(quiz);
    });
    div.appendChild(take_quiz);

    if (state.cx_id === null) {
        return div;
    }

    let passed = false;
    for (let timestamp of Object.keys(state.user_object.passed_quizzes)) {
        if (determineValidQuizDate(timestamp)) {
            const quiz_status = QUIZ_ID_TO_NAME[state.user_object.passed_quizzes[timestamp]];
            
            if (quiz_status === quiz.name) {
                passed = true;
                break;
            }
        }
    }

    if (passed) {
        div.classList.add("quiz-passed");
    }


    return div;
}

function openQuiz(quiz) {
    let quiz_link;

    let name = (state.user_object ?? "").name ?? "";
    let cx_id = (state.user_object ?? "").cx_id ?? "";
    let email = (state.user_object ?? "").email ?? "";

    let autofills = [name, cx_id, email];

    quiz_link = `https://docs.google.com/forms/d/e/${quiz.form}/viewform?usp=pp_url`;

    for (let i = 0; i < quiz.autofills.length; i++) {
        quiz_link += `&entry.${quiz.autofills[i]}=${autofills[i]}`;
    }
    
    window.open(encodeURI(quiz_link), "_blank");        
}

function openQuizByName(quiz_name) {
    const quiz = QUIZ_ID_TO_OBJECT[QUIZ_NAME_TO_ID[quiz_name]];
    openQuiz(quiz);
}