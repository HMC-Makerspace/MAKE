import React, { useEffect } from "react";
import clsx from "clsx";
import axios from "axios";
import { Input, Button } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { useLogin } from "../useLogin";
import { useStore } from "../../store";

export function Login() {
    // const { loggedIn, saveLogin } = useLogin();
    const setUserUUID = useStore((state) => state.setUserUUID);
    const user_uuid = useStore((state) => state.user_uuid);
    return (
        <div className="w-fit">
            {!user_uuid ? (
                <Input
                    label="Login"
                    placeholder="Enter user uuid"
                    type="text"
                    onValueChange={(uuid) => {
                        setUserUUID(uuid);
                        // saveLogin(uuid);
                    }}
                ></Input>
            ) : (
                <Button
                    onPress={() => {
                        setUserUUID("");
                    }}
                >
                    Logout
                </Button>
            )}
        </div>
    );
}
