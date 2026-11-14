import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGlobleContext } from "../../context/GlobleContext";
import { useLanguage } from "../../context/LanguageContext";
import {
  createInternshipRequest,
  fetchCompanyProfile,
} from "../../services/platformService";
import "./PostJob.css";

const futureDate = (days) => {
  const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
};

const PostJob = () => {
  const navigate = useNavigate();
  const { user } = useGlobleContext();
  const { language } = useLanguage();
  const isKm = language === "km";
  const [company, setCompany] = useState(null);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [form, setForm] = useState({
    title: "",
    category: "Technology",
    description: "",
    requirements: "",
    responsibilities: "",
    location: "Phnom Penh",
    isRemote: true,
    internshipType: "full_time",
    durationWeeks: 12,
    stipend: "",
    stipendAmount: "",
    openings: 1,
    applicationDeadline: futureDate(30),
    startDate: futureDate(45),
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!["recruiter", "admin"].includes(user?.role)) {
      Promise.resolve().then(() => setLoadingCompany(false));
      return;
    }
    Promise.resolve()
      .then(fetchCompanyProfile)
      .then((response) => setCompany(response.company))
      .catch((err) =>
        setError(err.message || "Unable to load your company profile."),
      )
      .finally(() => setLoadingCompany(false));
  }, [user]);

  const update = (field, value) =>
    setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      setError("");
      const response = await createInternshipRequest({
        ...form,
        durationWeeks: Number(form.durationWeeks),
        stipendAmount:
          form.stipendAmount === "" ? null : Number(form.stipendAmount),
        openings: Number(form.openings),
        requirements: form.requirements
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
        responsibilities: form.responsibilities
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
      });
      setSuccess(response.message);
      window.setTimeout(() => navigate("/applications"), 900);
    } catch (err) {
      setError(err.message || "Unable to publish the internship.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user)
    return (
      <main className="post-job-page">
        <section className="section container">
          <h1>{isKm ? "សូមចូលគណនីជាអ្នកជ្រើសរើសបុគ្គលិក" : "Login as a recruiter"}</h1>
          <Link className="btn primary" to="/login">
            {isKm ? "ចូលគណនី" : "Login"}
          </Link>
        </section>
      </main>
    );
  if (!["recruiter", "admin"].includes(user.role))
    return (
      <main className="post-job-page">
        <section className="section container">
          <h1>
            {isKm
              ? "តម្រូវឱ្យមានសិទ្ធិជាអ្នកជ្រើសរើសបុគ្គលិក"
              : "Recruiter access required"}
          </h1>
          <p>
            {isKm
              ? "សូមចុះឈ្មោះ ឬចូលប្រើប្រាស់ដោយគណនីក្រុមហ៊ុន/អ្នកជ្រើសរើសបុគ្គលិកដើម្បីប្រកាសការងារកម្មសិក្សា។"
              : "Register or login with a recruiter account to publish internships."}
          </p>
          <Link className="btn outline" to="/jobs">
            {isKm ? "ត្រឡប់ទៅទំព័រការងារ" : "Back to internships"}
          </Link>
        </section>
      </main>
    );
  if (loadingCompany)
    return (
      <main className="post-job-page">
        <section className="section container">
          {isKm ? "កំពុងទាញយកព័ត៌មានក្រុមហ៊ុន..." : "Loading company profile..."}
        </section>
      </main>
    );
  if (!company)
    return (
      <main className="post-job-page">
        <section className="section container company-required">
          <h1>
            {isKm
              ? "សូមបង្កើតព័ត៌មានក្រុមហ៊ុនរបស់អ្នកជាមុនសិន"
              : "Create your company profile first"}
          </h1>
          <p>
            {isKm
              ? "រាល់ឱកាសការងារកម្មសិក្សាត្រូវភ្ជាប់ជាមួយគណនីក្រុមហ៊ុនដែលបានផ្ទៀងផ្ទាត់ ដើម្បីផ្តល់ទំនុកចិត្តដល់និស្សិត។"
              : "Internships are connected to a verified company account so students know who posted them."}
          </p>
          <Link className="btn primary" to="/profile">
            {isKm ? "បង្កើតព័ត៌មានក្រុមហ៊ុន" : "Create company profile"}
          </Link>
        </section>
      </main>
    );

  const isVerifiedCompany =
    user?.role === "admin" ||
    Boolean(company.isVerified) ||
    Boolean(company.is_verified) ||
    company.verificationStatus === "verified" ||
    company.verification_status === "verified";

  if (!isVerifiedCompany) {
    return (
      <main className="post-job-page">
        <section
          className="section container company-required"
          style={{ textAlign: "center", padding: "40px 20px" }}
        >
          <div
            style={{
              maxWidth: 640,
              margin: "0 auto",
              background: "var(--card-bg, #ffffff)",
              padding: "36px 32px",
              borderRadius: 20,
              boxShadow: "0 12px 36px rgba(0,0,0,0.06)",
              border: "1px solid var(--line, #e2e8f0)",
            }}
          >
            <span style={{ fontSize: "2.5rem" }}>⏳</span>
            <h1 style={{ fontSize: "1.6rem", margin: "16px 0 10px" }}>
              {isKm
                ? "គណនីក្រុមហ៊ុនកំពុងស្ថិតក្នុងការពិនិត្យផ្ទៀងផ្ទាត់"
                : "Company Verification Under Review"}
            </h1>
            <p
              style={{
                color: "var(--soft, #64748b)",
                lineHeight: 1.6,
                marginBottom: 24,
              }}
            >
              {isKm ? (
                <>
                  គណនីក្រុមហ៊ុន <strong>{company.name}</strong>{" "}
                  របស់អ្នកកំពុងរង់ចាំការពិនិត្យ និងអនុម័តពីអ្នកគ្រប់គ្រងប្រព័ន្ធ (Admin)។
                  ដើម្បីធានាសុវត្ថិភាព និងគុណភាពសម្រាប់និស្សិត
                  ការប្រកាសជ្រើសរើសកម្មសិក្សាអាចដាក់ផ្សាយជាសាធារណៈបានបន្ទាប់ពីគណនីក្រុមហ៊ុនត្រូវបានអនុម័ត។
                </>
              ) : (
                <>
                  Your company <strong>{company.name}</strong> is currently
                  pending administrator verification. To ensure safety and
                  quality for students, internships can only be published once
                  approved.
                </>
              )}
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <Link className="btn primary" to="/dashboard">
                {isKm ? "ទៅកាន់ផ្ទាំងការងារ (Workspace)" : "Go to Workspace"}
              </Link>
              <Link className="btn outline" to="/profile">
                {isKm ? "ពិនិត្យព័ត៌មានក្រុមហ៊ុន" : "Review Company Details"}
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="post-job-page">
      <section className="page-hero post-job-hero">
        <div className="hero-content">
          <p className="eyebrow">{company.name}</p>
          <h1>
            {isKm
              ? "ប្រកាសឱកាសការងារកម្មសិក្សាថ្មី"
              : "Publish an internship opportunity."}
          </h1>
          <p>
            {isKm
              ? "បំពេញព័ត៌មានលម្អិតអំពីតួនាទី លក្ខខណ្ឌតម្រូវ កាលបរិច្ឆេទ និងប្រាក់ឧបត្ថម្ភឱ្យបានច្បាស់លាស់។"
              : "Add clear learning responsibilities, requirements, dates, and stipend information."}
          </p>
        </div>
      </section>
      <section className="section container">
        <form className="post-job-form" onSubmit={submit}>
          <div className="section-header">
            <div>
              <h2>
                {isKm ? "ព័ត៌មានលម្អិតនៃកម្មសិក្សា" : "Internship details"}
              </h2>
              <p>
                {isKm
                  ? "និស្សិតនឹងពិនិត្យមើលព័ត៌មានទាំងនេះមុនពេលដាក់ពាក្យ និងភ្ជាប់ PDF CV។"
                  : "Students will use this information before uploading their CV."}
              </p>
            </div>
            <Link className="btn outline" to="/applications">
              {isKm ? "ផ្ទាំងការងារ" : "Dashboard"}
            </Link>
          </div>
          {error && <div className="auth-error">{error}</div>}
          {success && <div className="profile-success">{success}</div>}
          <div className="field-grid">
            <label>
              {isKm ? "ចំណងជើងមុខតំណែងកម្មសិក្សា" : "Internship title"}
              <input
                required
                value={form.title}
                onChange={(event) => update("title", event.target.value)}
                placeholder="Frontend Developer Intern"
              />
            </label>
            <label>
              {isKm ? "ផ្នែក / ប្រភេទជំនាញ" : "Category"}
              <input
                required
                value={form.category}
                onChange={(event) => update("category", event.target.value)}
                placeholder="Technology"
              />
            </label>
          </div>
          <label>
            {isKm ? "ការពិពណ៌នាអំពីការងារ" : "Description"}
            <textarea
              required
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
              placeholder={
                isKm
                  ? "ពិពណ៌នាអំពីតួនាទី ក្រុមការងារ និងឱកាសសិក្សាអនុវត្ត..."
                  : "Describe the role, team, and learning opportunity."
              }
            />
          </label>
          <div className="field-grid">
            <label>
              {isKm ? "លក្ខខណ្ឌតម្រូវ (មួយជួរមួយចំណុច)" : "Requirements — one per line"}
              <textarea
                required
                value={form.requirements}
                onChange={(event) => update("requirements", event.target.value)}
                placeholder={"React fundamentals\nJavaScript\nGit"}
              />
            </label>
            <label>
              {isKm ? "ភារកិច្ចទទួលខុសត្រូវ (មួយជួរមួយចំណុច)" : "Responsibilities — one per line"}
              <textarea
                value={form.responsibilities}
                onChange={(event) =>
                  update("responsibilities", event.target.value)
                }
                placeholder={"Build interface components\nJoin code reviews"}
              />
            </label>
          </div>
          <div className="field-grid">
            <label>
              {isKm ? "ប្រភេទម៉ោងការងារ" : "Internship type"}
              <select
                value={form.internshipType}
                onChange={(event) =>
                  update("internshipType", event.target.value)
                }
              >
                <option value="full_time">{isKm ? "ពេញម៉ោង (Full time)" : "Full time"}</option>
                <option value="part_time">{isKm ? "ក្រៅម៉ោង (Part time)" : "Part time"}</option>
                <option value="virtual">{isKm ? "ពីចម្ងាយ (Virtual)" : "Virtual"}</option>
              </select>
            </label>
            <label>
              {isKm ? "រយៈពេល (គិតជាសប្តាហ៍)" : "Duration in weeks"}
              <input
                type="number"
                min="1"
                max="104"
                value={form.durationWeeks}
                onChange={(event) =>
                  update("durationWeeks", event.target.value)
                }
              />
            </label>
          </div>
          <div className="field-grid">
            <label>
              {isKm ? "ទីតាំងការងារ" : "Location"}
              <input
                required
                value={form.location}
                onChange={(event) => update("location", event.target.value)}
              />
            </label>
            <label className="post-remote-toggle">
              <input
                type="checkbox"
                checked={form.isRemote}
                onChange={(event) => update("isRemote", event.target.checked)}
              />{" "}
              {isKm ? "អាចធ្វើការពីចម្ងាយបាន (Remote)" : "Remote opportunity"}
            </label>
          </div>
          <div className="field-grid">
            <label>
              {isKm ? "ការបញ្ជាក់ប្រាក់ឧបត្ថម្ភ" : "Stipend description"}
              <input
                value={form.stipend}
                onChange={(event) => update("stipend", event.target.value)}
                placeholder="$200/month"
              />
            </label>
            <label>
              {isKm ? "ចំនួនប្រាក់ឧបត្ថម្ភ ($)" : "Numeric stipend amount"}
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.stipendAmount}
                onChange={(event) =>
                  update("stipendAmount", event.target.value)
                }
              />
            </label>
            <label>
              {isKm ? "ចំនួនជ្រើសរើស" : "Openings"}
              <input
                type="number"
                min="1"
                max="1000"
                value={form.openings}
                onChange={(event) => update("openings", event.target.value)}
              />
            </label>
          </div>
          <div className="field-grid">
            <label>
              {isKm ? "ថ្ងៃផុតកំណត់ទទួលពាក្យ" : "Application deadline"}
              <input
                required
                type="date"
                min={futureDate(1)}
                value={form.applicationDeadline}
                onChange={(event) =>
                  update("applicationDeadline", event.target.value)
                }
              />
            </label>
            <label>
              {isKm ? "ថ្ងៃរំពឹងថាចាប់ផ្តើមការងារ" : "Expected start date"}
              <input
                type="date"
                min={form.applicationDeadline}
                value={form.startDate}
                onChange={(event) => update("startDate", event.target.value)}
              />
            </label>
          </div>
          <button className="btn primary auth-submit" disabled={submitting}>
            {submitting
              ? isKm
                ? "កំពុងប្រកាស..."
                : "Publishing..."
              : isKm
                ? "ប្រកាសឱកាសកម្មសិក្សា"
                : "Publish internship"}
          </button>
        </form>
      </section>
    </main>
  );
};

export default PostJob;
