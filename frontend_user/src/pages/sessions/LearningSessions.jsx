import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  IoAddOutline,
  IoCalendarOutline,
  IoCheckmarkCircleOutline,
  IoCloseOutline,
  IoPeopleOutline,
  IoSearchOutline,
  IoStar,
  IoTimeOutline,
  IoVideocamOutline,
} from "react-icons/io5";
import { useGlobleContext } from "../../context/GlobleContext";
import { useLanguage } from "../../context/LanguageContext";
import {
  cancelLearningSessionRegistration,
  createLearningSession,
  getLearningSession,
  getLearningSessionParticipants,
  listLearningSessions,
  registerForLearningSession,
  submitLearningSessionFeedback,
  updateLearningSessionStatus,
} from "../../services/learningSessionService";
import { ButtonLoader, SkeletonGrid } from "../../components/ui/LoadingStates";
import "./LearningSessions.css";

const emptyForm = {
  title: "",
  description: "",
  category: "Programming",
  level: "all",
  scheduledTime: "",
  registrationDeadline: "",
  durationMinutes: 60,
  maxParticipants: 50,
  materialsText: "",
};

const formatDate = (value, locale) =>
  new Date(value).toLocaleString(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const LearningSessions = () => {
  const { user } = useGlobleContext();
  const { language, t } = useLanguage();
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [scope, setScope] = useState("upcoming");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [selected, setSelected] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [feedback, setFeedback] = useState({ rating: 5, feedback: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const canCreate = ["mentor", "admin"].includes(user?.role);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listLearningSessions({
        scope,
        q: query,
        category,
      });
      setSessions(response.sessions || []);
      setCategories(response.categories || []);
      setError("");
    } catch (err) {
      setError(err.message || t("sessionsPage.loadError"));
    } finally {
      setLoading(false);
    }
  }, [scope, query, category, t]);

  useEffect(() => {
    const timer = window.setTimeout(loadSessions, 250);
    return () => window.clearTimeout(timer);
  }, [loadSessions]);

  useEffect(() => {
    if (!sessionId) return;
    const loadDetail = async () => {
      try {
        const response = await getLearningSession(sessionId);
        setSelected(response.session);
        if (response.session.isHost) {
          setParticipants(await getLearningSessionParticipants(sessionId));
        } else {
          setParticipants([]);
        }
      } catch (err) {
        setError(err.message || t("sessionsPage.detailError"));
      }
    };
    loadDetail();
  }, [sessionId, t]);

  const stats = useMemo(
    () => ({
      upcoming: sessions.filter((item) =>
        ["scheduled", "ongoing"].includes(item.status),
      ).length,
      registered: sessions.filter((item) => item.isRegistered).length,
      live: sessions.filter((item) => item.status === "ongoing").length,
    }),
    [sessions],
  );

  const refreshSelected = async (id = sessionId) => {
    await loadSessions();
    if (!id) return;
    const response = await getLearningSession(id);
    setSelected(response.session);
    if (response.session.isHost) {
      setParticipants(await getLearningSessionParticipants(id));
    }
  };

  const handleRegistration = async (session) => {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      setBusy(`registration-${session.id}`);
      setError("");
      if (session.isRegistered) {
        await cancelLearningSessionRegistration(session.id);
      } else {
        await registerForLearningSession(session.id);
      }
      await refreshSelected(selected?.id === session.id ? session.id : null);
    } catch (err) {
      setError(err.message || t("sessionsPage.registrationError"));
    } finally {
      setBusy("");
    }
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    try {
      setBusy("create");
      const materials = form.materialsText
        .split("\n")
        .map((url) => url.trim())
        .filter(Boolean)
        .map((url) => ({ url, label: url }));
      const result = await createLearningSession({ ...form, materials });
      setForm(emptyForm);
      setCreateOpen(false);
      setScope("my");
      await loadSessions();
      navigate(`/sessions/${result.sessionId}`);
    } catch (err) {
      setError(err.message || t("sessionsPage.createError"));
    } finally {
      setBusy("");
    }
  };

  const changeStatus = async (status) => {
    if (!selected) return;
    const cancelReason =
      status === "cancelled"
        ? window.prompt(t("sessionsPage.cancelReasonPrompt")) || ""
        : "";
    try {
      setBusy(`status-${status}`);
      await updateLearningSessionStatus(selected.id, { status, cancelReason });
      await refreshSelected(selected.id);
    } catch (err) {
      setError(err.message || t("sessionsPage.statusError"));
    } finally {
      setBusy("");
    }
  };

  const submitFeedback = async (event) => {
    event.preventDefault();
    try {
      setBusy("feedback");
      await submitLearningSessionFeedback(selected.id, feedback);
      setFeedback({ rating: 5, feedback: "" });
      await refreshSelected(selected.id);
    } catch (err) {
      setError(err.message || t("sessionsPage.feedbackError"));
    } finally {
      setBusy("");
    }
  };

  return (
    <main className="sessions-page">
      <section className="sessions-hero">
        <div className="container sessions-hero-inner">
          <div>
            <p className="eyebrow">{t("sessionsPage.eyebrow")}</p>
            <h1>{t("sessionsPage.title")}</h1>
            <p>{t("sessionsPage.description")}</p>
            <div className="sessions-hero-actions">
              {canCreate && (
                <button
                  className="btn primary"
                  type="button"
                  onClick={() => setCreateOpen(true)}
                >
                  <IoAddOutline /> {t("sessionsPage.createSession")}
                </button>
              )}
              <button
                className="btn outline"
                type="button"
                onClick={() => (user ? setScope("my") : navigate("/login"))}
              >
                {user
                  ? t("sessionsPage.mySessions")
                  : t("sessionsPage.loginToJoin")}
              </button>
            </div>
          </div>
          <div className="sessions-stats">
            <div>
              <strong>{stats.upcoming}</strong>
              <span>{t("sessionsPage.upcoming")}</span>
            </div>
            <div>
              <strong>{stats.registered}</strong>
              <span>{t("sessionsPage.registered")}</span>
            </div>
            <div className={stats.live > 0 ? "sessions-live-stat" : ""}>
              <strong>{stats.live}</strong>
              <span>{t("sessionsPage.liveNow")}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section container sessions-content">
        {error && <div className="sessions-error">{error}</div>}
        <div className="sessions-toolbar">
          <label className="sessions-search">
            <IoSearchOutline />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("sessionsPage.searchPlaceholder")}
            />
          </label>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">{t("sessionsPage.allCategories")}</option>
            {categories.map((item) => (
              <option value={item} key={item}>
                {item}
              </option>
            ))}
          </select>
          <div className="sessions-tabs">
            {["upcoming", "my", "past", "cancelled"].map((item) => (
              <button
                type="button"
                className={scope === item ? "active" : ""}
                onClick={() => setScope(item)}
                key={item}
              >
                {t(`sessionsPage.tabs.${item}`)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <SkeletonGrid
            className="sessions-grid"
            count={3}
            label={t("sessionsPage.loading")}
            variant="session"
          />
        ) : sessions.length ? (
          <div className="sessions-grid">
            {sessions.map((session) => {
              const full = session.participantCount >= session.maxParticipants;
              return (
                <article className="session-card" key={session.id}>
                  <div className="session-card-top">
                    <span
                      className={`session-status ${session.status} ${session.status === "ongoing" ? "realtime-live-pill" : ""}`}
                    >
                      {t(`sessionsPage.status.${session.status}`)}
                    </span>
                    <span className="session-level">
                      {t(`sessionsPage.level.${session.level}`)}
                    </span>
                  </div>
                  <span className="session-category">{session.category}</span>
                  <h2>{session.title}</h2>
                  <p className="session-description">
                    {session.description || t("sessionsPage.defaultDescription")}
                  </p>
                  <div className="session-host">
                    <span>{initials(session.hostName)}</span>
                    <div>
                      <strong>{session.hostName}</strong>
                      <small>{session.hostTitle || t("sessionsPage.host")}</small>
                    </div>
                  </div>
                  <div className="session-meta">
                    <span>
                      <IoCalendarOutline />{" "}
                      {formatDate(
                        session.scheduledTime,
                        language === "km" ? "km-KH" : "en-US",
                      )}
                    </span>
                    <span>
                      <IoTimeOutline /> {session.durationMinutes}{" "}
                      {t("sessionsPage.minutes")}
                    </span>
                    <span>
                      <IoPeopleOutline /> {session.participantCount}/
                      {session.maxParticipants}
                    </span>
                    <span>
                      <IoVideocamOutline /> Jitsi Meet
                    </span>
                  </div>
                  <div className="session-card-actions">
                    <button
                      type="button"
                      className="btn outline small"
                      onClick={() => navigate(`/sessions/${session.id}`)}
                    >
                      {t("sessionsPage.viewDetails")}
                    </button>
                    {session.canJoin ? (
                      <Link
                        className="btn primary small"
                        to={`/sessions/${session.id}/room`}
                      >
                        <IoVideocamOutline /> {t("sessionsPage.joinNow")}
                      </Link>
                    ) : !session.isHost && session.status === "scheduled" ? (
                      <button
                        type="button"
                        className={`btn small ${session.isRegistered ? "outline" : "primary"}`}
                        onClick={() => handleRegistration(session)}
                        disabled={
                          (full && !session.isRegistered) ||
                          busy === `registration-${session.id}`
                        }
                      >
                        {busy === `registration-${session.id}` ? (
                          <ButtonLoader>{t("sessionsPage.updating")}</ButtonLoader>
                        ) : session.isRegistered ? (
                          t("sessionsPage.cancelRegistration")
                        ) : full ? (
                          t("sessionsPage.sessionFull")
                        ) : (
                          t("sessionsPage.register")
                        )}
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="sessions-empty">
            <IoVideocamOutline size={46} />
            <h2>{t("sessionsPage.noSessions")}</h2>
            <p>{t("sessionsPage.noSessionsDescription")}</p>
          </div>
        )}
      </section>

      {sessionId && selected && (
        <div className="session-detail-backdrop" role="presentation">
          <section
            className="session-detail-panel"
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              className="session-close"
              onClick={() => navigate("/sessions")}
              aria-label={t("sessionsPage.closeDetails")}
            >
              <IoCloseOutline />
            </button>
            <span
              className={`session-status ${selected.status} ${selected.status === "ongoing" ? "realtime-live-pill" : ""}`}
            >
              {t(`sessionsPage.status.${selected.status}`)}
            </span>
            <h2>{selected.title}</h2>
            <p>
              {selected.description || t("sessionsPage.defaultLiveDescription")}
            </p>
            <div className="detail-session-meta">
              <span>
                <IoCalendarOutline />{" "}
                {formatDate(
                  selected.scheduledTime,
                  language === "km" ? "km-KH" : "en-US",
                )}
              </span>
              <span>
                <IoTimeOutline /> {selected.durationMinutes}{" "}
                {t("sessionsPage.minutes")}
              </span>
              <span>
                <IoPeopleOutline /> {selected.participantCount}/
                {selected.maxParticipants} {t("sessionsPage.participants")}
              </span>
              <span>
                <IoVideocamOutline /> {t("sessionsPage.jitsiFeature")}
              </span>
            </div>

            {selected.materials?.length > 0 && (
              <div className="session-materials">
                <h3>{t("sessionsPage.materials")}</h3>
                {selected.materials.map((material) => (
                  <a
                    href={material.url}
                    target="_blank"
                    rel="noreferrer"
                    key={material.url}
                  >
                    {material.label}
                  </a>
                ))}
              </div>
            )}

            <div className="detail-session-actions">
              {selected.canJoin && (
                <Link
                  className="btn primary"
                  to={`/sessions/${selected.id}/room`}
                >
                  <IoVideocamOutline /> {t("sessionsPage.enterRoom")}
                </Link>
              )}
              {!selected.isHost && selected.status === "scheduled" && (
                <button
                  className="btn outline"
                  type="button"
                  onClick={() => handleRegistration(selected)}
                  disabled={busy === `registration-${selected.id}`}
                >
                  {busy === `registration-${selected.id}` ? (
                    <ButtonLoader>{t("sessionsPage.updating")}</ButtonLoader>
                  ) : selected.isRegistered ? (
                    t("sessionsPage.cancelRegistration")
                  ) : (
                    t("sessionsPage.registerForSession")
                  )}
                </button>
              )}
              {selected.isHost && selected.status === "scheduled" && (
                <>
                  <button
                    className="btn primary"
                    type="button"
                    onClick={() => changeStatus("ongoing")}
                    disabled={busy === "status-ongoing"}
                  >
                    {busy === "status-ongoing" ? (
                      <ButtonLoader>{t("sessionsPage.starting")}</ButtonLoader>
                    ) : (
                      t("sessionsPage.startSession")
                    )}
                  </button>
                  <button
                    className="btn outline"
                    type="button"
                    onClick={() => changeStatus("cancelled")}
                    disabled={busy === "status-cancelled"}
                  >
                    {busy === "status-cancelled" ? (
                      <ButtonLoader>{t("sessionsPage.cancelling")}</ButtonLoader>
                    ) : (
                      t("sessionsPage.cancelSession")
                    )}
                  </button>
                </>
              )}
              {selected.isHost && selected.status === "ongoing" && (
                <button
                  className="btn primary"
                  type="button"
                  onClick={() => changeStatus("completed")}
                  disabled={busy === "status-completed"}
                >
                  {busy === "status-completed" ? (
                    <ButtonLoader>{t("sessionsPage.completing")}</ButtonLoader>
                  ) : (
                    t("sessionsPage.completeSession")
                  )}
                </button>
              )}
            </div>

            {selected.isHost && (
              <div className="attendance-board">
                <h3>
                  {t("sessionsPage.attendance", { count: participants.length })}
                </h3>
                {participants.length ? (
                  participants.map((participant) => (
                    <div className="attendance-row" key={participant.id}>
                      <span className="attendance-avatar">
                        {initials(participant.name)}
                      </span>
                      <span>
                        <strong>{participant.name}</strong>
                        <small>{participant.email}</small>
                      </span>
                      <span
                        className={`attendance-label ${participant.attendanceStatus}`}
                      >
                        {participant.attendanceStatus}
                      </span>
                      <span>
                        {participant.attendanceMinutes || 0} {t("sessionsPage.min")}
                      </span>
                    </div>
                  ))
                ) : (
                  <p>{t("sessionsPage.noRegistrations")}</p>
                )}
              </div>
            )}

            {!selected.isHost &&
              selected.attendanceStatus === "attended" &&
              !selected.myRating && (
                <form className="session-feedback" onSubmit={submitFeedback}>
                  <h3>{t("sessionsPage.rateSession")}</h3>
                  <label>
                    {t("sessionsPage.rating")}
                    <select
                      value={feedback.rating}
                      onChange={(event) =>
                        setFeedback((current) => ({
                          ...current,
                          rating: Number(event.target.value),
                        }))
                      }
                    >
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <option value={rating} key={rating}>
                          {rating} {t("sessionsPage.stars")}
                        </option>
                      ))}
                    </select>
                  </label>
                  <textarea
                    value={feedback.feedback}
                    maxLength={1500}
                    onChange={(event) =>
                      setFeedback((current) => ({
                        ...current,
                        feedback: event.target.value,
                      }))
                    }
                    placeholder={t("sessionsPage.feedbackPlaceholder")}
                  />
                  <button
                    className="btn primary small"
                    type="submit"
                    disabled={busy === "feedback"}
                  >
                    {busy === "feedback" ? (
                      <ButtonLoader>{t("sessionsPage.submitting")}</ButtonLoader>
                    ) : (
                      <>
                        <IoStar /> {t("sessionsPage.submitFeedback")}
                      </>
                    )}
                  </button>
                </form>
              )}
            {selected.myRating && (
              <p className="feedback-saved">
                <IoCheckmarkCircleOutline />{" "}
                {t("sessionsPage.feedbackSaved", {
                  rating: selected.myRating,
                })}
              </p>
            )}
          </section>
        </div>
      )}

      {createOpen && (
        <div className="session-detail-backdrop" role="presentation">
          <form className="create-session-panel" onSubmit={handleCreate}>
            <div className="create-session-header">
              <div>
                <h2>{t("sessionsPage.scheduleTitle")}</h2>
                <p>{t("sessionsPage.scheduleDescription")}</p>
              </div>
              <button
                type="button"
                className="session-close inline"
                onClick={() => setCreateOpen(false)}
              >
                <IoCloseOutline />
              </button>
            </div>
            <div className="create-session-grid">
              <label className="wide">
                {t("sessionsPage.form.title")}
                <input
                  required
                  minLength={3}
                  maxLength={200}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </label>
              <label>
                {t("sessionsPage.form.category")}
                <input
                  required
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                />
              </label>
              <label>
                {t("sessionsPage.form.level")}
                <select
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value })}
                >
                  <option value="all">{t("sessionsPage.level.all")}</option>
                  <option value="beginner">
                    {t("sessionsPage.level.beginner")}
                  </option>
                  <option value="intermediate">
                    {t("sessionsPage.level.intermediate")}
                  </option>
                  <option value="advanced">
                    {t("sessionsPage.level.advanced")}
                  </option>
                </select>
              </label>
              <label>
                {t("sessionsPage.form.startTime")}
                <input
                  required
                  type="datetime-local"
                  value={form.scheduledTime}
                  onChange={(e) =>
                    setForm({ ...form, scheduledTime: e.target.value })
                  }
                />
              </label>
              <label>
                {t("sessionsPage.form.deadline")}
                <input
                  type="datetime-local"
                  value={form.registrationDeadline}
                  onChange={(e) =>
                    setForm({ ...form, registrationDeadline: e.target.value })
                  }
                />
              </label>
              <label>
                {t("sessionsPage.form.duration")}
                <input
                  required
                  type="number"
                  min="15"
                  max="480"
                  value={form.durationMinutes}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      durationMinutes: Number(e.target.value),
                    })
                  }
                />
              </label>
              <label>
                {t("sessionsPage.form.maxParticipants")}
                <input
                  required
                  type="number"
                  min="2"
                  max="500"
                  value={form.maxParticipants}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      maxParticipants: Number(e.target.value),
                    })
                  }
                />
              </label>
              <label className="wide">
                {t("sessionsPage.form.description")}
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </label>
              <label className="wide">
                {t("sessionsPage.form.materials")}
                <textarea
                  value={form.materialsText}
                  onChange={(e) =>
                    setForm({ ...form, materialsText: e.target.value })
                  }
                  placeholder="https://example.com/slides"
                />
              </label>
            </div>
            <div className="create-session-actions">
              <button
                type="button"
                className="btn outline"
                onClick={() => setCreateOpen(false)}
              >
                {t("sessionsPage.cancel")}
              </button>
              <button
                type="submit"
                className="btn primary"
                disabled={busy === "create"}
              >
                {busy === "create" ? (
                  <ButtonLoader>{t("sessionsPage.scheduling")}</ButtonLoader>
                ) : (
                  <>
                    <IoCalendarOutline /> {t("sessionsPage.scheduleSession")}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
};

export default LearningSessions;
