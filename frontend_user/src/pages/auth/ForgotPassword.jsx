import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPasswordRequest } from "../../services/authService";
import "./Auth.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setResetUrl("");
    setLoading(true);
    try {
      const response = await forgotPasswordRequest(email.trim().toLowerCase());
      setMessage(response.message);
      setResetUrl(response.devResetUrl || "");
    } catch (err) {
      setError(err.message || "Unable to request a password reset.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-header">
          <h1>Forgot password?</h1>
          <p>Enter your account email and we will create a secure reset link.</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}
          {message && <div className="auth-success">{message}</div>}
          {resetUrl && (
            <a className="auth-dev-link" href={resetUrl}>
              Open development reset link
            </a>
          )}
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>
          <button className="btn primary auth-submit" disabled={loading}>
            {loading ? "Creating link..." : "Send reset link"}
          </button>
          <p className="auth-footer">
            Remembered it? <Link to="/login">Return to login</Link>
          </p>
        </form>
      </section>
    </main>
  );
};

export default ForgotPassword;
