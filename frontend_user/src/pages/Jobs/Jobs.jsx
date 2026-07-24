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
import "./Jobs.css";

const formatType = (type = "") =>
  type.replace("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());

const formatDate = (value) =>
  value ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString() : "Open deadline";

const Jobs = () => {
  const navigate = useNavigate();
  const { user } = useGlobleContext();
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
      navigate("/login");
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
          <p className="eyebrow">Internship Opportunities</p>
          <h1>Build experience with a company that matches your skills.</h1>
          <p>Explore internships, upload your CV securely, and follow every application from pending to approved.</p>
          <div className="jobs-hero-actions">
            {user?.role === "recruiter" && <Link to="/post-job" className="btn primary">Post an internship</Link>}
            {user && <Link to="/applications" className="btn outline">{user.role === "recruiter" ? "Recruiter dashboard" : "My applications"}</Link>}
          </div>
        </div>
      </section>

      <section className="section container jobs-content">
        {error && <div className="auth-error">{error}</div>}
        {success && <div className="profile-success">{success}</div>}

        <div className="internship-stats">
          <article><IoBriefcaseOutline /><strong>{internships.length}</strong><span>Open internships</span></article>
          <article><strong>{internships.filter((item) => item.isRemote).length}</strong><span>Remote opportunities</span></article>
          <article><strong>{applications.length}</strong><span>Your applications</span></article>
        </div>

        <div className="internship-search-panel">
          <label><IoSearchOutline /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, company, or skill" /></label>
          <select value={type} onChange={(event) => setType(event.target.value)}><option value="">All types</option><option value="full_time">Full time</option><option value="part_time">Part time</option><option value="virtual">Virtual</option></select>
          <label className="remote-filter"><input type="checkbox" checked={remoteOnly} onChange={(event) => setRemoteOnly(event.target.checked)} /> Remote only</label>
        </div>

        <div className="section-header"><div><h2>Available internships</h2><p>Showing {visibleInternships.length} matching opportunities.</p></div>{user?.role === "recruiter" && <Link to="/post-job" className="btn outline">Create posting</Link>}</div>

        {isLoading ? <div className="internship-empty">Loading internships...</div> : visibleInternships.length ? (
          <div className="jobs-list">
            {visibleInternships.map((internship) => {
              const expired = internship.applicationDeadline && new Date(`${String(internship.applicationDeadline).slice(0, 10)}T23:59:59`).getTime() < currentTime;
              const applied = appliedIds.has(Number(internship.id));
              return (
                <article className="job-card" key={internship.id}>
                  <div className="internship-company-heading">{internship.companyLogo ? <img src={internship.companyLogo} alt="" /> : <span>{internship.company?.[0]}</span>}<div><span className="job-type">{formatType(internship.internshipType)}</span><h3>{internship.title}</h3><p className="company-name">{internship.company}</p></div></div>
                  <p className="internship-description">{internship.description}</p>
                  <div className="job-meta"><span><IoLocationOutline /> {internship.isRemote ? "Remote" : internship.location}</span><span><IoCalendarOutline /> Deadline: {formatDate(internship.applicationDeadline)}</span><span>{internship.durationWeeks ? `${internship.durationWeeks} weeks` : "Flexible duration"}</span><span>{internship.stipend || (internship.stipendAmount ? `$${internship.stipendAmount}` : "Stipend not specified")}</span></div>
                  <div className="internship-requirements">{(internship.requirements || []).slice(0, 6).map((requirement) => <span key={requirement}>{requirement}</span>)}</div>
                  <div className="internship-card-footer"><small>{internship.openings} openings · {internship.applicationCount} applicants</small><button className="btn primary small" type="button" disabled={applied || expired} onClick={() => openApplication(internship)}>{applied ? "Applied" : expired ? "Deadline passed" : "Apply online"}</button></div>

                  {applyingId === internship.id && (
                    <form className="internship-application-form" onSubmit={(event) => submitApplication(event, internship)}>
                      <div className="application-form-heading"><div><h4>Apply to {internship.company}</h4><p>PDF files only, maximum 10 MB.</p></div><button type="button" onClick={() => setApplyingId(null)}>×</button></div>
                      <label>CV / Resume (PDF)<input required type="file" accept="application/pdf,.pdf" onChange={(event) => setApplicationForm((current) => ({ ...current, resume: event.target.files?.[0] || null }))} /></label>
                      <label>Portfolio URL<input type="url" value={applicationForm.portfolioUrl} onChange={(event) => setApplicationForm((current) => ({ ...current, portfolioUrl: event.target.value }))} placeholder="https://your-portfolio.com" /></label>
                      <label>Cover letter<textarea value={applicationForm.coverLetter} onChange={(event) => setApplicationForm((current) => ({ ...current, coverLetter: event.target.value }))} placeholder="Why are you a strong match?" /></label>
                      <button className="btn primary" disabled={isSubmitting}>{isSubmitting ? "Uploading CV..." : "Submit application"}</button>
                    </form>
                  )}
                </article>
              );
            })}
          </div>
        ) : <div className="internship-empty">No internships match these filters.</div>}
      </section>
    </main>
  );
};

export default Jobs;
