import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "components/App"
import "./main.css";

// Create the root element for the ReactDOM to use
const root = createRoot(document.getElementById("root") ?? document.body);
root.render(
  // Render App in strict mode for debugging
  <StrictMode>
    <App />
  </StrictMode>
);