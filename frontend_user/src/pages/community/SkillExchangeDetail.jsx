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
import { getSocket } from "../../services/realtimeService";
import "./Community.css";

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(
        new Date(typeof value === "string" ? value.replace(" ", "T") : value),
      )
    : "Not scheduled";

const SkillExchangeDetail = () => {
  const { exchangeId } = useParams();
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
      const response = await confirmSkillExchangeCompletionRequest(exchangeId, note);
      setMessage(response.message);
      setNote("");
      await loadExchange();
    } catch (err) {
      setError(err.message || "Unable to confirm completion.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <main className="exchange-detail-page community-loading">Loading exchange...</main>;
  if (!exchange) {
    return <main className="exchange-detail-page"><section className="section container"><h1>Skill exchange unavailable</h1><p>{error || "This exchange was not found or does not belong to your account."}</p><Link to="/community" className="btn outline">Back to community</Link></section></main>;
  }

  return (
    <main className="exchange-detail-page">
      <section className="exchange-hero">
        <div className="container exchange-detail-layout">
          <div>
            <p className="eyebrow">Skill Exchange · {exchange.status}</p>
            <h1>{exchange.offeredSkill} for {exchange.requestedSkill}</h1>
            <p>{exchange.details || `${exchange.requesterName} and ${exchange.providerName} are exchanging skills.`}</p>
            <div className="exchange-participants"><span>{exchange.requesterName}</span><strong>↔</strong><span>{exchange.providerName}</span></div>
          </div>
          <div className="exchange-detail-actions">
            <Link to="/skill-requests" className="btn outline">All requests</Link>
            {exchange.conversationId && <Link className="btn primary" to={`/messages/${exchange.conversationId}`}><IoChatbubbleEllipsesOutline /> Chat</Link>}
            {exchange.meetingLink && <a className="btn outline" href={exchange.meetingLink} target="_blank" rel="noreferrer"><IoVideocamOutline /> Meeting</a>}
          </div>
        </div>
      </section>

      <section className="section container exchange-progress-layout">
        {error && <div className="auth-error">{error}</div>}
        {message && <div className="profile-success">{message}</div>}
        <section className="exchange-progress-panel">
          <div className="progress-heading"><div><h2>Learning progress</h2><p>Scheduled: {formatDate(exchange.scheduledDate)}</p></div><strong>{exchange.progressPercent}%</strong></div>
          <div className="exchange-progress-track"><span style={{ width: `${exchange.progressPercent}%` }} /></div>

          {exchange.status === "accepted" && (
            <form className="exchange-progress-form" onSubmit={saveProgress}>
              <label>Progress: {progress}%<input type="range" min="0" max="100" step="5" value={progress} onChange={(event) => setProgress(event.target.value)} /></label>
              <label>Learning note<textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="What did you learn or complete?" maxLength="500" /></label>
              <div className="progress-actions"><button className="btn primary" disabled={busy}>{busy ? "Saving..." : "Save progress"}</button><button type="button" className="btn outline" disabled={busy || exchange.currentUserCompleted} onClick={confirmCompletion}>{exchange.currentUserCompleted ? "You confirmed completion" : "Confirm my completion"}</button></div>
            </form>
          )}

          <div className="completion-confirmations">
            <span className={exchange.requesterCompleted ? "confirmed" : ""}><IoCheckmarkCircleOutline /> {exchange.requesterName}</span>
            <span className={exchange.providerCompleted ? "confirmed" : ""}><IoCheckmarkCircleOutline /> {exchange.providerName}</span>
          </div>
        </section>

        <section className="exchange-progress-panel">
          <h2>Progress updates</h2>
          <div className="progress-timeline">
            {updates.length ? updates.map((update) => <article key={update.id}><IoTimeOutline /><div><strong>{update.userName} · {update.progressPercent}%</strong><p>{update.note || "Progress updated"}</p><small>{formatDate(update.createdAt)}</small></div></article>) : <p className="community-empty">No progress updates yet.</p>}
          </div>
        </section>
      </section>
    </main>
  );
};

export default SkillExchangeDetail;
