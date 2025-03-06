import AdminLayout from "../../layouts/AdminLayout";
import ImageCarousel from "../../components/ImageCarousel";
import {FILE_RESOURCE_TYPE} from "../../../common/file.ts";

export default function AdminPage() {
    return (
        <AdminLayout pageHref={"/admin"}>
            <h1>Admin Page</h1>
            <ImageCarousel uuid="bdb852ff-5a41-428f-ab1e-7a97a0ba1a6a" fileType={FILE_RESOURCE_TYPE.USER} editable={true}/>

        </AdminLayout>
    );
}
