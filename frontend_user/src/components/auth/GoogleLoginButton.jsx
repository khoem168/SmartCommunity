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
      <button
        type="button"
        className="ios-google-pill-btn"
        onClick={() => {
          errorHandler.current(
            language === "km"
              ? "ការចូលដោយ Google ត្រូវការបញ្ចូល VITE_GOOGLE_CLIENT_ID នៅក្នុងឯកសារ .env។ សូមប្រើអ៊ីមែល និងពាក្យសម្ងាត់ដើម្បីចូល។"
              : "Google Login requires VITE_GOOGLE_CLIENT_ID in .env. Please use email and password to sign in."
          );
        }}
      >
        <svg className="google-icon-svg" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
        </svg>
        <span>{language === "km" ? "បន្តជាមួយ Google" : "Continue with Google"}</span>
      </button>
    );
  }

  return <div className="google-button-container" ref={containerRef} />;
};

export default GoogleLoginButton;
