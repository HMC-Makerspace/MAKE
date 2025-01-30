import React from "react";
import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/Home";
import AdminPage from "./pages/admin/Admin";
import UsersPage from "./pages/admin/Users";
import CertificationsPage from "./pages/admin/Certifications"

const App: React.FC = () => {
    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="/admin/certifications" element={<CertificationsPage />} />
        </Routes>
    );
};

export default App;
