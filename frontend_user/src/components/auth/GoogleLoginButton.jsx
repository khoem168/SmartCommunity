import { useEffect, useRef } from "react";
import { useLanguage } from "../../context/LanguageContext";

const SCRIPT_ID = "google-identity-services";

const GoogleLoginButton = ({ onCredential, onError }) => {
  const containerRef = useRef(null);
  const credentialHandler = useRef(onCredential);
  const errorHandler = useRef(onError);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const { language, t } = useLanguage();

  useEffect(() => {
    credentialHandler.current = onCredential;
    errorHandler.current = onError;
  }, [onCredential, onError]);

  useEffect(() => {
    if (!clientId) return undefined;

    const renderButton = () => {
      if (!window.google?.accounts?.id || !containerRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: ({ credential }) => credentialHandler.current(credential),
        cancel_on_tap_outside: true,
      });
      containerRef.current.replaceChildren();
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: "outline",
        size: "large",
        width: Math.min(containerRef.current.clientWidth || 400, 400),
        text: "continue_with",
        locale: language === "km" ? "km" : "en",
      });
    };

    const existingScript = document.getElementById(SCRIPT_ID);
    if (existingScript) {
      if (window.google?.accounts?.id) renderButton();
      else
        existingScript.addEventListener("load", renderButton, { once: true });
      return undefined;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.addEventListener("load", renderButton, { once: true });
    script.addEventListener(
      "error",
      () => errorHandler.current(t("auth.googleLoadError")),
      { once: true },
    );
    document.head.appendChild(script);
    return undefined;
  }, [clientId, language, t]);

  if (!clientId) {
    return (
      <button type="button" className="btn outline auth-google" disabled>
        {t("auth.googleRequires")}
      </button>
    );
  }

  return <div className="google-button-container" ref={containerRef} />;
};

export default GoogleLoginButton;
