import AdminLayout from "../../layouts/AdminLayout";
import RestockTable from "../../components/kiosks/admin/restock/RestockTable";
import { useQuery } from "@tanstack/react-query";
import { TRestockRequest } from "../../../common/restock";
import { TArea } from "common/area";
import { TCertification } from "common/certification";

export default function RestockKiosk() {
    // getting restock data
    const { data: restocks, isLoading, isError } = useQuery<TRestockRequest[]>({
        queryKey: ["restock"],
        refetchOnWindowFocus: false,
    });

    const { data: areas, isLoading: areasLoading } = useQuery<TArea[]>({
        queryKey: ["area"],
        refetchOnWindowFocus: false,
    });

    const { data: certs, isLoading: certsLoading } = useQuery<TCertification[]>(
        {
            queryKey: ["certification"],
            refetchOnWindowFocus: false,
        },
    );

    return (
        <AdminLayout pageHref={"/admin/restocks"}>
            {isError ? (
                <div className="font-bold text-xl text-danger-400 text-center">
                    Error loading restock data
                </div>
            ) : (
                <RestockTable restocks={restocks ?? []} areas={areas ?? []} certs={certs ?? []} isLoading={isLoading} />
            )}
        </AdminLayout>
    );
}
