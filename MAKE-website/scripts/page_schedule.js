async function fetchSchedule() {
    const response = await fetch(`${API}/schedule`);
    if (response.status == 200) {
        const schedule = await response.json();
        
        state.schedule = schedule;

        console.log(schedule);
        
        renderSchedule(schedule);
    }
}

function renderSchedule(schedule) {
    const schedule_table = document.getElementById("schedule-table");
    
    removeAllChildren(schedule_table);
    
    appendChildren(schedule_table, generateScheduleDivs(schedule));
}