var student_storage_key = null;
var student_storage_state = null;
var first_render = true;

const API = '/../api/v1';

async function authenticate() {
    // Get api keys from url params
    const params = new URLSearchParams(window.location.search);

    student_storage_key = params.get('api_key');

    if (student_storage_key === null) {
        return;
    }

    console.log(`Authenticating with student storage key ${student_storage_key}`);

    setInterval(fetchStudentStorage, 5000, kiosk_mode=true);

    fetchStudentStorage(kiosk_mode=true);
}

authenticate();
