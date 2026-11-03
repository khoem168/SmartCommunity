import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { translations } from "../i18n/translations";

const STORAGE_KEY = "smartCommunityLanguage";
const supportedLanguages = ["en", "km"];
const LanguageContext = createContext(null);

const detectInitialLanguage = () => {
  const queryLanguage = new URLSearchParams(window.location.search).get("lang");
  if (supportedLanguages.includes(queryLanguage)) return queryLanguage;

  const savedLanguage = window.localStorage.getItem(STORAGE_KEY);
  if (supportedLanguages.includes(savedLanguage)) return savedLanguage;

  return "km";
};

const getNestedValue = (source, path) =>
  path.split(".").reduce((value, key) => value?.[key], source);

const interpolate = (value, variables) => {
  if (typeof value !== "string") return value;

  return value.replace(/\{(\w+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(variables, key)
      ? String(variables[key])
      : match,
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider.");
  }
  return context;
};

const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(detectInitialLanguage);

  const setLanguage = useCallback((nextLanguage) => {
    if (!supportedLanguages.includes(nextLanguage)) return;
    setLanguageState(nextLanguage);
  }, []);

  const t = useCallback(
    (key, variables = {}) => {
      const localizedValue = getNestedValue(translations[language], key);
      const fallbackValue = getNestedValue(translations.en, key);
      return interpolate(localizedValue ?? fallbackValue ?? key, variables);
    },
    [language],
  );

  useLayoutEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
    document.documentElement.dir = "ltr";
    document.documentElement.dataset.language = language;
    document.title = translations[language].meta.siteTitle;
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      isKhmer: language === "km",
      setLanguage,
      t,
    }),
    [language, setLanguage, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageProvider;
