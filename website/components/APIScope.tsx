import React from "react";
import { API_SCOPE_DESCRIPTOR } from "../../common/global";

export default function APIScope({
    descriptor,
    size = "md",
}: {
    descriptor: API_SCOPE_DESCRIPTOR;
    size?: "sm" | "md";
}) {
    return size === "md" ? (
        <div className="flex flex-col h-[45px] w-full py-1">
            <div className="flex flex-row gap-2 items-center">
                <h1 className="text-md font-bold text-foreground-500">
                    {descriptor.label}
                </h1>
                <h2 className="text-xs font-mono text-foreground-200">
                    {descriptor.scope}
                </h2>
            </div>
            <p className="text-sm text-foreground-300">
                {descriptor.description}
            </p>
        </div>
    ) : (
        <div className="rounded-full bg-content3 py-1.5 px-2 text-sm font-medium text-foreground-500">
            {descriptor.label}
        </div>
    );
}
