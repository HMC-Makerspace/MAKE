renderMD("md/settings.md", "settings").then(() => {
    setTimeout(() => {
        fetchStatus();
    }, 100);
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
            console.log(status);

            document.getElementById("announcement-text").innerHTML = status.motd;
            document.getElementById("status").classList.add(status.is_open ? "open" : "closed");
            document.getElementById("open-closed").innerText = status.is_open ? "OPEN" : "CLOSED";

            const num_stewards = document.getElementById("num-stewards");

            // Get current number of stewards
            let now = new Date();
        
            let day = now.getDay();
            // Monday is 0, Sunday is 6
            if (day == 0) {
                day = 6;
            } else {
                day -= 1;
            }
        
            // Get current hour
            let hour = now.getHours();
        
            const current_shift = state.schedule.find((shift) => shift.day == DAYS[day] && formatHour(hour) == shift.timestamp_start);
        
            let num = 0;
        
            if (current_shift) {
                num = current_shift.stewards.length;
            }
            
            if (status.stewards_on_duty) {
                num_stewards.innerText = `${num} steward${num == 1 ? "" : "s"}`
            } else {
                num_stewards.innerText = `0 stewards`;
            }

        }
    } catch (error) {
        console.error(error);
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