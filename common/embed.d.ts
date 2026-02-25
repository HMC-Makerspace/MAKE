import { TDocument } from "./file";
import { UUID } from "./global";
import { UserRoleUUID } from "./user";

export type TEmbed = {
    uuid: UUID;
    title: string;
    src: string;
    visible_to?: UserRoleUUID[] | null;
    documents: TDocument[];
    auto_invert?: boolean;
};

export type THomeEmbed = Omit<TEmbed, "src"> & { src: React.ReactNode };