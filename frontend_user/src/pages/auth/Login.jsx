import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GoogleLoginButton from "../../components/auth/GoogleLoginButton";
import { useGlobleContext } from "../../context/GlobleContext";
import "./Auth.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { googleLogin, loginUser } = useGlobleContext();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNeedsVerification(false);

    if (!email || !password) return setError("Please enter email and password.");
    if (!email.includes("@")) return setError("Please enter a valid email address.");

    setLoading(true);
    try {
      await loginUser({ email: email.toLowerCase(), password, rememberMe: remember });
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Unable to login. Please try again.");
      setNeedsVerification(err.code === "EMAIL_NOT_VERIFIED");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = async (credential) => {
    setError("");
    setLoading(true);
    try {
      await googleLogin({ credential, rememberMe: remember });
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Unable to continue with Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-header">
          <h1>Login</h1>
          <p>Access your learning dashboard, mentorship, and job opportunities.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}
          {needsVerification && (
            <Link className="auth-dev-link" to={`/verify-email?email=${encodeURIComponent(email)}`}>
              Resend email verification
            </Link>
          )}

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </label>

          <div className="auth-row">
            <label className="auth-checkbox">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              Remember me
            </label>
            <Link className="auth-link" to="/forgot-password">
              Forgot password?
            </Link>
          </div>

          <button type="submit" className="btn primary auth-submit" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>

          <div className="auth-divider">or continue with</div>
          <GoogleLoginButton onCredential={handleGoogleCredential} onError={setError} />

          <p className="auth-footer">
            Don&apos;t have an account? <Link to="/register">Create one</Link>
          </p>
        </form>
      </section>
    </main>
  );
};

export default Login;
