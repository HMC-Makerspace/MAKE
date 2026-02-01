import { useQuery } from "@tanstack/react-query";
import { TUser } from "common/user";
import {
    Button,
} from "@heroui/react";
import { TWorkshopUserRecord } from "common/workshop";

export function WorkshopSigninConfirmation({
    email,
    rsvp_list,
    onYes = () => {},
    onNo = () => {},
}: {
    email: string;
    rsvp_list: TWorkshopUserRecord[];
    onYes?: (uuid?: string) => void;
    onNo?: (uuid?: string) => void;
}) {
    const {
        data: user,
        isLoading: userIsLoading,
        isError: userIsError,
        error: userError,
    } = useQuery<TUser>({
        queryKey: ["user", "by", "email", email],
        refetchOnWindowFocus: false,
        retry: false,
    });

    let RSVPd = false;
    for (let i = 0; i < rsvp_list.length; i++) {
        if (rsvp_list[i].user_uuid == user?.uuid) {
            RSVPd = true;
            break;
        }
    }

    if (userIsLoading) return (<div className="w-fit m-auto text-center">Loading...</div>);

    if (!RSVPd || !user) return (<div className="w-fit m-auto text-center">That user is not on the RSVP list or does not exist.</div>);

    return (<div>
        <div className="w-fit m-auto text-center">
            Found the user {" "}
                <span className="font-bold">{user?.name}</span> {" "}
                (<span className="italic">{user?.email}</span>)
            on the RSVP list. Is this you?
        </div>

        <div className="flex flex-row w-full justify-center">
            <Button onPress={() => onYes(user?.uuid)} className="w-fit min-w-24 mx-1">
                Yes
            </Button>
            <Button onPress={() => onNo(user?.uuid)} className="w-fit min-w-24 mx-1">
                No
            </Button>
        </div>
    </div>);
}
