import { TUser } from "../../../../../common/user";
import { useQuery } from "@tanstack/react-query";
import React from "react";

export default function RestockUser({ user_uuid }: { user_uuid: string }) {
    const { data, isSuccess, isError } = useQuery<TUser>({
        queryKey: ["user", user_uuid],
    });

    return (
        <div className="flex flex-col">
            <h2 className="text-x1">{data?.name}</h2>
            <h3>{data?.email}</h3>
        
        </div>
    );
}