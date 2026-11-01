import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  FiUser,
  FiMail,
  FiLock,
  FiShield,
  FiEye,
  FiEyeOff,
  FiBookOpen,
  FiAward,
  FiBriefcase,
  FiArrowRight,
  FiArrowLeft,
  FiCheck,
  FiPlus,
  FiX,
  FiLayers,
  FiAlertCircle,
} from "react-icons/fi";
import logo from "../../assets/logo/logo1.png";
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
  const { t, language } = useLanguage();
  const isKm = language === "km";
  const getCategoryLabel = (categoryName) =>
    t(`auth.${categoryTranslationKeys[categoryName]}`) || categoryName;

  const handleAddCustomSkill = () => {
    const skill = customSkill.trim();
    if (!skill || selectedSkills.includes(skill)) return;
    onToggle(field, skill);
    setCustomSkill("");
  };

  return (
    <div className="skill-category-picker ios-picker-card">
      <div className="section-label-row">
        <span className="section-label">{title}</span>
        {selectedSkills.length > 0 && (
          <span className="badge-pill-count">{selectedSkills.length}</span>
        )}
      </div>

      <div className="skill-category-select ios-input-group">
        <div className="ios-field-wrap">
          <FiLayers className="ios-field-icon" aria-hidden="true" />
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
        </div>
      </div>

      {activeCategory && (
        <section className="skill-category ios-sub-glass">
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
                {selectedSkills.includes(skill) && <FiCheck className="chip-check" />}
                <span>{skill}</span>
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
              className="btn btn-primary add-skill-btn"
              onClick={handleAddCustomSkill}
              disabled={!customSkill.trim()}
            >
              <FiPlus /> {t("common.add")}
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
              title={isKm ? "ចុចដើម្បីលុបចេញ" : "Click to remove"}
            >
              <span>{skill}</span>
              <FiX className="remove-icon" />
            </button>
          ))}
        </div>
      ) : (
        <div className="empty-skill-message">
          {activeCategory ? t("auth.noSkills") : t("auth.chooseCategory")}
        </div>
      )}
    </div>
  );
};

const Register = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { registerUser } = useGlobleContext();
  const { t, language } = useLanguage();
  const isKm = language === "km";
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
      if (response.requiresVerification === false) {
        navigate(loginPath);
      } else if (response.devVerificationUrl) {
        const verificationUrl = new URL(response.devVerificationUrl);
        navigate(
          `${verificationUrl.pathname}${verificationUrl.search}${redirectQuery}`,
        );
      } else {
        navigate(
          `/verify-email?email=${encodeURIComponent(registerPayload.email)}&sent=1${redirectQuery}`,
        );
      }
    } catch (err) {
      setError(err.message || t("auth.registerError"));
    } finally {
      setSubmitting(false);
    }
  };

  const roleCardOptions = [
    {
      id: "student",
      icon: FiBookOpen,
      title: t("auth.student") || (isKm ? "សិស្ស / អ្នករៀន" : "Student"),
      subtitle: isKm ? "រៀនជំនាញ & វគ្គសិក្សា" : "Learn skills & take courses",
    },
    {
      id: "mentor",
      icon: FiAward,
      title: t("auth.mentor") || (isKm ? "អ្នកណែនាំ" : "Mentor"),
      subtitle: isKm ? "ណែនាំ & ចែករំលែក" : "Guide peers & host sessions",
    },
    {
      id: "recruiter",
      icon: FiBriefcase,
      title: t("auth.recruiter") || (isKm ? "អ្នកជ្រើសរើស" : "Recruiter"),
      subtitle: isKm ? "ប្រកាសការងារ & ស្វែងរកបុគ្គលិក" : "Post jobs & hire talent",
    },
  ];

  return (
    <div className="auth-page">
      <div className="auth-ambient-orb auth-orb-1" aria-hidden="true" />
      <div className="auth-ambient-orb auth-orb-2" aria-hidden="true" />

      <section className="auth-card auth-wizard-card ios-glass-card">
        {/* Brand header badge */}
        <div className="auth-brand-badge">
          <div className="auth-logo-squircle">
            <img src={logo} alt="Smart Community" className="auth-brand-logo" />
          </div>
          <span className="auth-brand-eyebrow">
            <FiShield className="shield-icon" />
            <span>Smart Community Onboarding</span>
          </span>
        </div>

        {/* iOS Segmented Auth Switcher */}
        <div className="ios-auth-switcher-track" role="tablist">
          <Link to={loginPath} className="ios-auth-switch-pill" role="tab" aria-selected="false">
            {t("auth.login")}
          </Link>
          <button type="button" className="ios-auth-switch-pill active" role="tab" aria-selected="true">
            {t("auth.createOne")}
          </button>
        </div>

        <div className="auth-header">
          <h1>{t("auth.registerTitle")}</h1>
          <p>{t("auth.registerDescription")}</p>
        </div>

        {/* iOS 27 Liquid Stepper */}
        <div className="ios-stepper-track" aria-label="Registration steps">
          <div className={`ios-step-pill ${step >= 1 ? "active" : ""}`}>
            <span className="step-num">{step > 1 ? <FiCheck /> : "1"}</span>
            <span className="step-text">{isKm ? "គណនី" : "Account"}</span>
          </div>
          <div className="step-connector" />
          <div className={`ios-step-pill ${step >= 2 ? "active" : ""}`}>
            <span className="step-num">{step > 2 ? <FiCheck /> : "2"}</span>
            <span className="step-text">{isKm ? "តួនាទី & ជំនាញ" : "Role & Skills"}</span>
          </div>
          {!isRecruiter && (
            <>
              <div className="step-connector" />
              <div className={`ios-step-pill ${step >= 3 ? "active" : ""}`}>
                <span className="step-num">{step === 3 ? "3" : "3"}</span>
                <span className="step-text">{isKm ? "ពិនិត្យ & បញ្ចប់" : "Review"}</span>
              </div>
            </>
          )}
        </div>

        <form
          className="auth-form"
          onSubmit={isRecruiter || step === 3 ? handleSubmit : handleNext}
        >
          {error && (
            <div className="auth-error ios-alert-glass">
              <FiAlertCircle className="error-icon" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 && (
            <div className="auth-step-container">
              {/* Modern iOS Role Cards */}
              <div className="role-selection-section">
                <span className="section-label">{t("auth.role")}</span>
                <div className="role-cards-grid">
                  {roleCardOptions.map((opt) => {
                    const isSelected = formData.role === opt.id;
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        className={`role-squircle-card ${isSelected ? "selected" : ""}`}
                        onClick={() => updateField("role", opt.id)}
                      >
                        <div className="role-card-icon-wrap">
                          <Icon />
                        </div>
                        <div className="role-card-text">
                          <strong className="role-card-title">{opt.title}</strong>
                          <span className="role-card-desc">{opt.subtitle}</span>
                        </div>
                        {isSelected && (
                          <span className="role-card-check">
                            <FiCheck />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {formData.role === "recruiter" && (
                  <div
                    className="role-onboarding-hint recruiter-hint"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "12px 16px",
                      borderRadius: "14px",
                      background: "rgba(59, 130, 246, 0.08)",
                      border: "1px solid rgba(59, 130, 246, 0.25)",
                      color: "var(--text)",
                      fontSize: "0.85rem",
                      lineHeight: "1.5",
                      marginTop: "12px",
                    }}
                  >
                    <FiShield
                      style={{ color: "#2563eb", fontSize: "1.2rem", flexShrink: 0 }}
                    />
                    <span>
                      {isKm
                        ? "📌 សម្គាល់៖ គណនីក្រុមហ៊ុន/អ្នកជ្រើសរើស ត្រូវរង់ចាំការផ្ទៀងផ្ទាត់ (Pending Verification) ពី Admin មុនពេលអាចប្រកាសការងារជាសាធារណៈបាន។"
                        : "📌 Note: Recruiter accounts require company verification by admin before internship postings can be published publicly."}
                    </span>
                  </div>
                )}

                {formData.role === "mentor" && (
                  <div
                    className="role-onboarding-hint mentor-hint"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "12px 16px",
                      borderRadius: "14px",
                      background: "rgba(245, 158, 11, 0.08)",
                      border: "1px solid rgba(245, 158, 11, 0.28)",
                      color: "var(--text)",
                      fontSize: "0.85rem",
                      lineHeight: "1.5",
                      marginTop: "12px",
                    }}
                  >
                    <FiShield
                      style={{ color: "#d97706", fontSize: "1.2rem", flexShrink: 0 }}
                    />
                    <span>
                      {isKm
                        ? "📌 សម្គាល់៖ គណនីអ្នកណែនាំ (Mentor) ត្រូវរង់ចាំការពិនិត្យនិងអនុម័តពី Admin មុនពេលបើកទទួលការកក់ម៉ោង 1:1 និងបង្រៀនផ្ទាល់។"
                        : "📌 Note: Mentor accounts undergo admin credential review before public 1:1 bookings and live classes are activated."}
                    </span>
                  </div>
                )}
              </div>

              <div className="ios-input-group">
                <label htmlFor="reg-name">{t("auth.fullName")}</label>
                <div className="ios-field-wrap">
                  <FiUser className="ios-field-icon" aria-hidden="true" />
                  <input
                    id="reg-name"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    placeholder={t("auth.fullNamePlaceholder")}
                    required
                  />
                </div>
              </div>

              <div className="ios-input-group">
                <label htmlFor="reg-email">{t("auth.email")}</label>
                <div className="ios-field-wrap">
                  <FiMail className="ios-field-icon" aria-hidden="true" />
                  <input
                    id="reg-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder={t("auth.emailPlaceholder")}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="ios-input-group">
                <label htmlFor="reg-pass">{t("auth.password")}</label>
                <div className="ios-field-wrap">
                  <FiLock className="ios-field-icon" aria-hidden="true" />
                  <input
                    id="reg-pass"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    placeholder={t("auth.createPassword")}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="ios-field-eye"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <div className="ios-input-group">
                <label htmlFor="reg-confirm-pass">{t("auth.confirmPassword")}</label>
                <div className="ios-field-wrap">
                  <FiShield className="ios-field-icon" aria-hidden="true" />
                  <input
                    id="reg-confirm-pass"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      updateField("confirmPassword", e.target.value)
                    }
                    placeholder={t("auth.repeatPassword")}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="ios-field-eye"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {formData.confirmPassword && (
                  <div
                    className={`password-match-hint ${
                      formData.password === formData.confirmPassword
                        ? "success"
                        : "mismatch"
                    }`}
                  >
                    {formData.password === formData.confirmPassword ? (
                      <>
                        <FiCheck className="match-icon" />
                        <span>
                          {isKm
                            ? "លេខសម្ងាត់ត្រូវគ្នាហើយ"
                            : "Passwords match"}
                        </span>
                      </>
                    ) : (
                      <>
                        <FiAlertCircle className="match-icon" />
                        <span>
                          {isKm
                            ? "លេខសម្ងាត់មិនទាន់ត្រូវគ្នាទេ"
                            : "Passwords do not match"}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="auth-step-container">
              {formData.role === "recruiter" ? (
                <>
                  <div className="ios-input-group">
                    <label htmlFor="reg-job-title">{t("auth.jobTitle")}</label>
                    <div className="ios-field-wrap">
                      <FiBriefcase className="ios-field-icon" aria-hidden="true" />
                      <input
                        id="reg-job-title"
                        type="text"
                        value={formData.jobTitle}
                        onChange={(e) => updateField("jobTitle", e.target.value)}
                        placeholder={t("auth.jobTitlePlaceholder")}
                        required
                      />
                    </div>
                  </div>

                  <div className="ios-input-group">
                    <label htmlFor="reg-job-type">{t("auth.jobType")}</label>
                    <div className="ios-field-wrap">
                      <select
                        id="reg-job-type"
                        value={formData.jobType}
                        onChange={(e) => updateField("jobType", e.target.value)}
                      >
                        {jobTypes.map((option) => (
                          <option key={option} value={option}>
                            {t(`auth.${jobTypeTranslationKeys[option]}`)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="ios-input-group">
                    <label htmlFor="reg-seniority">{t("auth.candidateSeniority")}</label>
                    <div className="ios-field-wrap">
                      <select
                        id="reg-seniority"
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
                    </div>
                  </div>

                  <div className="section-label-row" style={{ marginTop: "12px" }}>
                    <span className="section-label">{t("auth.candidateSkills")}</span>
                    {formData.candidateSkills.length > 0 && (
                      <span className="badge-pill-count">{formData.candidateSkills.length}</span>
                    )}
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
                        {formData.candidateSkills.includes(skill) && <FiCheck className="chip-check" />}
                        <span>{skill}</span>
                      </button>
                    ))}
                  </div>

                  <div className="ios-input-group" style={{ marginTop: "12px" }}>
                    <label htmlFor="reg-timeline">{t("auth.hiringTimeline")}</label>
                    <div className="ios-field-wrap">
                      <select
                        id="reg-timeline"
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
                    </div>
                  </div>
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

                  <div className="ios-input-group">
                    <label htmlFor="reg-exp-level">{t("auth.experienceLevel")}</label>
                    <div className="ios-field-wrap">
                      <select
                        id="reg-exp-level"
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
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="auth-step-container">
              {formData.role === "recruiter" ? (
                <>
                  <div className="ios-input-group">
                    <label htmlFor="reg-company">{t("auth.company")}</label>
                    <div className="ios-field-wrap">
                      <FiBriefcase className="ios-field-icon" aria-hidden="true" />
                      <input
                        id="reg-company"
                        type="text"
                        value={formData.recruiterCompany}
                        onChange={(e) =>
                          updateField("recruiterCompany", e.target.value)
                        }
                        placeholder={t("auth.companyPlaceholder")}
                        required
                      />
                    </div>
                  </div>

                  <div className="ios-input-group">
                    <label htmlFor="reg-role-desc">{t("auth.aboutRole")}</label>
                    <textarea
                      id="reg-role-desc"
                      rows={4}
                      value={formData.jobDescription}
                      onChange={(e) =>
                        updateField("jobDescription", e.target.value)
                      }
                      placeholder={t("auth.aboutRolePlaceholder")}
                      required
                    />
                  </div>

                  <div className="review-box ios-review-sheet">
                    <div className="review-sheet-header">
                      <h3>{t("common.review")}</h3>
                      <span className="badge-verified-preview">
                        <FiCheck /> {isKm ? "រួចរាល់" : "Ready"}
                      </span>
                    </div>
                    <div className="review-meta-list">
                      <div className="review-row">
                        <span className="review-key">{t("auth.role")}:</span>
                        <strong className="review-val">{t(`auth.${formData.role}`)}</strong>
                      </div>
                      <div className="review-row">
                        <span className="review-key">{t("auth.jobTitle")}:</span>
                        <strong className="review-val">{formData.jobTitle}</strong>
                      </div>
                      <div className="review-row">
                        <span className="review-key">{t("auth.jobType")}:</span>
                        <strong className="review-val">
                          {t(`auth.${jobTypeTranslationKeys[formData.jobType]}`)}
                        </strong>
                      </div>
                      <div className="review-row">
                        <span className="review-key">{t("auth.candidateSkills")}:</span>
                        <strong className="review-val">
                          {formData.candidateSkills.join(", ") || t("common.none")}
                        </strong>
                      </div>
                      <div className="review-row">
                        <span className="review-key">{t("auth.hiringTimeline")}:</span>
                        <strong className="review-val">
                          {t(`auth.${hiringTranslationKeys[formData.hiringTimeline]}`)}
                        </strong>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="ios-input-group">
                    <label htmlFor="reg-avail">{t("auth.availability")}</label>
                    <div className="ios-field-wrap">
                      <select
                        id="reg-avail"
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
                    </div>
                  </div>

                  <div className="ios-input-group">
                    <label htmlFor="reg-bio">{t("auth.aboutYou")}</label>
                    <textarea
                      id="reg-bio"
                      rows={4}
                      value={formData.bio}
                      onChange={(e) => updateField("bio", e.target.value)}
                      placeholder={t("auth.aboutYouPlaceholder")}
                      required
                    />
                  </div>

                  <div className="review-box ios-review-sheet">
                    <div className="review-sheet-header">
                      <h3>{t("common.review")}</h3>
                      <span className="badge-verified-preview">
                        <FiCheck /> {isKm ? "រួចរាល់" : "Ready"}
                      </span>
                    </div>
                    <div className="review-meta-list">
                      <div className="review-row">
                        <span className="review-key">{t("auth.role")}:</span>
                        <strong className="review-val">{t(`auth.${formData.role}`)}</strong>
                      </div>
                      <div className="review-row">
                        <span className="review-key">{t("auth.availability")}:</span>
                        <strong className="review-val">
                          {t(`auth.${availabilityTranslationKeys[formData.availability]}`)}
                        </strong>
                      </div>
                      <div className="review-row">
                        <span className="review-key">{t("auth.skillsToTeach")}:</span>
                        <strong className="review-val">
                          {formData.skillsToTeach.join(", ") || t("common.none")}
                        </strong>
                      </div>
                      <div className="review-row">
                        <span className="review-key">{t("auth.skillsToLearn")}:</span>
                        <strong className="review-val">
                          {formData.skillsToLearn.join(", ") || t("common.none")}
                        </strong>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="auth-actions-row">
            {!isRecruiter && step > 1 ? (
              <button
                type="button"
                className="btn btn-soft auth-back-btn"
                onClick={handleBack}
              >
                <FiArrowLeft />
                <span>{t("common.back")}</span>
              </button>
            ) : (
              <div />
            )}

            <button
              type="submit"
              className="btn btn-primary auth-submit ios-submit-btn"
              disabled={submitting}
            >
              {submitting ? (
                <ButtonLoader>
                  {isRecruiter
                    ? t("auth.createAccount")
                    : t("auth.completeRegistration")}
                </ButtonLoader>
              ) : isRecruiter ? (
                <>
                  <span>{t("auth.createAccount")}</span>
                  <FiArrowRight />
                </>
              ) : step === 3 ? (
                <>
                  <span>{t("auth.completeRegistration")}</span>
                  <FiCheck />
                </>
              ) : (
                <>
                  <span>{t("common.next")}</span>
                  <FiArrowRight />
                </>
              )}
            </button>
          </div>

          <div className="auth-footer-box">
            <p className="auth-footer">
              {t("auth.alreadyAccount")}{" "}
              <Link to={loginPath} className="auth-create-link">
                {t("auth.login")}
              </Link>
            </p>
          </div>
        </form>
      </section>
    </div>
  );
};

export default Register;
