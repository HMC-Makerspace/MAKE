async function login() {
    const id = document.getElementById('college-id-input').value ?? "";

    let collegeID = parseCollegeID(id);

    if (collegeID !== null) {
        state.cx_id = collegeID;

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
    state.cx_id = null;

    saveState();

    displayLoggedOut();
}

function toggleMobileMenu() {
    const menu = document.getElementById('left-bar');

    menu.classList.toggle('show');
}

//document.getElementById('main-title-ani').addEventListener('mouseover', hoverOnRandomFont);
//document.getElementById('main-title-ani').addEventListener('mouseout', hoverOffRandomFont);

function hoverOnRandomFont() {
    const el = document.getElementById('main-title-ani');

    el.style.fontFamily = font_list[Math.floor(Math.random() * font_list.length)];

    // Add timeout
    el.hoverTimeout = setTimeout(() => {
        hoverOnRandomFont();
    }, 500);
}

function hoverOffRandomFont() {
    const el = document.getElementById('main-title-ani');

    el.style.fontFamily = "var(--title-font)";
    
    // Remove timeout if it exists
    if (el.hoverTimeout) {
        clearTimeout(el.hoverTimeout);
    }
}

async function getNowPlaying() {
    const result = await fetch(API + "/now_playing");

    if (result.ok) {
        const data = await result.json();

        let album_art = document.getElementById('music-art');
        let album_title = document.getElementById('music-title');

        if (data === null) {
            album_title.innerText = "Nothing playing";
            return null;
        }

        // Album art is div, not img
        album_art.style.backgroundImage = `url(${data.album.images[0].url})`;
        album_title.innerText = `${data.name} - ${data.artists[0].name}`;

        document.getElementById("top-right-music").style.display = "block";
        document.getElementById("announcement-text").classList.add("music");
    } else {
        return null;
    }
}

async function openFilesPopup() {
    document.getElementById("popup-container").classList.remove("hidden");
    document.getElementById("my-files").classList.remove("hidden");

    let request = await fetch(`${API}/users/get_file_list`, {
        method: "POST",
        body: JSON.stringify({
            user_uuid: state.user_object.uuid
        })
    });

    const files = await request.json();

    const usage = document.getElementById("my-files-usage");
    let total_size = 0;
    for (let file of files) {
        total_size += file.size;
    }
    usage.innerText = `${bytesToReadable(total_size)} / ${bytesToReadable(2 * 1024 * 1024 * 1024)}`;

    const files_list = document.getElementById("my-files-list");

    let divs = [];
    let header = document.createElement("tr");
    header.innerHTML = "<th>Name</th><th>Size</th><th>Date</th><th></th><th></th>";
    divs.push(header);

    for (let file of files) {
        let div = document.createElement("tr");
        div.classList.add("file");

        let name = document.createElement("td");
        name.innerText = file.name;
        div.appendChild(name);

        let size = document.createElement("td");
        size.innerText = bytesToReadable(file.size);
        div.appendChild(size);

        let date = document.createElement("td");
        date.innerHTML = (new Date(Number(file.timestamp) * 1000)).toLocaleString().replace(", ", "&nbsp;");
        div.appendChild(date);

        let download = document.createElement("td");
        let download_button = document.createElement("button");
        download_button.classList.add("only-icon");
        download_button.innerHTML = `<span class="material-symbols-outlined">download</span>`;
        download_button.onclick = async () => {
            download_button.setAttribute("disabled", "disabled");
            await fetchAndDownload(file.uuid);
            download_button.removeAttribute("disabled");
        }

        download.appendChild(download_button);
        div.appendChild(download);

        let delete_file = document.createElement("td");
        let delete_button = document.createElement("button");
        delete_button.classList.add("only-icon");
        delete_button.innerHTML = `<span class="material-symbols-outlined">delete</span>`;
        delete_button.onclick = () => {
            deleteFile(file.uuid);
        }
        
        delete_file.appendChild(delete_button);
        div.appendChild(delete_file);

        divs.push(div);
    }

    if (files.length === 0) {
        let div = document.createElement("tr");
        div.classList.add("file");

        let name = document.createElement("td");
        name.innerText = "No files uploaded";
        name.colSpan = 5;
        div.appendChild(name);

        divs.push(div);
    }

    removeAllChildren(files_list);
    appendChildren(files_list, divs);
}

async function fetchAndDownload(uuid) {
    const request = await fetch(`${API}/users/download_file/${uuid}`);
    // FastAPI responds with: return FileResponse(file_data, media_type="application/octet-stream", filename=file["name"])
    // So we can just download the data directly

    const file = await request.blob();
    // content-disposition
	// attachment; filename*=utf-8''anya%281%29.jpg
    let name = request.headers.get("content-disposition").split("filename")[1];

    name = name.replace("*=utf-8''", "");
    name = name.replace("=", "");
    name = name.replace("\"", "");
    name = name.replace("\'", "");
    name = decodeURI(name);
    
    // Remove the last char if its a _
    if (name[name.length - 1] === "_") {
        name = name.slice(0, -1);
    }
    
    const element = document.createElement("a");
    element.setAttribute("href", URL.createObjectURL(file));
    element.setAttribute("download", name);

    element.style.display = "none";
    document.body.appendChild(element);

    element.click();
}


function bytesToReadable(bytes) {
    const sizes = ["B", "KB", "MB", "GB", "TB"];

    let i = 0;
    while (bytes > 1024) {
        bytes /= 1024;
        i++;
    }

    return `${bytes.toFixed(2)}${sizes[i]}`;
}

function openFile() {
    document.getElementById("my-files-upload").click();
}

async function uploadFile(event) {
    // open file dialog then upload
    const file = event.target.files[0];

    if (file === undefined) {
        return;
    }

    // If the size of the file is larger then 500MB, return
    if (file.size > 500 * 1024 * 1024) {
        alert("File size is too large. Please keep it under 500MB.");
        return;
    }

    document.getElementById("my-files-upload-button").setAttribute("disabled", "disabled");

    let formData = new FormData();
    formData.append("file", file);
    formData.append("name", file.name);
    formData.append("user_uuid", state.user_object.uuid);

    await fetch(`${API}/users/upload_file`, {
        method: "POST",
        body: formData
    });

    openFilesPopup();
    document.getElementById("my-files-upload-button").removeAttribute("disabled");
}

async function deleteFile(uuid) {
    await fetch(`${API}/users/delete_file`, {
        method: "POST",
        body: JSON.stringify({
            user_uuid: state.user_object.uuid,
            file_uuid: uuid
        })
    });

    openFilesPopup();
}