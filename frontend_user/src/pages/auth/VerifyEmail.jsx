import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  resendVerificationRequest,
  verifyEmailRequest,
} from "../../services/authService";
import "./Auth.css";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [status, setStatus] = useState(token ? "Verifying your email..." : "");
  const [error, setError] = useState("");
  const [devUrl, setDevUrl] = useState("");
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) return;
    let active = true;
    verifyEmailRequest(token)
      .then((response) => {
        if (active) setStatus(response.message);
      })
      .catch((err) => {
        if (active) {
          setStatus("");
          setError(err.message || "Unable to verify your email.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const handleResend = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setDevUrl("");
    try {
      const response = await resendVerificationRequest(email);
      setStatus(response.message);
      setDevUrl(response.devVerificationUrl || "");
    } catch (err) {
      setError(err.message || "Unable to resend verification.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-header">
          <h1>Verify your email</h1>
          <p>Email verification protects your account and community identity.</p>
        </div>
        <div className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          {status && <div className="auth-success">{status}</div>}
          {devUrl && (
            <a className="auth-dev-link" href={devUrl}>
              Open development verification link
            </a>
          )}
          {!token && (
            <form className="auth-form auth-nested-form" onSubmit={handleResend}>
              <label>
                Account email
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>
              <button className="btn primary auth-submit" disabled={loading}>
                {loading ? "Sending..." : "Resend verification"}
              </button>
            </form>
          )}
          <p className="auth-footer">
            {loading ? "Please wait..." : <Link to="/login">Continue to login</Link>}
          </p>
        </div>
      </section>
    </main>
  );
};

export default VerifyEmail;
