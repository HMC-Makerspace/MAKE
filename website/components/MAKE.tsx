import { Link } from "@heroui/react";
import clsx from "clsx";

export default function MAKE({
    href = "/",
    className = "",
}: {
    href?: string;
    className?: string;
}) {
    return (
        <Link
            className={clsx([
                "font-title font-semibold text-5xl",
                "tracking-title pl-2",
                "text-background",
                "dark:text-content1",
                className,
            ])}
            href="/"
        >
            MAKE
        </Link>
    );
}
