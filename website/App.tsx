import React from "react";
import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/Home";
import AdminPage from "./pages/admin/Admin";
import UsersPage from "./pages/admin/Users";
import RolesPage from "./pages/admin/Roles";
import SchedulePage from "./pages/admin/Schedules";

const App: React.FC = () => {
    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="/admin/users/roles" element={<RolesPage />} />
            <Route path="/admin/schedule" element={<SchedulePage />} />
        </Routes>
    );
};

export default App;
