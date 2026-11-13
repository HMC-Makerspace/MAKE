import { Spinner } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { TConfig } from "common/config";
import { createContext, useContext } from "react";

const ConfigContext = createContext<TConfig>({} as TConfig);

export const ConfigProvider = ({ children }: { children: React.ReactNode }) => {
    const { data: config } = useQuery<TConfig>({
        queryKey: ["config"],
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });
    if (!config) {
        return (
            <div
                className={clsx(
                    "h-screen w-screen flex",
                    "items-center justify-center",
                )}
            >
                <Spinner />
            </div>
        );
    }
    return (
        <ConfigContext.Provider value={config}>
            {children}
        </ConfigContext.Provider>
    );
};

export function useConfig() {
    return useContext(ConfigContext);
}
