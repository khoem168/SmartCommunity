import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  IoBriefcaseOutline,
  IoCalendarOutline,
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
import "./Jobs.css";

const formatType = (type = "") =>
  type.replace("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());

const formatDate = (value) =>
  value ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString() : "Open deadline";

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
      return (
        (!search || text.includes(search)) &&
        (!type || item.internshipType === type) &&
        (!remoteOnly || item.isRemote)
      );
    });
  }, [internships, query, remoteOnly, type]);

  const appliedIds = useMemo(
    () => new Set(applications.map((application) => Number(application.internshipId))),
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
      const response = await applyInternshipRequest(internship.id, applicationForm);
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
          <p>{t("jobsPage.heroDescription")}</p>
          <div className="jobs-hero-actions">
            {user?.role === "recruiter" && <Link to="/post-job" className="btn primary">{t("jobsPage.postInternship")}</Link>}
            {user && <Link to="/applications" className="btn outline">{user.role === "recruiter" ? t("jobsPage.recruiterDashboard") : t("jobsPage.myApplications")}</Link>}
          </div>
        </div>
      </section>

      <section className="section container jobs-content">
        {error && <div className="auth-error">{error}</div>}
        {success && <div className="profile-success">{success}</div>}

        <div className="internship-stats">
          <article><IoBriefcaseOutline /><strong>{internships.length}</strong><span>{t("jobsPage.openInternships")}</span></article>
          <article><strong>{internships.filter((item) => item.isRemote).length}</strong><span>{t("jobsPage.remoteOpportunities")}</span></article>
          <article><strong>{applications.length}</strong><span>{t("jobsPage.yourApplications")}</span></article>
        </div>

        <div className="internship-search-panel">
          <label><IoSearchOutline /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("jobsPage.searchPlaceholder")} /></label>
          <select value={type} onChange={(event) => setType(event.target.value)}><option value="">{t("jobsPage.allTypes")}</option><option value="full_time">{t("jobsPage.fullTime")}</option><option value="part_time">{t("jobsPage.partTime")}</option><option value="virtual">{t("jobsPage.virtual")}</option></select>
          <label className="remote-filter"><input type="checkbox" checked={remoteOnly} onChange={(event) => setRemoteOnly(event.target.checked)} /> {t("jobsPage.remoteOnly")}</label>
        </div>

        <div className="section-header"><div><h2>{t("jobsPage.availableTitle")}</h2><p>{t("jobsPage.showing", { count: visibleInternships.length })}</p></div>{user?.role === "recruiter" && <Link to="/post-job" className="btn outline">{t("jobsPage.createPosting")}</Link>}</div>

        {isLoading ? (
          <SkeletonGrid
            className="jobs-list"
            count={3}
            label={t("jobsPage.loading")}
            variant="internship"
          />
        ) : visibleInternships.length ? (
          <div className="jobs-list">
            {visibleInternships.map((internship) => {
              const expired = internship.applicationDeadline && new Date(`${String(internship.applicationDeadline).slice(0, 10)}T23:59:59`).getTime() < currentTime;
              const applied = appliedIds.has(Number(internship.id));
              return (
                <article className="job-card" key={internship.id}>
                  <div className="internship-company-heading">{internship.companyLogo ? <img src={internship.companyLogo} alt="" /> : <span>{internship.company?.[0]}</span>}<div><span className="job-type">{formatType(internship.internshipType)}</span><h3>{internship.title}</h3><p className="company-name">{internship.company}</p></div></div>
                  <p className="internship-description">{internship.description}</p>
                  <div className="job-meta"><span><IoLocationOutline /> {internship.isRemote ? t("jobsPage.remote") : internship.location}</span><span><IoCalendarOutline /> {t("jobsPage.deadline", { date: formatDate(internship.applicationDeadline) })}</span><span>{internship.durationWeeks ? t("jobsPage.weeks", { count: internship.durationWeeks }) : t("jobsPage.flexibleDuration")}</span><span>{internship.stipend || (internship.stipendAmount ? `$${internship.stipendAmount}` : t("jobsPage.stipendMissing"))}</span></div>
                  <div className="internship-requirements">{(internship.requirements || []).slice(0, 6).map((requirement) => <span key={requirement}>{requirement}</span>)}</div>
                  <div className="internship-card-footer"><small>{t("jobsPage.openings", { openings: internship.openings, applicants: internship.applicationCount })}</small><button className="btn primary small" type="button" disabled={applied || expired} onClick={() => openApplication(internship)}>{applied ? t("jobsPage.applied") : expired ? t("jobsPage.deadlinePassed") : t("jobsPage.applyOnline")}</button></div>

                  {applyingId === internship.id && (
                    <form className="internship-application-form" onSubmit={(event) => submitApplication(event, internship)}>
                      <div className="application-form-heading"><div><h4>{t("jobsPage.applyTo", { company: internship.company })}</h4><p>{t("jobsPage.pdfOnly")}</p></div><button type="button" onClick={() => setApplyingId(null)}>×</button></div>
                      <label>{t("jobsPage.cv")}<input required type="file" accept="application/pdf,.pdf" onChange={(event) => setApplicationForm((current) => ({ ...current, resume: event.target.files?.[0] || null }))} /></label>
                      <label>{t("jobsPage.portfolio")}<input type="url" value={applicationForm.portfolioUrl} onChange={(event) => setApplicationForm((current) => ({ ...current, portfolioUrl: event.target.value }))} placeholder="https://your-portfolio.com" /></label>
                      <label>{t("jobsPage.coverLetter")}<textarea value={applicationForm.coverLetter} onChange={(event) => setApplicationForm((current) => ({ ...current, coverLetter: event.target.value }))} placeholder={t("jobsPage.coverPlaceholder")} /></label>
                      <button className="btn primary" disabled={isSubmitting}>{isSubmitting ? <ButtonLoader>{t("jobsPage.uploading")}</ButtonLoader> : t("jobsPage.submit")}</button>
                    </form>
                  )}
                </article>
              );
            })}
          </div>
        ) : <div className="internship-empty">{t("jobsPage.noMatch")}</div>}
      </section>
    </main>
  );
};

export default Jobs;

