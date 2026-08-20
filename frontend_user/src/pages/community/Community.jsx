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
import { ButtonLoader, SkeletonGrid } from "../../components/ui/LoadingStates";
import { useLanguage } from "../../context/LanguageContext";
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
  const { t } = useLanguage();
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
  const [submittingRequest, setSubmittingRequest] = useState(false);
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
    setSubmittingRequest(true);
    try {
      await createSkillExchangeRequest({ providerId: match.id, ...requestForm });
      setRequestingId(null);
      setMessage(`Skill exchange request sent to ${match.name}.`);
      await loadCommunity();
    } catch (err) {
      setError(err.message || "Unable to send skill exchange request.");
    } finally {
      setSubmittingRequest(false);
    }
  };

  const recentExchanges = exchanges.slice(0, 6);

  return (
    <main className="community-page">
      <section className="community-hero">
        <div className="hero-content">
          <p className="eyebrow">{t("communityPage.eyebrow")}</p>
          <h1>{t("communityPage.heroTitle")}</h1>
          <p>{t("communityPage.heroDescription")}</p>
        </div>
      </section>

      <section className="section container community-content">
        {error && <div className="auth-error">{error}</div>}
        {message && <div className="profile-success">{message}</div>}

        {user && (
          <>
            <div className="skill-progress-stats">
              <article><IoSwapHorizontalOutline /><strong>{history.stats?.active || 0}</strong><span>{t("communityPage.active")}</span></article>
              <article><IoCheckmarkCircleOutline /><strong>{history.stats?.completed || 0}</strong><span>{t("communityPage.completed")}</span></article>
              <article><IoBookOutline /><strong>{history.stats?.skillsLearned || 0}</strong><span>{t("communityPage.learned")}</span></article>
              <article><IoPeopleOutline /><strong>{history.stats?.averageProgress || 0}%</strong><span>{t("communityPage.average")}</span></article>
            </div>

            <div className="section-header community-section-header">
              <div><h2>{t("communityPage.bestMatches")}</h2><p>{t("communityPage.matchDescription")}</p></div>
            </div>

            {loading ? (
              <SkeletonGrid
                className="skill-match-grid"
                count={3}
                label={t("communityPage.loadingMatches")}
                variant="mentor"
              />
            ) : !profileSkills.teach.length && !profileSkills.learn.length ? (
              <div className="community-empty-card">
                <h3>{t("communityPage.addSkillsTitle")}</h3>
                <p>{t("communityPage.addSkillsDescription")}</p>
                <Link className="btn primary" to="/profile">{t("communityPage.completeProfile")}</Link>
              </div>
            ) : matches.length ? (
              <div className="skill-match-grid">
                {matches.map((match) => (
                  <article className="skill-match-card" key={match.id}>
                    <div className="skill-match-person">
                      {match.avatarUrl ? <img src={match.avatarUrl} alt="" /> : <span>{initials(match.name)}</span>}
                      <div><h3>{match.name}</h3><p>{match.profession || match.role}</p></div>
                      <strong>{t("communityPage.match", { score: match.matchScore })}</strong>
                    </div>
                    <div className="skill-match-directions">
                      <div><small>{t("communityPage.canLearn")}</small><div>{(match.canLearn.length ? match.canLearn : match.teachSkills).slice(0, 3).map((skill) => <span key={skill}>{skill}</span>)}</div></div>
                      <IoSwapHorizontalOutline />
                      <div><small>{t("communityPage.canTeach")}</small><div>{(match.canTeach.length ? match.canTeach : match.learnSkills).slice(0, 3).map((skill) => <span key={skill}>{skill}</span>)}</div></div>
                    </div>
                    {match.activeRequest ? (
                      <Link className="request-existing" to="/skill-requests">{t("communityPage.requestStatus", { status: match.activeRequest.status })}</Link>
                    ) : requestingId === match.id ? (
                      <form className="skill-request-form" onSubmit={(event) => sendRequest(event, match)}>
                        <label>{t("communityPage.iCanTeach")}<input value={requestForm.skillOffered} onChange={(event) => setRequestForm((current) => ({ ...current, skillOffered: event.target.value }))} required /></label>
                        <label>{t("communityPage.iWantLearn")}<input value={requestForm.skillRequested} onChange={(event) => setRequestForm((current) => ({ ...current, skillRequested: event.target.value }))} required /></label>
                        <label>{t("communityPage.message")}<textarea value={requestForm.message} onChange={(event) => setRequestForm((current) => ({ ...current, message: event.target.value }))} /></label>
                        <div className="request-form-actions"><button type="button" className="btn outline" onClick={() => setRequestingId(null)} disabled={submittingRequest}>{t("communityPage.cancel")}</button><button className="btn primary" disabled={submittingRequest}>{submittingRequest ? <ButtonLoader>{t("communityPage.sending")}</ButtonLoader> : t("communityPage.sendRequest")}</button></div>
                      </form>
                    ) : (
                      <div className="skill-match-actions"><Link className="btn outline" to={`/discover/${match.id}`}>{t("communityPage.viewProfile")}</Link><button className="btn primary" type="button" onClick={() => openRequest(match)}>{t("communityPage.requestExchange")}</button></div>
                    )}
                  </article>
                ))}
              </div>
            ) : <p className="community-empty">{t("communityPage.noMatches")}</p>}

            {history.history?.length > 0 && (
              <section className="learning-history-panel">
                <div className="section-header"><div><h2>{t("communityPage.history")}</h2><p>{t("communityPage.historyDescription")}</p></div></div>
                <div className="learning-history-list">{history.history.slice(0, 5).map((item) => <article key={item.id}><IoCheckmarkCircleOutline /><div><strong>{item.learnedSkill}</strong><span>{t("communityPage.learnedWith", { partner: item.partnerName, skill: item.taughtSkill })}</span></div><Link to={`/community/skill-exchange/${item.id}`}>{t("communityPage.details")}</Link></article>)}</div>
              </section>
            )}
          </>
        )}

        <div className="section-header community-section-header"><div><h2>{t("communityPage.recent")}</h2><p>{t("communityPage.recentDescription")}</p></div></div>
        {loading ? (
          <SkeletonGrid
            className="community-grid"
            count={3}
            label={t("communityPage.loadingExchanges")}
            variant="community"
          />
        ) : (
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
                  <p>{exchange.details || t("communityPage.wantsExchange", { name: exchange.offeredBy })}</p>
                  <div className="exchange-owner">
                    <span>{initials(exchange.offeredBy)}</span>
                    <div><small>{t("communityPage.offeredBy")}</small><strong>{exchange.offeredBy}</strong></div>
                  </div>
                  {exchange.status === "accepted" && (
                    <div className="exchange-mini-progress">
                      <div><span>{t("communityPage.progress")}</span><strong>{exchange.progressPercent}%</strong></div>
                      <div className="exchange-mini-track"><span style={{ width: `${exchange.progressPercent}%` }} /></div>
                    </div>
                  )}
                  {isParticipant && <Link className="btn primary small" to={`/community/skill-exchange/${exchange.id}`}>{t("communityPage.viewProgress")}</Link>}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
};

export default Community;

