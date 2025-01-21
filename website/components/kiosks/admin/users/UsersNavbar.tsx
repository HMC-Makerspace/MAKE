import { Button, Card } from "@heroui/react";

export default function UsersNavbar() {
    return (
        <Card className="flex-row justify-between items-center p-2">
            <h1 className="text-2xl font-semibold">Users</h1>
            <Button color="primary" variant="shadow" href="/admin/users/create">
                Create User
            </Button>
        </Card>
    );
}
