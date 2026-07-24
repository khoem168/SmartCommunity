import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  IoBookOutline,
  IoCheckmarkCircleOutline,
  IoPeopleOutline,
  IoSwapHorizontalOutline,
} from "react-icons/io5";
import { useGlobleContext } from "../../context/GlobleContext";
import {
  createSkillExchangeRequest,
  fetchCommunitySkillExchanges,
  fetchSkillExchanges,
  fetchSkillLearningHistory,
  fetchSkillMatches,
} from "../../services/platformService";
import "./Community.css";

const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

const Community = () => {
  const { user } = useGlobleContext();
  const [matches, setMatches] = useState([]);
  const [profileSkills, setProfileSkills] = useState({ teach: [], learn: [] });
  const [exchanges, setExchanges] = useState([]);
  const [history, setHistory] = useState({ history: [], active: [], stats: {} });
  const [requestingId, setRequestingId] = useState(null);
  const [requestForm, setRequestForm] = useState({
    skillOffered: "",
    skillRequested: "",
    message: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadCommunity = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const rows = user
        ? await fetchSkillExchanges()
        : await fetchCommunitySkillExchanges();
      setExchanges(rows);
      if (user) {
        const [matchData, historyData] = await Promise.all([
          fetchSkillMatches(),
          fetchSkillLearningHistory(),
        ]);
        setMatches(matchData.matches || []);
        setProfileSkills(matchData.profileSkills || { teach: [], learn: [] });
        setHistory(historyData);
      }
    } catch (err) {
      setError(err.message || "Unable to load skill exchanges.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    Promise.resolve()
      .then(loadCommunity)
      .catch(() => undefined);
  }, [loadCommunity]);

  const openRequest = (match) => {
    setRequestingId(match.id);
    setRequestForm({
      skillOffered: match.suggestedOfferedSkill || profileSkills.teach[0] || "",
      skillRequested: match.suggestedRequestedSkill || profileSkills.learn[0] || "",
      message: `Hi ${match.name}, I would like to exchange skills with you.`,
    });
    setError("");
    setMessage("");
  };

  const sendRequest = async (event, match) => {
    event.preventDefault();
    setError("");
    try {
      await createSkillExchangeRequest({ providerId: match.id, ...requestForm });
      setRequestingId(null);
      setMessage(`Skill exchange request sent to ${match.name}.`);
      await loadCommunity();
    } catch (err) {
      setError(err.message || "Unable to send skill exchange request.");
    }
  };

  const recentExchanges = exchanges.slice(0, 6);

  return (
    <main className="community-page">
      <section className="community-hero">
        <div className="hero-content">
          <p className="eyebrow">Skill Exchange</p>
          <h1>Teach what you know. Learn what moves you forward.</h1>
          <p>Find compatible community members, exchange knowledge, and track every completed skill.</p>
          <div className="community-hero-actions">
            <Link className="btn primary" to={user ? "/skill-requests" : "/login"}>
              {user ? "Manage my exchanges" : "Login to start"}
            </Link>
            {user && <Link className="btn outline" to="/profile">Update my skills</Link>}
          </div>
        </div>
      </section>

      <section className="section container community-content">
        {error && <div className="auth-error">{error}</div>}
        {message && <div className="profile-success">{message}</div>}
        {loading && <p className="community-empty">Finding skill exchanges...</p>}

        {user && (
          <>
            <div className="skill-progress-stats">
              <article><IoSwapHorizontalOutline /><strong>{history.stats?.active || 0}</strong><span>Active exchanges</span></article>
              <article><IoCheckmarkCircleOutline /><strong>{history.stats?.completed || 0}</strong><span>Completed</span></article>
              <article><IoBookOutline /><strong>{history.stats?.skillsLearned || 0}</strong><span>Skills learned</span></article>
              <article><IoPeopleOutline /><strong>{history.stats?.averageProgress || 0}%</strong><span>Average progress</span></article>
            </div>

            <div className="section-header community-section-header">
              <div><h2>Your best skill matches</h2><p>Scores use what you teach, want to learn, and shared interests.</p></div>
            </div>

            {!profileSkills.teach.length && !profileSkills.learn.length ? (
              <div className="community-empty-card">
                <h3>Add skills to unlock matching</h3>
                <p>Tell the community what you can teach and what you want to learn.</p>
                <Link className="btn primary" to="/profile">Complete skills profile</Link>
              </div>
            ) : matches.length ? (
              <div className="skill-match-grid">
                {matches.map((match) => (
                  <article className="skill-match-card" key={match.id}>
                    <div className="skill-match-person">
                      {match.avatarUrl ? <img src={match.avatarUrl} alt="" /> : <span>{initials(match.name)}</span>}
                      <div><h3>{match.name}</h3><p>{match.profession || match.role}</p></div>
                      <strong>{match.matchScore}% match</strong>
                    </div>
                    <div className="skill-match-directions">
                      <div><small>You can learn</small><div>{(match.canLearn.length ? match.canLearn : match.teachSkills).slice(0, 3).map((skill) => <span key={skill}>{skill}</span>)}</div></div>
                      <IoSwapHorizontalOutline />
                      <div><small>You can teach</small><div>{(match.canTeach.length ? match.canTeach : match.learnSkills).slice(0, 3).map((skill) => <span key={skill}>{skill}</span>)}</div></div>
                    </div>
                    {match.activeRequest ? (
                      <Link className="request-existing" to="/skill-requests">Request {match.activeRequest.status}</Link>
                    ) : requestingId === match.id ? (
                      <form className="skill-request-form" onSubmit={(event) => sendRequest(event, match)}>
                        <label>I can teach<input value={requestForm.skillOffered} onChange={(event) => setRequestForm((current) => ({ ...current, skillOffered: event.target.value }))} required /></label>
                        <label>I want to learn<input value={requestForm.skillRequested} onChange={(event) => setRequestForm((current) => ({ ...current, skillRequested: event.target.value }))} required /></label>
                        <label>Message<textarea value={requestForm.message} onChange={(event) => setRequestForm((current) => ({ ...current, message: event.target.value }))} /></label>
                        <div className="request-form-actions"><button type="button" className="btn outline" onClick={() => setRequestingId(null)}>Cancel</button><button className="btn primary">Send request</button></div>
                      </form>
                    ) : (
                      <div className="skill-match-actions"><Link className="btn outline" to={`/discover/${match.id}`}>View profile</Link><button className="btn primary" type="button" onClick={() => openRequest(match)}>Request exchange</button></div>
                    )}
                  </article>
                ))}
              </div>
            ) : <p className="community-empty">No compatible skill profiles yet.</p>}

            {history.history?.length > 0 && (
              <section className="learning-history-panel">
                <div className="section-header"><div><h2>Learning history</h2><p>Your completed community skill exchanges.</p></div></div>
                <div className="learning-history-list">{history.history.slice(0, 5).map((item) => <article key={item.id}><IoCheckmarkCircleOutline /><div><strong>{item.learnedSkill}</strong><span>Learned with {item.partnerName} · Taught {item.taughtSkill}</span></div><Link to={`/community/skill-exchange/${item.id}`}>Details</Link></article>)}</div>
              </section>
            )}
          </>
        )}

        <div className="section-header community-section-header"><div><h2>Recent community exchanges</h2><p>See what members are teaching and learning.</p></div></div>
        <div className="community-grid">
          {recentExchanges.map((exchange) => {
            const isParticipant = user && [exchange.requesterId, exchange.providerId].includes(user.id);
            return (
              <article key={exchange.id} className="exchange-card">
                <div className="exchange-card-heading">
                  <span className="exchange-swap-icon"><IoSwapHorizontalOutline /></span>
                  <span className={`exchange-status ${exchange.status}`}>{exchange.status}</span>
                </div>
                <div className="exchange-skill-route">
                  <span>{exchange.offeredSkill}</span>
                  <IoSwapHorizontalOutline />
                  <span>{exchange.requestedSkill}</span>
                </div>
                <p>{exchange.details || `${exchange.offeredBy} wants to exchange community skills.`}</p>
                <div className="exchange-owner">
                  <span>{initials(exchange.offeredBy)}</span>
                  <div><small>Offered by</small><strong>{exchange.offeredBy}</strong></div>
                </div>
                {exchange.status === "accepted" && (
                  <div className="exchange-mini-progress">
                    <div><span>Learning progress</span><strong>{exchange.progressPercent}%</strong></div>
                    <div className="exchange-mini-track"><span style={{ width: `${exchange.progressPercent}%` }} /></div>
                  </div>
                )}
                {isParticipant && <Link className="btn primary small" to={`/community/skill-exchange/${exchange.id}`}>View progress</Link>}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
};

export default Community;
