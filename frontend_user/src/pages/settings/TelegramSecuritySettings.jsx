import { useCallback, useEffect, useState } from "react";
import {
  FiBell,
  FiCheck,
  FiCopy,
  FiExternalLink,
  FiEye,
  FiEyeOff,
  FiRefreshCw,
  FiSend,
  FiShield,
} from "react-icons/fi";
import { FaTelegramPlane } from "react-icons/fa";
import { useGlobleContext } from "../../context/GlobleContext";
import { useLanguage } from "../../context/LanguageContext";
import { apiFetch } from "../../services/api";

const TelegramSecuritySettings = () => {
  const { user } = useGlobleContext();
  const { language } = useLanguage();
  const isKm = language === "km";

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState("");
  const [showClaim, setShowClaim] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const isAdmin = user?.role === "admin";

  const loadStatus = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/telegram/status");
      setData(res);
    } catch (err) {
      setError(err.message || (isKm ? "មិនអាចទាញស្ថានភាព Telegram Bot បានទេ។" : "Failed to load Telegram bot status."));
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isKm]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  if (!isAdmin) return null;

  const handleSyncWebhook = async () => {
    setBusyAction("sync");
    setNotice("");
    setError("");
    try {
      const res = await apiFetch("/telegram/setup-webhook", {
        method: "POST",
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        throw new Error(res.webhook?.description || "Webhook sync failed.");
      }
      setNotice(
        isKm
          ? `Sync Webhook ជោគជ័យទៅកាន់ ${res.webhookUrl} និងបានធ្វើបច្ចុប្បន្នភាពពាក្យបញ្ជាទាំង ១៥ ហើយ!`
          : `Webhook synced to ${res.webhookUrl} and all 15 commands updated!`,
      );
      await loadStatus();
    } catch (err) {
      setError(err.message || (isKm ? "Sync Webhook បរាជ័យ។" : "Failed to sync Telegram webhook."));
    } finally {
      setBusyAction("");
    }
  };

  const handleTestAlert = async () => {
    setBusyAction("test");
    setNotice("");
    setError("");
    try {
      const res = await apiFetch("/telegram/test-alert", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setNotice(
        isKm
          ? `បានផ្ញើសារសាកល្បងទៅកាន់ Super Admin (${res.sent}) តាម Telegram ដោយជោគជ័យ!`
          : `Test security alert delivered to ${res.sent} Super Admin Telegram chat(s)!`,
      );
    } catch (err) {
      setError(err.message || (isKm ? "មិនអាចផ្ញើសារសាកល្បងបានទេ។" : "Failed to send test alert."));
    } finally {
      setBusyAction("");
    }
  };

  const handleToggleSetting = async (key) => {
    if (!data?.settings) return;
    const nextValue = !data.settings[key];
    setBusyAction(`toggle:${key}`);
    setNotice("");
    setError("");
    try {
      const res = await apiFetch("/telegram/settings", {
        method: "PATCH",
        body: JSON.stringify({ key, enabled: nextValue }),
      });
      setData((prev) => (prev ? { ...prev, settings: res.settings } : prev));
    } catch (err) {
      setError(err.message || (isKm ? "មិនអាចរក្សាទុកការកំណត់បានទេ។" : "Failed to update setting."));
    } finally {
      setBusyAction("");
    }
  };

  const claimCommand = data?.claimCode ? `/claim ${data.claimCode}` : "";

  const handleCopyClaim = async () => {
    if (!claimCommand) return;
    try {
      await navigator.clipboard.writeText(claimCommand);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked
    }
  };

  const botLink = data?.botUsername ? `https://t.me/${data.botUsername}` : "https://t.me/smartcommunitykh_bot";

  return (
    <section className="settings-card security-card telegram-soc-card" aria-labelledby="tg-soc-heading">
      <div className="security-head">
        <span className="security-icon tg-soc-icon" aria-hidden="true">
          <FaTelegramPlane />
        </span>
        <div>
          <h2 id="tg-soc-heading">
            {isKm ? "Telegram Security Bot & Command Center (Super Admin)" : "Telegram Security Bot & Command Center"}
          </h2>
          <p className="settings-help" style={{ margin: 0 }}>
            {isKm
              ? "គ្រប់គ្រងការដាស់តឿនការវាយប្រហារ ការអនុញ្ញាត Super Admin 1-Tap និង Sync Webhook ភ្លាមៗដោយមិនបាច់បើក Terminal។"
              : "Manage real-time attack alerts, 1-Tap Super Admin login approval, and one-click webhook syncing."}
          </p>
        </div>
        <span className={`security-badge ${data?.configured && data?.webhookInfo?.url ? "on" : "off"}`}>
          <FiShield aria-hidden="true" />
          {data?.configured && data?.webhookInfo?.url
            ? isKm
              ? "ភ្ជាប់រួចរាល់"
              : "Connected"
            : isKm
              ? "មិនទាន់ Sync"
              : "Not Synced"}
        </span>
      </div>

      {notice && <div className="tg-soc-alert success">{notice}</div>}
      {error && <div className="tg-soc-alert error">{error}</div>}
      {data?.webhookInfo?.lastErrorMessage && (
        <div className="tg-soc-alert warn">
          {isKm ? "ការព្រមានចុងក្រោយពី Telegram Webhook៖ " : "Last Telegram webhook warning: "}
          <code>{data.webhookInfo.lastErrorMessage}</code>
        </div>
      )}

      {loading && !data ? (
        <p className="settings-loading">{isKm ? "កំពុងទាញស្ថានភាព Telegram Bot..." : "Loading Telegram bot status..."}</p>
      ) : data ? (
        <>
          {/* Live Telemetry Summary */}
          <div className="tg-soc-stats">
            <div className="tg-soc-stat">
              <small>{isKm ? "Bot Username" : "Bot"}</small>
              <strong>
                {data.botUsername ? (
                  <a href={botLink} target="_blank" rel="noreferrer" className="tg-soc-bot-link">
                    @{data.botUsername} <FiExternalLink />
                  </a>
                ) : (
                  "Not configured"
                )}
              </strong>
            </div>
            <div className="tg-soc-stat">
              <small>{isKm ? "Super Admin បានភ្ជាប់" : "Linked Admins"}</small>
              <strong>{data.adminChatCount}</strong>
            </div>
            <div className="tg-soc-stat">
              <small>{isKm ? "Security Events (24h)" : "Events (24h)"}</small>
              <strong>
                {data.stats24h?.events || 0}{" "}
                <span className="tg-soc-crit">({data.stats24h?.critical || 0} crit)</span>
              </strong>
            </div>
            <div className="tg-soc-stat">
              <small>{isKm ? "IP បានប្លុក" : "Blocked IPs"}</small>
              <strong>{data.stats24h?.blockedIps || 0}</strong>
            </div>
          </div>

          {/* 1-Click Actions */}
          <div className="tg-soc-actions">
            <button
              type="button"
              className="btn primary"
              onClick={handleSyncWebhook}
              disabled={busyAction !== "" || !data.configured}
            >
              <FiRefreshCw className={busyAction === "sync" ? "spin" : ""} />
              <span>
                {busyAction === "sync"
                  ? isKm
                    ? "កំពុង Sync Webhook..."
                    : "Syncing..."
                  : isKm
                    ? "Sync Telegram Bot & Webhook"
                    : "Sync Telegram Bot & Webhook"}
              </span>
            </button>

            <button
              type="button"
              className="btn outline"
              onClick={handleTestAlert}
              disabled={busyAction !== "" || !data.configured || data.adminChatCount === 0}
            >
              <FiSend />
              <span>
                {busyAction === "test"
                  ? isKm
                    ? "កំពុងផ្ញើ..."
                    : "Sending..."
                  : isKm
                    ? "ផ្ញើសារសាកល្បងទៅ Telegram"
                    : "Send Test Alert"}
              </span>
            </button>
          </div>

          {/* Claim Code Helper (for linking Super Admin Telegram chat without terminal) */}
          {claimCommand && (
            <div className="tg-soc-claim-box">
              <div className="tg-soc-claim-copy">
                <strong>{isKm ? "ពាក្យបញ្ជាភ្ជាប់ Super Admin Telegram ថ្មី" : "Link Super Admin Telegram Command"}</strong>
                <small>
                  {isKm
                    ? "ផ្ញើពាក្យបញ្ជានេះទៅកាន់ Bot ដើម្បីភ្ជាប់គណនី Telegram របស់បងជា Super Admin៖"
                    : "Send this one-time command to the bot to authorize your Telegram chat:"}
                </small>
              </div>
              <div className="tg-soc-claim-controls">
                <code>{showClaim ? claimCommand : "/claim ••••••••••••••••"}</code>
                <button
                  type="button"
                  className="tg-soc-mini-btn"
                  onClick={() => setShowClaim((v) => !v)}
                  aria-label={showClaim ? "Hide code" : "Show code"}
                >
                  {showClaim ? <FiEyeOff /> : <FiEye />}
                </button>
                <button
                  type="button"
                  className="tg-soc-mini-btn"
                  onClick={handleCopyClaim}
                  aria-label="Copy claim command"
                >
                  {copied ? <FiCheck /> : <FiCopy />}
                </button>
              </div>
            </div>
          )}

          {/* Live Alert & Lockdown Toggles */}
          {data.settings && data.settingMeta && (
            <div className="tg-soc-toggles">
              <p className="settings-help" style={{ margin: "0 0 8px" }}>
                <FiBell />{" "}
                {isKm
                  ? "បើក ឬបិទការជូនដំណឹងតាមប្រភេទ (Sync ផ្ទាល់ជាមួយ /settings ក្នុង Telegram)"
                  : "Toggle alert rules live (synced directly with /settings in Telegram)"}
              </p>
              <div className="settings-toggle-grid">
                {Object.entries(data.settingMeta).map(([key, meta]) => (
                  <label
                    className={`settings-toggle ${key === "maintenance_lockdown" && data.settings[key] ? "tg-lockdown-on" : ""}`}
                    key={key}
                  >
                    <span>
                      <b>{isKm ? meta.labelKm : meta.labelEn}</b>
                    </span>
                    <span className="settings-toggle-control">
                      <input
                        type="checkbox"
                        checked={Boolean(data.settings[key])}
                        disabled={busyAction === `toggle:${key}`}
                        onChange={() => handleToggleSetting(key)}
                      />
                      <span className="settings-toggle-switch" />
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}
    </section>
  );
};

export default TelegramSecuritySettings;
