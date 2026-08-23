import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGlobleContext } from "../../context/GlobleContext";
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
  const [company, setCompany] = useState(null);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [form, setForm] = useState({
    title: "",
    category: "Technology",
    description: "",
    requirements: "",
    responsibilities: "",
    location: "Remote",
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
          <h1>Login as a recruiter</h1>
          <Link className="btn primary" to="/login">
            Login
          </Link>
        </section>
      </main>
    );
  if (!["recruiter", "admin"].includes(user.role))
    return (
      <main className="post-job-page">
        <section className="section container">
          <h1>Recruiter access required</h1>
          <p>
            Register or login with a recruiter account to publish internships.
          </p>
          <Link className="btn outline" to="/jobs">
            Back to internships
          </Link>
        </section>
      </main>
    );
  if (loadingCompany)
    return (
      <main className="post-job-page">
        <section className="section container">
          Loading company profile...
        </section>
      </main>
    );
  if (!company)
    return (
      <main className="post-job-page">
        <section className="section container company-required">
          <h1>Create your company profile first</h1>
          <p>
            Internships are connected to a verified company account so students
            know who posted them.
          </p>
          <Link className="btn primary" to="/applications">
            Create company profile
          </Link>
        </section>
      </main>
    );

  return (
    <main className="post-job-page">
      <section className="page-hero post-job-hero">
        <div className="hero-content">
          <p className="eyebrow">{company.name}</p>
          <h1>Publish an internship opportunity.</h1>
          <p>
            Add clear learning responsibilities, requirements, dates, and
            stipend information.
          </p>
        </div>
      </section>
      <section className="section container">
        <form className="post-job-form" onSubmit={submit}>
          <div className="section-header">
            <div>
              <h2>Internship details</h2>
              <p>
                Students will use this information before uploading their CV.
              </p>
            </div>
            <Link className="btn outline" to="/applications">
              Dashboard
            </Link>
          </div>
          {error && <div className="auth-error">{error}</div>}
          {success && <div className="profile-success">{success}</div>}
          <div className="field-grid">
            <label>
              Internship title
              <input
                required
                value={form.title}
                onChange={(event) => update("title", event.target.value)}
                placeholder="Frontend Developer Intern"
              />
            </label>
            <label>
              Category
              <input
                required
                value={form.category}
                onChange={(event) => update("category", event.target.value)}
                placeholder="Technology"
              />
            </label>
          </div>
          <label>
            Description
            <textarea
              required
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
              placeholder="Describe the role, team, and learning opportunity."
            />
          </label>
          <div className="field-grid">
            <label>
              Requirements — one per line
              <textarea
                required
                value={form.requirements}
                onChange={(event) => update("requirements", event.target.value)}
                placeholder={"React fundamentals\nJavaScript\nGit"}
              />
            </label>
            <label>
              Responsibilities — one per line
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
              Internship type
              <select
                value={form.internshipType}
                onChange={(event) =>
                  update("internshipType", event.target.value)
                }
              >
                <option value="full_time">Full time</option>
                <option value="part_time">Part time</option>
                <option value="virtual">Virtual</option>
              </select>
            </label>
            <label>
              Duration in weeks
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
              Location
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
              Remote opportunity
            </label>
          </div>
          <div className="field-grid">
            <label>
              Stipend description
              <input
                value={form.stipend}
                onChange={(event) => update("stipend", event.target.value)}
                placeholder="$500/month or Unpaid"
              />
            </label>
            <label>
              Numeric stipend amount
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
              Openings
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
              Application deadline
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
              Expected start date
              <input
                type="date"
                min={form.applicationDeadline}
                value={form.startDate}
                onChange={(event) => update("startDate", event.target.value)}
              />
            </label>
          </div>
          <button className="btn primary auth-submit" disabled={submitting}>
            {submitting ? "Publishing..." : "Publish internship"}
          </button>
        </form>
      </section>
    </main>
  );
};

export default PostJob;
