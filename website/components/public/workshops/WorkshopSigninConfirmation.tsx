import { useQuery } from "@tanstack/react-query";
import { TUser } from "common/user";
import {
    Button,
} from "@heroui/react";
import { TWorkshopUserRecord } from "common/workshop";

export function WorkshopSigninConfirmation({
    email,
    rsvp_list,
    capacity,
    onSubmit = () => {},
    onCancel = () => {},
}: {
    email: string;
    rsvp_list: TWorkshopUserRecord[];
    capacity?: number;
    onSubmit?: (uuid?: string) => void;
    onCancel?: (uuid?: string) => void;
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

    const RSVP_index = rsvp_list.findIndex((r) => r.user_uuid === user?.uuid);
    const RSVPd = RSVP_index !== -1;

    let header = <></>;
    let footer = (
        <div className="flex flex-row w-full justify-between">
            <Button
                variant="shadow"
                color="primary"
                onPress={() => onSubmit(user?.uuid)}
                className="w-fit min-w-24 mx-1"
            >
                Sign In
            </Button>
            <Button
                variant="flat"
                color="danger"
                onPress={() => onCancel(user?.uuid)}
                className="w-fit min-w-24 mx-1"
            >
                Cancel
            </Button>
        </div>
    );

    if (userIsLoading) {
        header = <div className="w-fit m-auto text-center">Loading...</div>;
        footer = <></>;
    } else if (!user) {
        header = (
            <div className="w-fit m-auto text-center">
                No user found by email
                <br />
                <span className="italic text-secondary-500 text-lg">
                    {email}
                </span>
                <br />
                Please login to create an account.
            </div>
        );
        footer = <></>;
    } else if (!RSVPd) {
        header = (
            <div className="w-fit m-auto text-center">
                <div className="text-lg">
                    <span className="font-bold text-secondary-500 text-lg">
                        {user?.name}
                    </span>{" "}
                    <br />(
                    <span className="italic text-secondary-500 text-lg">
                        {user?.email}
                    </span>
                    )
                </div>
                is not on the RSVP list or waitlist for this workshop.
                <br />
                <div className="py-2 underline">
                    Users on the RSVP and waitlist will be given priority.
                </div>
                <span>Would you still like to sign in?</span>
            </div>
        );
    } else {
        header = (
            <div className="w-fit m-auto text-center">
                <span className="font-bold text-primary-500">{user?.name}</span>
                <br /> (
                <span className="italic text-primary-500">{user?.email}</span>)
                <br />
                is on the{" "}
                {!capacity || RSVP_index < capacity ? "RSVP list" : "wait list"}
                .
            </div>
        );
    }
    return (
        <>
            {header}
            {footer}
        </>
    );
}
