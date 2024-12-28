export async function tick() {
    return Promise.all([tickFiles(), tickCheckouts()]);
}

async function tickFiles() {}

async function tickCheckouts() {}
