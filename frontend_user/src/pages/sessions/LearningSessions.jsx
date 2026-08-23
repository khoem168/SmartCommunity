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

const formatDate = (value) =>
  new Date(value).toLocaleString([], {
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
      setError(err.message || "Unable to load learning sessions.");
    } finally {
      setLoading(false);
    }
  }, [scope, query, category]);

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
        setError(err.message || "Unable to load this session.");
      }
    };
    loadDetail();
  }, [sessionId]);

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
      setError(err.message || "Unable to update registration.");
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
      setError(err.message || "Unable to create the session.");
    } finally {
      setBusy("");
    }
  };

  const changeStatus = async (status) => {
    if (!selected) return;
    const cancelReason =
      status === "cancelled"
        ? window.prompt("Why is this session being cancelled?") || ""
        : "";
    try {
      setBusy(`status-${status}`);
      await updateLearningSessionStatus(selected.id, { status, cancelReason });
      await refreshSelected(selected.id);
    } catch (err) {
      setError(err.message || "Unable to update session status.");
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
      setError(err.message || "Unable to save feedback.");
    } finally {
      setBusy("");
    }
  };

  return (
    <main className="sessions-page">
      <section className="sessions-hero">
        <div className="container sessions-hero-inner">
          <div>
            <p className="eyebrow">Live community learning</p>
            <h1>Learn together in interactive online sessions.</h1>
            <p>
              Register for mentor-led workshops, join through Jitsi, share your
              screen, and keep a verified attendance history.
            </p>
            <div className="sessions-hero-actions">
              {canCreate && (
                <button
                  className="btn primary"
                  type="button"
                  onClick={() => setCreateOpen(true)}
                >
                  <IoAddOutline /> Create session
                </button>
              )}
              <button
                className="btn outline"
                type="button"
                onClick={() => (user ? setScope("my") : navigate("/login"))}
              >
                {user ? "My learning sessions" : "Login to join sessions"}
              </button>
            </div>
          </div>
          <div className="sessions-stats">
            <div>
              <strong>{stats.upcoming}</strong>
              <span>Upcoming</span>
            </div>
            <div>
              <strong>{stats.registered}</strong>
              <span>Registered</span>
            </div>
            <div className={stats.live > 0 ? "sessions-live-stat" : ""}>
              <strong>{stats.live}</strong>
              <span>Live now</span>
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
              placeholder="Search title, description, or host"
            />
          </label>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">All categories</option>
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
                {item}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <SkeletonGrid
            className="sessions-grid"
            count={3}
            label="Loading learning sessions"
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
                      {session.status}
                    </span>
                    <span className="session-level">{session.level}</span>
                  </div>
                  <span className="session-category">{session.category}</span>
                  <h2>{session.title}</h2>
                  <p className="session-description">
                    {session.description || "A community learning session."}
                  </p>
                  <div className="session-host">
                    <span>{initials(session.hostName)}</span>
                    <div>
                      <strong>{session.hostName}</strong>
                      <small>{session.hostTitle || "Session host"}</small>
                    </div>
                  </div>
                  <div className="session-meta">
                    <span>
                      <IoCalendarOutline /> {formatDate(session.scheduledTime)}
                    </span>
                    <span>
                      <IoTimeOutline /> {session.durationMinutes} minutes
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
                      View details
                    </button>
                    {session.canJoin ? (
                      <Link
                        className="btn primary small"
                        to={`/sessions/${session.id}/room`}
                      >
                        <IoVideocamOutline /> Join now
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
                          <ButtonLoader>Updating...</ButtonLoader>
                        ) : session.isRegistered ? (
                          "Cancel registration"
                        ) : full ? (
                          "Session full"
                        ) : (
                          "Register"
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
            <h2>No sessions found</h2>
            <p>Try another filter or ask a verified mentor to schedule one.</p>
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
              aria-label="Close session details"
            >
              <IoCloseOutline />
            </button>
            <span
              className={`session-status ${selected.status} ${selected.status === "ongoing" ? "realtime-live-pill" : ""}`}
            >
              {selected.status}
            </span>
            <h2>{selected.title}</h2>
            <p>
              {selected.description || "A live community learning session."}
            </p>
            <div className="detail-session-meta">
              <span>
                <IoCalendarOutline /> {formatDate(selected.scheduledTime)}
              </span>
              <span>
                <IoTimeOutline /> {selected.durationMinutes} minutes
              </span>
              <span>
                <IoPeopleOutline /> {selected.participantCount}/
                {selected.maxParticipants} participants
              </span>
              <span>
                <IoVideocamOutline /> Jitsi video and screen sharing
              </span>
            </div>

            {selected.materials?.length > 0 && (
              <div className="session-materials">
                <h3>Session materials</h3>
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
                  <IoVideocamOutline /> Enter Jitsi room
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
                    <ButtonLoader>Updating...</ButtonLoader>
                  ) : selected.isRegistered ? (
                    "Cancel registration"
                  ) : (
                    "Register for session"
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
                      <ButtonLoader>Starting...</ButtonLoader>
                    ) : (
                      "Start session"
                    )}
                  </button>
                  <button
                    className="btn outline"
                    type="button"
                    onClick={() => changeStatus("cancelled")}
                    disabled={busy === "status-cancelled"}
                  >
                    {busy === "status-cancelled" ? (
                      <ButtonLoader>Cancelling...</ButtonLoader>
                    ) : (
                      "Cancel session"
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
                    <ButtonLoader>Completing...</ButtonLoader>
                  ) : (
                    "Complete session"
                  )}
                </button>
              )}
            </div>

            {selected.isHost && (
              <div className="attendance-board">
                <h3>Attendance ({participants.length})</h3>
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
                      <span>{participant.attendanceMinutes || 0} min</span>
                    </div>
                  ))
                ) : (
                  <p>No registrations yet.</p>
                )}
              </div>
            )}

            {!selected.isHost &&
              selected.attendanceStatus === "attended" &&
              !selected.myRating && (
                <form className="session-feedback" onSubmit={submitFeedback}>
                  <h3>Rate this session</h3>
                  <label>
                    Rating
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
                          {rating} stars
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
                    placeholder="What was useful?"
                  />
                  <button
                    className="btn primary small"
                    type="submit"
                    disabled={busy === "feedback"}
                  >
                    {busy === "feedback" ? (
                      <ButtonLoader>Submitting...</ButtonLoader>
                    ) : (
                      <>
                        <IoStar /> Submit feedback
                      </>
                    )}
                  </button>
                </form>
              )}
            {selected.myRating && (
              <p className="feedback-saved">
                <IoCheckmarkCircleOutline /> Your {selected.myRating}-star
                feedback is saved.
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
                <h2>Schedule a learning session</h2>
                <p>A private Jitsi link is generated automatically.</p>
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
                Title
                <input
                  required
                  minLength={3}
                  maxLength={200}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </label>
              <label>
                Category
                <input
                  required
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                />
              </label>
              <label>
                Level
                <select
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value })}
                >
                  <option value="all">All levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </label>
              <label>
                Start date and time
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
                Registration deadline
                <input
                  type="datetime-local"
                  value={form.registrationDeadline}
                  onChange={(e) =>
                    setForm({ ...form, registrationDeadline: e.target.value })
                  }
                />
              </label>
              <label>
                Duration (minutes)
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
                Maximum participants
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
                Description
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </label>
              <label className="wide">
                Material links (one URL per line)
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
                Cancel
              </button>
              <button
                type="submit"
                className="btn primary"
                disabled={busy === "create"}
              >
                {busy === "create" ? (
                  <ButtonLoader>Scheduling...</ButtonLoader>
                ) : (
                  <>
                    <IoCalendarOutline /> Schedule session
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
