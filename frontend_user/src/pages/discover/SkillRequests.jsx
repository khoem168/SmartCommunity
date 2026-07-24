import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  IoCalendarOutline,
  IoChatbubbleEllipsesOutline,
  IoCheckmarkCircleOutline,
  IoSwapHorizontalOutline,
  IoVideocamOutline,
} from "react-icons/io5";
import { useGlobleContext } from "../../context/GlobleContext";
import {
  confirmSkillExchangeCompletionRequest,
  fetchSkillExchanges,
  fetchSkillLearningHistory,
  updateSkillExchangeStatusRequest,
} from "../../services/platformService";
import { getSocket } from "../../services/realtimeService";
import "./Discover.css";

const formatScheduledDate = (value) => {
  if (!value) return "";
  const normalized = typeof value === "string" ? value.replace(" ", "T") : value;
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(normalized));
};

const AcceptedActions = ({ request, currentUserId, completingId, onComplete }) => {
  if (!["accepted", "completed"].includes(request.status)) return null;

  const currentUserCompleted =
    Number(request.requesterId) === Number(currentUserId)
      ? request.requesterCompleted
      : request.providerCompleted;

  return (
    <>
      {request.scheduledDate && (
        <div className="request-schedule-note">
          <IoCalendarOutline aria-hidden="true" />
          Meeting: {formatScheduledDate(request.scheduledDate)}
        </div>
      )}
      <div className="request-actions">
        {request.conversationId && (
          <Link
            className="btn primary small"
            to={`/messages/${request.conversationId}`}
          >
            <IoChatbubbleEllipsesOutline aria-hidden="true" />
            Chat now
          </Link>
        )}
        {request.meetingLink && (
          <a
            className="btn outline small"
            href={request.meetingLink}
            target="_blank"
            rel="noreferrer"
          >
            <IoVideocamOutline aria-hidden="true" />
            Join meeting
          </a>
        )}
        <Link
          className="btn outline small"
          to={`/community/skill-exchange/${request.id}`}
        >
          View progress
        </Link>
      </div>
      <div className="request-progress-summary">
        <div>
          <span>Learning progress</span>
          <strong>{request.progressPercent || 0}%</strong>
        </div>
        <div className="request-progress-track">
          <span style={{ width: `${request.progressPercent || 0}%` }} />
        </div>
        {request.status === "accepted" && (
          <button
            type="button"
            className="btn primary small"
            disabled={currentUserCompleted || completingId === request.id}
            onClick={() => onComplete(request.id)}
          >
            <IoCheckmarkCircleOutline aria-hidden="true" />
            {currentUserCompleted
              ? "You confirmed completion"
              : completingId === request.id
                ? "Saving..."
                : "Confirm completion"}
          </button>
        )}
        {request.status === "completed" && (
          <p className="request-completed-note">
            <IoCheckmarkCircleOutline aria-hidden="true" />
            Completed by both members
          </p>
        )}
      </div>
    </>
  );
};

const RejectionReason = ({ request, label = "Reason" }) => {
  if (request.status !== "rejected" || !request.rejectionReason) return null;

  return (
    <p className="request-rejection-note">
      <strong>{label}:</strong> {request.rejectionReason}
    </p>
  );
};

const SkillRequests = () => {
  const { user } = useGlobleContext();
  const currentUserId = user?.id || "";
  const [requests, setRequests] = useState([]);
  const [scheduleByRequestId, setScheduleByRequestId] = useState({});
  const [decliningRequestId, setDecliningRequestId] = useState("");
  const [declineReasonByRequestId, setDeclineReasonByRequestId] = useState({});
  const [historyStats, setHistoryStats] = useState({});
  const [completingId, setCompletingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const loadRequests = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      setError("");
      const [exchangeRows, history] = await Promise.all([
        fetchSkillExchanges(),
        fetchSkillLearningHistory(),
      ]);
      setRequests(exchangeRows);
      setHistoryStats(history.stats || {});
    } catch (err) {
      setError(err.message || "Unable to load skill requests.");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const refreshRequests = async () => {
      await loadRequests();
    };

    refreshRequests();
  }, [loadRequests]);

  useEffect(() => {
    if (!user?.id) return;
    const socket = getSocket();
    const handleNotification = (notification) => {
      if (notification?.type === "skill_exchange") {
        loadRequests();
      }
    };

    socket.on("notification:new", handleNotification);

    return () => {
      socket.off("notification:new", handleNotification);
    };
  }, [loadRequests, user]);

  const incomingRequests = requests.filter(
    (request) => request.providerId === currentUserId,
  );
  const outgoingRequests = requests.filter(
    (request) => request.requesterId === currentUserId,
  );

  const updateRequestStatus = async (requestId, status, extraPayload = {}) => {
    try {
      setError("");
      await updateSkillExchangeStatusRequest(requestId, {
        status,
        ...extraPayload,
      });
      if (status === "rejected") {
        setDecliningRequestId("");
      }
      await loadRequests();
    } catch (err) {
      setError(err.message || "Unable to update skill request.");
    }
  };

  const confirmCompletion = async (requestId) => {
    try {
      setCompletingId(requestId);
      setError("");
      await confirmSkillExchangeCompletionRequest(requestId);
      await loadRequests();
    } catch (err) {
      setError(err.message || "Unable to confirm completion.");
    } finally {
      setCompletingId(null);
    }
  };

  const statusLabel = (status) => {
    if (status === "rejected") return "declined";
    if (status === "cancelled") return "cancelled";
    return status;
  };

  if (!user) {
    return (
      <main className="discover-page">
        <section className="discover-empty-state container">
          <h1>Login to manage skill requests.</h1>
          <p>Create an account before accepting or sending skill exchanges.</p>
          <Link className="btn primary small" to="/register">
            Create account
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="discover-page">
      <section className="discover-hero">
        <div className="container discover-hero-inner">
          <div>
            <p className="eyebrow">
              <IoSwapHorizontalOutline aria-hidden="true" />
              Skill Requests
            </p>
            <h1>Manage your skill exchange requests.</h1>
            <p>
              Review incoming requests from other users and track requests you
              already sent.
            </p>
          </div>
          <Link className="btn primary" to="/discover">
            Discover matches
          </Link>
        </div>
      </section>

      <section className="section container">
        {error && <div className="auth-error">{error}</div>}
        {isLoading && <p className="request-empty">Loading skill requests...</p>}

        <div className="request-learning-stats">
          <article>
            <strong>{historyStats.active || 0}</strong>
            <span>Active exchanges</span>
          </article>
          <article>
            <strong>{historyStats.averageProgress || 0}%</strong>
            <span>Average progress</span>
          </article>
          <article>
            <strong>{historyStats.completed || 0}</strong>
            <span>Completed exchanges</span>
          </article>
          <article>
            <strong>{historyStats.skillsLearned || 0}</strong>
            <span>Skills learned</span>
          </article>
        </div>

        <div className="discover-request-board request-page-board">
          <section className="request-column">
            <div className="request-column-header">
              <h2>Incoming requests</h2>
              <span>{incomingRequests.length}</span>
            </div>

            {incomingRequests.length ? (
              <div className="request-list">
                {incomingRequests.map((request) => (
                  <article className="request-card" key={request.id}>
                    <div>
                      <h3>{request.requesterName}</h3>
                      <p>
                        Offers {request.offeredSkill} for{" "}
                        {request.requestedSkill}
                      </p>
                      <RejectionReason request={request} label="Your reason" />
                      <span className={`request-status ${request.status}`}>
                        {statusLabel(request.status)}
                      </span>
                    </div>

                    {request.status === "pending" && (
                      <>
                        <label className="request-schedule-field">
                          Meeting date and time
                          <input
                            type="datetime-local"
                            value={scheduleByRequestId[request.id] || ""}
                            onChange={(event) =>
                              setScheduleByRequestId((current) => ({
                                ...current,
                                [request.id]: event.target.value,
                              }))
                            }
                          />
                        </label>
                        <div className="request-actions">
                          <button
                            type="button"
                            className="btn primary small"
                            disabled={!scheduleByRequestId[request.id]}
                            onClick={() =>
                              updateRequestStatus(request.id, "accepted", {
                                scheduledDate: scheduleByRequestId[request.id],
                              })
                            }
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            className="btn outline small"
                            onClick={() =>
                              setDecliningRequestId((current) =>
                                current === request.id ? "" : request.id,
                              )
                            }
                          >
                            Decline
                          </button>
                        </div>
                        {decliningRequestId === request.id && (
                          <div className="request-decline-box">
                            <label>
                              Reason for declining
                              <textarea
                                value={
                                  declineReasonByRequestId[request.id] || ""
                                }
                                onChange={(event) =>
                                  setDeclineReasonByRequestId((current) => ({
                                    ...current,
                                    [request.id]: event.target.value,
                                  }))
                                }
                                placeholder="Tell them why you cannot accept this skill exchange."
                              />
                            </label>
                            <div className="request-actions">
                              <button
                                type="button"
                                className="btn outline small"
                                onClick={() => setDecliningRequestId("")}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                className="btn primary small"
                                disabled={
                                  !declineReasonByRequestId[
                                    request.id
                                  ]?.trim()
                                }
                                onClick={() =>
                                  updateRequestStatus(request.id, "rejected", {
                                    rejectionReason:
                                      declineReasonByRequestId[
                                        request.id
                                      ].trim(),
                                  })
                                }
                              >
                                Send decline
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    <AcceptedActions
                      request={request}
                      currentUserId={currentUserId}
                      completingId={completingId}
                      onComplete={confirmCompletion}
                    />
                  </article>
                ))}
              </div>
            ) : (
              <p className="request-empty">No incoming requests yet.</p>
            )}
          </section>

          <section className="request-column">
            <div className="request-column-header">
              <h2>Sent requests</h2>
              <span>{outgoingRequests.length}</span>
            </div>

            {outgoingRequests.length ? (
              <div className="request-list">
                {outgoingRequests.map((request) => (
                  <article className="request-card" key={request.id}>
                    <div>
                      <h3>{request.providerName || "Community member"}</h3>
                      <p>
                        You offer {request.offeredSkill} for{" "}
                        {request.requestedSkill}
                      </p>
                      <RejectionReason
                        request={request}
                        label={`Reason from ${
                          request.providerName || "the member"
                        }`}
                      />
                      <span className={`request-status ${request.status}`}>
                        {statusLabel(request.status)}
                      </span>
                    </div>
                    {request.status === "pending" && (
                      <div className="request-actions">
                        <button
                          type="button"
                          className="btn outline small"
                          onClick={() => updateRequestStatus(request.id, "cancelled")}
                        >
                          Cancel request
                        </button>
                      </div>
                    )}
                    <AcceptedActions
                      request={request}
                      currentUserId={currentUserId}
                      completingId={completingId}
                      onComplete={confirmCompletion}
                    />
                  </article>
                ))}
              </div>
            ) : (
              <p className="request-empty">No sent requests yet.</p>
            )}
          </section>
        </div>
      </section>
    </main>
  );
};

export default SkillRequests;
