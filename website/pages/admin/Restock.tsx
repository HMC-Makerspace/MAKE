import AdminLayout from "../../layouts/AdminLayout";
import RestockTable from "../../components/kiosks/admin/restock/RestockTable";
import { useQuery } from "@tanstack/react-query";
import { TRestockRequest } from "../../../common/restock";

export default function RestockPage() {
    // getting restock data
    const { data, isLoading, isError } = useQuery<TRestockRequest[]>({
        queryKey: ["restock"],
        refetchOnWindowFocus: false,
    });

    return (
        <AdminLayout pageHref={"/admin/restocks"}>
            {isError ? (
                <div className="font-bold text-xl text-danger-400 text-center">
                    Error loading restock data
                </div>
            ) : (
                <RestockTable restocks={data ?? []} isLoading={isLoading} />
            )}
        </AdminLayout>
    );
}
