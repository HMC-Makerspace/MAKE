import { Card } from "@heroui/react";
// @ts-expect-error Static asset loading using Vite
import brandingImage from "../../../../common/branding.webp";
import clsx from "clsx";
import { useConfig } from "../../../queries/useConfig";

export default function Branding({
    width = 100,
    height = 100,
    className = "",
    href,
}: {
    width?: number;
    height?: number;
    className?: string;
    href?: string;
}) {
    const config = useConfig();
    const brandingHref = href || config.general.branding_url;
    return (
        <Card
            isPressable={!!brandingHref}
            onPress={() =>
                brandingHref ? (window.location.href = brandingHref) : null
            }
            shadow="sm"
            className={clsx("size-fit", className)}
        >
            <img src={brandingImage} width={width} height={height} />
        </Card>
    );
}
