import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiBriefcase,
  FiClock,
  FiCalendar,
  FiCheckCircle,
  FiFileText,
  FiSearch,
  FiRefreshCw,
  FiArrowRight,
  FiExternalLink,
  FiVideo,
  FiMapPin,
  FiDollarSign,
  FiInbox,
} from "react-icons/fi";
import { useGlobleContext } from "../../context/GlobleContext";
import { useLanguage } from "../../context/LanguageContext";
import { fetchInternshipApplications } from "../../services/platformService";
import { RouteLoader } from "../../components/ui/LoadingStates";
import "./StudentApplicationTracker.css";

const statusLabel = (t, status, isKm) => {
  const map = {
    pending: isKm ? "រង់ចាំពិនិត្យ" : "Pending",
    reviewed: isKm ? "បានពិនិត្យ" : "Reviewed",
    shortlisted: isKm ? "ជាប់ជម្រើស" : "Shortlisted",
    approved: isKm ? "បានយល់ព្រម" : "Approved",
    rejected: isKm ? "បដិសេធ" : "Declined",
  };
  return map[status] || status;
};

const formatDate = (dateStr, language) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime())
    ? ""
    : new Intl.DateTimeFormat(language === "km" ? "km-KH" : "en", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(d);
};

export default function StudentApplicationTracker() {
  const { user } = useGlobleContext();
  const { language, t } = useLanguage();
  const isKm = language === "km";

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchInternshipApplications();
      setApplications(data.applications || []);
    } catch (err) {
      setError(err.message || "Failed to load your applications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  // Statistics
  const stats = useMemo(() => {
    const total = applications.length;
    const inReview = applications.filter((a) =>
      ["pending", "reviewed"].includes(a.status),
    ).length;
    const interview = applications.filter(
      (a) => a.status === "shortlisted" || Boolean(a.interviewScheduledAt),
    ).length;
    const decisions = applications.filter((a) =>
      ["approved", "rejected"].includes(a.status),
    ).length;

    return { total, inReview, interview, decisions };
  }, [applications]);

  // Filtered List
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      // Tab filter
      if (activeTab === "review" && !["pending", "reviewed"].includes(app.status))
        return false;
      if (
        activeTab === "interview" &&
        app.status !== "shortlisted" &&
        !app.interviewScheduledAt
      )
        return false;
      if (
        activeTab === "decision" &&
        !["approved", "rejected"].includes(app.status)
      )
        return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = app.internshipTitle?.toLowerCase().includes(q);
        const matchesCompany = app.company?.toLowerCase().includes(q);
        return matchesTitle || matchesCompany;
      }
      return true;
    });
  }, [applications, activeTab, searchQuery]);

  if (loading) {
    return (
      <main className="sc-tracker-page">
        <RouteLoader label={isKm ? "កំពុងទាញយកទិន្នន័យពាក្យស្នើសុំ..." : "Loading your applications..."} />
      </main>
    );
  }

  return (
    <main className="sc-tracker-page">
      {/* Hero */}
      <section className="sc-tracker-hero">
        <div className="container">
          <p className="sc-dash-kicker">
            {isKm ? "តាមដានពាក្យស្នើសុំការងារ" : "Career Application Tracker"}
          </p>
          <h1>{isKm ? "ពាក្យស្នើសុំកម្មសិក្សារបស់អ្នក" : "My Internship Applications"}</h1>
          <p>
            {isKm
              ? "តាមដានដំណើរការនៃពាក្យស្នើសុំរបស់អ្នក ពីការពិនិត្យដំបូង រហូតដល់ការសម្ភាសន៍ និងការសម្រេចចិត្តចុងក្រោយ។"
              : "Track every step of your application journey in real-time, from submission to interview invitations and final offers."}
          </p>
        </div>
      </section>

      <div className="container" style={{ marginTop: "24px" }}>
        {error && (
          <div className="auth-error" style={{ marginBottom: "20px" }}>
            {error}
          </div>
        )}

        {/* 4 Stats Cards */}
        <section className="sc-tracker-stats">
          <div className="sc-tracker-stat-card sc-stat-total">
            <div className="sc-tracker-stat-icon">
              <FiBriefcase />
            </div>
            <div className="sc-tracker-stat-info">
              <strong>{stats.total}</strong>
              <span>{isKm ? "ពាក្យបានដាក់" : "Total Applied"}</span>
            </div>
          </div>

          <div className="sc-tracker-stat-card sc-stat-review">
            <div className="sc-tracker-stat-icon">
              <FiClock />
            </div>
            <div className="sc-tracker-stat-info">
              <strong>{stats.inReview}</strong>
              <span>{isKm ? "កំពុងពិនិត្យ" : "In Review"}</span>
            </div>
          </div>

          <div className="sc-tracker-stat-card sc-stat-interview">
            <div className="sc-tracker-stat-icon">
              <FiCalendar />
            </div>
            <div className="sc-tracker-stat-info">
              <strong>{stats.interview}</strong>
              <span>{isKm ? "ជាប់ជម្រើស / សម្ភាសន៍" : "Interviews"}</span>
            </div>
          </div>

          <div className="sc-tracker-stat-card sc-stat-decision">
            <div className="sc-tracker-stat-icon">
              <FiCheckCircle />
            </div>
            <div className="sc-tracker-stat-info">
              <strong>{stats.decisions}</strong>
              <span>{isKm ? "ការសម្រេចចិត្ត" : "Decisions"}</span>
            </div>
          </div>
        </section>

        {/* Filter Tabs & Search */}
        <div className="sc-tracker-toolbar">
          <div className="sc-tracker-tabs" role="tablist">
            <button
              type="button"
              className={`sc-tracker-tab ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              {isKm ? "ទាំងអស់" : "All"} ({stats.total})
            </button>
            <button
              type="button"
              className={`sc-tracker-tab ${activeTab === "review" ? "active" : ""}`}
              onClick={() => setActiveTab("review")}
            >
              {isKm ? "កំពុងពិនិត្យ" : "In Review"} ({stats.inReview})
            </button>
            <button
              type="button"
              className={`sc-tracker-tab ${activeTab === "interview" ? "active" : ""}`}
              onClick={() => setActiveTab("interview")}
            >
              {isKm ? "សម្ភាសន៍" : "Interviews"} ({stats.interview})
            </button>
            <button
              type="button"
              className={`sc-tracker-tab ${activeTab === "decision" ? "active" : ""}`}
              onClick={() => setActiveTab("decision")}
            >
              {isKm ? "លទ្ធផល" : "Decisions"} ({stats.decisions})
            </button>
          </div>

          <div className="sc-tracker-search">
            <FiSearch className="sc-tracker-search-icon" />
            <input
              type="text"
              placeholder={isKm ? "ស្វែងរកតាមចំណងជើង ឬក្រុមហ៊ុន..." : "Search by role or company..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Application Cards List */}
        {filteredApplications.length > 0 ? (
          <div className="sc-tracker-list">
            {filteredApplications.map((app) => {
              const status = app.status;
              const hasInterview = Boolean(app.interviewScheduledAt);

              // Timeline Stage Calculation
              const isStage1Done = true; // Submitted
              const isStage2Done = ["reviewed", "shortlisted", "approved", "rejected"].includes(status);
              const isStage2Active = status === "pending";
              const isStage3Done = ["approved", "rejected"].includes(status);
              const isStage3Active = status === "shortlisted" || hasInterview;
              const isStage4Done = ["approved", "rejected"].includes(status);

              return (
                <article key={app.id} className="sc-app-card">
                  <div className="sc-app-header">
                    <div className="sc-app-company-wrap">
                      {app.companyLogo ? (
                        <img
                          src={app.companyLogo}
                          alt={app.company}
                          className="sc-app-company-logo"
                        />
                      ) : (
                        <div className="sc-app-company-placeholder">
                          {app.company ? app.company.charAt(0).toUpperCase() : "C"}
                        </div>
                      )}
                      <div className="sc-app-title-info">
                        <h3>{app.internshipTitle}</h3>
                        <div className="sc-app-meta-badges">
                          <strong>{app.company}</strong>
                          {app.location && (
                            <span>
                              · <FiMapPin style={{ verticalAlign: "-2px" }} /> {app.location}
                            </span>
                          )}
                          {app.internshipType && (
                            <span>· {app.internshipType.replace("_", " ")}</span>
                          )}
                          {app.stipend && (
                            <span>
                              · <FiDollarSign style={{ verticalAlign: "-2px" }} /> {app.stipend}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span className={`sc-app-chip ${status}`}>
                      {statusLabel(t, status, isKm)}
                    </span>
                  </div>

                  {/* 4-Stage Progress Timeline */}
                  <div className="sc-app-timeline">
                    <div className="sc-timeline-step completed">
                      <span className="sc-step-circle">✓</span>
                      <span className="sc-step-text">{isKm ? "បានដាក់ពាក្យ" : "Submitted"}</span>
                    </div>

                    <div
                      className={`sc-timeline-step ${
                        isStage2Done ? "completed" : isStage2Active ? "active" : ""
                      }`}
                    >
                      <span className="sc-step-circle">
                        {isStage2Done ? "✓" : "2"}
                      </span>
                      <span className="sc-step-text">{isKm ? "កំពុងពិនិត្យ" : "Under Review"}</span>
                    </div>

                    <div
                      className={`sc-timeline-step ${
                        isStage3Done ? "completed" : isStage3Active ? "active" : ""
                      }`}
                    >
                      <span className="sc-step-circle">
                        {isStage3Done ? "✓" : "3"}
                      </span>
                      <span className="sc-step-text">{isKm ? "សម្ភាសន៍" : "Interview"}</span>
                    </div>

                    <div
                      className={`sc-timeline-step ${
                        isStage4Done ? "completed" : ""
                      }`}
                    >
                      <span className="sc-step-circle">
                        {isStage4Done ? "✓" : "4"}
                      </span>
                      <span className="sc-step-text">
                        {status === "approved"
                          ? isKm ? "បានជ្រើសរើស" : "Offered"
                          : status === "rejected"
                          ? isKm ? "បដិសេធ" : "Declined"
                          : isKm ? "ការសម្រេចចិត្ត" : "Final Decision"}
                      </span>
                    </div>
                  </div>

                  {/* Interview Highlight Alert Card */}
                  {hasInterview && (
                    <div className="sc-interview-alert-card">
                      <div className="sc-interview-icon-wrap">
                        <FiVideo />
                      </div>
                      <div className="sc-interview-details">
                        <strong>
                          {isKm ? "📅 ការណាត់សម្ភាសន៍ត្រូវបានកំណត់!" : "📅 Interview Scheduled!"}
                        </strong>
                        <p>
                          {formatDate(app.interviewScheduledAt, language)}
                          {app.interviewNote ? ` · Note: ${app.interviewNote}` : ""}
                        </p>
                      </div>
                      {app.interviewMeetingLink && (
                        <a
                          href={app.interviewMeetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="sc-interview-join-btn"
                        >
                          <FiVideo /> {isKm ? "ចូលជួបសម្ភាសន៍" : "Join Interview Room"}
                        </a>
                      )}
                    </div>
                  )}

                  {/* Footer & Attached CV */}
                  <div className="sc-app-footer">
                    <span style={{ fontSize: "0.85rem", color: "var(--soft)" }}>
                      {isKm ? "កាលបរិច្ឆេទដាក់ពាក្យ៖ " : "Applied on "}
                      {formatDate(app.appliedAt, language)}
                    </span>

                    <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                      {app.resumeUrl && (
                        <a
                          href={app.resumeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="sc-app-cv-link"
                        >
                          <FiFileText /> {app.resumeOriginalName || "View My CV (PDF)"}
                        </a>
                      )}
                      {app.portfolioUrl && (
                        <a
                          href={app.portfolioUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="sc-app-cv-link"
                        >
                          <FiExternalLink /> Portfolio
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="sc-tracker-empty">
            <FiInbox style={{ fontSize: "3rem", color: "var(--soft)" }} />
            <h3>{isKm ? "មិនទាន់មានពាក្យស្នើសុំការងារនៅឡើយទេ" : "No applications found"}</h3>
            <p>
              {isKm
                ? "ស្វែងរកឱកាសកម្មសិក្សាដែលត្រូវនឹងជំនាញរបស់អ្នក និងចាប់ផ្ដើមដាក់ពាក្យថ្ងៃនេះ!"
                : "Explore open internships matching your skills and start applying today!"}
            </p>
            <Link to="/jobs" className="btn primary" style={{ display: "inline-flex", gap: "8px", alignItems: "center" }}>
              <FiBriefcase /> {isKm ? "ស្វែងរកកម្មសិក្សា (Explore Jobs)" : "Explore Internships"} <FiArrowRight />
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
