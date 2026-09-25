import React from "react";
import { Route, Routes } from "react-router-dom";

// Pages
import HomePage from "./pages/Home";
import CertificationsPage from "./pages/Certifications";
import AreasPage from "./pages/Areas";
import SchedulePage from "./pages/Schedule";
import InventoryPage from "./pages/Inventory";
import WorkshopPage from "./pages/Workshop";
import QuickTransferPage from "./pages/QuickTransfer";

// Kiosks
import AdminKiosk from "./pages/admin/AdminKiosk";
import UsersKiosk from "./pages/admin/UsersKiosk";
import CheckoutsKiosk from "./pages/admin/CheckoutsKiosk";
import CertificationsKiosk from "./pages/admin/CertificationsKiosk";
import RestockKiosk from "./pages/admin/RestockKiosk";
import RolesKiosk from "./pages/admin/RolesKiosk";
import ScheduleKiosk from "./pages/admin/SchedulesKiosk";
import SettingsKiosk from "./pages/admin/SettingsKiosk";
import StatisticsKiosk from "./pages/admin/StatisticsKiosk";
import AreasKiosk from "./pages/admin/AreasKiosk";
import MachinesKiosk from "./pages/admin/MachinesKiosk";
import InventoryKiosk from "./pages/admin/InventoryKiosk";
import WorkshopKiosk from "./pages/admin/WorkshopsKiosk";
import FAQPage from "./pages/FAQ";

const App: React.FC = () => {
    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/certifications">
                <Route index element={<CertificationsPage />} />
                <Route path=":cert_uuid" element={<CertificationsPage />} />
            </Route>
            <Route path="/areas" element={<AreasPage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/workshops" element={<WorkshopPage />} />
            <Route path="/transfer" element={<QuickTransferPage />} />
            <Route path="/faq" element={<FAQPage />} />

            {/* Kiosks */}
            <Route path="/admin" element={<AdminKiosk />} />
            <Route path="/admin/users" element={<UsersKiosk />} />
            <Route path="/admin/checkouts" element={<CheckoutsKiosk />} />
            <Route
                path="/admin/certifications"
                element={<CertificationsKiosk />}
            />
            <Route path="/admin/areas" element={<AreasKiosk />} />
            <Route path="/admin/machines" element={<MachinesKiosk />} />
            <Route path="/admin/roles" element={<RolesKiosk />} />
            <Route path="/admin/schedule" element={<ScheduleKiosk />} />
            <Route path="/admin/settings" element={<SettingsKiosk />} />
            <Route path="/admin/restocks" element={<RestockKiosk />} />
            <Route path="/admin/inventory" element={<InventoryKiosk />} />
            <Route path="/admin/workshops" element={<WorkshopKiosk />} />
            <Route path="/admin/statistics" element={<StatisticsKiosk />} />
        </Routes>
    );
};

export default App;
