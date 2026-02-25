import { Link as HeroLink } from "@heroui/react";
import clsx from "clsx";
import { Link } from "react-router-dom";

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
        <HeroLink
            className={clsx([
                "font-title font-semibold text-5xl",
                "tracking-title indent-[0.1em]",
                "text-background transition-all duration-500",
                hover && "hover:text-foreground-900 hover:!opacity-100",
                hover && "hover:tracking-wide hover:-indent-[0.075em]",
                className,
            ])}
            as={Link}
            to={href ? href : undefined}
        >
            MAKE
        </HeroLink>
    );
}
