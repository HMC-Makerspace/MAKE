import { Tooltip } from "@heroui/react";

import {
    FaceSmileIcon,
    FaceFrownIcon
} from "@heroicons/react/24/outline";

export default function ItemQuantityIcon({
    qtype,
    color = "",
    className = "",
}: {
    qtype: boolean; // true: numerical, false: categorical
    color?: string;
    className?: string;
}) {
    return (
        <Tooltip
            content={`Quantity type: ${qtype ? "numerical :)" : "categorical :("}`}
            className="w-fit p-2"
            delay={500}
            closeDelay={150}
        >
            {getIcon(qtype, color, className)}
        </Tooltip>
    );
}

function getIcon(
    qtype: boolean,
    color: string,
    className: string,
) {
    // in case of future customization
    const strokeWidth = 2;

    return qtype ? (
        <FaceSmileIcon
            className={className}
            strokeWidth={strokeWidth}
            color={color}
        />
    ) : (
        <FaceFrownIcon
            className={className}
            strokeWidth={strokeWidth}
            color={color}
        />
    );
}