import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  IoArrowForwardOutline,
  IoBriefcaseOutline,
  IoCalendarOutline,
  IoCheckmarkCircleOutline,
  IoCloudUploadOutline,
  IoLocationOutline,
  IoSearchOutline,
} from "react-icons/io5";
import {
  applyInternshipRequest,
  fetchInternshipApplications,
  fetchInternships,
} from "../../services/platformService";
import { useGlobleContext } from "../../context/GlobleContext";
import { ButtonLoader, SkeletonGrid } from "../../components/ui/LoadingStates";
import { useLanguage } from "../../context/LanguageContext";
import { enrichInternshipRecord } from "../../utils/bilingualCatalog";
import "./Jobs.css";

const formatType = (type = "") =>
  type.replace("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());

const formatDate = (value) =>
  value
    ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString()
    : "Open deadline";

const Jobs = () => {
  const navigate = useNavigate();
  const { user } = useGlobleContext();
  const { t } = useLanguage();
  const [internships, setInternships] = useState([]);
  const [applications, setApplications] = useState([]);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [currentTime] = useState(() => Date.now());
  const [matchFilter, setMatchFilter] = useState("");
  const [expandedBridgeId, setExpandedBridgeId] = useState(null);
  const [applyingId, setApplyingId] = useState(null);
  const [applicationForm, setApplicationForm] = useState({
    resume: null,
    coverLetter: "",
    portfolioUrl: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadJobs = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const rows = await fetchInternships();
      setInternships(rows);
      if (user?.role === "student") {
        const response = await fetchInternshipApplications();
        setApplications(response.applications || []);
      } else {
        setApplications([]);
      }
    } catch (err) {
      setError(err.message || "Unable to load internship listings.");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    Promise.resolve()
      .then(loadJobs)
      .catch(() => undefined);
  }, [loadJobs]);

  const visibleInternships = useMemo(() => {
    const search = query.trim().toLowerCase();
    return internships.filter((item) => {
      const text = [
        item.title,
        item.company,
        item.category,
        item.description,
        ...(item.requirements || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchFilterPass =
        matchFilter === "high"
          ? item.matchScore !== null && item.matchScore >= 75
          : matchFilter === "medium"
            ? item.matchScore !== null && item.matchScore >= 50
            : true;

      return (
        (!search || text.includes(search)) &&
        (!type || item.internshipType === type) &&
        (!remoteOnly || item.isRemote) &&
        matchFilterPass
      );
    });
  }, [internships, matchFilter, query, remoteOnly, type]);

  const appliedIds = useMemo(
    () =>
      new Set(
        applications.map((application) => Number(application.internshipId)),
      ),
    [applications],
  );

  const openApplication = (internship) => {
    if (!user) {
      navigate(`/register?redirect=${encodeURIComponent("/jobs")}`);
      return;
    }
    if (user.role !== "student") {
      setError("Only student accounts can apply for internships.");
      return;
    }
    setApplyingId(internship.id);
    setApplicationForm({ resume: null, coverLetter: "", portfolioUrl: "" });
    setError("");
    setSuccess("");
  };

  const submitApplication = async (event, internship) => {
    event.preventDefault();
    if (!applicationForm.resume) {
      setError("Choose your CV in PDF format.");
      return;
    }
    if (
      applicationForm.resume.type !== "application/pdf" ||
      !applicationForm.resume.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Your CV must be a PDF file.");
      return;
    }
    try {
      setIsSubmitting(true);
      setError("");
      const response = await applyInternshipRequest(
        internship.id,
        applicationForm,
      );
      setSuccess(response.message);
      setApplyingId(null);
      await loadJobs();
    } catch (err) {
      setError(err.message || "Unable to submit your application.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="jobs-page">
      <section className="page-hero jobs-hero">
        <div className="hero-content">
          <p className="eyebrow">{t("jobsPage.eyebrow")}</p>
          <h1>{t("jobsPage.heroTitle")}</h1>
          <p className="jobs-hero-description">
            {t("jobsPage.heroDescription")}
          </p>

          <div className="jobs-hero-actions">
            <a href="#internship-search" className="btn primary jobs-hero-primary">
              {t("jobsPage.findOpportunity")}
              <IoArrowForwardOutline aria-hidden="true" />
            </a>
            {user?.role === "recruiter" && (
              <Link to="/post-job" className="btn outline">
                {t("jobsPage.postInternship")}
              </Link>
            )}
            {user && (
              <Link
                to={user.role === "recruiter" ? "/recruiter/candidates" : "/my-applications"}
                className="btn outline"
              >
                {user.role === "recruiter"
                  ? (isKm ? "ផ្ទាំងបេក្ខជន (Candidate ATS)" : "Candidate ATS")
                  : t("jobsPage.myApplications")}
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="section container jobs-content">
        {error && <div className="auth-error">{error}</div>}
        {success && <div className="profile-success">{success}</div>}

        <div className="internship-stats">
          <article>
            <IoBriefcaseOutline />
            <strong>{internships.length}</strong>
            <span>{t("jobsPage.openInternships")}</span>
          </article>
          <article>
            <strong>
              {internships.filter((item) => item.isRemote).length}
            </strong>
            <span>{t("jobsPage.remoteOpportunities")}</span>
          </article>
          <article>
            <strong>{applications.length}</strong>
            <span>{t("jobsPage.yourApplications")}</span>
          </article>
        </div>

        <div className="internship-search-panel" id="internship-search">
          <label>
            <IoSearchOutline />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("jobsPage.searchPlaceholder")}
            />
          </label>
          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            <option value="">{t("jobsPage.allTypes")}</option>
            <option value="full_time">{t("jobsPage.fullTime")}</option>
            <option value="part_time">{t("jobsPage.partTime")}</option>
            <option value="virtual">{t("jobsPage.virtual")}</option>
          </select>
          <label className="remote-filter">
            <input
              type="checkbox"
              checked={remoteOnly}
              onChange={(event) => setRemoteOnly(event.target.checked)}
            />{" "}
            {t("jobsPage.remoteOnly")}
          </label>
        </div>

        {user?.role === "student" && (
          <div className="match-filter-tabs" role="tablist" aria-label="Skill match filters">
            <button
              type="button"
              className={`match-filter-tab ${matchFilter === "" ? "active" : ""}`}
              onClick={() => setMatchFilter("")}
            >
              All Openings ({internships.length})
            </button>
            <button
              type="button"
              className={`match-filter-tab ${matchFilter === "medium" ? "active" : ""}`}
              onClick={() => setMatchFilter((curr) => (curr === "medium" ? "" : "medium"))}
            >
              ⚡ Qualified (50%+)
            </button>
            <button
              type="button"
              className={`match-filter-tab ${matchFilter === "high" ? "active" : ""}`}
              onClick={() => setMatchFilter((curr) => (curr === "high" ? "" : "high"))}
            >
              ✨ Best Match (75%+)
            </button>
          </div>
        )}

        <div className="section-header">
          <div>
            <h2>{t("jobsPage.availableTitle")}</h2>
            <p>{t("jobsPage.showing", { count: visibleInternships.length })}</p>
          </div>
          {user?.role === "recruiter" && (
            <Link to="/post-job" className="btn outline">
              {t("jobsPage.createPosting")}
            </Link>
          )}
        </div>

        {isLoading ? (
          <SkeletonGrid
            className="jobs-list"
            count={3}
            label={t("jobsPage.loading")}
            variant="internship"
          />
        ) : visibleInternships.length ? (
          <div className="jobs-list">
            {visibleInternships.map((internship, idx) => {
              const enriched = enrichInternshipRecord(internship, idx);
              const displayTitle = isKm ? enriched.titleKm : internship.title;
              const displayDesc = isKm ? enriched.descKm : internship.description;
              const displayLocation = isKm
                ? enriched.locationKm
                : internship.isRemote
                  ? t("jobsPage.remote")
                  : internship.location;
              const expired =
                internship.applicationDeadline &&
                new Date(
                  `${String(internship.applicationDeadline).slice(0, 10)}T23:59:59`,
                ).getTime() < currentTime;
              const applied = appliedIds.has(Number(internship.id));
              return (
                <article className="job-card" key={internship.id}>
                  <div className="internship-company-heading">
                    {internship.companyLogo ? (
                      <img src={internship.companyLogo} alt="" />
                    ) : (
                      <span>{internship.company?.[0]}</span>
                    )}
                    <div className="company-heading-info">
                      <span className="job-type">
                        {isKm ? "កម្មសិក្សាពេញម៉ោង" : formatType(internship.internshipType)}
                      </span>
                      <h3>{displayTitle}</h3>
                      <p className="company-name">{internship.company}</p>
                    </div>

                    {internship.matchScore !== null ? (
                      <div
                        className={`skill-match-pill ${
                          internship.matchScore >= 75
                            ? "match-high"
                            : internship.matchScore >= 50
                              ? "match-medium"
                              : "match-low"
                        }`}
                        title={`${internship.matchedSkills?.length || 0} of ${(internship.requirements || []).length} required skills match your profile`}
                      >
                        <span className="match-pill-sparkle">✨</span>
                        <strong className="match-pill-pct">
                          {internship.matchScore}% Match
                        </strong>
                        <span className="match-pill-meta">
                          ({internship.matchedSkills?.length || 0}/
                          {(internship.requirements || []).length})
                        </span>
                      </div>
                    ) : user?.role === "student" ? (
                      <Link
                        to="/profile"
                        className="skill-match-pill match-tip"
                        title="Add skills to your profile to calculate your qualification match"
                      >
                        <span>⚡ Check Match</span>
                      </Link>
                    ) : null}
                  </div>
                  <p className="internship-description">
                    {displayDesc}
                  </p>
                  <div className="job-meta">
                    <span>
                      <IoLocationOutline />{" "}
                      {displayLocation}
                    </span>
                    <span>
                      <IoCalendarOutline />{" "}
                      {t("jobsPage.deadline", {
                        date: formatDate(internship.applicationDeadline),
                      })}
                    </span>
                    <span>
                      {internship.durationWeeks
                        ? t("jobsPage.weeks", {
                            count: internship.durationWeeks,
                          })
                        : t("jobsPage.flexibleDuration")}
                    </span>
                    <span>
                      {internship.stipend ||
                        (internship.stipendAmount
                          ? `$${internship.stipendAmount}`
                          : t("jobsPage.stipendMissing"))}
                    </span>
                  </div>
                  <div className="internship-requirements">
                    {(internship.requirements || [])
                      .slice(0, 6)
                      .map((requirement) => (
                        <span key={requirement}>{requirement}</span>
                      ))}
                  </div>

                  {user?.role === "student" && (
                    <div className="career-bridge-container">
                      <button
                        type="button"
                        className={`btn-toggle-bridge ${
                          expandedBridgeId === internship.id ? "active" : ""
                        }`}
                        onClick={() =>
                          setExpandedBridgeId((curr) =>
                            curr === internship.id ? null : internship.id,
                          )
                        }
                      >
                        <span>🎯 Skill Alignment & Learning Bridge</span>
                        <span className="bridge-toggle-indicator">
                          {expandedBridgeId === internship.id
                            ? "▲ Hide Details"
                            : "▼ View Bridge Actions"}
                        </span>
                      </button>

                      {expandedBridgeId === internship.id && (
                        <div className="career-bridge-drawer">
                          {internship.matchedSkills &&
                            internship.matchedSkills.length > 0 && (
                              <div className="bridge-skill-group matched">
                                <span className="bridge-group-label">
                                  ✓ Skills You Have (
                                  {internship.matchedSkills.length}):
                                </span>
                                <div className="bridge-skill-chips">
                                  {internship.matchedSkills.map((skill) => (
                                    <span
                                      key={skill}
                                      className="skill-chip matched"
                                    >
                                      ✓ {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                          {internship.missingSkills &&
                          internship.missingSkills.length > 0 ? (
                            <div className="bridge-skill-group missing">
                              <span className="bridge-group-label">
                                ⚠️ Missing Skills (
                                {internship.missingSkills.length}) & Learning
                                Bridges:
                              </span>
                              <div className="bridge-missing-list">
                                {internship.bridges &&
                                internship.bridges.length > 0
                                  ? internship.bridges.map((b) => (
                                      <div
                                        key={b.skill}
                                        className="bridge-card"
                                      >
                                        <span className="missing-skill-name">
                                          ⚡ {b.skill}
                                        </span>
                                        <div className="bridge-links">
                                          {b.course ? (
                                            <Link
                                              to={b.courseUrl}
                                              className="bridge-btn course-bridge"
                                              title={`Learn ${b.skill} in ${b.course.title}`}
                                            >
                                              📚 Course:{" "}
                                              <strong>{b.course.title}</strong>
                                            </Link>
                                          ) : (
                                            <Link
                                              to={b.courseUrl}
                                              className="bridge-btn course-search-bridge"
                                            >
                                              🔍 Find Courses for {b.skill}
                                            </Link>
                                          )}
                                          <Link
                                            to={b.exchangeUrl}
                                            className="bridge-btn swap-bridge"
                                            title={`Peer swap to learn ${b.skill}`}
                                          >
                                            🤝 Peer Swap
                                          </Link>
                                          <Link
                                            to={b.careerUrl}
                                            className="bridge-btn roadmap-bridge"
                                            title="Add to Career Roadmap"
                                          >
                                            🚀 Roadmap
                                          </Link>
                                        </div>
                                      </div>
                                    ))
                                  : internship.missingSkills.map((s) => (
                                      <div key={s} className="bridge-card">
                                        <span className="missing-skill-name">
                                          ⚡ {s}
                                        </span>
                                        <div className="bridge-links">
                                          <Link
                                            to={`/courses?q=${encodeURIComponent(s)}`}
                                            className="bridge-btn course-bridge"
                                          >
                                            📚 Find Courses
                                          </Link>
                                          <Link
                                            to={`/skill-exchange?learn=${encodeURIComponent(s)}`}
                                            className="bridge-btn swap-bridge"
                                          >
                                            🤝 Swap with Peer
                                          </Link>
                                        </div>
                                      </div>
                                    ))}
                              </div>
                            </div>
                          ) : (
                            <div className="bridge-all-matched">
                              🎉 <strong>100% Match!</strong> You meet all
                              required skills for this position.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="internship-card-footer">
                    <small>
                      {t("jobsPage.openings", {
                        openings: internship.openings,
                        applicants: internship.applicationCount,
                      })}
                    </small>
                    <button
                      className="btn primary small"
                      type="button"
                      disabled={applied || expired}
                      onClick={() => openApplication(internship)}
                    >
                      {applied
                        ? t("jobsPage.applied")
                        : expired
                          ? t("jobsPage.deadlinePassed")
                          : t("jobsPage.applyOnline")}
                    </button>
                  </div>

                  {applyingId === internship.id && (
                    <form
                      className="internship-application-form"
                      onSubmit={(event) => submitApplication(event, internship)}
                    >
                      <div className="application-form-heading">
                        <div>
                          <h4>
                            {t("jobsPage.applyTo", {
                              company: internship.company,
                            })}
                          </h4>
                          <p>{t("jobsPage.pdfOnly")}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setApplyingId(null)}
                        >
                          ×
                        </button>
                      </div>
                      <label>
                        {t("jobsPage.cv")}
                        <input
                          required
                          type="file"
                          accept="application/pdf,.pdf"
                          onChange={(event) =>
                            setApplicationForm((current) => ({
                              ...current,
                              resume: event.target.files?.[0] || null,
                            }))
                          }
                        />
                        <span className="cv-studio-shortcut-hint" style={{ fontSize: "0.82rem", marginTop: "4px", display: "block" }}>
                          ⚡ <Link to="/cv-studio" target="_blank" rel="noreferrer" style={{ color: "#2563eb", fontWeight: 600 }}>
                            Need a PDF CV? Open CV Studio to create &amp; export →
                          </Link>
                        </span>
                      </label>
                      <label>
                        {t("jobsPage.portfolio")}
                        <input
                          type="url"
                          value={applicationForm.portfolioUrl}
                          onChange={(event) =>
                            setApplicationForm((current) => ({
                              ...current,
                              portfolioUrl: event.target.value,
                            }))
                          }
                          placeholder="https://your-portfolio.com"
                        />
                      </label>
                      <label>
                        {t("jobsPage.coverLetter")}
                        <textarea
                          value={applicationForm.coverLetter}
                          onChange={(event) =>
                            setApplicationForm((current) => ({
                              ...current,
                              coverLetter: event.target.value,
                            }))
                          }
                          placeholder={t("jobsPage.coverPlaceholder")}
                        />
                      </label>
                      <button className="btn primary" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <ButtonLoader>{t("jobsPage.uploading")}</ButtonLoader>
                        ) : (
                          t("jobsPage.submit")
                        )}
                      </button>
                    </form>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="internship-empty">{t("jobsPage.noMatch")}</div>
        )}
      </section>
    </main>
  );
};

export default Jobs;
