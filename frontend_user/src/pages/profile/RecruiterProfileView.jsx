import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  IoBusinessOutline,
  IoGlobeOutline,
  IoMailOutline,
  IoLocationOutline,
  IoCheckmarkCircle,
  IoTimeOutline,
  IoCameraOutline,
  IoCreateOutline,
  IoBriefcaseOutline,
  IoPeopleOutline,
  IoAddOutline,
  IoArrowForwardOutline,
} from "react-icons/io5";
import {
  fetchCompanyProfile,
  saveCompanyProfileRequest,
  uploadCompanyLogoRequest,
  fetchRecruiterInternships,
} from "../../services/platformService";
import { ButtonLoader } from "../../components/ui/LoadingStates";
import { useLanguage } from "../../context/LanguageContext";

export default function RecruiterProfileView({ user }) {
  const { language } = useLanguage();
  const isKm = language === "km";

  const [company, setCompany] = useState(null);
  const [internships, setInternships] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    industry: "",
    website: "",
    contactEmail: "",
    location: "",
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [compRes, jobsRes] = await Promise.all([
        fetchCompanyProfile().catch(() => ({ company: null })),
        fetchRecruiterInternships().catch(() => []),
      ]);

      const comp = compRes.company || {
        name: user.company || user.fullName || "My Company",
        description: "",
        industry: "Technology",
        website: "",
        contactEmail: user.email,
        location: user.location || "Phnom Penh",
        isVerified: false,
        verificationStatus: "pending",
        logoUrl: user.avatarUrl,
      };

      setCompany(comp);
      setInternships(jobsRes || []);
      setForm({
        name: comp.name || "",
        description: comp.description || "",
        industry: comp.industry || "Technology",
        website: comp.website || "",
        contactEmail: comp.contactEmail || user.email || "",
        location: comp.location || "",
      });
    } catch (err) {
      setError(err.message || "Failed to load company profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setError("");
    try {
      const result = await uploadCompanyLogoRequest(file);
      setCompany((cur) => ({ ...cur, logoUrl: result.logoUrl }));
      setMessage(isKm ? "រូបសញ្ញាក្រុមហ៊ុនត្រូវបាន Update ដោយជោគជ័យ!" : "Company logo updated successfully!");
    } catch (err) {
      setError(err.message || "Unable to upload company logo.");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await saveCompanyProfileRequest(form);
      setCompany((cur) => ({ ...cur, ...result.company }));
      setEditing(false);
      setMessage(isKm ? "ព័ត៌មានក្រុមហ៊ុនត្រូវបានរក្សាទុក!" : "Company profile updated successfully!");
    } catch (err) {
      setError(err.message || "Unable to save company profile.");
    } finally {
      setBusy(false);
    }
  };

  const isVerified = Boolean(company?.isVerified) || company?.verificationStatus === "verified";
  const activePostingsCount = internships.filter((j) => j.status === "open").length;

  return (
    <div className="recruiter-profile-view">
      {/* 1. Recruiter Hero */}
      <section className="profile-hero recruiter-hero">
        <div className="container profile-hero-inner">
          <div className="profile-identity">
            <div className="profile-avatar-wrap company-logo-wrap">
              {company?.logoUrl ? (
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  className="company-logo-img"
                />
              ) : (
                <div className="company-logo-placeholder">
                  <IoBusinessOutline />
                </div>
              )}
              <label className="profile-avatar-upload" title="Upload company logo">
                <IoCameraOutline />
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleLogoUpload}
                  disabled={busy}
                />
              </label>
            </div>

            <div>
              <div className="recruiter-badge-row">
                <span className="profile-role-tag recruiter">
                  <IoBusinessOutline /> {isKm ? "គណនីក្រុមហ៊ុនជ្រើសរើស" : "Employer / Recruiter"}
                </span>

                {isVerified ? (
                  <span className="verification-pill verified">
                    <IoCheckmarkCircle />
                    <span>{isKm ? "ក្រុមហ៊ុនបានផ្ទៀងផ្ទាត់ (Verified)" : "Verified Employer"}</span>
                  </span>
                ) : (
                  <span className="verification-pill pending">
                    <IoTimeOutline />
                    <span>{isKm ? "រង់ចាំការផ្ទៀងផ្ទាត់ (Pending)" : "Verification Pending"}</span>
                  </span>
                )}
              </div>

              <h1>{company?.name || user.company || "Company Profile"}</h1>
              <p className="profile-headline">
                {company?.industry || "Technology"} · {company?.location || "Cambodia"}
              </p>

              <div className="profile-social-links">
                {company?.website && (
                  <a href={company.website} target="_blank" rel="noreferrer">
                    <IoGlobeOutline /> {company.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
                {company?.contactEmail && (
                  <span>
                    <IoMailOutline /> {company.contactEmail}
                  </span>
                )}
                {company?.location && (
                  <span>
                    <IoLocationOutline /> {company.location}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="profile-hero-buttons">
            <button
              type="button"
              className="btn outline"
              onClick={() => setEditing((cur) => !cur)}
            >
              <IoCreateOutline />
              <span>{editing ? (isKm ? "បិទកែប្រែ" : "Close Edit") : (isKm ? "កែព័ត៌មានក្រុមហ៊ុន" : "Edit Details")}</span>
            </button>
            <Link to="/post-job" className="btn primary">
              <IoAddOutline />
              <span>{isKm ? "+ ប្រកាសការងារថ្មី" : "Post Internship"}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Global Message / Error */}
      <div className="container">
        {message && <div className="profile-success">{message}</div>}
        {error && <div className="profile-error">{error}</div>}
      </div>

      <div className="container profile-content">
        {/* Verification Status Warning if Pending */}
        {!isVerified && (
          <div className="recruiter-verification-alert glass">
            <div className="rva-icon">
              <IoTimeOutline />
            </div>
            <div>
              <h4>{isKm ? "គណនីក្រុមហ៊ុនរបស់អ្នកកំពុងស្ថិតក្នុងការពិនិត្យ (Pending Verification)" : "Company Account Under Review"}</h4>
              <p>
                {isKm
                  ? "ក្រុមការងារ Smart Community កំពុងត្រួតពិនិត្យឯកសារអាជីវកម្មរបស់អ្នក។ ក្រោយពេល Verified អ្នកអាចបង្ហោះឱកាសការងារ និងទាក់ទងបេក្ខជនសិស្សនិស្សិតបានភ្លាមៗ។"
                  : "Our team is reviewing your business credentials. Once approved, you can freely post internships and invite candidates to interviews."}
              </p>
            </div>
          </div>
        )}

        {/* 2. Hiring Metrics Row */}
        <div className="recruiter-stats-grid">
          <article className="recruiter-stat-card glass">
            <IoBriefcaseOutline className="stat-icon blue" />
            <div>
              <strong>{internships.length}</strong>
              <span>{isKm ? "ការងារដែលបានបង្ហោះសរុប" : "Total Postings"}</span>
            </div>
          </article>

          <article className="recruiter-stat-card glass">
            <IoCheckmarkCircle className="stat-icon green" />
            <div>
              <strong>{activePostingsCount}</strong>
              <span>{isKm ? "ការងារកំពុងបើកទទួល" : "Active Openings"}</span>
            </div>
          </article>

          <article className="recruiter-stat-card glass">
            <IoPeopleOutline className="stat-icon purple" />
            <div>
              <Link to="/recruiter/candidates" className="stat-ats-link">
                <span>{isKm ? "គ្រប់គ្រងបេក្ខជនក្នុង ATS" : "Manage in ATS"}</span>
                <IoArrowForwardOutline />
              </Link>
              <small>{isKm ? "Kanban Pipeline 5 ដំណាក់កាល" : "5-Stage Candidate Board"}</small>
            </div>
          </article>
        </div>

        {/* 3. Company Edit Form */}
        {editing && (
          <section className="profile-panel glass profile-editor-panel">
            <h2>{isKm ? "កែសម្រួលព័ត៌មាន និងម៉ាកយីហោក្រុមហ៊ុន" : "Edit Employer Branding & Company Info"}</h2>
            <form onSubmit={handleSaveCompany} className="company-edit-form">
              <div className="hub-form-row">
                <label className="hub-form-label">
                  <span>{isKm ? "ឈ្មោះក្រុមហ៊ុន (Company Name)" : "Company Name"} *</span>
                  <input
                    type="text"
                    className="hub-input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </label>

                <label className="hub-form-label">
                  <span>{isKm ? "វិស័យឧស្សាហកម្ម (Industry)" : "Industry"} *</span>
                  <input
                    type="text"
                    className="hub-input"
                    value={form.industry}
                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    placeholder="e.g. Banking, FinTech, Software Development"
                    required
                  />
                </label>
              </div>

              <div className="hub-form-row">
                <label className="hub-form-label">
                  <span>{isKm ? "Website ក្រុមហ៊ុន" : "Company Website"}</span>
                  <input
                    type="url"
                    className="hub-input"
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    placeholder="https://company.com"
                  />
                </label>

                <label className="hub-form-label">
                  <span>{isKm ? "អ៊ីមែលទំនាក់ទំនង (Contact Email)" : "Contact Email"}</span>
                  <input
                    type="email"
                    className="hub-input"
                    value={form.contactEmail}
                    onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                  />
                </label>
              </div>

              <label className="hub-form-label">
                <span>{isKm ? "ទីតាំងការិយាល័យ (Office Location)" : "Office Location"}</span>
                <input
                  type="text"
                  className="hub-input"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. Phnom Penh, Cambodia"
                />
              </label>

              <label className="hub-form-label">
                <span>{isKm ? "អំពីក្រុមហ៊ុន (Company Bio & Culture)" : "About Company & Culture"}</span>
                <textarea
                  className="hub-textarea"
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder={isKm ? "រៀបរាប់ពីបេសកកម្ម បរិយាកាសការងារ និងឱកាសរីកចម្រើនសម្រាប់សិស្ស..." : "Describe your mission, workplace culture, and learning opportunities for students..."}
                />
              </label>

              <div className="hub-modal-actions">
                <button
                  type="button"
                  className="btn outline"
                  onClick={() => setEditing(false)}
                >
                  {isKm ? "បោះបង់" : "Cancel"}
                </button>
                <button type="submit" className="btn primary" disabled={busy}>
                  {busy ? <ButtonLoader>{isKm ? "កំពុងរក្សាទុក..." : "Saving..."}</ButtonLoader> : (isKm ? "រក្សាទុកព័ត៌មាន" : "Save Company Profile")}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* 4. Company Description & Culture */}
        <section className="profile-panel glass">
          <h2>{isKm ? "អំពីក្រុមហ៊ុន និងបរិយាកាសការងារ" : "About the Company"}</h2>
          {company?.description ? (
            <p className="company-desc-text">{company.description}</p>
          ) : (
            <div className="company-desc-empty">
              <p>{isKm ? "មិនទាន់បានបន្ថែមការពិពណ៌នាពីក្រុមហ៊ុននៅឡើយទេ។ ចុចប៊ូតុង Edit Details ខាងលើដើម្បីបន្ថែម។" : "No description provided yet. Click 'Edit Details' to introduce your company culture to students."}</p>
            </div>
          )}
        </section>

        {/* 5. Active Postings Management */}
        <section className="profile-panel glass">
          <div className="profile-section-heading">
            <div>
              <h2>{isKm ? "ឱកាសការងារដែលបានបង្ហោះ (Posted Opportunities)" : "Your Job & Internship Postings"}</h2>
              <p>{isKm ? "តាមដាន និងគ្រប់គ្រងបេក្ខជនដាក់ពាក្យ" : "Track applications and candidate status in the ATS"}</p>
            </div>
            <Link to="/post-job" className="btn primary small">
              <IoAddOutline /> {isKm ? "បង្ហោះការងារ" : "Post Opportunity"}
            </Link>
          </div>

          {internships.length > 0 ? (
            <div className="recruiter-jobs-table-wrap">
              <table className="recruiter-jobs-table">
                <thead>
                  <tr>
                    <th>{isKm ? "តំណែងការងារ" : "Role"}</th>
                    <th>{isKm ? "ប្រភេទ" : "Type"}</th>
                    <th>{isKm ? "ទីតាំង" : "Location"}</th>
                    <th>{isKm ? "ស្ថានភាព" : "Status"}</th>
                    <th>{isKm ? "កាលបរិច្ឆេទ" : "Date Posted"}</th>
                    <th className="th-action">{isKm ? "សកម្មភាព" : "Action"}</th>
                  </tr>
                </thead>
                <tbody>
                  {internships.map((job) => (
                    <tr key={job.id}>
                      <td>
                        <strong>{job.title}</strong>
                      </td>
                      <td>
                        <span className="job-tag-type">{job.internship_type || "Full-time"}</span>
                      </td>
                      <td>{job.location || "Remote"}</td>
                      <td>
                        <span className={`hub-status-pill ${job.status}`}>
                          {job.status}
                        </span>
                      </td>
                      <td>
                        <small>{new Date(job.created_at).toLocaleDateString()}</small>
                      </td>
                      <td className="td-action">
                        <Link
                          to="/recruiter/candidates"
                          className="btn primary small"
                          title="View Candidates in ATS"
                        >
                          <IoPeopleOutline />
                          <span>{isKm ? "មើលបេក្ខជន" : "Review ATS"}</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="hub-empty-subcard">
              <p>{isKm ? "អ្នកមិនទាន់បានបង្ហោះការងារណាមួយនៅឡើយទេ។" : "You have not published any job postings yet."}</p>
              <Link to="/post-job" className="btn primary small" style={{ marginTop: "1rem" }}>
                {isKm ? "បង្ហោះការងារដំបូងរបស់អ្នក" : "Create Your First Posting"}
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
