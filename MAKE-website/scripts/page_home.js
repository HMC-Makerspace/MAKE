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
    const logout_button = document.getElementById('logout-button');
    logout_button.setAttribute('disabled', 'disabled');
    
    state.user_object = null;
    state.cx_id = null;

    saveState();

    displayLoggedOut();

    logout_button.removeAttribute('disabled');
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
    showPopup("quick-transfer");

    let request = await fetch(`${API}/users/get_file_list`, {
        method: "POST",
        body: JSON.stringify({
            user_uuid: state.user_object.uuid
        })
    });

    const files = await request.json();

    const usage = document.getElementById("quick-transfer-usage");
    let total_size = 0;
    for (let file of files) {
        total_size += file.size;
    }
    usage.innerHTML = `Log into MAKE on any computer to quickly transfer files.<br>Files will be deleted after 7 days.<br>Drag and Drop!!!!<br><br><b>${bytesToReadable(total_size)} / ${bytesToReadable(2 * 1024 * 1024 * 1024)}</b>`;

    const files_list = document.getElementById("quick-transfer-list");

    let divs = [];
    let header = document.createElement("tr");
    header.innerHTML = "<th>Name</th><th>Size</th><th>Time Left</th><th></th><th></th>";
    divs.push(header);

    // Event listeners to see when user is hovering over the quick transfer div
    const quickTransferDiv = document.getElementById("quick-transfer");
    quickTransferDiv.addEventListener("drop", dropHandler);
    quickTransferDiv.addEventListener("dragover", dragOverHandler);
    quickTransferDiv.addEventListener("dragleave", dragLeaveHandler);

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
        // Use file.timestamp to calculate the expiration date
        let timestamp = new Date(file.timestamp * 1000);
        let expiration_date = new Date(timestamp.getTime() + 7 * 24 * 60 * 60 * 1000);

        let now = new Date();

        let time_left = timeLeft(now, expiration_date);

        date.innerHTML = `${time_left}`;
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

function timeLeft(date_start, date_end) {
    // Calculate the time left between two dates, either in days, hours, or minutes
    const diff = date_end - date_start;

    const days = Math.round(diff / (1000 * 60 * 60 * 24));
    const hours = Math.round(diff / (1000 * 60 * 60));
    const minutes = Math.round(diff / (1000 * 60));

    if (days > 1) {
        return `${days} days`;
    } else if (hours > 1) {
        return `${hours} hours`;
    } else {
        return `${minutes} minutes`;
    }
}

async function fetchAndDownload(uuid) { 
    const request_url = `${API}/users/download_file/${uuid}`;
  
    const element = document.createElement("a"); 
    element.setAttribute("href", request_url); 
    element.setAttribute("download", "");

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
    document.getElementById("quick-transfer-upload").click();
}

async function uploadFiles(event) {
    // open file dialog then upload
    let formData = new FormData();
    const files = event.target.files;
    for (const file of files) {
        if (file === undefined) {
            return;
        }

        // If the size of the file is larger then 1GB, don't allow the upload
        if (file.size > 1024 * 1024 * 1024) {
            alert("File size is too large. Please keep it under 1GB.");
            return;
        }

        document.getElementById("quick-transfer-upload-button").setAttribute("disabled", "disabled");

        formData.append("file", file);
        formData.append("name", file.name);
        formData.append("user_uuid", state.user_object.uuid);

        await fetch(`${API}/users/upload_file`, {
            method: "POST",
            body: formData
        });

        openFilesPopup();
        document.getElementById("quick-transfer-upload-button").removeAttribute("disabled");
    }
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

let noUpload = false;

function dropHandler(event) {
    event.preventDefault();
    if (noUpload) {
        return;
    }
    const files = event.dataTransfer.files;
    handleFiles(files);
    noUpload = true;

    setTimeout(() => {
        noUpload = false;
    }, 500); // Adjust the delay as needed
}

// should probably do like a hover state
function dragOverHandler(event) {
    event.preventDefault();
}

// should probably like do a hover state
function dragLeaveHandler(event) {
    event.preventDefault();
}

function handleFiles(files) {
    if (files.length > 0) {
        uploadFiles({ target: { files } });
    }
}