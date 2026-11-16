import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./styles/tokens.css";
import App from "./App.jsx";
import GlobleContext from "./context/GlobleContext.jsx";
import LanguageProvider from "./context/LanguageContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { Analytics } from "@vercel/analytics/react";

// Page-view analytics (Vercel). Query strings are dropped before sending:
// password-reset and email-verification links carry private tokens there.
// Certificate codes in paths are replaced too.
const privacySafeEvent = (event) => {
  const url = new URL(event.url);
  url.search = "";
  if (url.pathname.startsWith("/certificates/")) url.pathname = "/certificates/[code]";
  return { ...event, url: url.toString() };
};

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <GlobleContext>
          <App />
          <Analytics beforeSend={privacySafeEvent} />
        </GlobleContext>
      </LanguageProvider>
    </ThemeProvider>
  </StrictMode>,
);
