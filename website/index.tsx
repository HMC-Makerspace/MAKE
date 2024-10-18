import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";

const root = createRoot(document.getElementById("root") ?? document.body);
root.render(
  <StrictMode>
    <h1>Hello</h1>
  </StrictMode>
);