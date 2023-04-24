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

    // Remove api key from url, but keep the rest of the url
    window.history.replaceState({}, document.title, window.location.pathname);

    // Save api key to local storage
    localStorage.setItem('admin_api_key', api_key);

    console.log(`Authenticating with admin key ${api_key}`);

    setInterval(fetchUsers, 5000);
    setInterval(fetchStudentStorageAdmin, 5000);

    fetchUsers().then(() => {
        for (let key of Object.keys(state.users)) {
            state.users[key].cx_id_str = state.users[key].cx_id.toString();
        }

        submitUserSearch(editable=true);
        document.getElementById("users-search-input").addEventListener("keyup", submitUserSearch, editable=true);
    });
    await fetchStudentStorageAdmin();

    setInterval(renderAll(), 5000);
    renderAll();
    console.log(state.users);
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
    document.getElementById("edit-user-role").value = user.cx_id;        
}

function hidePopup() {
    document.getElementById("popup-container").classList.add("hidden");
    document.getElementById("edit-user").classList.add("hidden");
    document.getElementById("edit-inventory").classList.add("hidden");
    document.getElementById("edit-shift").classList.add("hidden");
}