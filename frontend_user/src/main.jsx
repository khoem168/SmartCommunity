import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import GlobleContext from "./context/GlobleContext.jsx";
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GlobleContext>
      <App />
    </GlobleContext>
  </StrictMode>,
);
