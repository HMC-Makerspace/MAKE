import { TDocument } from "./file";
import { TUserRoleLog } from "./user";

export type TEmbed = {
    title: string;
    src: string | React.ReactElement;
    authorized_roles?: TUserRoleLog[];
    documents: TDocument[];
    auto_dark?: boolean;
    is_element?: boolean;
};
