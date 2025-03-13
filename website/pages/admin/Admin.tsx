import AdminLayout from "../../layouts/AdminLayout";
import ImageCarousel from "../../components/ImageCarousel";
import {FILE_RESOURCE_TYPE} from "../../../common/file.ts";

export default function AdminPage() {
    return (
        <AdminLayout pageHref={"/admin"}>
            <h1>Admin Page</h1>
            <ImageCarousel uuid="a1b2c3d4-1234-5678-90ab-cdef12345678" fileType={FILE_RESOURCE_TYPE.WORKSHOP} editable={true}/>
            <ImageCarousel uuid="a20759224c244439a309e69c5825e572" fileType={FILE_RESOURCE_TYPE.USER} editable={true}/>
        </AdminLayout>
    );
}
