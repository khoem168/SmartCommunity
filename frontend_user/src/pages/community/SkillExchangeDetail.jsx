import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  IoChatbubbleEllipsesOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoVideocamOutline,
} from "react-icons/io5";
import {
  confirmSkillExchangeCompletionRequest,
  fetchSkillExchangeDetail,
  updateSkillExchangeProgressRequest,
} from "../../services/platformService";
import { useLanguage } from "../../context/LanguageContext";
import { getSocket } from "../../services/realtimeService";
import "./Community.css";

const formatDate = (value, isKm = false) =>
  value
    ? new Intl.DateTimeFormat(isKm ? "km-KH" : "en", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(
        new Date(typeof value === "string" ? value.replace(" ", "T") : value),
      )
    : isKm
      ? "មិនទាន់កំណត់ពេល"
      : "Not scheduled";

const SkillExchangeDetail = () => {
  const { exchangeId } = useParams();
  const { language } = useLanguage();
  const isKm = language === "km";
  const [exchange, setExchange] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [progress, setProgress] = useState(0);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadExchange = useCallback(async () => {
    const response = await fetchSkillExchangeDetail(exchangeId);
    setExchange(response.exchange);
    setUpdates(response.updates || []);
    setProgress(response.exchange.progressPercent || 0);
  }, [exchangeId]);

  useEffect(() => {
    let active = true;
    Promise.resolve()
      .then(loadExchange)
      .catch((err) => {
        if (active) setError(err.message || "Unable to load this exchange.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [loadExchange]);

  useEffect(() => {
    const socket = getSocket();
    const handleProgress = (payload) => {
      if (String(payload.exchangeId) === String(exchangeId)) loadExchange();
    };
    socket.on("skill-exchange:progress", handleProgress);
    return () => socket.off("skill-exchange:progress", handleProgress);
  }, [exchangeId, loadExchange]);

  const saveProgress = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await updateSkillExchangeProgressRequest(exchangeId, {
        progressPercent: Number(progress),
        note,
      });
      setMessage(response.message);
      setNote("");
      await loadExchange();
    } catch (err) {
      setError(err.message || "Unable to update progress.");
    } finally {
      setBusy(false);
    }
  };

  const confirmCompletion = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await confirmSkillExchangeCompletionRequest(
        exchangeId,
        note,
      );
      setMessage(response.message);
      setNote("");
      await loadExchange();
    } catch (err) {
      setError(err.message || "Unable to confirm completion.");
    } finally {
      setBusy(false);
    }
  };

  if (loading)
    return (
      <main className="exchange-detail-page community-loading">
        {isKm ? "កំពុងទាញយកព័ត៌មានការផ្លាស់ប្តូរជំនាញ..." : "Loading exchange..."}
      </main>
    );
  if (!exchange) {
    const localizedError =
      isKm && error && error.toLowerCase().includes("not found")
        ? "រកមិនឃើញទិន្នន័យការផ្លាស់ប្តូរជំនាញនេះ ឬមិនមែនជារបស់គណនីអ្នកទេ។"
        : error;
    return (
      <main className="exchange-detail-page">
        <section
          className="section container"
          style={{
            maxWidth: 620,
            margin: "48px auto",
            padding: "42px 32px",
            borderRadius: 24,
            background: "#fff",
            border: "1px solid rgba(15, 23, 42, 0.08)",
            boxShadow: "0 18px 42px -18px rgba(15, 23, 42, 0.08)",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: "clamp(1.6rem, 2.8vw, 2.2rem)", marginBottom: 12 }}>
            {isKm ? "រកមិនឃើញការផ្លាស់ប្តូរជំនាញនេះទេ" : "Skill exchange unavailable"}
          </h1>
          <p style={{ color: "#64748b", marginBottom: 22 }}>
            {localizedError ||
              (isKm
                ? "ការផ្លាស់ប្តូរជំនាញនេះមិនមាននៅក្នុងប្រព័ន្ធ ឬមិនមែនជារបស់គណនីអ្នកទេ។"
                : "This exchange was not found or does not belong to your account.")}
          </p>
          <Link to="/skill-exchange" className="btn primary">
            {isKm ? "ត្រឡប់ទៅមជ្ឈមណ្ឌលប្តូរជំនាញ" : "Back to Skill Exchange"}
          </Link>
        </section>
      </main>
    );
  }

  const statusLabel = isKm
    ? {
        accepted: "កំពុងដំណើរការ",
        completed: "បានបញ្ចប់",
        pending: "កំពុងរង់ចាំ",
        cancelled: "បានបោះបង់",
        rejected: "បានបដិសេធ",
      }[exchange.status] || exchange.status
    : exchange.status;

  return (
    <main className="exchange-detail-page">
      <section className="exchange-hero">
        <div className="container exchange-detail-layout">
          <div>
            <p className="eyebrow">
              {isKm ? "ការផ្លាស់ប្តូរជំនាញ" : "Skill Exchange"} · {statusLabel}
            </p>
            <h1>
              {exchange.offeredSkill} {isKm ? "ប្តូរជាមួយ" : "for"} {exchange.requestedSkill}
            </h1>
            <p>
              {exchange.details ||
                (isKm
                  ? `${exchange.requesterName} និង ${exchange.providerName} កំពុងផ្លាស់ប្តូរជំនាញជាមួយគ្នា។`
                  : `${exchange.requesterName} and ${exchange.providerName} are exchanging skills.`)}
            </p>
            <div className="exchange-participants">
              <span>{exchange.requesterName}</span>
              <strong>↔</strong>
              <span>{exchange.providerName}</span>
            </div>
          </div>
          <div className="exchange-detail-actions">
            <Link to="/skill-requests" className="btn outline">
              {isKm ? "សំណើទាំងអស់" : "All requests"}
            </Link>
            {exchange.conversationId && (
              <Link
                className="btn primary"
                to={`/messages/${exchange.conversationId}`}
              >
                <IoChatbubbleEllipsesOutline /> {isKm ? "ផ្ញើសារ" : "Chat"}
              </Link>
            )}
            {exchange.meetingLink && (
              <a
                className="btn outline"
                href={exchange.meetingLink}
                target="_blank"
                rel="noreferrer"
              >
                <IoVideocamOutline /> {isKm ? "ចូលបន្ទប់ប្រជុំ" : "Meeting"}
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="section container exchange-progress-layout">
        {error && <div className="auth-error">{error}</div>}
        {message && <div className="profile-success">{message}</div>}
        <section className="exchange-progress-panel">
          <div className="progress-heading">
            <div>
              <h2>{isKm ? "វឌ្ឍនភាពនៃការសិក្សា" : "Learning progress"}</h2>
              <p>
                {isKm ? "កាលវិភាគ៖ " : "Scheduled: "}
                {formatDate(exchange.scheduledDate, isKm)}
              </p>
            </div>
            <strong>{exchange.progressPercent}%</strong>
          </div>
          <div className="exchange-progress-track">
            <span style={{ width: `${exchange.progressPercent}%` }} />
          </div>

          {exchange.status === "accepted" && exchange.isParticipant !== false && (
            <form className="exchange-progress-form" onSubmit={saveProgress}>
              <label>
                {isKm ? "វឌ្ឍនភាព៖" : "Progress:"} {progress}%
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={progress}
                  onChange={(event) => setProgress(event.target.value)}
                />
              </label>
              <label>
                {isKm ? "កំណត់ត្រាសិក្សា" : "Learning note"}
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder={
                    isKm
                      ? "តើអ្នកបានរៀន ឬសម្រេចអ្វីខ្លះក្នុងវគ្គនេះ?"
                      : "What did you learn or complete?"
                  }
                  maxLength="500"
                />
              </label>
              <div className="progress-actions">
                <button className="btn primary" disabled={busy}>
                  {busy
                    ? isKm
                      ? "កំពុងរក្សាទុក..."
                      : "Saving..."
                    : isKm
                      ? "រក្សាទុកវឌ្ឍនភាព"
                      : "Save progress"}
                </button>
                <button
                  type="button"
                  className="btn outline"
                  disabled={busy || exchange.currentUserCompleted}
                  onClick={confirmCompletion}
                >
                  {exchange.currentUserCompleted
                    ? isKm
                      ? "អ្នកបានបញ្ជាក់ការបញ្ចប់រួចហើយ"
                      : "You confirmed completion"
                    : isKm
                      ? "បញ្ជាក់ការបញ្ចប់វគ្គ"
                      : "Confirm my completion"}
                </button>
              </div>
            </form>
          )}

          <div className="completion-confirmations">
            <span className={exchange.requesterCompleted ? "confirmed" : ""}>
              <IoCheckmarkCircleOutline /> {exchange.requesterName}
            </span>
            <span className={exchange.providerCompleted ? "confirmed" : ""}>
              <IoCheckmarkCircleOutline /> {exchange.providerName}
            </span>
          </div>
        </section>

        <section className="exchange-progress-panel">
          <h2>{isKm ? "ប្រវត្តិវឌ្ឍនភាព" : "Progress updates"}</h2>
          <div className="progress-timeline">
            {updates.length ? (
              updates.map((update) => (
                <article key={update.id}>
                  <IoTimeOutline />
                  <div>
                    <strong>
                      {update.userName} · {update.progressPercent}%
                    </strong>
                    <p>{update.note || (isKm ? "បានធ្វើបច្ចុប្បន្នភាពវឌ្ឍនភាព" : "Progress updated")}</p>
                    <small>{formatDate(update.createdAt, isKm)}</small>
                  </div>
                </article>
              ))
            ) : (
              <p className="community-empty">
                {isKm ? "មិនទាន់មានកំណត់ត្រាវឌ្ឍនភាពនៅឡើយទេ។" : "No progress updates yet."}
              </p>
            )}
          </div>
        </section>
      </section>
    </main>
  );
};

export default SkillExchangeDetail;
