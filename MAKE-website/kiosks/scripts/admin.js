var state = {
    users: null,
};

const API = '/../api/v1';

async function authenticate() {
    // Get api keys from url params
    const params = new URLSearchParams(window.location.search);

    api_key = params.get('api_key');

    if (api_key === null) {
        return;
    }

    console.log(`Authenticating with admin key ${api_key}`);

    setInterval(fetchUsers, 5000);
    await fetchUsers();

    console.log(state.users);
}

authenticate();