import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  IoBriefcaseOutline,
  IoBusinessOutline,
  IoDocumentTextOutline,
} from "react-icons/io5";
import { useGlobleContext } from "../../context/GlobleContext";
import { useLanguage } from "../../context/LanguageContext";
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

const formatDate = (value, isKm = false) =>
  value
    ? new Date(value).toLocaleDateString(isKm ? "km-KH" : "en-US")
    : isKm
      ? "មិនទាន់ធ្វើបច្ចុប្បន្នភាព"
      : "Not updated";

const InternshipDashboard = () => {
  const { user } = useGlobleContext();
  const { language } = useLanguage();
  const isKm = language === "km";
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

  const statusText = (rawStatus) => {
    if (!isKm) return rawStatus;
    const map = {
      open: "កំពុងបើកទទួលពាក្យ",
      closed: "បានបិទ",
      filled: "ពេញចំនួន",
      pending: "កំពុងរង់ចាំពិនិត្យ",
      reviewed: "បានពិនិត្យ",
      shortlisted: "ជាប់បញ្ជីសម្រាំង",
      approved: "បានអនុម័ត",
      accepted: "បានទទួលយក",
      rejected: "បានបដិសេធ",
    };
    return map[String(rawStatus || "").toLowerCase()] || rawStatus;
  };

  if (!user) {
    return (
      <main className="internship-dashboard-page">
        <section className="section container internship-empty">
          <h1>{isKm ? "សូមចូលគណនីដើម្បីមើលពាក្យស្នើសុំការងារ" : "Login to view applications"}</h1>
          <Link className="btn primary" to="/login">
            {isKm ? "ចូលគណនី" : "Login"}
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="internship-dashboard-page">
      <section className="internship-dashboard-hero">
        <div className="container">
          <p className="eyebrow">
            {isKm ? "ផ្ទាំងគ្រប់គ្រងកម្មសិក្សា និងការងារ" : "Internship Dashboard"}
          </p>
          <h1>
            {recruiterView
              ? isKm
                ? "គ្រប់គ្រងក្រុមហ៊ុន ការប្រកាសការងារ និងបេក្ខជនរបស់អ្នក"
                : "Manage your company, postings, and candidates."
              : isKm
                ? "តាមដានរាល់ពាក្យស្នើសុំកម្មសិក្សា និងការងាររបស់អ្នក"
                : "Track every internship application."}
          </h1>
          <p>
            {recruiterView
              ? isKm
                ? "ធ្វើបច្ចុប្បន្នភាពព័ត៌មានក្រុមហ៊ុន និងគ្រប់គ្រងដំណើរការជ្រើសរើសបេក្ខជនប្រកបដោយប្រសិទ្ធភាព។"
                : "Keep company details current and move candidates through your hiring workflow."
              : isKm
                ? "ពិនិត្យមើលស្ថានភាពពាក្យស្នើសុំ នៅពេលអ្នកជ្រើសរើសពិនិត្យ សម្រាំង អនុម័ត ឬឆ្លើយតប។"
                : "See when recruiters review, shortlist, approve, or reject your application."}
          </p>
        </div>
      </section>

      <section className="section container internship-dashboard-content">
        {error && <div className="auth-error">{error}</div>}
        {message && <div className="profile-success">{message}</div>}
        {loading && (
          <p className="internship-empty">
            {isKm ? "កំពុងផ្ទុកទិន្នន័យផ្ទាំងគ្រប់គ្រង..." : "Loading dashboard..."}
          </p>
        )}

        <div className="internship-dashboard-stats">
          <article>
            <IoBriefcaseOutline />
            <strong>
              {recruiterView ? internships.length : applications.length}
            </strong>
            <span>
              {recruiterView
                ? isKm
                  ? "ការប្រកាសជ្រើសរើស"
                  : "Internship postings"
                : isKm
                  ? "ពាក្យស្នើសុំសរុប"
                  : "Applications"}
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
            <span>
              {recruiterView
                ? isKm
                  ? "បេក្ខជនសរុប"
                  : "Candidates"
                : isKm
                  ? "កំពុងរង់ចាំពិនិត្យ"
                  : "Pending"}
            </span>
          </article>
          <article>
            <IoBusinessOutline />
            <strong>
              {recruiterView
                ? company
                  ? isKm
                    ? "រួចរាល់"
                    : "Ready"
                  : isKm
                    ? "ទាមទារការបំពេញ"
                    : "Required"
                : applications.filter((item) => item.status === "approved")
                    .length}
            </strong>
            <span>
              {recruiterView
                ? isKm
                  ? "ព័ត៌មានក្រុមហ៊ុន"
                  : "Company profile"
                : isKm
                  ? "បានអនុម័ត"
                  : "Approved"}
            </span>
          </article>
        </div>

        {recruiterView && (
          <form className="company-profile-form" onSubmit={saveCompany}>
            <div className="section-header">
              <div>
                <h2>{isKm ? "ព័ត៌មានក្រុមហ៊ុន (Company Profile)" : "Company profile"}</h2>
                <p>
                  {isKm
                    ? "សូមបំពេញព័ត៌មានក្រុមហ៊ុន មុនពេលបង្ហោះជ្រើសរើសបុគ្គលិក ឬកម្មសិក្សា។"
                    : "Create this profile before publishing an internship."}
                </p>
              </div>
              {company?.logoUrl && (
                <img src={company.logoUrl} alt="Company logo" />
              )}
            </div>
            <div className="company-form-grid">
              <label>
                {isKm ? "ឈ្មោះក្រុមហ៊ុន / ស្ថាប័ន" : "Company name"}
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
                {isKm ? "វិស័យការងារ (Industry)" : "Industry"}
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
                {isKm ? "អ៊ីមែលទំនាក់ទំនង" : "Contact email"}
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
                {isKm ? "លេខទូរស័ព្ទ" : "Phone"}
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
                {isKm ? "គេហទំព័រ (Website)" : "Website"}
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
                {isKm ? "ទីតាំង" : "Location"}
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
                {isKm ? "ទំហំក្រុមហ៊ុន" : "Company size"}
                <select
                  value={companyForm.companySize}
                  onChange={(event) =>
                    setCompanyForm((current) => ({
                      ...current,
                      companySize: event.target.value,
                    }))
                  }
                >
                  <option value="">{isKm ? "ជ្រើសរើសទំហំក្រុមហ៊ុន" : "Select size"}</option>
                  <option value="1-10 employees">{isKm ? "១-១០ នាក់" : "1-10 employees"}</option>
                  <option value="11-50 employees">{isKm ? "១១-៥០ នាក់" : "11-50 employees"}</option>
                  <option value="51-200 employees">{isKm ? "៥១-២០០ នាក់" : "51-200 employees"}</option>
                  <option value="201-1000 employees">{isKm ? "២០១-១០០០ នាក់" : "201-1000 employees"}</option>
                  <option value="1000+ employees">{isKm ? "លើសពី ១០០០ នាក់" : "1000+ employees"}</option>
                </select>
              </label>
              <label>
                {isKm ? "និមិត្តសញ្ញាក្រុមហ៊ុន (Logo: JPG, PNG, WebP)" : "Logo (JPG, PNG, WebP)"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => setLogo(event.target.files?.[0] || null)}
                />
              </label>
              <label className="wide">
                {isKm ? "ការពិពណ៌នាអំពីក្រុមហ៊ុន" : "Company description"}
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
              {busy === "company"
                ? isKm
                  ? "កំពុងរក្សាទុក..."
                  : "Saving..."
                : isKm
                  ? "រក្សាទុកព័ត៌មានក្រុមហ៊ុន"
                  : "Save company profile"}
            </button>
          </form>
        )}

        {recruiterView && (
          <section>
            <div className="section-header">
              <div>
                <h2>{isKm ? "ការប្រកាសជ្រើសរើសរបស់ខ្ញុំ" : "My internship postings"}</h2>
                <p>
                  {isKm
                    ? "បើក ឬបិទការទទួលពាក្យស្នើសុំបានគ្រប់ពេល។"
                    : "Open or close applications at any time."}
                </p>
              </div>
              <Link className="btn primary" to="/post-job">
                {isKm ? "+ បង្ហោះជ្រើសរើសថ្មី" : "Post internship"}
              </Link>
            </div>
            {internships.length ? (
              <div className="managed-internships">
                {internships.map((item) => (
                  <article key={item.id}>
                    <div>
                      <span className={`application-status ${item.status}`}>
                        {statusText(item.status)}
                      </span>
                      <h3>{item.title}</h3>
                      <p>
                        {item.company} · {item.applicationCount}{" "}
                        {isKm ? "បេក្ខជនដាក់ពាក្យ" : "applicants"}
                      </p>
                    </div>
                    <select
                      disabled={busy === `internship-${item.id}`}
                      value={item.status}
                      onChange={(event) =>
                        updatePosting(item.id, event.target.value)
                      }
                    >
                      <option value="open">{isKm ? "កំពុងបើកទទួលពាក្យ" : "Open"}</option>
                      <option value="closed">{isKm ? "បានបិទ" : "Closed"}</option>
                      <option value="filled">{isKm ? "ពេញចំនួន" : "Filled"}</option>
                    </select>
                  </article>
                ))}
              </div>
            ) : (
              <p className="internship-empty">
                {isKm ? "មិនទាន់មានការប្រកាសជ្រើសរើសនៅឡើយទេ។" : "No internships posted yet."}
              </p>
            )}
          </section>
        )}

        <section>
          <div className="section-header">
            <div>
              <h2>
                {recruiterView
                  ? isKm
                    ? "ពាក្យស្នើសុំរបស់បេក្ខជន"
                    : "Candidate applications"
                  : isKm
                    ? "ពាក្យស្នើសុំការងាររបស់ខ្ញុំ"
                    : "My applications"}
              </h2>
              <p>
                {recruiterView
                  ? isKm
                    ? "ពិនិត្យ CV និងធ្វើបច្ចុប្បន្នភាពស្ថានភាពបេក្ខជននីមួយៗ។"
                    : "Review CVs and update each candidate's status."
                  : isKm
                    ? "រាល់ការផ្លាស់ប្តូរស្ថានភាពនឹងបង្ហាញនៅទីនេះ និងក្នុងការជូនដំណឹង។"
                    : "Status changes appear here and in notifications."}
              </p>
            </div>
            {!recruiterView && (
              <Link className="btn outline" to="/jobs">
                {isKm ? "ស្វែងរកឱកាសការងារ" : "Find internships"}
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
                        {statusText(item.status)}
                      </span>
                      <h3>{item.internshipTitle}</h3>
                      <p>
                        {recruiterView
                          ? `${item.studentName} · ${item.studentEmail}`
                          : item.company}
                      </p>
                    </div>
                    <small>
                      {isKm ? "ដាក់ពាក្យនៅថ្ងៃទី " : "Applied "}
                      {formatDate(item.appliedAt, isKm)}
                    </small>
                  </div>
                  {item.coverLetter && (
                    <p className="application-cover-letter">
                      {item.coverLetter}
                    </p>
                  )}
                  <div className="application-links">
                    {item.resumeUrl && (
                      <a href={item.resumeUrl} target="_blank" rel="noreferrer">
                        {isKm ? "មើល CV៖ " : "View CV: "}
                        {item.resumeOriginalName || "resume.pdf"}
                      </a>
                    )}
                    {item.portfolioUrl && (
                      <a
                        href={item.portfolioUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {isKm ? "គម្រោងស្នាដៃ (Portfolio)" : "Portfolio"}
                      </a>
                    )}
                  </div>
                  {recruiterView ? (
                    <div className="application-review-controls">
                      <label>
                        {isKm ? "កំណត់ចំណាំអ្នកជ្រើសរើស" : "Recruiter notes"}
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
                        {isKm ? "ស្ថានភាពពាក្យស្នើសុំ" : "Status"}
                        <select
                          value={item.status}
                          disabled={busy === `application-${item.id}`}
                          onChange={(event) =>
                            updateApplication(item.id, event.target.value)
                          }
                        >
                          <option value="pending">{isKm ? "កំពុងរង់ចាំពិនិត្យ" : "Pending"}</option>
                          <option value="reviewed">{isKm ? "បានពិនិត្យ" : "Reviewed"}</option>
                          <option value="shortlisted">{isKm ? "ជាប់បញ្ជីសម្រាំង" : "Shortlisted"}</option>
                          <option value="approved">{isKm ? "បានអនុម័ត" : "Approved"}</option>
                          <option value="rejected">{isKm ? "បានបដិសេធ" : "Rejected"}</option>
                        </select>
                      </label>
                    </div>
                  ) : (
                    item.recruiterNotes && (
                      <p className="recruiter-note">
                        <strong>{isKm ? "កំណត់ចំណាំអ្នកជ្រើសរើស៖" : "Recruiter note:"}</strong>{" "}
                        {item.recruiterNotes}
                      </p>
                    )
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p className="internship-empty">
              {isKm ? "មិនទាន់មានពាក្យស្នើសុំនៅឡើយទេ។" : "No applications yet."}
            </p>
          )}
        </section>
      </section>
    </main>
  );
};

export default InternshipDashboard;
