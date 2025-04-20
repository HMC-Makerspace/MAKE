import { Tooltip } from "@heroui/react";

import {
    LockOpenIcon,
    LockClosedIcon,
    ClockIcon,
    NoSymbolIcon
} from "@heroicons/react/24/outline";

import { CERTIFICATION_VISIBILITY } from "../../../../../common/certification";

// An icon of changing form to indicate visibility of a certification
// Lock open icon   : public
// Lock closed icon : private
// Clock icon       : schedule
// No symbol icon   : (invalid visibility)
export default function CVisibilityIcon({
    visibility,
    color="",
    className=""
}: {
    visibility: CERTIFICATION_VISIBILITY | undefined,
    color?: string,
    className?: string
}) {
    
    return (
        <Tooltip
            content={
                `Visibility: ${visibility}`
            }
            className="w-fit p-2"
            delay={500}
            closeDelay={150}
        >
            {getIcon(visibility, color, className)}
        </Tooltip>
    );
}

// Determines which icon to return based on visibility
function getIcon(visibility: CERTIFICATION_VISIBILITY | undefined, color: string, className: string) {
    // in case of future customization
    const strokeWidth = 2.5;

    switch(visibility) {
        case CERTIFICATION_VISIBILITY.PUBLIC:
            return (<LockOpenIcon
                        className={className}
                        strokeWidth={strokeWidth}
                        color={color}
                    />);
        case CERTIFICATION_VISIBILITY.PRIVATE:
            return (<LockClosedIcon
                        className={className}
                        strokeWidth={strokeWidth}
                        color={color}
                    />);
        case CERTIFICATION_VISIBILITY.SCHEDULE:
            return (<ClockIcon
                        className={className}
                        strokeWidth={strokeWidth}
                        color={color}
                    />);
        default: // some accidentally missing visibility
            return (<NoSymbolIcon
                        className={className}
                        strokeWidth={strokeWidth}
                        color={color}
                    />);
    }
}