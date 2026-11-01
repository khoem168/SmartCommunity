import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./styles/tokens.css";
import App from "./App.jsx";
import GlobleContext from "./context/GlobleContext.jsx";
import LanguageProvider from "./context/LanguageContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <GlobleContext>
          <App />
        </GlobleContext>
      </LanguageProvider>
    </ThemeProvider>
  </StrictMode>,
);
