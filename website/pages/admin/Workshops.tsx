import AdminLayout from "../../layouts/AdminLayout";
import { TWorkshop } from "common/workshop";
import { useQuery } from "@tanstack/react-query";
import WorkshopTable from "../../components/kiosks/admin/workshops/WorkshopTable";
import React from 'react'

export default function WorkshopPage() {
    // getting workshop data
    const { data, isLoading, isError } = useQuery<TWorkshop[]>({
        queryKey: ["workshop"],
        refetchOnWindowFocus: false,
    });

    return (
        <AdminLayout pageHref={"/admin/workshops"}>
            {isError ? (
            <div className="font-bold text-xl text-danger-400 text-center">
                Error loading restock data
            </div>
        ) : (
            <WorkshopTable workshops={data ?? []}  isLoading={isLoading}/>
        )}
        </AdminLayout>
    );
}