const quizzes = [
    {
        name: "General",
        description: "Provides building and student storage access, permission to work in the Makerspace, and tool checkout ability.",
        icon: "tools_power_drill",
        reference: "https://docs.google.com/document/d/1-pycsGqeUptorvEH-Ti66ssmvKLrtopvLRZ9YNMSMKo/edit",
        form: "1FAIpQLSfW3l2cxem3JwKqX3RJjjhJXKzAdwY9x4dYeXvOATGA-dhWzA",
        autofills: [382887588, 1395074003, 1482318217]
    },
    {
        name: "Laser3D",
        description: "Provides access to the 3D printer / laser cutter room.",
        icon: "stylus_laser_pointer",
        reference: "https://docs.google.com/document/d/1gDvmQBr8GSX1x4c6m6gHaMW2nl4jzUDritskwbLwQwI/edit",
        form: "1FAIpQLSfAZHwVpaI91oPq2PcDnUJt4yjPbwLznU41mMfjJJzyyZ9T7A",
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

    let divs = [];

    for (let quiz of quizzes) {
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