// Get url parameters
const urlParams = new URLSearchParams(window.location.search);
const status = urlParams.get('status');
const message = urlParams.get('message');

console.log("Error " + status + ": " + message);

renderMD("md/error.md", "error", {
    "status": status,
    "message": message
})