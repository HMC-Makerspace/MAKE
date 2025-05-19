import AdminLayout from "../../layouts/AdminLayout";
import { Spinner } from "@heroui/react";
import { TWorkshop } from "common/workshop";
import { TCertification } from "common/certification";
import { TUser, TUserRole } from "common/user";


import { useQuery } from "@tanstack/react-query";
import WorkshopTable from "../../components/kiosks/admin/workshops/WorkshopTable";
import React from 'react'

export default function WorkshopPage() {
    // getting workshop data
    const { data: workshops, isLoading: workshopsLoading, isError } = useQuery<TWorkshop[]>({
        queryKey: ["workshop"],
        refetchOnWindowFocus: false,
    });

    // Get all user data
    const { data: users, isLoading: usersLoading } = useQuery<TUser[]>({
        queryKey: ["user"],
        refetchOnWindowFocus: false,
    });

    // Get all certification data
    const { data: certs, isLoading: certsLoading } = useQuery<TCertification[]>({
        queryKey: ["certification"],
        refetchOnWindowFocus: false,
    });

    const { data: roles, isLoading: rolesLoading } = useQuery<TUserRole[]>({
        queryKey: ["user", "role"],
        refetchOnWindowFocus: false,
    });

    if (
        workshops === undefined ||
        certs === undefined ||
        users === undefined ||
        roles === undefined ||
        workshopsLoading ||
        certsLoading ||
        usersLoading ||
        rolesLoading
    ) {
        return (
            <div className="w-full h-screen flex justify-center py-auto">
                <Spinner />
            </div>
        );
    }
    
    return (
        <AdminLayout pageHref={"/admin/workshops"}>
            {isError ? (
            <div className="font-bold text-xl text-danger-400 text-center">
                Error loading restock data
            </div>
        ) : (
            <WorkshopTable 
                workshops={workshops ?? []}  
                isLoading={workshopsLoading}
                users={users}
                certs={certs}
                roles={roles}
            />
        )}
        </AdminLayout>
    );
}