import React from "react";
import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/Home";
import AdminPage from "./pages/admin/Admin";
import UsersPage from "./pages/admin/Users";
import CertificationsPage from "./pages/admin/Certifications"
import RestockPage from "./pages/admin/Restock";
import RolesPage from "./pages/admin/Roles";
import SchedulePage from "./pages/admin/Schedules";
import SettingsPage from "./pages/admin/Settings";
import InventoryPage from "./pages/admin/Inventory";

const App: React.FC = () => {
    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/users" element={<UsersPage />} />
            <Route
                path="/admin/certifications"
                element={<CertificationsPage />}
            />
            <Route path="/admin/roles" element={<RolesPage />} />
            <Route path="/admin/schedule" element={<SchedulePage />} />
            <Route path="/admin/settings" element={<SettingsPage />} />
            <Route path="/admin/restocks" element={<RestockPage />} />
            <Route path="/admin/inventory" element={<InventoryPage />} />
        </Routes>
    );
};

export default App;
