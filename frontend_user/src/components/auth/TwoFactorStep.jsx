import { useEffect, useRef, useState } from "react";
import { FiArrowLeft, FiArrowRight, FiShield } from "react-icons/fi";
import { useGlobleContext } from "../../context/GlobleContext";
import { useLanguage } from "../../context/LanguageContext";
import { ButtonLoader } from "../ui/LoadingStates";

const copy = {
  km: {
    title: "ផ្ទៀងផ្ទាត់ពីរជំហាន",
    text: "បើកកម្មវិធី Authenticator នៅលើទូរសព្ទរបស់អ្នក ហើយបញ្ចូលលេខកូដ ៦ ខ្ទង់ដែលកំពុងបង្ហាញ។",
    recoveryText: "បញ្ចូលលេខកូដសង្គ្រោះមួយក្នុងចំណោមលេខកូដដែលអ្នកបានរក្សាទុក។ លេខកូដនីមួយៗប្រើបានតែម្តង។",
    codeLabel: "លេខកូដ ៦ ខ្ទង់",
    recoveryLabel: "លេខកូដសង្គ្រោះ",
    trust: "ទុកចិត្តឧបករណ៍នេះរយៈពេល ៣០ ថ្ងៃ",
    submit: "ផ្ទៀងផ្ទាត់",
    useRecovery: "បាត់ទូរសព្ទ? ប្រើលេខកូដសង្គ្រោះ",
    useApp: "ប្រើលេខកូដពីកម្មវិធីវិញ",
    back: "ត្រឡប់ក្រោយ",
    attempts: (n) => `នៅសល់ ${n} ដងទៀត។`,
    expired: "ជំហាននេះផុតកំណត់ហើយ។ សូមចូលគណនីម្តងទៀត។",
    errors: {
      TWO_FACTOR_INVALID_CODE: "លេខកូដមិនត្រឹមត្រូវទេ។ សូមពិនិត្យម៉ោងនៅលើទូរសព្ទ ហើយប្រើលេខកូដថ្មីបំផុត។",
      TWO_FACTOR_LOCKED: "បញ្ចូលលេខកូដខុសច្រើនដងពេក។ សូមរង់ចាំ ១០ នាទី ហើយព្យាយាមម្តងទៀត។",
      TWO_FACTOR_RESET_REQUIRED: "ការផ្ទៀងផ្ទាត់ពីរជំហានត្រូវកំណត់ឡើងវិញដោយអ្នកគ្រប់គ្រង។",
    },
    recoveryLeft: (n) => `អ្នកនៅសល់លេខកូដសង្គ្រោះ ${n}។ បង្កើតថ្មីនៅក្នុងការកំណត់ → សុវត្ថិភាព។`,
  },
  en: {
    title: "Two-step verification",
    text: "Open the authenticator app on your phone and enter the 6-digit code it shows.",
    recoveryText: "Enter one of the recovery codes you saved. Each code works only once.",
    codeLabel: "6-digit code",
    recoveryLabel: "Recovery code",
    trust: "Trust this device for 30 days",
    submit: "Verify",
    useRecovery: "Lost your phone? Use a recovery code",
    useApp: "Use a code from the app instead",
    back: "Back",
    attempts: (n) => `${n} attempts left.`,
    expired: "This step expired. Please sign in again.",
    errors: {},
    recoveryLeft: (n) => `You have ${n} recovery codes left. Make new ones in Settings → Security.`,
  },
};

/**
 * The second sign-in step for accounts with two-factor authentication.
 * `challenge` is the response from the password or Google step.
 */
const TwoFactorStep = ({ challenge, onSuccess, onCancel }) => {
  const { completeTwoFactor } = useGlobleContext();
  const { language } = useLanguage();
  const text = copy[language === "en" ? "en" : "km"];
  const [useRecovery, setUseRecovery] = useState(false);
  const [value, setValue] = useState("");
  const [trustDevice, setTrustDevice] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [useRecovery]);

  const submit = async (event) => {
    event.preventDefault();
    const clean = useRecovery ? value.trim() : value.replace(/\D/g, "");
    if (!useRecovery && clean.length !== 6) return;
    if (useRecovery && clean.length < 10) return;
    setLoading(true);
    setError("");
    try {
      const response = await completeTwoFactor({
        challengeToken: challenge.challengeToken,
        rememberMe: challenge.rememberMe,
        trustDevice,
        ...(useRecovery ? { recoveryCode: clean } : { code: clean }),
      });
      onSuccess(response.recoveryCodesLeft !== undefined ? text.recoveryLeft(response.recoveryCodesLeft) : "");
    } catch (err) {
      if (err.code === "TWO_FACTOR_CHALLENGE_EXPIRED") {
        setError(text.expired);
      } else {
        const attemptsLeft = err.body?.attemptsLeft;
        const message = text.errors[err.code] || err.message;
        setError(`${message}${attemptsLeft ? ` ${text.attempts(attemptsLeft)}` : ""}`);
      }
      setValue("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-form two-factor-step" onSubmit={submit} noValidate>
      <div className="two-factor-icon" aria-hidden="true"><FiShield /></div>
      <h2>{text.title}</h2>
      <p className="two-factor-text">{useRecovery ? text.recoveryText : text.text}</p>

      {error && <div className="auth-error ios-alert-glass" role="alert">{error}</div>}

      <label className="two-factor-label" htmlFor="two-factor-code">
        {useRecovery ? text.recoveryLabel : text.codeLabel}
      </label>
      <input
        ref={inputRef}
        id="two-factor-code"
        className={`two-factor-input${useRecovery ? " recovery" : ""}`}
        value={value}
        onChange={(event) =>
          setValue(useRecovery ? event.target.value.slice(0, 20) : event.target.value.replace(/\D/g, "").slice(0, 6))
        }
        inputMode={useRecovery ? "text" : "numeric"}
        autoComplete="one-time-code"
        placeholder={useRecovery ? "xxxxx-xxxxx" : "123456"}
        aria-describedby="two-factor-help"
      />

      <label className="auth-checkbox ios-checkbox-label two-factor-trust">
        <input type="checkbox" checked={trustDevice} onChange={(event) => setTrustDevice(event.target.checked)} />
        <span className="ios-checkbox-custom" />
        <span>{text.trust}</span>
      </label>

      <button
        type="submit"
        className="btn btn-primary auth-submit ios-submit-btn"
        disabled={loading || (useRecovery ? value.trim().length < 10 : value.length !== 6)}
      >
        {loading ? <ButtonLoader>{text.submit}</ButtonLoader> : <><span>{text.submit}</span><FiArrowRight className="submit-arrow" /></>}
      </button>

      <div className="two-factor-links" id="two-factor-help">
        <button type="button" className="auth-link-sm" onClick={() => { setUseRecovery((v) => !v); setValue(""); setError(""); }}>
          {useRecovery ? text.useApp : text.useRecovery}
        </button>
        <button type="button" className="auth-link-sm" onClick={onCancel}>
          <FiArrowLeft /> {text.back}
        </button>
      </div>
    </form>
  );
};

export default TwoFactorStep;
