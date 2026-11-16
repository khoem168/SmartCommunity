import { useState } from "react";
import {
  IoEyeOffOutline,
  IoEyeOutline,
  IoLockClosedOutline,
  IoMailOutline,
  IoShieldCheckmarkOutline,
} from "react-icons/io5";
import logo from "../assets/logo/image.png";
import { loginAdmin, verifyAdminTwoFactor } from "../services/api";

const LoginPage = ({ onLogin }) => {
  const [form, setForm] = useState({
    email: "",
    password: "",
    rememberMe: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // Second step for accounts with two-step verification.
  const [challenge, setChallenge] = useState(null);
  const [code, setCode] = useState("");
  const [useRecovery, setUseRecovery] = useState(false);
  const [trustDevice, setTrustDevice] = useState(true);

  const change = (event) => {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await loginAdmin(form);
      if (result?.twoFactorRequired) {
        setChallenge(result);
        setForm((current) => ({ ...current, password: "" }));
        return;
      }
      onLogin(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitCode = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      onLogin(
        await verifyAdminTwoFactor({
          challengeToken: challenge.challengeToken,
          rememberMe: challenge.rememberMe,
          trustDevice,
          ...(useRecovery ? { recoveryCode: code.trim() } : { code }),
        }),
      );
    } catch (err) {
      setError(err.message);
      setCode("");
      if (err.code === "TWO_FACTOR_CHALLENGE_EXPIRED") setChallenge(null);
    } finally {
      setLoading(false);
    }
  };

  const codeReady = useRecovery ? code.trim().length >= 10 : code.length === 6;

  return (
    <main className="login-page">
      <section className="login-story">
        <div className="login-story-content">
          <img src={logo} alt="Smart Community" />
          <p className="eyebrow light">Administration workspace</p>
          <h1>Keep the community trusted, useful, and growing.</h1>
          <p>
            Review people, programs, opportunities, and platform health from one
            secure control center.
          </p>
          <div className="login-security">
            <IoShieldCheckmarkOutline />
            <div>
              <strong>Protected administrator access</strong>
              <span>JWT authentication · Role enforcement · Audit history</span>
            </div>
          </div>
        </div>
        <div className="login-orb login-orb-one" />
        <div className="login-orb login-orb-two" />
      </section>

      <section className="login-panel">
        {challenge ? (
        <form className="login-form" onSubmit={submitCode}>
          <div className="login-brand-mobile">
            <img src={logo} alt="Smart Community" />
            <span>Admin</span>
          </div>
          <p className="eyebrow">Two-step verification</p>
          <h2>Enter your code</h2>
          <p className="login-intro">
            {useRecovery
              ? "Enter one of your saved recovery codes. Each works once."
              : "Open your authenticator app and enter the 6-digit code."}
          </p>

          {error && <div className="form-alert">{error}</div>}

          <label className="field">
            <span>{useRecovery ? "Recovery code" : "6-digit code"}</span>
            <div className="input-with-icon">
              <IoShieldCheckmarkOutline />
              <input
                value={code}
                onChange={(event) =>
                  setCode(useRecovery ? event.target.value.slice(0, 20) : event.target.value.replace(/D/g, "").slice(0, 6))
                }
                inputMode={useRecovery ? "text" : "numeric"}
                autoComplete="one-time-code"
                placeholder={useRecovery ? "xxxxx-xxxxx" : "123456"}
                autoFocus
                required
              />
            </div>
          </label>

          <label className="check-field">
            <input type="checkbox" checked={trustDevice} onChange={(event) => setTrustDevice(event.target.checked)} />
            <span>Trust this device for 30 days</span>
          </label>

          <button className="button primary login-button" disabled={loading || !codeReady}>
            {loading ? <span className="spinner light" /> : "Verify and open dashboard"}
          </button>
          <p className="login-help">
            <button type="button" className="link-button" onClick={() => { setUseRecovery((v) => !v); setCode(""); setError(""); }}>
              {useRecovery ? "Use a code from the app instead" : "Lost your phone? Use a recovery code"}
            </button>
            {" · "}
            <button type="button" className="link-button" onClick={() => { setChallenge(null); setCode(""); setError(""); }}>
              Back
            </button>
          </p>
        </form>
        ) : (
        <form className="login-form" onSubmit={submit}>
          <div className="login-brand-mobile">
            <img src={logo} alt="Smart Community" />
            <span>Admin</span>
          </div>
          <p className="eyebrow">Welcome back</p>
          <h2>Sign in to Admin Control</h2>
          <p className="login-intro">
            Use an account with the administrator role.
          </p>

          {error && <div className="form-alert">{error}</div>}

          <label className="field">
            <span>Email address</span>
            <div className="input-with-icon">
              <IoMailOutline />
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={change}
                placeholder="admin@example.com"
                autoComplete="email"
                required
              />
            </div>
          </label>

          <label className="field">
            <span>Password</span>
            <div className="input-with-icon">
              <IoLockClosedOutline />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={change}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
              <button
                className="input-action"
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
              </button>
            </div>
          </label>

          <label className="check-field">
            <input
              name="rememberMe"
              type="checkbox"
              checked={form.rememberMe}
              onChange={change}
            />
            <span>Keep me signed in on this device</span>
          </label>

          <button className="button primary login-button" disabled={loading}>
            {loading ? <span className="spinner light" /> : "Open dashboard"}
          </button>
          <p className="login-help">
            Access is logged. Contact the system owner if your role has changed.
          </p>
        </form>
        )}
      </section>
    </main>
  );
};

export default LoginPage;
