import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  IoBriefcaseOutline,
  IoBusinessOutline,
  IoDocumentTextOutline,
} from "react-icons/io5";
import { useGlobleContext } from "../../context/GlobleContext";
import {
  fetchCompanyProfile,
  fetchInternshipApplications,
  fetchRecruiterInternships,
  saveCompanyProfileRequest,
  updateInternshipApplicationStatusRequest,
  updateInternshipStatusRequest,
  uploadCompanyLogoRequest,
} from "../../services/platformService";
import { getSocket } from "../../services/realtimeService";
import "./InternshipDashboard.css";

const emptyCompany = {
  name: "",
  description: "",
  industry: "",
  website: "",
  contactEmail: "",
  phone: "",
  location: "",
  companySize: "",
};

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "Not updated";

const InternshipDashboard = () => {
  const { user } = useGlobleContext();
  const recruiterView = ["recruiter", "admin"].includes(user?.role);
  const [company, setCompany] = useState(null);
  const [companyForm, setCompanyForm] = useState(emptyCompany);
  const [logo, setLogo] = useState(null);
  const [internships, setInternships] = useState([]);
  const [applications, setApplications] = useState([]);
  const [notesById, setNotesById] = useState({});
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadDashboard = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const applicationData = await fetchInternshipApplications();
      setApplications(applicationData.applications || []);
      if (recruiterView) {
        const [companyData, internshipRows] = await Promise.all([
          fetchCompanyProfile(),
          fetchRecruiterInternships(),
        ]);
        setCompany(companyData.company);
        setCompanyForm(
          companyData.company
            ? {
                name: companyData.company.name || "",
                description: companyData.company.description || "",
                industry: companyData.company.industry || "",
                website: companyData.company.website || "",
                contactEmail:
                  companyData.company.contactEmail || user.email || "",
                phone: companyData.company.phone || "",
                location: companyData.company.location || "",
                companySize: companyData.company.companySize || "",
              }
            : {
                ...emptyCompany,
                name: user.company || "",
                contactEmail: user.email || "",
              },
        );
        setInternships(internshipRows);
      }
    } catch (err) {
      setError(err.message || "Unable to load the internship dashboard.");
    } finally {
      setLoading(false);
    }
  }, [recruiterView, user]);

  useEffect(() => {
    Promise.resolve()
      .then(loadDashboard)
      .catch(() => undefined);
  }, [loadDashboard]);

  useEffect(() => {
    if (!user?.id) return;
    const socket = getSocket();
    const refresh = (notification) => {
      if (notification?.type === "internship") loadDashboard();
    };
    socket.on("notification:new", refresh);
    return () => socket.off("notification:new", refresh);
  }, [loadDashboard, user]);

  const saveCompany = async (event) => {
    event.preventDefault();
    try {
      setBusy("company");
      setError("");
      const response = await saveCompanyProfileRequest(companyForm);
      setMessage(response.message);
      if (logo) await uploadCompanyLogoRequest(logo);
      setLogo(null);
      await loadDashboard();
    } catch (err) {
      setError(err.message || "Unable to save the company profile.");
    } finally {
      setBusy("");
    }
  };

  const updateApplication = async (applicationId, status) => {
    try {
      setBusy(`application-${applicationId}`);
      setError("");
      const response = await updateInternshipApplicationStatusRequest(
        applicationId,
        {
          status,
          recruiterNotes: notesById[applicationId] || "",
        },
      );
      setMessage(response.message);
      await loadDashboard();
    } catch (err) {
      setError(err.message || "Unable to update the application.");
    } finally {
      setBusy("");
    }
  };

  const updatePosting = async (internshipId, status) => {
    try {
      setBusy(`internship-${internshipId}`);
      const response = await updateInternshipStatusRequest(
        internshipId,
        status,
      );
      setMessage(response.message);
      await loadDashboard();
    } catch (err) {
      setError(err.message || "Unable to update the internship.");
    } finally {
      setBusy("");
    }
  };

  if (!user) {
    return (
      <main className="internship-dashboard-page">
        <section className="section container internship-empty">
          <h1>Login to view applications</h1>
          <Link className="btn primary" to="/login">
            Login
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="internship-dashboard-page">
      <section className="internship-dashboard-hero">
        <div className="container">
          <p className="eyebrow">Internship Dashboard</p>
          <h1>
            {recruiterView
              ? "Manage your company, postings, and candidates."
              : "Track every internship application."}
          </h1>
          <p>
            {recruiterView
              ? "Keep company details current and move candidates through your hiring workflow."
              : "See when recruiters review, shortlist, approve, or reject your application."}
          </p>
        </div>
      </section>

      <section className="section container internship-dashboard-content">
        {error && <div className="auth-error">{error}</div>}
        {message && <div className="profile-success">{message}</div>}
        {loading && <p className="internship-empty">Loading dashboard...</p>}

        <div className="internship-dashboard-stats">
          <article>
            <IoBriefcaseOutline />
            <strong>
              {recruiterView ? internships.length : applications.length}
            </strong>
            <span>
              {recruiterView ? "Internship postings" : "Applications"}
            </span>
          </article>
          <article>
            <IoDocumentTextOutline />
            <strong>
              {recruiterView
                ? applications.length
                : applications.filter((item) => item.status === "pending")
                    .length}
            </strong>
            <span>{recruiterView ? "Candidates" : "Pending"}</span>
          </article>
          <article>
            <IoBusinessOutline />
            <strong>
              {recruiterView
                ? company
                  ? "Ready"
                  : "Required"
                : applications.filter((item) => item.status === "approved")
                    .length}
            </strong>
            <span>{recruiterView ? "Company profile" : "Approved"}</span>
          </article>
        </div>

        {recruiterView && (
          <form className="company-profile-form" onSubmit={saveCompany}>
            <div className="section-header">
              <div>
                <h2>Company profile</h2>
                <p>Create this profile before publishing an internship.</p>
              </div>
              {company?.logoUrl && (
                <img src={company.logoUrl} alt="Company logo" />
              )}
            </div>
            <div className="company-form-grid">
              <label>
                Company name
                <input
                  required
                  value={companyForm.name}
                  onChange={(event) =>
                    setCompanyForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Industry
                <input
                  value={companyForm.industry}
                  onChange={(event) =>
                    setCompanyForm((current) => ({
                      ...current,
                      industry: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Contact email
                <input
                  required
                  type="email"
                  value={companyForm.contactEmail}
                  onChange={(event) =>
                    setCompanyForm((current) => ({
                      ...current,
                      contactEmail: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Phone
                <input
                  value={companyForm.phone}
                  onChange={(event) =>
                    setCompanyForm((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Website
                <input
                  type="url"
                  value={companyForm.website}
                  onChange={(event) =>
                    setCompanyForm((current) => ({
                      ...current,
                      website: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Location
                <input
                  value={companyForm.location}
                  onChange={(event) =>
                    setCompanyForm((current) => ({
                      ...current,
                      location: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Company size
                <select
                  value={companyForm.companySize}
                  onChange={(event) =>
                    setCompanyForm((current) => ({
                      ...current,
                      companySize: event.target.value,
                    }))
                  }
                >
                  <option value="">Select size</option>
                  <option>1-10 employees</option>
                  <option>11-50 employees</option>
                  <option>51-200 employees</option>
                  <option>201-1000 employees</option>
                  <option>1000+ employees</option>
                </select>
              </label>
              <label>
                Logo (JPG, PNG, WebP)
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => setLogo(event.target.files?.[0] || null)}
                />
              </label>
              <label className="wide">
                Company description
                <textarea
                  value={companyForm.description}
                  onChange={(event) =>
                    setCompanyForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
            <button className="btn primary" disabled={busy === "company"}>
              {busy === "company" ? "Saving..." : "Save company profile"}
            </button>
          </form>
        )}

        {recruiterView && (
          <section>
            <div className="section-header">
              <div>
                <h2>My internship postings</h2>
                <p>Open or close applications at any time.</p>
              </div>
              <Link className="btn primary" to="/post-job">
                Post internship
              </Link>
            </div>
            {internships.length ? (
              <div className="managed-internships">
                {internships.map((item) => (
                  <article key={item.id}>
                    <div>
                      <span className={`application-status ${item.status}`}>
                        {item.status}
                      </span>
                      <h3>{item.title}</h3>
                      <p>
                        {item.company} · {item.applicationCount} applicants
                      </p>
                    </div>
                    <select
                      disabled={busy === `internship-${item.id}`}
                      value={item.status}
                      onChange={(event) =>
                        updatePosting(item.id, event.target.value)
                      }
                    >
                      <option value="open">Open</option>
                      <option value="closed">Closed</option>
                      <option value="filled">Filled</option>
                    </select>
                  </article>
                ))}
              </div>
            ) : (
              <p className="internship-empty">No internships posted yet.</p>
            )}
          </section>
        )}

        <section>
          <div className="section-header">
            <div>
              <h2>
                {recruiterView ? "Candidate applications" : "My applications"}
              </h2>
              <p>
                {recruiterView
                  ? "Review CVs and update each candidate's status."
                  : "Status changes appear here and in notifications."}
              </p>
            </div>
            {!recruiterView && (
              <Link className="btn outline" to="/jobs">
                Find internships
              </Link>
            )}
          </div>
          {applications.length ? (
            <div className="application-tracking-list">
              {applications.map((item) => (
                <article key={item.id} className="application-tracking-card">
                  <div className="application-heading">
                    <div>
                      <span className={`application-status ${item.status}`}>
                        {item.status}
                      </span>
                      <h3>{item.internshipTitle}</h3>
                      <p>
                        {recruiterView
                          ? `${item.studentName} · ${item.studentEmail}`
                          : item.company}
                      </p>
                    </div>
                    <small>Applied {formatDate(item.appliedAt)}</small>
                  </div>
                  {item.coverLetter && (
                    <p className="application-cover-letter">
                      {item.coverLetter}
                    </p>
                  )}
                  <div className="application-links">
                    <a href={item.resumeUrl} target="_blank" rel="noreferrer">
                      View CV: {item.resumeOriginalName || "resume.pdf"}
                    </a>
                    {item.portfolioUrl && (
                      <a
                        href={item.portfolioUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Portfolio
                      </a>
                    )}
                  </div>
                  {recruiterView ? (
                    <div className="application-review-controls">
                      <label>
                        Recruiter notes
                        <textarea
                          value={
                            notesById[item.id] ?? item.recruiterNotes ?? ""
                          }
                          onChange={(event) =>
                            setNotesById((current) => ({
                              ...current,
                              [item.id]: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label>
                        Status
                        <select
                          value={item.status}
                          disabled={busy === `application-${item.id}`}
                          onChange={(event) =>
                            updateApplication(item.id, event.target.value)
                          }
                        >
                          <option value="pending">Pending</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </label>
                    </div>
                  ) : (
                    item.recruiterNotes && (
                      <p className="recruiter-note">
                        <strong>Recruiter note:</strong> {item.recruiterNotes}
                      </p>
                    )
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p className="internship-empty">No applications yet.</p>
          )}
        </section>
      </section>
    </main>
  );
};

export default InternshipDashboard;
