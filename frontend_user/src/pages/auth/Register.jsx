import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
import { useLanguage } from "../../context/LanguageContext";
import { ButtonLoader } from "../../components/ui/LoadingStates";

const categoryTranslationKeys = {
  "Technology & Programming": "categoryTechnology",
  "Design & Creative": "categoryDesign",
  "Data & Cloud": "categoryData",
  "Business & Marketing": "categoryBusiness",
  "Career & Soft Skills": "categoryCareer",
};

const availabilityTranslationKeys = {
  "Weekdays morning": "weekdaysMorning",
  "Weekdays evening": "weekdaysEvening",
  Weekends: "weekends",
  "Flexible schedule": "flexibleSchedule",
  "By appointment": "byAppointment",
};

const hiringTranslationKeys = {
  ASAP: "asap",
  "Within 2 weeks": "withinTwoWeeks",
  "Within 1 month": "withinOneMonth",
  Flexible: "flexible",
  "Looking ahead": "lookingAhead",
};

const jobTypeTranslationKeys = {
  "Full-time": "fullTime",
  "Part-time": "partTime",
  Contract: "contract",
  Internship: "internship",
  Freelance: "freelance",
};

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
  const { t } = useLanguage();
  const getCategoryLabel = (categoryName) =>
    t(`auth.${categoryTranslationKeys[categoryName]}`);

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
        {t("auth.selectCategory")}
        <select
          value={selectedCategory}
          onChange={(event) => {
            setSelectedCategory(event.target.value);
          }}
        >
          <option value="">{t("auth.selectCategory")}</option>
          {skillCategories.map((category) => (
            <option key={`${field}-${category.name}`} value={category.name}>
              {getCategoryLabel(category.name)}
            </option>
          ))}
        </select>
      </label>

      {activeCategory && (
        <section className="skill-category">
          <h3>{getCategoryLabel(activeCategory.name)}</h3>
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
              placeholder={t("auth.addCustomSkill")}
            />
            <button
              type="button"
              className="btn primary add-skill-btn"
              onClick={handleAddCustomSkill}
              disabled={!customSkill.trim()}
            >
              {t("common.add")}
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
            ? t("auth.noSkills")
            : t("auth.chooseCategory")}
        </div>
      )}
    </div>
  );
};

const Register = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { registerUser } = useGlobleContext();
  const { t } = useLanguage();
  const requestedRedirect = searchParams.get("redirect") || "";
  const redirectTo =
    requestedRedirect.startsWith("/") && !requestedRedirect.startsWith("//")
      ? requestedRedirect
      : "";
  const redirectQuery = redirectTo
    ? `&redirect=${encodeURIComponent(redirectTo)}`
    : "";
  const loginPath = redirectTo
    ? `/login?redirect=${encodeURIComponent(redirectTo)}`
    : "/login";
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
        setError(t("auth.validationRequired"));
        return false;
      }
      if (!formData.email.includes("@")) {
        setError(t("auth.invalidEmail"));
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError(t("auth.passwordsMismatch"));
        return false;
      }
      if (formData.password.length < 8) {
        setError(t("auth.validationPasswordLength"));
        return false;
      }
      if (
        !/[a-z]/.test(formData.password) ||
        !/[A-Z]/.test(formData.password) ||
        !/\d/.test(formData.password)
      ) {
        setError(t("auth.validationPasswordStrength"));
        return false;
      }
    }

    if (step === 2) {
      if (formData.role === "recruiter") {
        if (!formData.jobTitle.trim()) {
          setError(t("auth.validationJobTitle"));
          return false;
        }
        if (!formData.candidateSkills.length) {
          setError(t("auth.validationCandidateSkills"));
          return false;
        }
      } else if (
        !formData.skillsToTeach.length &&
        !formData.skillsToLearn.length
      ) {
        setError(t("auth.validationSkills"));
        return false;
      }
    }

    if (step === 3) {
      if (formData.role === "recruiter") {
        if (!formData.recruiterCompany.trim()) {
          setError(t("auth.validationCompany"));
          return false;
        }
        if (!formData.jobDescription.trim()) {
          setError(t("auth.validationJobDescription"));
          return false;
        }
      } else if (!formData.bio.trim()) {
        setError(t("auth.validationBio"));
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
      setSubmitting(true);
      const response = await registerUser(registerPayload);
      if (response.devVerificationUrl) {
        const verificationUrl = new URL(response.devVerificationUrl);
        navigate(`${verificationUrl.pathname}${verificationUrl.search}${redirectQuery}`);
      } else {
        navigate(`/verify-email?email=${encodeURIComponent(registerPayload.email)}&sent=1${redirectQuery}`);
      }
    } catch (err) {
      setError(err.message || t("auth.registerError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card auth-wizard-card">
        <div className="auth-header">
          <h1>{t("auth.registerTitle")}</h1>
          <p>{t("auth.registerDescription")}</p>
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
                {t("auth.fullName")}
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => updateField("fullName", e.target.value)}
                  placeholder={t("auth.fullNamePlaceholder")}
                />
              </label>

              <label>
                {t("auth.email")}
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder={t("auth.emailPlaceholder")}
                />
              </label>

              <label>
                {t("auth.role")}
                <select
                  value={formData.role}
                  onChange={(e) => updateField("role", e.target.value)}
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(`auth.${option.value}`)}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                {t("auth.password")}
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  placeholder={t("auth.createPassword")}
                />
              </label>

              <label>
                {t("auth.confirmPassword")}
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    updateField("confirmPassword", e.target.value)
                  }
                  placeholder={t("auth.repeatPassword")}
                />
              </label>
            </>
          )}

          {step === 2 && (
            <>
              {formData.role === "recruiter" ? (
                <>
                  <label>
                    {t("auth.jobTitle")}
                    <input
                      type="text"
                      value={formData.jobTitle}
                      onChange={(e) => updateField("jobTitle", e.target.value)}
                      placeholder={t("auth.jobTitlePlaceholder")}
                    />
                  </label>

                  <label>
                    {t("auth.jobType")}
                    <select
                      value={formData.jobType}
                      onChange={(e) => updateField("jobType", e.target.value)}
                    >
                      {jobTypes.map((option) => (
                        <option key={option} value={option}>
                          {t(`auth.${jobTypeTranslationKeys[option]}`)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    {t("auth.candidateSeniority")}
                    <select
                      value={formData.experienceLevel}
                      onChange={(e) =>
                        updateField("experienceLevel", e.target.value)
                      }
                    >
                      {experienceLevels.map((option) => (
                        <option key={option.value} value={option.value}>
                          {t(`auth.${option.value}`)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="section-label">
                    {t("auth.candidateSkills")}
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
                    {t("auth.hiringTimeline")}
                    <select
                      value={formData.hiringTimeline}
                      onChange={(e) =>
                        updateField("hiringTimeline", e.target.value)
                      }
                    >
                      {hiringTimelineOptions.map((option) => (
                        <option key={option} value={option}>
                          {t(`auth.${hiringTranslationKeys[option]}`)}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              ) : (
                <>
                  <SkillCategoryPicker
                    title={t("auth.teachSkills")}
                    field="skillsToTeach"
                    selectedSkills={formData.skillsToTeach}
                    onToggle={toggleSkill}
                  />

                  <SkillCategoryPicker
                    title={t("auth.learnSkills")}
                    field="skillsToLearn"
                    selectedSkills={formData.skillsToLearn}
                    onToggle={toggleSkill}
                  />

                  <label>
                    {t("auth.experienceLevel")}
                    <select
                      value={formData.experienceLevel}
                      onChange={(e) =>
                        updateField("experienceLevel", e.target.value)
                      }
                    >
                      {experienceLevels.map((option) => (
                        <option key={option.value} value={option.value}>
                          {t(`auth.${option.value}`)}
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
                    {t("auth.company")}
                    <input
                      type="text"
                      value={formData.recruiterCompany}
                      onChange={(e) =>
                        updateField("recruiterCompany", e.target.value)
                      }
                      placeholder={t("auth.companyPlaceholder")}
                    />
                  </label>

                  <label>
                    {t("auth.aboutRole")}
                    <textarea
                      value={formData.jobDescription}
                      onChange={(e) =>
                        updateField("jobDescription", e.target.value)
                      }
                      placeholder={t("auth.aboutRolePlaceholder")}
                    />
                  </label>

                  <div className="review-box">
                    <h3>{t("common.review")}</h3>
                    <p>
                      {t("auth.role")}:{" "}
                      <strong>{t(`auth.${formData.role}`)}</strong>
                    </p>
                    <p>
                      {t("auth.jobTitle")}: <strong>{formData.jobTitle}</strong>
                    </p>
                    <p>
                      {t("auth.jobType")}:{" "}
                      <strong>
                        {t(`auth.${jobTypeTranslationKeys[formData.jobType]}`)}
                      </strong>
                    </p>
                    <p>
                      {t("auth.candidateSkills")}:{" "}
                      <strong>
                        {formData.candidateSkills.join(", ") || t("common.none")}
                      </strong>
                    </p>
                    <p>
                      {t("auth.hiringTimeline")}:{" "}
                      <strong>
                        {t(
                          `auth.${hiringTranslationKeys[formData.hiringTimeline]}`,
                        )}
                      </strong>
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <label>
                    {t("auth.availability")}
                    <select
                      value={formData.availability}
                      onChange={(e) =>
                        updateField("availability", e.target.value)
                      }
                    >
                      {availabilityOptions.map((option) => (
                        <option key={option} value={option}>
                          {t(`auth.${availabilityTranslationKeys[option]}`)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    {t("auth.aboutYou")}
                    <textarea
                      value={formData.bio}
                      onChange={(e) => updateField("bio", e.target.value)}
                      placeholder={t("auth.aboutYouPlaceholder")}
                    />
                  </label>

                  <div className="review-box">
                    <h3>{t("common.review")}</h3>
                    <p>
                      {t("auth.role")}:{" "}
                      <strong>{t(`auth.${formData.role}`)}</strong>
                    </p>
                    <p>
                      {t("auth.availability")}:{" "}
                      <strong>
                        {t(
                          `auth.${availabilityTranslationKeys[formData.availability]}`,
                        )}
                      </strong>
                    </p>
                    <p>
                      {t("auth.skillsToTeach")}:{" "}
                      <strong>
                        {formData.skillsToTeach.join(", ") || t("common.none")}
                      </strong>
                    </p>
                    <p>
                      {t("auth.skillsToLearn")}:{" "}
                      <strong>
                        {formData.skillsToLearn.join(", ") || t("common.none")}
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
                {t("common.back")}
              </button>
            ) : (
              <div />
            )}

            <button
              type="submit"
              className="btn primary auth-submit"
              disabled={submitting}
            >
              {submitting ? (
                <ButtonLoader>
                  {isRecruiter ? t("auth.createAccount") : t("auth.completeRegistration")}
                </ButtonLoader>
              ) : isRecruiter
                ? t("auth.createAccount")
                : step === 3
                  ? t("auth.completeRegistration")
                  : t("common.next")}
            </button>
          </div>

          <p className="auth-footer">
            {t("auth.alreadyAccount")}{" "}
            <Link to={loginPath}>{t("auth.login")}</Link>
          </p>
        </form>
      </section>
    </main>
  );
};

export default Register;
