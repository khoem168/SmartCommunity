import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  IoArrowBackOutline,
  IoOpenOutline,
  IoVideocamOutline,
} from "react-icons/io5";
import { useGlobleContext } from "../../context/GlobleContext";
import UserAvatar from "../../components/ui/UserAvatar";
import {
  joinLearningSession,
  leaveLearningSession,
} from "../../services/learningSessionService";
import "./LearningSessions.css";

const SessionRoom = () => {
  const { sessionId } = useParams();
  const { user } = useGlobleContext();
  const [meetingLink, setMeetingLink] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const leftRef = useRef(false);

  const saveLeave = useCallback(() => {
    if (leftRef.current || !user) return;
    leftRef.current = true;
    leaveLearningSession(sessionId).catch(() => {});
  }, [sessionId, user]);

  useEffect(() => {
    if (!user) return;
    joinLearningSession(sessionId)
      .then((response) => setMeetingLink(response.meetingLink))
      .catch((err) => setError(err.message || "Unable to enter this meeting."))
      .finally(() => setLoading(false));

    window.addEventListener("beforeunload", saveLeave);
    return () => {
      window.removeEventListener("beforeunload", saveLeave);
      saveLeave();
    };
  }, [sessionId, user, saveLeave]);

  if (!user) {
    return (
      <main className="session-room-state">
        <IoVideocamOutline size={54} />
        <h1>Login to join this session</h1>
        <Link className="btn primary" to="/login">
          Login
        </Link>
      </main>
    );
  }

  if (loading || error) {
    return (
      <main className="session-room-state">
        <IoVideocamOutline size={54} />
        <h1>
          {loading ? "Preparing your Jitsi room…" : "Meeting unavailable"}
        </h1>
        {error && <p>{error}</p>}
        <Link className="btn outline" to={`/sessions/${sessionId}`}>
          <IoArrowBackOutline /> Back to session
        </Link>
      </main>
    );
  }

  return (
    <main className="session-room-page">
      <header className="session-room-header">
        <div className="session-room-identity">
          <UserAvatar user={user} className="session-room-avatar" />
          <div className="session-room-copy">
            <strong>{user.fullName || "Smart Community member"}</strong>
            <span>Smart Community live session · Jitsi meeting room</span>
          </div>
        </div>
        <div>
          <a
            className="btn outline small"
            href={meetingLink}
            target="_blank"
            rel="noreferrer"
          >
            <IoOpenOutline /> Open in new tab
          </a>
          <Link
            className="btn primary small"
            to={`/sessions/${sessionId}`}
            onClick={saveLeave}
          >
            Leave session
          </Link>
        </div>
      </header>
      <iframe
        className="jitsi-frame"
        src={meetingLink}
        title="Jitsi learning session"
        allow="camera; microphone; display-capture; fullscreen; clipboard-write; autoplay"
      />
    </main>
  );
};

export default SessionRoom;
