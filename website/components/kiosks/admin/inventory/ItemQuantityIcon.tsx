import { Tooltip } from "@heroui/react";

import { CubeTransparentIcon, CubeIcon } from "@heroicons/react/24/outline";

export default function ItemQuantityIcon({
    qtype,
    color = "",
    className = "",
    isDisabled = false,
}: {
    qtype: boolean; // true: numerical, false: categorical
    color?: string;
    className?: string;
    isDisabled?: boolean;
}) {
    return (
        <Tooltip
            content={`Quantity type: ${qtype ? "numerical" : "categorical"}`}
            className="w-fit p-2"
            delay={500}
            closeDelay={150}
            isDisabled={isDisabled}
        >
            {getIcon(qtype, color, className)}
        </Tooltip>
    );
}

function getIcon(qtype: boolean, color: string, className: string) {
    // in case of future customization
    const strokeWidth = 2;

    return qtype ? (
        <CubeIcon
            className={className}
            strokeWidth={strokeWidth}
            color={color}
        />
    ) : (
        <CubeTransparentIcon
            className={className}
            strokeWidth={strokeWidth}
            color={color}
        />
    );
}
