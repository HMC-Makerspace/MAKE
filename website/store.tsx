import axios from "axios";
import { create } from "zustand";

type State = {
    user_uuid: string;
    page_index: number;
    setUserUUID: (uuid: string) => void;
    setPage: (page: number) => void;
};

function setUserUUID(uuid: string) {
    axios.defaults.headers.common["requesting_uuid"] = uuid;
    return { user_uuid: uuid };
}

export const useStore = create<State>((set) => ({
    user_uuid: window.localStorage.getItem("requesting_uuid") || "",
    page_index: 0,
    setUserUUID: (uuid: string) => set((state) => setUserUUID(uuid)),
    setPage: (page: number) => set((state) => ({ page_index: page })),
}));
