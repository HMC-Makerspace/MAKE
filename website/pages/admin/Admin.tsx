import AdminLayout from "../../layouts/AdminLayout";
import ImageCarousel from "../../components/ImageCarousel";
import {FILE_RESOURCE_TYPE} from "../../../common/file.ts";

export default function AdminPage() {
    return (
        <AdminLayout pageHref={"/admin"}>
            <h1>Admin Page</h1>
            <ImageCarousel uuid="123e4567-e89b-12d3-a456-426614174003" fileType={FILE_RESOURCE_TYPE.WORKSHOP} editable={true}/>
        </AdminLayout>
    );
}
