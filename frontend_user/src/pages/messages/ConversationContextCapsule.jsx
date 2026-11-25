import { Link } from "react-router-dom";
import {
  IoBriefcaseOutline,
  IoSchoolOutline,
  IoSwapHorizontalOutline,
  IoPeopleOutline,
  IoVideocamOutline,
  IoCalendarOutline,
  IoArrowForwardOutline,
  IoTimeOutline,
} from "react-icons/io5";
import { useLanguage } from "../../context/LanguageContext";

const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export default function ConversationContextCapsule({ conversation, user }) {
  const { language } = useLanguage();
  const isKm = language === "km";

  if (!conversation) return null;

  const category = conversation.category || (conversation.type === "group" ? "group" : "direct");
  const context = conversation.context || {};

  // If general direct chat with no special context, don't show capsule
  if (category === "direct" && !conversation.context) {
    return null;
  }

  // 1. Job Application Context
  if (category === "job_application" || context.type === "job_application") {
    const statusLabels = {
      pending: isKm ? "រង់ចាំពិនិត្យ" : "Under Review",
      reviewed: isKm ? "បានពិនិត្យ" : "Reviewed",
      shortlisted: isKm ? "ជាប់ជម្រើស" : "Shortlisted",
      approved: isKm ? "បានជ្រើសរើស" : "Offered",
      rejected: isKm ? "មិនបានជ្រើសរើស" : "Declined",
    };

    const statusKey = context.status || "pending";
    const isInterview = Boolean(context.interviewScheduledAt);
    const isRecruiter = context.isRecruiter || user?.role === "recruiter";

    return (
      <div className="context-capsule-banner job glass">
        <div className="context-capsule-left">
          <div className="context-capsule-icon-wrap job">
            <IoBriefcaseOutline />
          </div>
          <div className="context-capsule-text">
            <div className="context-capsule-headline">
              <span className="context-capsule-badge job">
                <IoBriefcaseOutline /> {isKm ? "ពាក្យសុំការងារ" : "Job Application"}
              </span>
              <strong>{context.jobTitle || conversation.displayName}</strong>
              {context.company && <span className="context-capsule-sub">· {context.company}</span>}
            </div>

            <div className="context-capsule-meta">
              <span className={`context-status-pill ${statusKey}`}>
                {statusLabels[statusKey] || statusKey}
              </span>

              {isInterview && (
                <span className="context-interview-pill">
                  <IoCalendarOutline /> {isKm ? "សម្ភាសន៍៖ " : "Interview: "}
                  {formatDateTime(context.interviewScheduledAt)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="context-capsule-actions">
          {context.interviewMeetingLink && (
            <a
              href={context.interviewMeetingLink}
              target="_blank"
              rel="noreferrer"
              className="context-btn interview-join"
              title={isKm ? "ចូលជួបសម្ភាសន៍" : "Join Interview Meeting"}
            >
              <IoVideocamOutline />
              <span>{isKm ? "ចូលសម្ភាសន៍" : "Join Interview"}</span>
            </a>
          )}

          {isRecruiter ? (
            <Link
              to={context.internshipId ? `/recruiter/candidates?jobId=${context.internshipId}` : "/recruiter/candidates"}
              className="context-btn secondary"
            >
              <span>{isKm ? "ATS Candidates" : "ATS Board"}</span>
              <IoArrowForwardOutline />
            </Link>
          ) : (
            <Link to="/my-applications" className="context-btn secondary">
              <span>{isKm ? "ស្ថានភាពពាក្យសុំ" : "My Applications"}</span>
              <IoArrowForwardOutline />
            </Link>
          )}
        </div>
      </div>
    );
  }

  // 2. Skill Exchange Context
  if (category === "skill_exchange" || context.type === "skill_exchange") {
    const progress = Number(context.progress || 0);

    return (
      <div className="context-capsule-banner swap glass">
        <div className="context-capsule-left">
          <div className="context-capsule-icon-wrap swap">
            <IoSwapHorizontalOutline />
          </div>
          <div className="context-capsule-text">
            <div className="context-capsule-headline">
              <span className="context-capsule-badge swap">
                <IoSwapHorizontalOutline /> {isKm ? "ប្តូរជំនាញគ្នា" : "Skill Swap"}
              </span>
              <strong>
                {context.skillOffered || "Skill"} ⇄ {context.skillWanted || "Skill"}
              </strong>
            </div>

            <div className="context-capsule-meta">
              <span className="context-status-pill accepted">
                {context.status === "completed"
                  ? isKm ? "បានបញ្ចប់ ១០០%" : "Completed 100%"
                  : isKm ? `វឌ្ឍនភាព៖ ${progress}%` : `Progress: ${progress}%`}
              </span>

              {context.meetingDatetime && (
                <span className="context-interview-pill">
                  <IoTimeOutline /> {formatDateTime(context.meetingDatetime)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="context-capsule-actions">
          {context.meetingLink && (
            <a
              href={context.meetingLink}
              target="_blank"
              rel="noreferrer"
              className="context-btn session-join"
              title={isKm ? "ចូលបន្ទប់រៀនផ្ទាល់" : "Join Skill Swap Session"}
            >
              <IoVideocamOutline />
              <span>{isKm ? "បន្ទប់រៀន (Jitsi)" : "Join Session"}</span>
            </a>
          )}

          <Link to="/skill-exchange?tab=swaps" className="context-btn secondary">
            <span>{isKm ? "គ្រប់គ្រង Swaps" : "Swap Hub"}</span>
            <IoArrowForwardOutline />
          </Link>
        </div>
      </div>
    );
  }

  // 3. Mentorship Context
  if (category === "mentorship" || context.type === "mentorship") {
    return (
      <div className="context-capsule-banner mentor glass">
        <div className="context-capsule-left">
          <div className="context-capsule-icon-wrap mentor">
            <IoSchoolOutline />
          </div>
          <div className="context-capsule-text">
            <div className="context-capsule-headline">
              <span className="context-capsule-badge mentor">
                <IoSchoolOutline /> {isKm ? "ការប្រឹក្សាជំនាញ" : "Mentorship"}
              </span>
              <strong>{context.topic || (isKm ? "ការណែនាំជំនាញ 1:1" : "1:1 Guidance")}</strong>
              {context.mentorName && <span className="context-capsule-sub">· {context.mentorName}</span>}
            </div>

            <div className="context-capsule-meta">
              <span className="context-status-pill mentor">
                {context.status || "Active"}
              </span>
              {context.requestedTime && (
                <span className="context-interview-pill">
                  <IoCalendarOutline /> {formatDateTime(context.requestedTime)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="context-capsule-actions">
          <Link to="/mentorship" className="context-btn secondary">
            <span>{isKm ? "ទំព័រ Mentorship" : "Mentorship Hub"}</span>
            <IoArrowForwardOutline />
          </Link>
        </div>
      </div>
    );
  }

  // 4. Group Conversation Context
  if (category === "group" || conversation.type === "group") {
    return (
      <div className="context-capsule-banner group glass">
        <div className="context-capsule-left">
          <div className="context-capsule-icon-wrap group">
            <IoPeopleOutline />
          </div>
          <div className="context-capsule-text">
            <div className="context-capsule-headline">
              <span className="context-capsule-badge group">
                <IoPeopleOutline /> {isKm ? "ក្រុមពិភាក្សា" : "Community Group"}
              </span>
              <strong>{conversation.displayName}</strong>
              <span className="context-capsule-sub">
                · {conversation.memberCount || 0} {isKm ? "សមាជិក" : "members"}
              </span>
            </div>
            {conversation.description && (
              <p className="context-capsule-desc">{conversation.description}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
