import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resetPasswordRequest } from "../../services/authService";
import "./Auth.css";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!token) return setError("This reset link is missing its token.");
    if (password !== confirmPassword) return setError("Passwords do not match.");
    setLoading(true);
    try {
      const response = await resetPasswordRequest(token, password);
      setMessage(response.message);
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message || "Unable to reset your password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-header">
          <h1>Set a new password</h1>
          <p>Use at least 8 characters with uppercase, lowercase, and a number.</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}
          {message && <div className="auth-success">{message}</div>}
          <label>
            New password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              required
            />
          </label>
          <label>
            Confirm password
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              required
            />
          </label>
          <button className="btn primary auth-submit" disabled={loading || !token}>
            {loading ? "Updating..." : "Reset password"}
          </button>
          <p className="auth-footer">
            <Link to="/login">Return to login</Link>
          </p>
        </form>
      </section>
    </main>
  );
};

export default ResetPassword;
