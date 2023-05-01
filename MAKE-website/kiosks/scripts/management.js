var state = {
    users: null,
    student_storage: null,
    workshops: null,
    shifts: null,
    inventory: null,
};

const API = '/api/v2';

document.documentElement.setAttribute('data-theme', 'dark');
localStorage.setItem("theme", "dark");

async function authenticate() {
    // Get api keys from url params
    const params = new URLSearchParams(window.location.search);

    api_key = params.get('api_key') ?? localStorage.getItem('admin_api_key');

    if (api_key === null) {
        alert("No API key provided.");
    }

    // Fetch api scope
    const response = await fetch(`${API}/misc/api_key_scope`,
        {
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ api_key: api_key }),
            method: "POST",
        }
    );

    if (response.status == 200) {
        const body = await response.json();

        if (body.scope == "admin") {
            console.log("Authenticated as admin");
        } else {
            alert("API key does not have admin scope.");
        }
    } else {
        alert("Invalid API key.");
    }

    // Remove api key from url, but keep the rest of the url
    window.history.replaceState({}, document.title, window.location.pathname);

    // Save api key to local storage
    localStorage.setItem('admin_api_key', api_key);

    setInterval(fetchUsers, 5000);
    setInterval(fetchStudentStorageAdmin, 5000);

    fetchUsers().then(() => {
        for (let key of Object.keys(state.users)) {
            state.users[key].cx_id_str = state.users[key].cx_id.toString();
        }

        submitUserSearch(editable = true);
        document.getElementById("users-search-input").addEventListener("keyup", submitUserSearch, editable = true);
    });
    await fetchStudentStorageAdmin();

    setInterval(renderAll(), 5000);
    renderAll();
}

authenticate();

async function fetchStudentStorageAdmin() {
    const response = await fetch(`${API}/student_storage/get_student_storage`,
        {
            headers: {
                "Content-Type": "application/json",
                "api-key": api_key,
            },
        }
    );

    if (response.status == 200) {
        const student_storage = await response.json();

        state.student_storage = student_storage;

        console.log(state.student_storage);
    }
}

function renderAll() {
    renderStudentStorage();
}


function showEditUser(uuid) {
    let user = state.users.find(user => user.uuid === uuid);

    document.getElementById("popup-container").classList.remove("hidden");
    document.getElementById("edit-user").classList.remove("hidden");

    document.getElementById("edit-user-name").value = user.name;
    document.getElementById("edit-user-email").value = user.email;
    document.getElementById("edit-user-cx_id").value = user.cx_id;
    document.getElementById("edit-user-role").value = user.role;

    document.getElementById("edit-user-save").onclick = () => {
        saveUser(uuid);
    }
}

async function saveUser(uuid) {
    let user = {
        uuid: uuid,
        name: document.getElementById("edit-user-name").value,
        email: document.getElementById("edit-user-email").value,
        cx_id: Number(document.getElementById("edit-user-cx_id").value),
        role: document.getElementById("edit-user-role").value,
    }

    let request = await fetch(`${API}/users/update_user`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api-key": api_key,
            },
            body: JSON.stringify(user)
        }
    );

    if (request.status == 200) {
        console.log("User updated");
        fetchUsers().then(() => {
            for (let key of Object.keys(state.users)) {
                state.users[key].cx_id_str = state.users[key].cx_id.toString();
            }
    
            submitUserSearch(editable = true);
        });

        closePopup();
    } else {
        console.log("Error updating user");
    }
}

function closePopup() {
    document.getElementById("popup-container").classList.add("hidden");
    const content = document.getElementById("popup-content");

    for (let child of content.children) {
        child.classList.add("hidden");
    }
}