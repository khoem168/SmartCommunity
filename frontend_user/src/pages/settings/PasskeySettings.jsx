import { useCallback, useEffect, useState } from "react";
import { FiKey, FiPlus, FiSmartphone, FiTrash2 } from "react-icons/fi";
import { useLanguage } from "../../context/LanguageContext";
import {
  addPasskeyRequest,
  listPasskeysRequest,
  passkeysSupported,
  removePasskeyRequest,
} from "../../services/authService";

const copy = {
  km: {
    heading: "Passkey (ចូលដោយស្នាមម្រាមដៃ ឬមុខ)",
    intro: "ចូលគណនីដោយស្នាមម្រាមដៃ មុខ ឬលេខកូដចាក់សោទូរសព្ទ ដោយមិនចាំបាច់វាយពាក្យសម្ងាត់។ មានសុវត្ថិភាពជាងពាក្យសម្ងាត់ ហើយឥតគិតថ្លៃ។",
    unsupported: "កម្មវិធីរុករកនេះមិនគាំទ្រ Passkey ទេ។ សូមប្រើ Chrome, Safari ឬ Edge ថ្មីៗ។",
    none: "មិនទាន់មាន Passkey ទេ។",
    namePlaceholder: "ឈ្មោះ (ឧ. ទូរសព្ទរបស់ខ្ញុំ)",
    add: "បន្ថែម Passkey",
    remove: "លុប",
    syncs: "ធ្វើសមកាលកម្មលើឧបករណ៍ផ្សេងទៀត",
    thisDevice: "សម្រាប់ឧបករណ៍នេះតែប៉ុណ្ណោះ",
    added: "បានបន្ថែម Passkey។ លើកក្រោយ ចុច “ចូលដោយ Passkey” នៅទំព័រចូលគណនី។",
    removed: "បានលុប Passkey។",
    lastUsed: "ប្រើចុងក្រោយ",
    never: "មិនទាន់ប្រើ",
    errors: {
      PASSKEY_EXISTS: "Passkey នេះបានរក្សាទុករួចហើយ។",
      PASSKEY_INVALID: "មិនអាចផ្ទៀងផ្ទាត់ Passkey បានទេ។ សូមព្យាយាមម្តងទៀត។",
      PASSKEY_CHALLENGE_EXPIRED: "ជំហាននេះផុតកំណត់ហើយ។ សូមព្យាយាមម្តងទៀត។",
    },
  },
  en: {
    heading: "Passkeys (fingerprint or face sign-in)",
    intro: "Sign in with your fingerprint, face or phone screen lock instead of typing a password. Safer than a password, and free.",
    unsupported: "This browser doesn't support passkeys. Use a recent Chrome, Safari or Edge.",
    none: "No passkeys yet.",
    namePlaceholder: "Name (e.g. My phone)",
    add: "Add a passkey",
    remove: "Remove",
    syncs: "Syncs to your other devices",
    thisDevice: "This device only",
    added: "Passkey added. Next time, choose “Sign in with a passkey” on the sign-in page.",
    removed: "Passkey removed.",
    lastUsed: "Last used",
    never: "Not used yet",
    errors: {},
  },
};

const PasskeySettings = () => {
  const { language } = useLanguage();
  const text = copy[language === "en" ? "en" : "km"];
  const supported = passkeysSupported();
  const [passkeys, setPasskeys] = useState(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const reload = useCallback(async () => {
    const data = await listPasskeysRequest();
    setPasskeys(data.passkeys);
  }, []);

  useEffect(() => {
    let cancelled = false;
    listPasskeysRequest()
      .then((data) => { if (!cancelled) setPasskeys(data.passkeys); })
      .catch(() => { if (!cancelled) setPasskeys([]); });
    return () => { cancelled = true; };
  }, []);

  const add = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await addPasskeyRequest(name.trim());
      setName("");
      setMessage(text.added);
      await reload();
    } catch (err) {
      if (err.name !== "NotAllowedError" && err.name !== "AbortError") {
        setError(text.errors[err.code] || err.message);
      }
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await removePasskeyRequest(id);
      setMessage(text.removed);
      await reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const dateText = (value) =>
    value ? new Date(value).toLocaleDateString(language === "en" ? "en-US" : "km-KH") : text.never;

  return (
    <section className="settings-card security-card" aria-labelledby="passkey-heading">
      <div className="security-head">
        <span className="security-icon" aria-hidden="true"><FiKey /></span>
        <div>
          <h2 id="passkey-heading">{text.heading}</h2>
          <p className="settings-help">{text.intro}</p>
        </div>
      </div>

      {message && <p className="settings-message" role="status">{message}</p>}
      {error && <p className="settings-error" role="alert">{error}</p>}

      {passkeys && passkeys.length === 0 && <p className="settings-help">{text.none}</p>}
      {passkeys && passkeys.length > 0 && (
        <ul className="passkey-list">
          {passkeys.map((item) => (
            <li key={item.id}>
              <FiSmartphone aria-hidden="true" />
              <div>
                <strong>{item.name}</strong>
                <small>{item.syncs ? text.syncs : text.thisDevice} · {text.lastUsed}: {dateText(item.lastUsedAt)}</small>
              </div>
              <button type="button" className="btn security-danger" onClick={() => remove(item.id)} disabled={busy} aria-label={`${text.remove} ${item.name}`}>
                <FiTrash2 /> {text.remove}
              </button>
            </li>
          ))}
        </ul>
      )}

      {supported ? (
        <form className="passkey-add" onSubmit={add}>
          <input
            value={name}
            onChange={(event) => setName(event.target.value.slice(0, 60))}
            placeholder={text.namePlaceholder}
            aria-label={text.namePlaceholder}
          />
          <button type="submit" className="btn primary" disabled={busy}><FiPlus /> {text.add}</button>
        </form>
      ) : (
        <p className="security-warning">{text.unsupported}</p>
      )}
    </section>
  );
};

export default PasskeySettings;
