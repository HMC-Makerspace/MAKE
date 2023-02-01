const API = '/../api/v1';

var state = {
    file: null,
    history: {},
    render: null,
}

function dragOverHandler(event) {
    event.preventDefault();

    // Change the style of the drop area
    document.getElementById("display").classList.add("fileover");
}

function dragLeaveHandler(event) {
    event.preventDefault();

    // Change the style of the drop area
    document.getElementById("display").classList.remove("fileover");
}

function openFile() {
    // Open file dialog to pick a image file
    document.getElementById("file-input").click();
}

function loadFile(event) {
    document.getElementById("display").classList.add("loading");

    state.history = {};
    state.file = event.target.files[0];

    renderPreview();
}

function dropHandler(event) {
    document.getElementById("display").classList.remove("fileover");
    document.getElementById("display").classList.add("loading");

    event.preventDefault();
    state.history = {};
    state.file = event.dataTransfer.files[0];

    renderPreview();
}

function renderPreview() {
    // Send image file to server to generate preview with options
    // Encode image as base64 string
    let request = new XMLHttpRequest();
    request.open("POST", API + "/loom/render    ", true);
    request.setRequestHeader("Content-Type", "application/json");

    request.onload = function () {
        if (request.status >= 200 && request.status < 400) {
            // Success!
            let data = JSON.parse(request.responseText);

            const img = document.getElementById("preview");

            state.render = `data:image/png;base64,${data}`;

            img.style.backgroundImage = `url(${state.render})`;

            document.getElementById("display").classList.remove("loading");
            document.getElementById("display").classList.add("preview");
        } else {
            // We reached our target server, but it returned an error
            console.log("Error");
        }
    }

    request.onerror = function () {
        // There was a connection error of some sort
        console.log("Error");
    }

    // Decode image file as base64 string
    let reader = new FileReader();
    reader.readAsDataURL(state.file);
    reader.onload = function () {
        let file_data_base64 = reader.result.split(',')[1];


        let data = {
            file: file_data_base64,
            extension: state.file.name.split('.').pop(),
        }

        request.send(JSON.stringify(data));
        console.log("Sent");
    };
}

function downloadCurrentRender() {
    // Download current render
    const link = document.createElement("a");
    link.download = "loom.png";
    link.href = state.render;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}