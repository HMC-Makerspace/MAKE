import { Link } from "@heroui/react";
import clsx from "clsx";

export default function MAKE({
    href = "/",
    className = "",
    hover = true,
}: {
    href?: string;
    className?: string;
    hover?: boolean;
}) {
    return (
        <Link
            className={clsx([
                "font-title font-semibold text-5xl",
                "tracking-title indent-[0.175em]",
                "text-background transition-all duration-500",
                hover && "hover:text-foreground-900",
                hover && "hover:tracking-wide hover:indent-0",
                className,
            ])}
            href={href ? href : undefined}
        >
            MAKE
        </Link>
    );
}
