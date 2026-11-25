import { useEffect, useState } from "react";
import { FiArrowLeft, FiCheckCircle, FiShield, FiXCircle } from "react-icons/fi";
import { FaTelegramPlane } from "react-icons/fa";
import { useGlobleContext } from "../../context/GlobleContext";
import { useLanguage } from "../../context/LanguageContext";

const TelegramApprovalStep = ({ approval, onSuccess, onCancel }) => {
  const { pollTelegramApproval } = useGlobleContext();
  const { language } = useLanguage();
  const isKm = language === "km";

  const [trustDevice, setTrustDevice] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(approval?.expiresInSeconds || 300);
  const [status, setStatus] = useState("pending"); // pending | approved | denied | expired
  const [error, setError] = useState("");

  useEffect(() => {
    const countdown = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setStatus("expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(countdown);
  }, []);

  useEffect(() => {
    if (status !== "pending" || !approval?.approvalToken) return undefined;

    let active = true;
    const poll = async () => {
      try {
        const res = await pollTelegramApproval({
          approvalToken: approval.approvalToken,
          trustDevice,
        });
        if (!active) return;
        if (res?.status === "approved") {
          setStatus("approved");
          window.setTimeout(() => {
            if (active) onSuccess();
          }, 500);
        }
      } catch (err) {
        if (!active) return;
        if (err.code === "TELEGRAM_LOGIN_DENIED") {
          setStatus("denied");
          setError(
            isKm
              ? "ការចូលគណនីត្រូវបានបដិសេធតាម Telegram ហើយ IP នេះត្រូវបានប្លុកការពារ។"
              : "Sign-in was denied via Telegram and this IP was blocked.",
          );
        } else if (err.code === "TELEGRAM_APPROVAL_EXPIRED") {
          setStatus("expired");
          setError(
            isKm
              ? "សំណើអនុញ្ញាតបានផុតកំណត់ហើយ។ សូមព្យាយាម Login ម្តងទៀត។"
              : "Approval request expired. Please sign in again.",
          );
        }
      }
    };

    const interval = window.setInterval(poll, 2500);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [approval?.approvalToken, trustDevice, status, pollTelegramApproval, onSuccess, isKm]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="auth-form two-factor-step telegram-approval-step">
      <div
        className="two-factor-icon"
        aria-hidden="true"
        style={{
          background:
            status === "denied"
              ? "rgba(239, 68, 68, 0.14)"
              : status === "approved"
                ? "rgba(16, 185, 129, 0.14)"
                : "rgba(37, 99, 235, 0.12)",
          color:
            status === "denied"
              ? "#dc2626"
              : status === "approved"
                ? "#059669"
                : "#2563eb",
        }}
      >
        {status === "approved" ? (
          <FiCheckCircle />
        ) : status === "denied" ? (
          <FiXCircle />
        ) : (
          <FaTelegramPlane />
        )}
      </div>

      <h2>
        {status === "approved"
          ? isKm
            ? "បានអនុញ្ញាតជោគជ័យ!"
            : "Approved!"
          : status === "denied"
            ? isKm
              ? "ការចូលត្រូវបានបដិសេធ"
              : "Sign-In Denied"
            : isKm
              ? "ផ្ទៀងផ្ទាត់ Super Admin តាម Telegram"
              : "Super Admin Telegram Verification"}
      </h2>

      <p className="two-factor-text">
        {status === "approved"
          ? isKm
            ? "កំពុងនាំអ្នកចូលទៅកាន់ផ្ទាំងគ្រប់គ្រង..."
            : "Redirecting you to your workspace..."
          : status === "denied" || status === "expired"
            ? error ||
              (isKm
                ? "សំណើអនុញ្ញាតបានផុតកំណត់។ សូមចូលម្តងទៀត។"
                : "Approval request expired. Please try again.")
            : isKm
              ? "យើងបានផ្ញើសំណើទៅកាន់ Telegram (@smartcommunitykh_bot) របស់អ្នក។ សូមបើក Telegram ហើយចុច ✅ ជាខ្ញុំផ្ទាល់ ដើម្បីបន្ត។"
              : "We sent an approval prompt to your Telegram (@smartcommunitykh_bot). Open Telegram and tap Approve to continue."}
      </p>

      {status === "pending" && (
        <>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "8px 16px",
              borderRadius: 999,
              background: "rgba(37, 99, 235, 0.08)",
              color: "#2563eb",
              fontSize: "0.86rem",
              fontWeight: 700,
              margin: "4px auto 8px",
            }}
          >
            <FiShield aria-hidden="true" />
            <span>
              {isKm ? `កំពុងរង់ចាំការចុចអនុញ្ញាត · ${mins}:${secs}` : `Waiting for 1-Tap approval · ${mins}:${secs}`}
            </span>
          </div>

          <label className="auth-checkbox ios-checkbox-label two-factor-trust">
            <input
              type="checkbox"
              checked={trustDevice}
              onChange={(event) => setTrustDevice(event.target.checked)}
            />
            <span className="ios-checkbox-custom" />
            <span>
              {isKm
                ? "ទុកចិត្តឧបករណ៍នេះរយៈពេល ៣០ ថ្ងៃ"
                : "Trust this device for 30 days"}
            </span>
          </label>
        </>
      )}

      {error && (
        <div className="auth-error ios-alert-glass" role="alert">
          {error}
        </div>
      )}

      <div className="two-factor-links" style={{ justifyContent: "center", marginTop: 8 }}>
        <button type="button" className="auth-link-sm" onClick={onCancel}>
          <FiArrowLeft /> {isKm ? "ត្រឡប់ទៅទំព័រ Login" : "Back to Login"}
        </button>
      </div>
    </div>
  );
};

export default TelegramApprovalStep;
