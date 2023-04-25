renderMD("md/settings.md", "settings").then(() => {
    setTimeout(() => {
        fetchStatus();
    }, 1000);
});

async function fetchStatus() {
    // Time the request
    const start = new Date().getTime();
    let response;

    try {
        response = await fetch(`${API}/misc/status`);
        let end = new Date().getTime();
        if (response.status == 200) {
            const status = await response.json();
    
            const statuses = document.getElementById("statuses");
            console.log(status);
            
            statuses.innerHTML = `
            <div>Alive</div
            <div>[ ✅ ]</div>
            <div>Ping Time</div>
            <div>[ ${end - start}ms ]</div>
            <div>Version</div>
            <div>[ ${status.version} ]</div>
            <div>Inventory Size</div>
            <div>[ ${status.total_items} ]</div>
            <div>Total Checkouts Processed</div>
            <div>[ ${status.total_checkouts} ]</div>
            <div>Total Registered Users</div>
            <div>[ ${status.total_users} ]</div>
            <div>Server Time</div>
            <div>[ ${new Date(status.time * 1000)} ]</div>
            <div>Last Quiz Update</div>
            <div>[ ${new Date(status.last_update * 1000)} ]</div>
    
            `;
        }
    } catch {
        let end = new Date().getTime();
        const statuses = document.getElementById("statuses");

        statuses.innerHTML = `
        <div>Alive</div
        <div>[ ❌ ]</div>
        <div>Ping Time</div>
        <div>[ ${end - start}ms ]</div>
        <div>Version</div>
        <div>[ \`Unknown\` ]</div>
        <div>Inventory Size</div>
        <div>[ \`Unknown\` ]</div>
        <div>Total Checkouts Processed</div>
        <div>[ \`Unknown\` ]</div>
        <div>Total Registered Users</div>
        <div>[ \`Unknown\` ]</div>
        <div>Server Time</div>
        <div>[ \`Unknown\` ]</div>
        <div>Last Quiz Update</div>
        <div>[ \`Unknown\` ]</div>

        `;
    }
}    