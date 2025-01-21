import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./main.css";
import App from "./App";
import { Provider } from "./providers";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";

// Setup axios defaults
axios.defaults.headers.common["requesting_uuid"] =
    window.localStorage.getItem("requesting_uuid") ?? "";

const root = createRoot(document.getElementById("root") ?? document.body);
root.render(
    <StrictMode>
        <BrowserRouter>
            <Provider>
                <App />
            </Provider>
        </BrowserRouter>
    </StrictMode>,
);
