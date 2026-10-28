import { useQuery } from "@tanstack/react-query";
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
        return children;
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
