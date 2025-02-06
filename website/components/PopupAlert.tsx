import React from "react";
import { Alert } from "@heroui/react";
import { AnimatePresence, motion } from "framer-motion";

export default function PopupAlert({
    isOpen,
    onOpenChange,
    color = "success",
    description,
    icon,
    className,
    timeout = 3000,
}: {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
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
    timeout?: number;
}) {
    // Hide the popup after 3 seconds
    React.useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                onOpenChange(false);
            }, timeout);
        }
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <Alert
                        color={color}
                        description={description}
                        icon={icon}
                        className={className}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
