import DefaultLayout from "../layouts/Default";
import { ThemeSwitcher } from "../components/ThemeSwitcher";
import { Login } from "../components/user/Login";
import { Button } from "@heroui/react";
import axios from "axios";
import { MAKEUser } from "../components/user/User";
import { useMAKEStore } from "../store";

export default function HomePage() {
    const user_uuid = useMAKEStore((state) => state.user_uuid);
    return (
        <DefaultLayout>
            <div>Welcome to MAKE v3!</div>
            <ThemeSwitcher />
            <Login />
            <Button
                onPress={() => {
                    axios.get("/api/v3/user/self").then((res) => {
                        console.log(res.data);
                    });
                }}
            >
                Log test data
            </Button>
            <MAKEUser user_uuid={user_uuid} />
        </DefaultLayout>
    );
}
