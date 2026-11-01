import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiBriefcase,
  FiUsers,
  FiPlus,
  FiCalendar,
  FiVideo,
  FiFileText,
  FiExternalLink,
  FiCheckCircle,
  FiX,
  FiClock,
  FiAlertCircle,
  FiRefreshCw,
  FiFilter,
} from "react-icons/fi";
import { useGlobleContext } from "../../context/GlobleContext";
import { useLanguage } from "../../context/LanguageContext";
import {
  fetchCompanyProfile,
  fetchInternshipApplications,
  fetchRecruiterInternships,
  updateInternshipApplicationStatusRequest,
  updateInternshipStatusRequest,
} from "../../services/platformService";
import { RouteLoader } from "../../components/ui/LoadingStates";
import "./RecruiterATS.css";

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

export default function RecruiterATS({ initialView = "candidates" }) {
  const { user } = useGlobleContext();
  const { language, t } = useLanguage();
  const isKm = language === "km";

  const [activeView, setActiveView] = useState(initialView);
  const [applications, setApplications] = useState([]);
  const [internships, setInternships] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [filterJobId, setFilterJobId] = useState("all");

  // Candidate Review Modal State
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [modalNotes, setModalNotes] = useState("");
  const [modalStatus, setModalStatus] = useState("pending");
  const [modalInterviewDate, setModalInterviewDate] = useState("");
  const [modalInterviewLink, setModalInterviewLink] = useState("");
  const [modalInterviewNote, setModalInterviewNote] = useState("");
  const [savingCandidate, setSavingCandidate] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [appData, jobData, companyData] = await Promise.all([
        fetchInternshipApplications(),
        fetchRecruiterInternships(),
        fetchCompanyProfile(),
      ]);
      setApplications(appData.applications || []);
      setInternships(jobData || []);
      setCompany(companyData.company || null);
    } catch (err) {
      setError(err.message || "Failed to load recruiter data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open candidate modal
  const openCandidateModal = (candidate) => {
    setSelectedCandidate(candidate);
    setModalNotes(candidate.recruiterNotes || "");
    setModalStatus(candidate.status || "pending");
    setModalInterviewDate(
      candidate.interviewScheduledAt
        ? new Date(candidate.interviewScheduledAt).toISOString().slice(0, 16)
        : "",
    );
    setModalInterviewLink(
      candidate.interviewMeetingLink ||
        `https://meet.jit.si/interview-${(company?.name || "sc").toLowerCase().replace(/[^a-z0-9]/g, "")}-${candidate.id}`,
    );
    setModalInterviewNote(candidate.interviewNote || "");
  };

  const closeCandidateModal = () => {
    setSelectedCandidate(null);
    setModalNotes("");
    setModalStatus("pending");
    setModalInterviewDate("");
    setModalInterviewLink("");
    setModalInterviewNote("");
  };

  // Submit candidate update
  const handleSaveCandidate = async (newStatus = modalStatus) => {
    if (!selectedCandidate) return;
    setSavingCandidate(true);
    setError("");
    try {
      const payload = {
        status: newStatus,
        recruiterNotes: modalNotes,
        interviewScheduledAt: modalInterviewDate ? new Date(modalInterviewDate).toISOString() : null,
        interviewMeetingLink: modalInterviewDate ? modalInterviewLink : null,
        interviewNote: modalInterviewDate ? modalInterviewNote : null,
      };
      await updateInternshipApplicationStatusRequest(selectedCandidate.id, payload);
      setSuccessMsg(
        isKm
          ? `បានកែប្រែស្ថានភាពបេក្ខជន ${selectedCandidate.studentName} ដោយជោគជ័យ!`
          : `Candidate ${selectedCandidate.studentName} updated successfully!`,
      );
      closeCandidateModal();
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to update candidate.");
    } finally {
      setSavingCandidate(false);
    }
  };

  // Update internship posting status
  const handleUpdatePostingStatus = async (internshipId, newStatus) => {
    try {
      await updateInternshipStatusRequest(internshipId, newStatus);
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to update internship posting status.");
    }
  };

  // Filtered applications
  const filteredApps = useMemo(() => {
    if (filterJobId === "all") return applications;
    return applications.filter(
      (a) => String(a.internshipId) === String(filterJobId),
    );
  }, [applications, filterJobId]);

  // Categorize into Kanban stages
  const kanbanStages = useMemo(() => {
    return {
      pending: filteredApps.filter((a) => a.status === "pending"),
      reviewed: filteredApps.filter((a) => a.status === "reviewed"),
      shortlisted: filteredApps.filter((a) => a.status === "shortlisted"),
      approved: filteredApps.filter((a) => a.status === "approved"),
      rejected: filteredApps.filter((a) => a.status === "rejected"),
    };
  }, [filteredApps]);

  if (loading) {
    return (
      <main className="sc-ats-page">
        <RouteLoader label={isKm ? "កំពុងទាញយកទិន្នន័យជ្រើសរើសបុគ្គលិក..." : "Loading Recruiter ATS Workspace..."} />
      </main>
    );
  }

  return (
    <main className="sc-ats-page">
      {/* Hero */}
      <section className="sc-ats-hero">
        <div className="container sc-ats-hero-inner">
          <div>
            <p className="sc-dash-kicker">
              {isKm ? "ផ្ទាំងជ្រើសរើសបុគ្គលិក & ATS" : "Recruiter ATS & Talent Pipeline"}
            </p>
            <h1>{isKm ? "គ្រប់គ្រងបេក្ខជន និងការងារ" : "Candidate Pipeline"}</h1>
            <p>
              {isKm
                ? "ពិនិត្យ CV បេក្ខជន កត់ត្រាការវាយតម្លៃឯកជន កំណត់ថ្ងៃសម្ភាសន៍ និងគ្រប់គ្រងការងាររបស់ក្រុមហ៊ុនអ្នក។"
                : "Review candidate CVs, write confidential evaluation notes, schedule interviews, and oversee job openings."}
            </p>
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <Link to="/post-job" className="btn primary" style={{ display: "inline-flex", gap: "8px", alignItems: "center" }}>
              <FiPlus /> {isKm ? "ប្រកាសការងារថ្មី" : "Post Internship"}
            </Link>
            <button type="button" onClick={loadData} className="btn outline" style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
              <FiRefreshCw /> {isKm ? "ផ្ទុកឡើងវិញ" : "Refresh"}
            </button>
          </div>
        </div>
      </section>

      <div className="container" style={{ marginTop: "20px" }}>
        {error && (
          <div className="auth-error" style={{ marginBottom: "20px" }}>
            {error}
          </div>
        )}
        {successMsg && (
          <div className="profile-success" style={{ marginBottom: "20px" }}>
            {successMsg}
          </div>
        )}

        {/* View Switcher & Job Filter */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div className="sc-ats-view-nav">
            <button
              type="button"
              className={`sc-ats-view-btn ${activeView === "candidates" ? "active" : ""}`}
              onClick={() => setActiveView("candidates")}
            >
              <FiUsers /> {isKm ? "បេក្ខជនទាំងអស់ (Candidate Pipeline)" : "Candidate Pipeline"} ({applications.length})
            </button>
            <button
              type="button"
              className={`sc-ats-view-btn ${activeView === "postings" ? "active" : ""}`}
              onClick={() => setActiveView("postings")}
            >
              <FiBriefcase /> {isKm ? "ការងារដែលបានបង្ហោះ (My Postings)" : "Job Postings"} ({internships.length})
            </button>
          </div>

          {activeView === "candidates" && internships.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FiFilter style={{ color: "var(--soft)" }} />
              <select
                value={filterJobId}
                onChange={(e) => setFilterJobId(e.target.value)}
                style={{
                  padding: "8px 14px",
                  borderRadius: "12px",
                  border: "1px solid rgba(0,0,0,0.1)",
                  background: "rgba(255,255,255,0.8)",
                  fontSize: "0.88rem",
                  fontWeight: "600",
                }}
              >
                <option value="all">{isKm ? "ការងារទាំងអស់ (All Jobs)" : "All Jobs"}</option>
                {internships.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* VIEW 1: CANDIDATE PIPELINE (KANBAN BOARD) */}
        {activeView === "candidates" && (
          <section className="sc-kanban-board">
            {/* Col 1: Pending */}
            <div className="sc-kanban-col sc-col-pending">
              <div className="sc-kanban-header">
                <h3>{isKm ? "រង់ចាំពិនិត្យ" : "New / Pending"}</h3>
                <span className="sc-col-count-pill">{kanbanStages.pending.length}</span>
              </div>
              <div className="sc-kanban-cards">
                {kanbanStages.pending.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="sc-candidate-card"
                    onClick={() => openCandidateModal(candidate)}
                  >
                    <div className="sc-candidate-card-top">
                      <img
                        src={
                          candidate.studentAvatar ||
                          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                        }
                        alt={candidate.studentName}
                        className="sc-candidate-avatar"
                      />
                      <div>
                        <strong className="sc-candidate-name">{candidate.studentName}</strong>
                        <span className="sc-candidate-job-tag">{candidate.internshipTitle}</span>
                      </div>
                    </div>
                    {candidate.coverLetter && (
                      <p style={{ margin: "4px 0 8px", fontSize: "0.82rem", color: "var(--soft)", lineHeight: "1.4" }}>
                        {candidate.coverLetter.slice(0, 90)}...
                      </p>
                    )}
                    <div className="sc-candidate-card-footer">
                      <span>{formatDate(candidate.appliedAt, language)}</span>
                      <span style={{ color: "#2563eb", fontWeight: "700" }}>
                        {isKm ? "ពិនិត្យ CV →" : "Review CV →"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Col 2: Reviewed */}
            <div className="sc-kanban-col sc-col-reviewed">
              <div className="sc-kanban-header">
                <h3>{isKm ? "បានពិនិត្យ" : "Under Review"}</h3>
                <span className="sc-col-count-pill">{kanbanStages.reviewed.length}</span>
              </div>
              <div className="sc-kanban-cards">
                {kanbanStages.reviewed.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="sc-candidate-card"
                    onClick={() => openCandidateModal(candidate)}
                  >
                    <div className="sc-candidate-card-top">
                      <img
                        src={
                          candidate.studentAvatar ||
                          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                        }
                        alt={candidate.studentName}
                        className="sc-candidate-avatar"
                      />
                      <div>
                        <strong className="sc-candidate-name">{candidate.studentName}</strong>
                        <span className="sc-candidate-job-tag">{candidate.internshipTitle}</span>
                      </div>
                    </div>
                    <div className="sc-candidate-card-footer">
                      <span>{formatDate(candidate.appliedAt, language)}</span>
                      <span style={{ color: "#2563eb", fontWeight: "700" }}>{isKm ? "ពិនិត្យ →" : "Review →"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Col 3: Shortlisted / Interview */}
            <div className="sc-kanban-col sc-col-shortlisted">
              <div className="sc-kanban-header">
                <h3>{isKm ? "ជាប់ជម្រើស / សម្ភាសន៍" : "Interview"}</h3>
                <span className="sc-col-count-pill">{kanbanStages.shortlisted.length}</span>
              </div>
              <div className="sc-kanban-cards">
                {kanbanStages.shortlisted.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="sc-candidate-card"
                    onClick={() => openCandidateModal(candidate)}
                  >
                    <div className="sc-candidate-card-top">
                      <img
                        src={
                          candidate.studentAvatar ||
                          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                        }
                        alt={candidate.studentName}
                        className="sc-candidate-avatar"
                      />
                      <div>
                        <strong className="sc-candidate-name">{candidate.studentName}</strong>
                        <span className="sc-candidate-job-tag">{candidate.internshipTitle}</span>
                      </div>
                    </div>
                    {candidate.interviewScheduledAt && (
                      <div
                        style={{
                          padding: "6px 10px",
                          borderRadius: "10px",
                          background: "rgba(139, 92, 246, 0.12)",
                          color: "#7c3aed",
                          fontSize: "0.78rem",
                          fontWeight: "700",
                          margin: "6px 0",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <FiVideo /> {formatDate(candidate.interviewScheduledAt, language)}
                      </div>
                    )}
                    <div className="sc-candidate-card-footer">
                      <span>{formatDate(candidate.appliedAt, language)}</span>
                      <span style={{ color: "#7c3aed", fontWeight: "700" }}>{isKm ? "គ្រប់គ្រង →" : "Manage →"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Col 4: Approved / Hired */}
            <div className="sc-kanban-col sc-col-approved">
              <div className="sc-kanban-header">
                <h3>{isKm ? "បានយល់ព្រម" : "Offered / Hired"}</h3>
                <span className="sc-col-count-pill">{kanbanStages.approved.length}</span>
              </div>
              <div className="sc-kanban-cards">
                {kanbanStages.approved.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="sc-candidate-card"
                    onClick={() => openCandidateModal(candidate)}
                  >
                    <div className="sc-candidate-card-top">
                      <img
                        src={
                          candidate.studentAvatar ||
                          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                        }
                        alt={candidate.studentName}
                        className="sc-candidate-avatar"
                      />
                      <div>
                        <strong className="sc-candidate-name">{candidate.studentName}</strong>
                        <span className="sc-candidate-job-tag">{candidate.internshipTitle}</span>
                      </div>
                    </div>
                    <div className="sc-candidate-card-footer">
                      <span style={{ color: "#10b981", fontWeight: "700" }}>✓ {isKm ? "បានជ្រើសរើស" : "Offered"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Col 5: Declined */}
            <div className="sc-kanban-col sc-col-rejected">
              <div className="sc-kanban-header">
                <h3>{isKm ? "បដិសេធ" : "Declined"}</h3>
                <span className="sc-col-count-pill">{kanbanStages.rejected.length}</span>
              </div>
              <div className="sc-kanban-cards">
                {kanbanStages.rejected.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="sc-candidate-card"
                    onClick={() => openCandidateModal(candidate)}
                  >
                    <div className="sc-candidate-card-top">
                      <img
                        src={
                          candidate.studentAvatar ||
                          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                        }
                        alt={candidate.studentName}
                        className="sc-candidate-avatar"
                      />
                      <div>
                        <strong className="sc-candidate-name">{candidate.studentName}</strong>
                        <span className="sc-candidate-job-tag">{candidate.internshipTitle}</span>
                      </div>
                    </div>
                    <div className="sc-candidate-card-footer">
                      <span>{formatDate(candidate.appliedAt, language)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* VIEW 2: JOB POSTINGS MANAGER */}
        {activeView === "postings" && (
          <section className="sc-ats-postings-list">
            {internships.length ? (
              internships.map((job) => (
                <div key={job.id} className="sc-ats-posting-card">
                  <div>
                    <span className={`application-status ${job.status}`} style={{ marginBottom: "6px", display: "inline-block" }}>
                      {job.status}
                    </span>
                    <h3 style={{ margin: "2px 0 4px", fontSize: "1.2rem", fontWeight: "700" }}>
                      {job.title}
                    </h3>
                    <p style={{ margin: 0, color: "var(--soft)", fontSize: "0.88rem" }}>
                      {job.category} · {job.openings || 1} {isKm ? "កន្លែង" : "openings"} ·{" "}
                      {job.applicationCount || 0} {isKm ? "បេក្ខជនបានដាក់ពាក្យ" : "applicants"}
                    </p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <select
                      value={job.status}
                      onChange={(e) => handleUpdatePostingStatus(job.id, e.target.value)}
                      style={{
                        padding: "8px 14px",
                        borderRadius: "10px",
                        border: "1px solid rgba(0,0,0,0.1)",
                        fontWeight: "700",
                      }}
                    >
                      <option value="open">Open</option>
                      <option value="closed">Closed</option>
                      <option value="filled">Filled</option>
                    </select>

                    <button
                      type="button"
                      className="btn outline"
                      onClick={() => {
                        setFilterJobId(job.id);
                        setActiveView("candidates");
                      }}
                    >
                      <FiUsers /> {isKm ? "មើលបេក្ខជន" : "View Candidates"}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <p>{isKm ? "អ្នកមិនទាន់បានប្រកាសការងារនៅឡើយទេ។" : "No internships posted yet."}</p>
                <Link to="/post-job" className="btn primary">
                  <FiPlus /> {isKm ? "ប្រកាសការងារដំបូង" : "Post your first internship"}
                </Link>
              </div>
            )}
          </section>
        )}
      </div>

      {/* CANDIDATE EVALUATION & INTERVIEW MODAL */}
      {selectedCandidate && (
        <div className="sc-ats-modal-backdrop" onClick={closeCandidateModal}>
          <div className="sc-ats-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sc-modal-header">
              <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                <img
                  src={
                    selectedCandidate.studentAvatar ||
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                  }
                  alt={selectedCandidate.studentName}
                  style={{ width: "56px", height: "56px", borderRadius: "16px", objectFit: "cover" }}
                />
                <div>
                  <h2 style={{ margin: 0, fontSize: "1.3rem" }}>{selectedCandidate.studentName}</h2>
                  <p style={{ margin: "2px 0 0", color: "var(--soft)", fontSize: "0.88rem" }}>
                    {selectedCandidate.studentEmail} · Applied for <strong>{selectedCandidate.internshipTitle}</strong>
                  </p>
                </div>
              </div>
              <button type="button" className="sc-modal-close-btn" onClick={closeCandidateModal}>
                <FiX />
              </button>
            </div>

            {/* Candidate Attachments */}
            <div className="sc-modal-section" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              {selectedCandidate.resumeUrl && (
                <a
                  href={selectedCandidate.resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn primary"
                  style={{ display: "inline-flex", gap: "6px", alignItems: "center", fontSize: "0.86rem" }}
                >
                  <FiFileText /> {isKm ? "ទាញយក / មើល CV (PDF)" : "View Candidate CV (PDF)"}
                </a>
              )}
              {selectedCandidate.portfolioUrl && (
                <a
                  href={selectedCandidate.portfolioUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn outline"
                  style={{ display: "inline-flex", gap: "6px", alignItems: "center", fontSize: "0.86rem" }}
                >
                  <FiExternalLink /> Portfolio
                </a>
              )}
            </div>

            {/* Cover Letter */}
            {selectedCandidate.coverLetter && (
              <div className="sc-modal-section">
                <label>{isKm ? "លិខិតបង្ហាញចំណាប់អារម្មណ៍ (Cover Letter)" : "Cover Letter"}</label>
                <div
                  style={{
                    padding: "14px",
                    borderRadius: "14px",
                    background: "rgba(0,0,0,0.03)",
                    fontSize: "0.88rem",
                    lineHeight: "1.6",
                  }}
                >
                  {selectedCandidate.coverLetter}
                </div>
              </div>
            )}

            {/* Recruiter Private Internal Notes */}
            <div className="sc-modal-section">
              <label>
                🔒 {isKm ? "កំណត់ត្រាផ្ទៃក្នុងសម្ងាត់របស់ Recruiter (Private Notes - Student cannot see)" : "Confidential Internal Recruiter Notes"}
              </label>
              <textarea
                className="sc-modal-textarea"
                placeholder={isKm ? "កត់ត្រាការវាយតម្លៃបេក្ខជននៅទីនេះ (សិស្សនឹងមិនអាចមើលឃើញទេ)..." : "Write evaluation comments, skill ratings, or team notes here (strictly hidden from candidate)..."}
                value={modalNotes}
                onChange={(e) => setModalNotes(e.target.value)}
              />
            </div>

            {/* Interview Scheduler Section */}
            <div className="sc-modal-interview-box">
              <h4 style={{ margin: "0 0 12px", display: "flex", alignItems: "center", gap: "8px", color: "#7c3aed" }}>
                <FiVideo /> {isKm ? "កំណត់កាលវិភាគសម្ភាសន៍ (Schedule Interview)" : "Schedule Interview Session"}
              </h4>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                    {isKm ? "កាលបរិច្ឆេទ & ម៉ោង" : "Date & Time"}
                  </label>
                  <input
                    type="datetime-local"
                    value={modalInterviewDate}
                    onChange={(e) => setModalInterviewDate(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.15)" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                    {isKm ? "Link សម្ភាសន៍ (Jitsi Video Room)" : "Interview Video Link"}
                  </label>
                  <input
                    type="url"
                    value={modalInterviewLink}
                    onChange={(e) => setModalInterviewLink(e.target.value)}
                    placeholder="https://meet.jit.si/..."
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.15)" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                  {isKm ? "ចំណាំសម្រាប់បេក្ខជន (Optional note to candidate)" : "Note for Candidate"}
                </label>
                <input
                  type="text"
                  placeholder={isKm ? "ឧ. សូមត្រៀមបង្ហាញ Portfolio រយៈពេល ១៥ នាទី" : "e.g. Please prepare to present a project portfolio"}
                  value={modalInterviewNote}
                  onChange={(e) => setModalInterviewNote(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.15)" }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="sc-modal-actions">
              <button
                type="button"
                className="btn primary"
                disabled={savingCandidate}
                onClick={() => handleSaveCandidate("shortlisted")}
                style={{ background: "#7c3aed", borderColor: "#7c3aed" }}
              >
                <FiCalendar /> {isKm ? "Shortlist & ណាត់សម្ភាសន៍" : "Shortlist & Schedule"}
              </button>

              <button
                type="button"
                className="btn primary"
                disabled={savingCandidate}
                onClick={() => handleSaveCandidate("approved")}
                style={{ background: "#10b981", borderColor: "#10b981" }}
              >
                <FiCheckCircle /> {isKm ? "យល់ព្រមជ្រើសរើស (Offer / Hire)" : "Approve / Hire"}
              </button>

              <button
                type="button"
                className="btn outline"
                disabled={savingCandidate}
                onClick={() => handleSaveCandidate("reviewed")}
              >
                {isKm ? "កត់ត្រាការពិនិត្យ (Mark Reviewed)" : "Mark Reviewed"}
              </button>

              <button
                type="button"
                className="btn outline"
                disabled={savingCandidate}
                onClick={() => handleSaveCandidate("rejected")}
                style={{ color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.3)" }}
              >
                {isKm ? "បដិសេធ (Decline)" : "Decline"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
