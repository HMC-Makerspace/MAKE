import React from "react";
import { Alert, Tooltip, TooltipPlacement } from "@heroui/react";
import clsx from "clsx";
import { AnimatePresence } from "framer-motion";

export default function PopupAlert({
    children,
    isOpen,
    placement = "top",
    color = "success",
    description,
    icon,
    className,
}: {
    children?: React.ReactNode;
    isOpen: boolean;
    placement?: TooltipPlacement;
    color?:
        | "default"
        | "primary"
        | "success"
        | "warning"
        | "danger"
        | "secondary";
    description?: string;
    icon?: React.ReactNode;
    className?: string;
}) {
    return (
        <AnimatePresence>
            <Tooltip
                className="bg-none w-full"
                placement={placement}
                isOpen={isOpen}
                content={
                    <Alert
                        color={color}
                        description={description}
                        icon={icon}
                        className={clsx("absolute w-4/5 left-[10%]", className)}
                    />
                }
            >
                {children}
            </Tooltip>
        </AnimatePresence>
    );
}
