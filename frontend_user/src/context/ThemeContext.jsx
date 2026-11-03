import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ConfigProvider, theme as antdTheme } from "antd";

const STORAGE_KEY = "smartCommunityTheme";
const ThemeContext = createContext(null);

const detectInitialTheme = () => {
  if (typeof window === "undefined") return "light";

  const savedTheme = window.localStorage.getItem(STORAGE_KEY);
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return "light";
};

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(detectInitialTheme);

  const applyThemeToDOM = useCallback((newTheme) => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.theme = newTheme;
    document.documentElement.setAttribute("data-theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const setTheme = useCallback(
    (newTheme) => {
      const nextTheme = newTheme === "dark" ? "dark" : "light";
      setThemeState(nextTheme);
      try {
        window.localStorage.setItem(STORAGE_KEY, nextTheme);
      } catch {
        // localStorage not accessible
      }
      applyThemeToDOM(nextTheme);
    },
    [applyThemeToDOM],
  );

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme, applyThemeToDOM]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => {
      const savedTheme = window.localStorage.getItem(STORAGE_KEY);
      if (!savedTheme) {
        setTheme(e.matches ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [setTheme]);

  // Ant Design ConfigProvider Token Configuration
  const isDark = theme === "dark";
  const antdConfig = useMemo(
    () => ({
      algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      token: {
        colorPrimary: isDark ? "#3b82f6" : "#2563eb",
        borderRadius: 16,
        fontFamily: "Inter, 'Kantumruy Pro', system-ui, sans-serif",
        colorBgContainer: isDark ? "#161c2e" : "#ffffff",
        colorText: isDark ? "#f3f5f9" : "#0f172a",
        colorTextSecondary: isDark ? "#9aa3b2" : "#64748b",
        colorBorder: isDark ? "rgba(255,255,255,0.12)" : "#e2e8f0",
      },
    }),
    [isDark],
  );

  const value = useMemo(
    () => ({
      theme,
      isDark,
      setTheme,
      toggleTheme,
    }),
    [theme, isDark, setTheme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      <ConfigProvider theme={antdConfig}>{children}</ConfigProvider>
    </ThemeContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export default ThemeContext;
