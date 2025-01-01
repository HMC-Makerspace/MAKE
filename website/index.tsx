import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./main.css";
import App from "./components/App";

const root = createRoot(document.getElementById("root") ?? document.body);
root.render(
    <StrictMode>
        <App />
    </StrictMode>,
);
