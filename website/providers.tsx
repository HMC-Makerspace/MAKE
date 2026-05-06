import React, { useEffect } from "react";

import type { NavigateOptions } from "react-router-dom";

import { HeroUIProvider } from "@heroui/system";
import { data, useHref, useNavigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { ToastProvider } from "@heroui/react";

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

// Initialize axios with csrf header
axios
    .get("/api/v3/csrf-token", {
        withCredentials: true,
    })
    .then(({ data: csrfData }) => {
        axios.defaults.headers.common["x-csrf-token"] = csrfData.csrfToken;
        axios.defaults.withCredentials = true;
    });

const defaultQueryFn = async ({ queryKey }: QueryFunctionContext) => {
    const { data } = await axios.get(`/api/v3/${queryKey.join("/")}`);
    return data;
};

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            queryFn: defaultQueryFn,
            gcTime: 1000 * 60 * 60, // 1 hour
            refetchOnWindowFocus: false,
            refetchOnMount: false,
        },
    },
});

export function Provider({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();

    return (
        <HeroUIProvider navigate={navigate} useHref={useHref}>
            <ToastProvider
                toastProps={{
                    timeout: 3000,
                    classNames: {
                        title: "overflow-auto text-wrap whitespace-normal",
                    },
                }}
            />
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
