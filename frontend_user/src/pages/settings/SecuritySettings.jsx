import { useCallback, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { FiCheckCircle, FiCopy, FiDownload, FiKey, FiShield, FiSmartphone } from "react-icons/fi";
import { useGlobleContext } from "../../context/GlobleContext";
import { useLanguage } from "../../context/LanguageContext";
import {
  twoFactorDisableRequest,
  twoFactorEnableRequest,
  twoFactorRecoveryCodesRequest,
  twoFactorSetupRequest,
  twoFactorStatusRequest,
} from "../../services/authService";

const copy = {
  km: {
    title: "សុវត្ថិភាព",
    heading: "ការផ្ទៀងផ្ទាត់ពីរជំហាន (2FA)",
    intro: "បន្ថែមសុវត្ថិភាពមួយកម្រិតទៀត៖ ក្រោយបញ្ចូលពាក្យសម្ងាត់ អ្នកត្រូវបញ្ចូលលេខកូដ ៦ ខ្ទង់ពីកម្មវិធីនៅលើទូរសព្ទ។ ឥតគិតថ្លៃ និងដំណើរការដោយគ្មានអ៊ីនធឺណិតនៅលើទូរសព្ទ។",
    on: "បានបើក",
    off: "មិនទាន់បើក",
    required: "គណនីអ្នកគ្រប់គ្រងត្រូវតែបើក 2FA មុនពេលប្រើឧបករណ៍គ្រប់គ្រង។",
    start: "បើក 2FA",
    step1: "១. ដំឡើងកម្មវិធី Authenticator ឥតគិតថ្លៃ",
    step1Text: "ឧទាហរណ៍ Google Authenticator ឬ Microsoft Authenticator ពី App Store / Play Store។",
    step2: "២. ស្កេនកូដ QR នេះ",
    step2Text: "នៅក្នុងកម្មវិធី ចុច “+” រួចជ្រើស “ស្កេនកូដ QR”។",
    manual: "មិនអាចស្កេនបាន? បញ្ចូលលេខកូដនេះដោយដៃ៖",
    step3: "៣. បញ្ចូលលេខកូដ ៦ ខ្ទង់ដែលកម្មវិធីបង្ហាញ",
    confirm: "បញ្ជាក់ និងបើក",
    cancel: "បោះបង់",
    savedTitle: "រក្សាទុកលេខកូដសង្គ្រោះទាំងនេះ",
    savedText: "ប្រើលេខកូដណាមួយ បើអ្នកបាត់ទូរសព្ទ។ លេខកូដនីមួយៗប្រើបានតែម្តង។ យើងនឹងមិនបង្ហាញម្តងទៀតទេ។",
    copy: "ចម្លង",
    copied: "បានចម្លង",
    download: "ទាញយក",
    done: "ខ្ញុំបានរក្សាទុកហើយ",
    enabledSince: "បើកតាំងពី",
    codesLeft: (n) => `លេខកូដសង្គ្រោះនៅសល់៖ ${n}`,
    newCodes: "បង្កើតលេខកូដសង្គ្រោះថ្មី",
    disable: "បិទ 2FA",
    disableWarn: "បើបិទ គណនីរបស់អ្នកនឹងការពារដោយពាក្យសម្ងាត់តែប៉ុណ្ណោះ។",
    password: "ពាក្យសម្ងាត់",
    code: "លេខកូដ ៦ ខ្ទង់",
    confirmDisable: "បិទ 2FA",
    confirmNewCodes: "បង្កើតថ្មី",
    enabledMsg: "បានបើកការផ្ទៀងផ្ទាត់ពីរជំហាន។",
    disabledMsg: "បានបិទការផ្ទៀងផ្ទាត់ពីរជំហាន។",
    loadError: "មិនអាចផ្ទុកការកំណត់សុវត្ថិភាពបានទេ។",
    errors: {
      TWO_FACTOR_INVALID_CODE: "លេខកូដមិនត្រឹមត្រូវទេ។ សូមប្រើលេខកូដថ្មីបំផុតពីកម្មវិធី។",
      TWO_FACTOR_LOCKED: "បញ្ចូលលេខកូដខុសច្រើនដងពេក។ សូមរង់ចាំ ១០ នាទី។",
      TWO_FACTOR_NO_SETUP: "សូមចាប់ផ្តើមការរៀបចំម្តងទៀត។",
      INVALID_PASSWORD: "ពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ។",
    },
  },
  en: {
    title: "Security",
    heading: "Two-step verification (2FA)",
    intro: "Add a second layer of protection: after your password, you enter a 6-digit code from an app on your phone. Free, and the app works offline.",
    on: "On",
    off: "Off",
    required: "Administrator accounts must turn on 2FA before using admin tools.",
    start: "Turn on 2FA",
    step1: "1. Install a free authenticator app",
    step1Text: "For example Google Authenticator or Microsoft Authenticator from the App Store or Play Store.",
    step2: "2. Scan this QR code",
    step2Text: "In the app, tap “+” and choose “Scan a QR code”.",
    manual: "Can't scan? Enter this key manually:",
    step3: "3. Enter the 6-digit code the app shows",
    confirm: "Confirm and turn on",
    cancel: "Cancel",
    savedTitle: "Save these recovery codes",
    savedText: "Use one if you lose your phone. Each code works once. They won't be shown again.",
    copy: "Copy",
    copied: "Copied",
    download: "Download",
    done: "I've saved them",
    enabledSince: "On since",
    codesLeft: (n) => `Recovery codes left: ${n}`,
    newCodes: "Make new recovery codes",
    disable: "Turn off 2FA",
    disableWarn: "If you turn it off, your account is protected by your password only.",
    password: "Password",
    code: "6-digit code",
    confirmDisable: "Turn off 2FA",
    confirmNewCodes: "Make new codes",
    enabledMsg: "Two-step verification is on.",
    disabledMsg: "Two-step verification is off.",
    loadError: "Couldn't load security settings.",
    errors: {},
  },
};

const digitsOnly = (value) => value.replace(/\D/g, "").slice(0, 6);

const SecuritySettings = () => {
  const { user } = useGlobleContext();
  const { language } = useLanguage();
  const text = copy[language === "en" ? "en" : "km"];
  const [status, setStatus] = useState(null);
  const [mode, setMode] = useState("idle"); // idle | setup | codes | disable | regenerate
  const [setup, setSetup] = useState(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      setStatus(await twoFactorStatusRequest());
    } catch {
      setError(text.loadError);
    }
  }, [text.loadError]);

  useEffect(() => {
    let cancelled = false;
    twoFactorStatusRequest()
      .then((data) => { if (!cancelled) setStatus(data); })
      .catch(() => { if (!cancelled) setError(text.loadError); });
    return () => { cancelled = true; };
  }, [text.loadError]);

  const reset = (nextMode = "idle") => {
    setMode(nextMode);
    setCode("");
    setPassword("");
    setError("");
  };

  const run = async (action) => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
    } catch (err) {
      setError(text.errors[err.code] || err.message);
      setCode("");
    } finally {
      setBusy(false);
    }
  };

  const beginSetup = () =>
    run(async () => {
      setSetup(await twoFactorSetupRequest());
      reset("setup");
    });

  const confirmSetup = (event) => {
    event.preventDefault();
    run(async () => {
      const response = await twoFactorEnableRequest(code);
      setRecoveryCodes(response.recoveryCodes);
      setSetup(null);
      reset("codes");
      await load();
    });
  };

  const disable = (event) => {
    event.preventDefault();
    run(async () => {
      await twoFactorDisableRequest({ password, code });
      reset();
      setMessage(text.disabledMsg);
      await load();
    });
  };

  const regenerate = (event) => {
    event.preventDefault();
    run(async () => {
      const response = await twoFactorRecoveryCodesRequest(code);
      setRecoveryCodes(response.recoveryCodes);
      reset("codes");
      await load();
    });
  };

  const codesText = recoveryCodes.join("\n");
  const copyCodes = async () => {
    try {
      await navigator.clipboard.writeText(codesText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };
  const downloadCodes = () => {
    const blob = new Blob(
      [`Smart Community recovery codes (${user?.email || ""})\nEach code works once.\n\n${codesText}\n`],
      { type: "text/plain" },
    );
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "smart-community-recovery-codes.txt";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const needsPassword = user?.authProvider !== "google";

  return (
    <section className="settings-card security-card" aria-labelledby="security-heading">
      <p className="settings-kicker">{text.title}</p>
      <div className="security-head">
        <span className="security-icon" aria-hidden="true"><FiShield /></span>
        <div>
          <h2 id="security-heading">{text.heading}</h2>
          <p className="settings-help">{text.intro}</p>
        </div>
        {status && (
          <span className={`security-badge ${status.enabled ? "on" : "off"}`}>
            {status.enabled ? <FiCheckCircle /> : null} {status.enabled ? text.on : text.off}
          </span>
        )}
      </div>

      {status?.requiredForRole && !status.enabled && <p className="security-warning" role="status">{text.required}</p>}
      {message && <p className="settings-message" role="status">{message}</p>}
      {error && <p className="settings-error" role="alert">{error}</p>}

      {mode === "idle" && status && !status.enabled && (
        <button type="button" className="btn primary" onClick={beginSetup} disabled={busy}>
          <FiSmartphone /> {text.start}
        </button>
      )}

      {mode === "setup" && setup && (
        <form className="security-setup" onSubmit={confirmSetup}>
          <div className="security-step">
            <h3>{text.step1}</h3>
            <p>{text.step1Text}</p>
          </div>
          <div className="security-step">
            <h3>{text.step2}</h3>
            <p>{text.step2Text}</p>
            <div className="security-qr">
              <QRCodeSVG value={setup.otpauthUrl} size={184} marginSize={2} title="2FA QR code" />
            </div>
            <p className="security-manual">{text.manual}</p>
            <code className="security-secret">{setup.secret.match(/.{1,4}/g).join(" ")}</code>
          </div>
          <div className="security-step">
            <h3>{text.step3}</h3>
            <input
              className="security-code-input"
              value={code}
              onChange={(event) => setCode(digitsOnly(event.target.value))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              aria-label={text.code}
              autoFocus
            />
          </div>
          <div className="security-actions">
            <button type="submit" className="btn primary" disabled={busy || code.length !== 6}>{text.confirm}</button>
            <button type="button" className="btn" onClick={() => { setSetup(null); reset(); }}>{text.cancel}</button>
          </div>
        </form>
      )}

      {mode === "codes" && (
        <div className="security-codes-box">
          <h3><FiKey /> {text.savedTitle}</h3>
          <p>{text.savedText}</p>
          <ul className="security-codes">
            {recoveryCodes.map((item) => <li key={item}><code>{item}</code></li>)}
          </ul>
          <div className="security-actions">
            <button type="button" className="btn" onClick={copyCodes}><FiCopy /> {copied ? text.copied : text.copy}</button>
            <button type="button" className="btn" onClick={downloadCodes}><FiDownload /> {text.download}</button>
            <button type="button" className="btn primary" onClick={() => { setRecoveryCodes([]); reset(); setMessage(text.enabledMsg); }}>{text.done}</button>
          </div>
        </div>
      )}

      {mode === "idle" && status?.enabled && (
        <div className="security-enabled">
          <p className="settings-help">
            {status.enabledAt && <>{text.enabledSince} {new Date(status.enabledAt).toLocaleDateString(language === "en" ? "en-US" : "km-KH")} · </>}
            {text.codesLeft(status.recoveryCodesLeft)}
          </p>
          <div className="security-actions">
            <button type="button" className="btn" onClick={() => reset("regenerate")}><FiKey /> {text.newCodes}</button>
            <button type="button" className="btn security-danger" onClick={() => reset("disable")}>{text.disable}</button>
          </div>
        </div>
      )}

      {(mode === "disable" || mode === "regenerate") && (
        <form className="security-setup" onSubmit={mode === "disable" ? disable : regenerate}>
          {mode === "disable" && <p className="security-warning">{text.disableWarn}</p>}
          {mode === "disable" && needsPassword && (
            <label>{text.password}
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
            </label>
          )}
          <label>{text.code}
            <input
              className="security-code-input"
              value={code}
              onChange={(event) => setCode(digitsOnly(event.target.value))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              autoFocus
            />
          </label>
          <div className="security-actions">
            <button
              type="submit"
              className={`btn ${mode === "disable" ? "security-danger" : "primary"}`}
              disabled={busy || code.length !== 6 || (mode === "disable" && needsPassword && !password)}
            >
              {mode === "disable" ? text.confirmDisable : text.confirmNewCodes}
            </button>
            <button type="button" className="btn" onClick={() => reset()}>{text.cancel}</button>
          </div>
        </form>
      )}
    </section>
  );
};

export default SecuritySettings;
