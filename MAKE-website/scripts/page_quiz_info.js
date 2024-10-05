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

The correct link for the form (after "/d/e/") can also be found in this url, which is different
from the normal edit link in the url bar when editing the form.
*/
const quizzes = [
    {
        name: "General",
        description: "Provides building and student storage access, permission to work in the Makerspace, and tool checkout ability.",
        icon: "tools_power_drill",
        reference: "https://docs.google.com/document/d/1-pycsGqeUptorvEH-Ti66ssmvKLrtopvLRZ9YNMSMKo/edit",
        form: "1FAIpQLSfW3l2cxem3JwKqX3RJjjhJXKzAdwY9x4dYeXvOATGA-dhWzA",
        autofills: [382887588, 1395074003, 1482318217]
    },
    // Old 3d printer/laser cutter quiz
    // {
    //     name: "Laser3D",
    //     description: "Provides access to the 3D printer / laser cutter room.",
    //     icon: "stylus_laser_pointer",
    //     reference: "https://docs.google.com/document/d/1gDvmQBr8GSX1x4c6m6gHaMW2nl4jzUDritskwbLwQwI/edit",
    //     form: "1FAIpQLSfAZHwVpaI91oPq2PcDnUJt4yjPbwLznU41mMfjJJzyyZ9T7A",
    //     autofills: [382887588, 1395074003, 1482318217]
    // },
    {
        name: "3D",
        description: "Must be completed before gaining access to the 3D Printer/Laser Cutter room.",
        icon: "view_in_ar",
        reference: "https://docs.google.com/document/d/1P8ANYjpi3USbBGqlTxAZjM13yGebQL4fTTedh64FtQI/edit",
        form: "1FAIpQLSfkiVD2PfOYFThht0YOeV7-qUoR_Ot7sU75BUK2EwwOUaFKVA",
        autofills: [382887588, 1395074003, 1482318217]
    },{
        name: "Laser",
        description: "Must be completed before gaining access to the 3D Printer/Laser Cutter room.",
        icon: "stylus_laser_pointer",
        reference: "https://docs.google.com/document/d/1-MjMIR0GWLGws6HAIEd_lilhaoMGJicK_Rhr4bm6DUQ/edit",
        form: "1FAIpQLSfJpCxhjoVcismSm_ZekKre-7-FCYPVt7Z6RMTrxb-Oe30cVQ",
        autofills: [382887588, 1395074003, 1482318217]
    },
    {
        name: "SprayPaint",
        description: "Provides access to the spray paint booth.",
        icon: "colors",
        reference: "https://docs.google.com/document/d/1rWhhCfDzNkxNpQC1f5lGxxvZ7KNCTyGIw4CS1ixTPic/edit",
        form: "1FAIpQLScjlDfT9sXZzq_IbqKTrjn3H2H81B5c7uL9aucRB_rEOLbGMg",
        autofills: [382887588, 1395074003, 1482318217]
    },
    {
        name: "Composite",
        description: "Provides access to the composite room.",
        icon: "layers",
        reference: "https://docs.google.com/document/d/1vf5Pw24-stQF0I0EhXi-4wItHGNquIOZGPalTngE7B8/edit",
        form: "1FAIpQLSfJTAr-E4TT-wYCfgvDqTYdssBY7ZfSLGBOv0oTtZBl_H_PJw",
        autofills: [382887588, 1395074003, 1482318217]
    },
    {
        name: "Welding",
        icon: "bolt",
        description: "Prerequisite to in-person welding training, which is required to use the welding area.",
        reference: "https://docs.google.com/document/d/13k30JUPOOKK707lYuoaa8Pd3ICvUOBFMly4v8zQqU-Y/edit",
        form: "1FAIpQLSet-S7ZIHVRydmc-J_zXSV4knCr50AryDbq0aUv1s5FB2ZGmg",
        autofills: [382887588, 1395074003, 1482318217]
    },
    {
        name: "Studio",
        description: "Provides access to the studio.",
        icon: "camera",
        reference: "https://docs.google.com/document/d/1pqknkaGRO2VQL6vkdeRkVYewqo_WKNh6-tpEloCPW5c/edit",
        form: "1FAIpQLSdikBUUUXV2RMTD1LGdGHcSzVXgzokmguET0vedSR8JqNGm0Q",
        autofills: [382887588, 1395074003, 1482318217]
    },
    {
        name: "Waterjet",
        description: "Required to use the waterjet cutter, located in the 3D printer / laser cutter room.",
        icon: "water_pump",
        reference: "https://docs.google.com/document/d/1a-hPM5qB79ONJ-7k06pvIZVxz1_ONLAD/edit",
        form: "1FAIpQLSev6cU296gQyqFxOxi2LFmJPCDthz_QBMYkP52AbKcr-7HFFg",
        autofills: [382887588, 1395074003, 1482318217]
    },
    {
        name: "Loom",
        description: "Required to use the digital jacquard loom.",
        icon: "view_quilt",
        reference: "https://docs.google.com/document/d/1T7UWdbl9iEGJ31fNZpCOMRPS3_PBd1ioztRqxQduCKY/edit",
        form: "1FAIpQLSdbzUnLeSloX5LDFGJP0tg-8oK3MadUkEaeKOtBy2AZ918g2Q",
        autofills: [1421487221, 216407767, 1881621455]
    }
]

function renderQuizInfo() {
    const quiz_container = document.getElementById("quiz-list-container");
    const general_quiz_container = document.getElementById("general-quiz-container");

    let divs = [];

    // Add the general quiz to the general quiz container
    // so it is always at the top and appears larger
    let general_quiz = quizzes.find(quiz => quiz.name === "General");
    if (general_quiz !== undefined) {
        removeAllChildren(general_quiz_container);
        general_quiz_container.appendChild(generateQuizDiv(general_quiz));
    }



    for (let quiz of quizzes) {
        if (quiz.name === "General") {
            continue;
        }
        // Add all quizzes except General to the normal quiz-list-container
        divs.push(generateQuizDiv(quiz));
    }

    removeAllChildren(quiz_container);
    appendChildren(quiz_container, divs);
}

function renderCertifications() {
    const table = document.getElementById("certifications-info-table");

    const header = "<tr><th>Certification</th><th>Valid?</th></tr>";

    table.innerHTML = header;

    let rows = [];
    for (let cert of state.certifications) {
        let row = document.createElement("tr");
        let name = document.createElement("td");
        name.innerText = cert.name;
        row.appendChild(name);

        let valid = "No";
        if (state.user_object !== null) {
            if (state.user_object.certifications) {
                if (state.user_object.certifications[cert.uuid] !== undefined) {
                    let valid_until = cert.seconds_valid_for + state.user_object.certifications[cert.uuid];
                    valid_until = new Date(valid_until * 1000);

                    if (valid_until >= new Date()) {
                        valid = `Valid until ${valid_until.toLocaleDateString()}`;
                    }
                }
            }
        }

        let valid_td = document.createElement("td");
        valid_td.innerText = valid;
        row.appendChild(valid_td);

        rows.push(row);
    }
    
    appendChildren(table, rows);
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