import { Button, Card, Image, Link } from "@heroui/react";
// @ts-expect-error Static asset loading using Vite
import brandingUrl from "../../common/branding.webp";
import clsx from "clsx";

export default function Branding({
    width = 100,
    height = 100,
    className = "",
    href = "https://www.hmc.edu",
}: {
    width?: number;
    height?: number;
    className?: string;
    href?: string;
}) {
    return (
        <Card
            isPressable={!!href}
            onPress={() => (href ? (window.location.href = href) : null)}
            shadow="sm"
            className={clsx("size-fit", className)}
        >
            <Image src={brandingUrl} width={width} height={height} />
        </Card>
    );
}
