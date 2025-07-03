import {
    WrenchScrewdriverIcon,
    CubeIcon,
    BriefcaseIcon,
    RadioIcon,
    MapPinIcon,
    QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import { ITEM_ROLE } from "../../../../../common/inventory";

export default function ItemRoleIcon({ role }: { role: ITEM_ROLE }) {
    if (role === ITEM_ROLE.TOOL) {
        return <WrenchScrewdriverIcon className="size-6" />;
    }
    if (role === ITEM_ROLE.MATERIAL) {
        return <CubeIcon className="size-6" />;
    }
    if (role === ITEM_ROLE.KIT) {
        return <BriefcaseIcon className="size-6" />;
    }
    if (role === ITEM_ROLE.MACHINE) {
        return <RadioIcon className="size-6" />;
    }
    if (role === ITEM_ROLE.AREA) {
        return <MapPinIcon className="size-6" />;
    } else {
        return <QuestionMarkCircleIcon className="size-6" />;
    }
}
