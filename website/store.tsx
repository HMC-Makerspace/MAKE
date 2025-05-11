import axios from "axios";
import { create } from "zustand";

type State = {
    user_uuid: string;
    page_index: number;
    setUserUUID: (uuid: string) => void;
    setPage: (page: number) => void;
};

function setUserUUID(uuid: string) {
    window.localStorage.setItem("requesting_uuid", uuid);
    axios.defaults.headers.common["requesting_uuid"] = uuid;
    console.log(
        "Setting axios header",
        axios.defaults.headers.common["requesting_uuid"],
    );
    return { user_uuid: uuid };
}

export const useMAKEStore = create<State>((set) => ({
    user_uuid: window.localStorage.getItem("requesting_uuid") || "",
    page_index: 0,
    setUserUUID: (uuid: string) => set((state) => setUserUUID(uuid)),
    setPage: (page: number) => set((state) => ({ page_index: page })),
}));
