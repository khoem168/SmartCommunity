import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Auth.css";
import {
  roleOptions,
  learnSkills,
  skillCategories,
  availabilityOptions,
  experienceLevels,
  jobTypes,
  hiringTimelineOptions,
} from "../../data/registerData";
import { useGlobleContext } from "../../context/GlobleContext";

const initialForm = {
  fullName: "",
  email: "",
  role: "student",
  password: "",
  confirmPassword: "",
  experienceLevel: "beginner",
  availability: "Flexible schedule",
  bio: "",
  skillsToTeach: [],
  skillsToLearn: [],
  jobTitle: "",
  jobType: "Full-time",
  candidateSkills: [],
  hiringTimeline: "ASAP",
  recruiterCompany: "",
  jobDescription: "",
};

const SkillCategoryPicker = ({ title, field, selectedSkills, onToggle }) => {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [customSkill, setCustomSkill] = useState("");
  const activeCategory =
    skillCategories.find((category) => category.name === selectedCategory) ||
    null;
  const availableSkills = activeCategory ? activeCategory.skills : [];

  const handleAddCustomSkill = () => {
    const skill = customSkill.trim();
    if (!skill || selectedSkills.includes(skill)) return;
    onToggle(field, skill);
    setCustomSkill("");
  };

  return (
    <div className="skill-category-picker">
      <div className="section-label">{title}</div>

      <label className="skill-category-select">
        Select category
        <select
          value={selectedCategory}
          onChange={(event) => {
            setSelectedCategory(event.target.value);
          }}
        >
          <option value="">Select category</option>
          {skillCategories.map((category) => (
            <option key={`${field}-${category.name}`} value={category.name}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      {activeCategory && (
        <section className="skill-category">
          <h3>{activeCategory.name}</h3>
          <div className="skill-grid">
            {availableSkills.map((skill) => (
              <button
                type="button"
                key={`${field}-${skill}`}
                className={
                  selectedSkills.includes(skill)
                    ? "skill-chip active"
                    : "skill-chip"
                }
                onClick={() => onToggle(field, skill)}
              >
                {skill}
              </button>
            ))}
          </div>

          <div className="custom-skill-row">
            <input
              type="text"
              value={customSkill}
              onChange={(event) => setCustomSkill(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleAddCustomSkill();
                }
              }}
              placeholder="Add custom skill"
            />
            <button
              type="button"
              className="btn primary add-skill-btn"
              onClick={handleAddCustomSkill}
              disabled={!customSkill.trim()}
            >
              Add
            </button>
          </div>
        </section>
      )}

      {selectedSkills.length ? (
        <div className="selected-skill-wrap">
          {selectedSkills.map((skill) => (
            <button
              type="button"
              key={skill}
              className="selected-skill"
              onClick={() => onToggle(field, skill)}
            >
              {skill}
            </button>
          ))}
        </div>
      ) : (
        <div className="empty-skill-message">
          {activeCategory
            ? "No skills added yet. Add your first skill above!"
            : "Select a category to choose related skills."}
        </div>
      )}
    </div>
  );
};

const Register = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { registerUser } = useGlobleContext();
  const isRecruiter = formData.role === "recruiter";

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleSkill = (field, skill) => {
    setFormData((prev) => {
      const values = prev[field];
      const nextValues = values.includes(skill)
        ? values.filter((item) => item !== skill)
        : [...values, skill];
      return { ...prev, [field]: nextValues };
    });
  };

  const validateStep = () => {
    setError("");

    if (step === 1) {
      if (
        !formData.fullName ||
        !formData.email ||
        !formData.password ||
        !formData.confirmPassword
      ) {
        setError("Please complete all required fields in step 1.");
        return false;
      }
      if (!formData.email.includes("@")) {
        setError("Please enter a valid email address.");
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match.");
        return false;
      }
      if (formData.password.length < 8) {
        setError("Password must be at least 8 characters.");
        return false;
      }
      if (
        !/[a-z]/.test(formData.password) ||
        !/[A-Z]/.test(formData.password) ||
        !/\d/.test(formData.password)
      ) {
        setError("Password must include uppercase, lowercase, and a number.");
        return false;
      }
    }

    if (step === 2) {
      if (formData.role === "recruiter") {
        if (!formData.jobTitle.trim()) {
          setError("Please provide a job title for the role you are posting.");
          return false;
        }
        if (!formData.candidateSkills.length) {
          setError(
            "Please select the skills you are looking for in candidates.",
          );
          return false;
        }
      } else if (
        !formData.skillsToTeach.length &&
        !formData.skillsToLearn.length
      ) {
        setError("Please choose at least one skill to teach or learn.");
        return false;
      }
    }

    if (step === 3) {
      if (formData.role === "recruiter") {
        if (!formData.recruiterCompany.trim()) {
          setError("Please enter your company or organization.");
          return false;
        }
        if (!formData.jobDescription.trim()) {
          setError(
            "Please add a short description of the role you are hiring for.",
          );
          return false;
        }
      } else if (!formData.bio.trim()) {
        setError(
          "Tell us a little about yourself so mentors and peers can connect.",
        );
        return false;
      }
    }

    return true;
  };

  const handleNext = (event) => {
    event.preventDefault();
    if (!validateStep()) return;
    setStep((current) => Math.min(current + 1, 3));
  };

  const handleBack = () => {
    setError("");
    setStep((current) => Math.max(current - 1, 1));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateStep()) return;

    const registerPayload = {
      fullName: formData.fullName,
      email: formData.email.toLowerCase(),
      password: formData.password,
      role: formData.role,
      bio: formData.bio,
      skillsToTeach: formData.skillsToTeach,
      skillsToLearn: formData.skillsToLearn,
      candidateSkills: formData.candidateSkills,
      experienceLevel: formData.experienceLevel,
      availability: formData.availability,
      recruiterCompany: formData.recruiterCompany,
      jobTitle: formData.jobTitle,
      location: formData.location || null,
    };

    try {
      const response = await registerUser(registerPayload);
      if (response.devVerificationUrl) {
        const verificationUrl = new URL(response.devVerificationUrl);
        navigate(`${verificationUrl.pathname}${verificationUrl.search}`);
      } else {
        navigate(`/verify-email?email=${encodeURIComponent(registerPayload.email)}&sent=1`);
      }
    } catch (err) {
      setError(err.message || "Unable to register. Please try again.");
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card auth-wizard-card">
        <div className="auth-header">
          <h1>Create your account</h1>
          <p>Complete your profile in a few steps and join your community.</p>
        </div>

        <div className="step-indicator">
          <span className={step >= 1 ? "step active" : "step"}>1</span>
          {!isRecruiter && (
            <>
              <span className={step >= 2 ? "step active" : "step"}>2</span>
              <span className={step >= 3 ? "step active" : "step"}>3</span>
            </>
          )}
        </div>

        <form
          className="auth-form"
          onSubmit={isRecruiter || step === 3 ? handleSubmit : handleNext}
        >
          {error && <div className="auth-error">{error}</div>}

          {step === 1 && (
            <>
              <label>
                Full name
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => updateField("fullName", e.target.value)}
                  placeholder="Enter your name"
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="you@example.com"
                />
              </label>

              <label>
                Role
                <select
                  value={formData.role}
                  onChange={(e) => updateField("role", e.target.value)}
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Password
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  placeholder="Create a password"
                />
              </label>

              <label>
                Confirm password
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    updateField("confirmPassword", e.target.value)
                  }
                  placeholder="Repeat your password"
                />
              </label>
            </>
          )}

          {step === 2 && (
            <>
              {formData.role === "recruiter" ? (
                <>
                  <label>
                    Job title
                    <input
                      type="text"
                      value={formData.jobTitle}
                      onChange={(e) => updateField("jobTitle", e.target.value)}
                      placeholder="e.g. Frontend Developer"
                    />
                  </label>

                  <label>
                    Job type
                    <select
                      value={formData.jobType}
                      onChange={(e) => updateField("jobType", e.target.value)}
                    >
                      {jobTypes.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Candidate seniority
                    <select
                      value={formData.experienceLevel}
                      onChange={(e) =>
                        updateField("experienceLevel", e.target.value)
                      }
                    >
                      {experienceLevels.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="section-label">
                    Skills you are looking for in candidates
                  </div>
                  <div className="skill-grid">
                    {learnSkills.map((skill) => (
                      <button
                        type="button"
                        key={skill}
                        className={
                          formData.candidateSkills.includes(skill)
                            ? "skill-chip active"
                            : "skill-chip"
                        }
                        onClick={() => toggleSkill("candidateSkills", skill)}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>

                  <label>
                    Hiring timeline
                    <select
                      value={formData.hiringTimeline}
                      onChange={(e) =>
                        updateField("hiringTimeline", e.target.value)
                      }
                    >
                      {hiringTimelineOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              ) : (
                <>
                  <SkillCategoryPicker
                    title="What skills can you teach?"
                    field="skillsToTeach"
                    selectedSkills={formData.skillsToTeach}
                    onToggle={toggleSkill}
                  />

                  <SkillCategoryPicker
                    title="What skills do you want to learn?"
                    field="skillsToLearn"
                    selectedSkills={formData.skillsToLearn}
                    onToggle={toggleSkill}
                  />

                  <label>
                    Experience level
                    <select
                      value={formData.experienceLevel}
                      onChange={(e) =>
                        updateField("experienceLevel", e.target.value)
                      }
                    >
                      {experienceLevels.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              )}
            </>
          )}

          {step === 3 && (
            <>
              {formData.role === "recruiter" ? (
                <>
                  <label>
                    Company or organization
                    <input
                      type="text"
                      value={formData.recruiterCompany}
                      onChange={(e) =>
                        updateField("recruiterCompany", e.target.value)
                      }
                      placeholder="Enter your company name"
                    />
                  </label>

                  <label>
                    About the role
                    <textarea
                      value={formData.jobDescription}
                      onChange={(e) =>
                        updateField("jobDescription", e.target.value)
                      }
                      placeholder="Describe what makes this role a great opportunity."
                    />
                  </label>

                  <div className="review-box">
                    <h3>Review</h3>
                    <p>
                      Role: <strong>{formData.role}</strong>
                    </p>
                    <p>
                      Job title: <strong>{formData.jobTitle}</strong>
                    </p>
                    <p>
                      Job type: <strong>{formData.jobType}</strong>
                    </p>
                    <p>
                      Candidate skills:{" "}
                      <strong>
                        {formData.candidateSkills.join(", ") || "None"}
                      </strong>
                    </p>
                    <p>
                      Hiring timeline:{" "}
                      <strong>{formData.hiringTimeline}</strong>
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <label>
                    Availability
                    <select
                      value={formData.availability}
                      onChange={(e) =>
                        updateField("availability", e.target.value)
                      }
                    >
                      {availabilityOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    About you
                    <textarea
                      value={formData.bio}
                      onChange={(e) => updateField("bio", e.target.value)}
                      placeholder="Share your goals, background, or what you want from the community."
                    />
                  </label>

                  <div className="review-box">
                    <h3>Review</h3>
                    <p>
                      Role: <strong>{formData.role}</strong>
                    </p>
                    <p>
                      Availability: <strong>{formData.availability}</strong>
                    </p>
                    <p>
                      Skills to teach:{" "}
                      <strong>
                        {formData.skillsToTeach.join(", ") || "None"}
                      </strong>
                    </p>
                    <p>
                      Skills to learn:{" "}
                      <strong>
                        {formData.skillsToLearn.join(", ") || "None"}
                      </strong>
                    </p>
                  </div>
                </>
              )}
            </>
          )}

          <div className="auth-row">
            {!isRecruiter && step > 1 ? (
              <button
                type="button"
                className="btn secondary"
                onClick={handleBack}
              >
                Back
              </button>
            ) : (
              <div />
            )}

            <button type="submit" className="btn primary auth-submit">
              {isRecruiter
                ? "Create account"
                : step === 3
                  ? "Complete registration"
                  : "Next step"}
            </button>
          </div>

          <p className="auth-footer">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </form>
      </section>
    </main>
  );
};

export default Register;
