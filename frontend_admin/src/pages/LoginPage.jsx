import { useState } from "react";
import {
  IoEyeOffOutline,
  IoEyeOutline,
  IoLockClosedOutline,
  IoMailOutline,
  IoShieldCheckmarkOutline,
} from "react-icons/io5";
import logo from "../assets/logo/image.png";
import { loginAdmin } from "../services/api";

const LoginPage = ({ onLogin }) => {
  const [form, setForm] = useState({
    email: "",
    password: "",
    rememberMe: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      onLogin(await loginAdmin(form));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
      </section>
    </main>
  );
};

export default LoginPage;
