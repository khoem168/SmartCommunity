import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiBell, FiMoon, FiSave } from "react-icons/fi";
import { useGlobleContext } from "../../context/GlobleContext";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import { fetchNotificationPreferences, updateNotificationPreferences } from "../../services/notificationService";
import "./Settings.css";

const preferenceOptions = [
  ["mentorship", "mentorshipUpdates"], ["message", "messageUpdates"], ["skillExchange", "exchangeUpdates"],
  ["session", "sessionUpdates"], ["internship", "internshipUpdates"], ["forum", "forumUpdates"], ["system", "systemUpdates"],
];

const Settings = () => {
  const { user, updateUser } = useGlobleContext();
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [form, setForm] = useState({
    fullName: "",
    bio: "",
    availability: "Flexible schedule",
    darkMode: theme === "dark",
  });
  const [preferences, setPreferences] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    Promise.resolve().then(() => {
      setForm({
        fullName: user.fullName || "",
        bio: user.bio || "",
        availability: user.availability || "Flexible schedule",
        darkMode: theme === "dark",
      });
    });
  }, [user, theme]);

  useEffect(() => {
    if (!user) return;
    fetchNotificationPreferences()
      .then((response) => setPreferences(response.preferences))
      .catch((cause) => setError(cause.message || t("refresh.settingsLoadError")));
  }, [t, user]);

  if (!user) return <main className="settings-page container"><section className="settings-empty"><h1>{t("refresh.settingsTitle")}</h1><p>{t("refresh.settingsText")}</p><Link to="/login" className="btn primary">{t("nav.signIn")}</Link></section></main>;
  const change = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const handleThemeToggle = (checked) => {
    change("darkMode", checked);
    setTheme(checked ? "dark" : "light");
  };
  const togglePreference = (key) => setPreferences((current) => ({ ...current, [key]: !current?.[key] }));
  const save = async (event) => {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      await Promise.all([updateUser(form), preferences ? updateNotificationPreferences(preferences) : Promise.resolve()]);
      setMessage(t("refresh.saved"));
    } catch (cause) { setError(cause.message || t("refresh.saveFailed")); }
    finally { setBusy(false); }
  };
  return <main className="settings-page container"><section className="settings-header"><p className="settings-kicker">{t("refresh.workspace")}</p><h1>{t("refresh.settingsTitle")}</h1><p>{t("refresh.settingsText")}</p></section><form className="settings-card" onSubmit={save}>
    <fieldset><legend>{t("refresh.account")}</legend><label>{t("refresh.fullName")}<input required type="text" value={form.fullName} onChange={(event) => change("fullName", event.target.value)} /></label><label>{t("refresh.email")}<input type="email" value={user.email || ""} disabled /></label><label>{t("refresh.bio")}<textarea value={form.bio} onChange={(event) => change("bio", event.target.value)} /></label><label>{t("refresh.availability")}<select value={form.availability} onChange={(event) => change("availability", event.target.value)}><option value="Flexible schedule">{t("refresh.flexible")}</option><option value="Part time">{t("refresh.partTime")}</option><option value="Full time">{t("refresh.fullTime")}</option><option value="Open to project work">{t("refresh.projectWork")}</option></select></label></fieldset>
    <fieldset><legend>{t("refresh.appearance")}</legend><label className="settings-toggle"><span><FiMoon /> <b>{t("refresh.darkMode")}</b><small>{t("refresh.darkModeText")}</small></span><span className="settings-toggle-control"><input type="checkbox" checked={form.darkMode} onChange={(event) => handleThemeToggle(event.target.checked)} /><span className="settings-toggle-switch" /></span></label></fieldset>
    <fieldset><legend>{t("refresh.notificationTitle")}</legend><p className="settings-help"><FiBell /> {t("refresh.notificationText")}</p><div className="settings-toggle-grid">{preferences ? preferenceOptions.map(([key, label]) => <label className="settings-toggle" key={key}><span><b>{t(`refresh.${label}`)}</b></span><span className="settings-toggle-control"><input type="checkbox" checked={Boolean(preferences[key])} onChange={() => togglePreference(key)} /><span className="settings-toggle-switch" /></span></label>) : <p className="settings-loading">{t("refresh.loading")}</p>}</div><Link className="settings-push-link" to="/notifications">{t("refresh.pushSettings")}</Link></fieldset>
    <div className="settings-actions"><button type="submit" className="btn primary" disabled={busy}><FiSave /> {busy ? t("refresh.saving") : t("refresh.save")}</button>{message && <span className="settings-message">{message}</span>}{error && <span className="settings-error">{error}</span>}</div>
  </form></main>;
};
export default Settings;
