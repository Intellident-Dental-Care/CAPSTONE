import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import { BranchProvider } from "./context/BranchContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BranchProvider>
      <App />
    </BranchProvider>
  </React.StrictMode>
);