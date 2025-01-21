import React from "react";
import Navbar from "../components/navbar";

// Create a default layout that takes ReactNode as children
export default function DefaultLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative flex flex-col h-screen">
            <Navbar />
            <main className="container mx-auto max-w-7xl flex-grow pl-8 py-4">
                {children}
            </main>
        </div>
    );
}
