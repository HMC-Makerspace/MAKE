import { useState } from "react";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";

export function useLogin() {
    const queryClient = useQueryClient();

    const isLoggedIn = () => {
        return window.localStorage.getItem("logged_in") === "true";
    };

    const [loggedIn, setLoggedIn] = useState(isLoggedIn());

    const saveLogin = (uuid: string) => {
        if (uuid) {
            axios.defaults.headers.common["requesting_uuid"] = uuid;
            queryClient.invalidateQueries();
            queryClient.setQueryData(["login"], true);
            setLoggedIn(true);
        } else {
            axios.defaults.headers.common["requesting_uuid"] = "";
            queryClient.invalidateQueries();
            queryClient.setQueryData(["login"], false);
            setLoggedIn(false);
        }
    };

    return {
        loggedIn,
        saveLogin,
    };
}
