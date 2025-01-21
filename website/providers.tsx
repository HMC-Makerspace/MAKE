import React from "react";

import type { NavigateOptions } from "react-router-dom";

import { HeroUIProvider } from "@heroui/system";
import { useHref, useNavigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";

import {
    QueryClient,
    QueryClientProvider,
    QueryFunctionContext,
} from "@tanstack/react-query";
import axios from "axios";

declare module "@react-types/shared" {
    interface RouterConfig {
        routerOptions: NavigateOptions;
    }
}

const defaultQueryFn = async ({ queryKey }: QueryFunctionContext) => {
    const { data } = await axios.get(`/api/v3/${queryKey.join("/")}`);
    return data;
};

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            queryFn: defaultQueryFn,
        },
    },
});

export function Provider({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();

    return (
        <HeroUIProvider navigate={navigate} useHref={useHref}>
            <ThemeProvider
                attribute="class"
                defaultTheme="dark"
                themes={["dark", "light"]}
            >
                <QueryClientProvider client={queryClient}>
                    {children}
                </QueryClientProvider>
            </ThemeProvider>
        </HeroUIProvider>
    );
}
