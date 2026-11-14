import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiUser,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiBriefcase,
  FiAward,
  FiBookOpen,
  FiCheck,
  FiArrowRight,
  FiArrowLeft,
  FiShield,
  FiAlertCircle,
  FiPlus,
  FiX,
  FiInfo,
} from "react-icons/fi";
import logo from "../../assets/logo/logo-mark.png";
import GoogleLoginButton from "../../components/auth/GoogleLoginButton";
import { useGlobleContext } from "../../context/GlobleContext";
import { useLanguage } from "../../context/LanguageContext";
import { ButtonLoader } from "../../components/ui/LoadingStates";
import "./Auth.css";

const POPULAR_SKILLS = [
  "React.js",
  "JavaScript",
  "HTML & CSS",
  "Node.js & API",
  "Python",
  "SQL & MySQL",
  "UX/UI Figma",
  "Cybersecurity",
];

const parseSkillList = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const joinSkillList = (items) => Array.from(new Set(items)).join(", ");

const QuickSkillChipPicker = ({
  label,
  hint,
  value,
  onChange,
  customPlaceholder,
  addLabel,
}) => {
  const [customSkill, setCustomSkill] = useState("");
  const selectedSkills = parseSkillList(value);

  const toggleSkill = (skill) => {
    const exists = selectedSkills.some(
      (item) => item.toLowerCase() === skill.toLowerCase(),
    );
    if (exists) {
      onChange(
        joinSkillList(
          selectedSkills.filter(
            (item) => item.toLowerCase() !== skill.toLowerCase(),
          ),
        ),
      );
    } else {
      onChange(joinSkillList([...selectedSkills, skill]));
    }
  };

  const handleAddCustom = () => {
    const trimmed = customSkill.trim();
    if (!trimmed) return;
    if (
      !selectedSkills.some(
        (item) => item.toLowerCase() === trimmed.toLowerCase(),
      )
    ) {
      onChange(joinSkillList([...selectedSkills, trimmed]));
    }
    setCustomSkill("");
  };

  const extraSkills = selectedSkills.filter(
    (skill) =>
      !POPULAR_SKILLS.some(
        (preset) => preset.toLowerCase() === skill.toLowerCase(),
      ),
  );

  return (
    <div className="ios-input-group quick-skill-picker">
      <div className="quick-skill-header">
        <label>{label}</label>
        {hint && <span className="quick-skill-hint">{hint}</span>}
      </div>

      <div className="quick-skill-pills">
        {POPULAR_SKILLS.map((skill) => {
          const isSelected = selectedSkills.some(
            (item) => item.toLowerCase() === skill.toLowerCase(),
          );
          return (
            <button
              key={skill}
              type="button"
              className={`quick-skill-chip ${isSelected ? "selected" : ""}`}
              onClick={() => toggleSkill(skill)}
            >
              {isSelected ? <FiCheck size={13} /> : <FiPlus size={13} />}
              <span>{skill}</span>
            </button>
          );
        })}

        {extraSkills.map((skill) => (
          <button
            key={skill}
            type="button"
            className="quick-skill-chip selected"
            onClick={() => toggleSkill(skill)}
          >
            <span>{skill}</span>
            <FiX size={13} />
          </button>
        ))}
      </div>

      <div className="quick-skill-custom-row">
        <input
          type="text"
          value={customSkill}
          onChange={(e) => setCustomSkill(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddCustom();
            }
          }}
          placeholder={customPlaceholder}
          className="quick-skill-custom-input"
        />
        <button
          type="button"
          className="quick-skill-add-btn"
          onClick={handleAddCustom}
          disabled={!customSkill.trim()}
        >
          <FiPlus size={14} />
          <span>{addLabel}</span>
        </button>
      </div>
    </div>
  );
};

const Register = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    role: "student",
    profession: "",
    careerGoal: "",
    skillsToTeach: "HTML & CSS, JavaScript",
    skillsToLearn: "React.js, Node.js & API",
    mentorTitle: "",
    mentorExperience: "",
    mentorExpertise: "React.js, Node.js & API",
    recruiterCompany: "",
    jobTitle: "",
    candidateSkills: "React.js, JavaScript",
    bio: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { googleLogin, registerUser } = useGlobleContext();
  const { language, t } = useLanguage();
  const isKm = language === "km";

  const handleChange = (event) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const setFieldValue = (field, val) => {
    setFormData((current) => ({
      ...current,
      [field]: val,
    }));
  };

  const handleRoleSelect = (roleValue) => {
    if (!["student", "mentor", "recruiter"].includes(roleValue)) return;
    setFormData((current) => ({ ...current, role: roleValue }));
  };

  const passwordRules = {
    minLength: formData.password.length >= 8,
    mixedCase:
      /[a-z]/.test(formData.password) && /[A-Z]/.test(formData.password),
    hasNumber: /\d/.test(formData.password),
  };

  const passwordScore =
    Object.values(passwordRules).filter(Boolean).length +
    (formData.password.length >= 12 ? 1 : 0);

  const validateStepOne = () => {
    if (!formData.fullName.trim()) {
      return t("auth.fullNameRequired");
    }
    if (!formData.email.trim().includes("@")) {
      return t("auth.validEmailRequired");
    }
    if (!passwordRules.minLength) {
      return t("auth.passwordMinLength");
    }
    if (!passwordRules.mixedCase || !passwordRules.hasNumber) {
      return t("auth.passwordComplexity");
    }
    if (formData.password !== formData.confirmPassword) {
      return t("auth.passwordMismatch");
    }
    return "";
  };

  const validateStepTwo = () => {
    if (formData.role === "student") {
      if (!formData.skillsToTeach.trim() && !formData.skillsToLearn.trim()) {
        return t("auth.validationSkills");
      }
    }
    if (formData.role === "mentor") {
      if (!formData.mentorExpertise.trim()) {
        return t("auth.mentorExpertiseRequired");
      }
    }
    if (formData.role === "recruiter") {
      if (!formData.recruiterCompany.trim()) {
        return t("auth.companyRequired");
      }
    }
    return "";
  };

  const handleNext = (event) => {
    event.preventDefault();
    setError("");
    const validationError = validateStepOne();
    if (validationError) return setError(validationError);
    setStep(2);
  };

  const handlePrev = () => {
    setError("");
    setStep(1);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const stepOneError = validateStepOne();
    if (stepOneError) {
      setStep(1);
      return setError(stepOneError);
    }

    const stepTwoError = validateStepTwo();
    if (stepTwoError) return setError(stepTwoError);

    const defaultBioByRole = {
      student:
        formData.bio.trim() ||
        `Tech learner sharing ${formData.skillsToTeach || "web skills"} and learning ${formData.skillsToLearn || "software engineering"} on Smart Community.`,
      mentor:
        formData.bio.trim() ||
        `${formData.mentorTitle || "Tech Mentor"} guiding learners in ${formData.mentorExpertise || "software engineering"}.`,
      recruiter:
        formData.bio.trim() ||
        `Hiring talent at ${formData.recruiterCompany || "our company"} for ${formData.jobTitle || "technology roles"}.`,
    };

    setLoading(true);
    try {
      const result = await registerUser({
        ...formData,
        skillsToTeach: parseSkillList(formData.skillsToTeach),
        skillsToLearn: parseSkillList(formData.skillsToLearn),
        mentorExpertise: parseSkillList(formData.mentorExpertise),
        candidateSkills: parseSkillList(formData.candidateSkills),
        profession:
          formData.role === "mentor"
            ? formData.mentorTitle || "Tech Mentor"
            : formData.role === "recruiter"
              ? formData.jobTitle || "Talent Recruiter"
              : formData.profession || "Tech Learner",
        bio: defaultBioByRole[formData.role] || formData.bio.trim(),
        email: formData.email.toLowerCase().trim(),
      });

      if (result?.token) {
        navigate("/dashboard");
        return;
      }

      if (result?.requiresVerification === false) {
        navigate("/login", {
          state: { registeredEmail: result.email || formData.email.trim() },
        });
        return;
      }

      const tokenParam = result?.devVerificationUrl?.split("token=")[1] || "";
      navigate(
        `/verify-email${tokenParam ? `?token=${encodeURIComponent(tokenParam)}` : ""}`,
        {
          state: {
            email: result?.email || formData.email.trim(),
            devVerificationUrl: result?.devVerificationUrl || "",
          },
        },
      );
    } catch (err) {
      setError(err.message || t("auth.registerError"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = async (credential) => {
    setError("");
    setLoading(true);
    try {
      await googleLogin({ credential, rememberMe: true });
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || t("auth.googleRegisterError"));
    } finally {
      setLoading(false);
    }
  };

  const roleCards = [
    {
      id: "student",
      icon: FiBookOpen,
      label: t("auth.roleStudent"),
      desc: isKm ? "រៀនកូដ & ប្តូរជំនាញ" : "Learn & swap skills",
    },
    {
      id: "mentor",
      icon: FiAward,
      label: t("auth.roleMentor"),
      desc: isKm ? "ណែនាំសិស្ស 1:1" : "Guide mentees 1:1",
    },
    {
      id: "recruiter",
      icon: FiBriefcase,
      label: t("auth.roleRecruiter"),
      desc: isKm ? "ប្រកាសការងារ & ATS" : "Post jobs & hire",
    },
  ];

  const stepTwoLabelByRole = {
    student: isKm ? "គោលដៅសិក្សា & ជំនាញ" : "Learning Interests",
    mentor: isKm ? "ជំនាញឯកទេស & ផ្ទៀងផ្ទាត់" : "Expertise & Verification",
    recruiter: isKm ? "ព័ត៌មានក្រុមហ៊ុន & ផ្ទៀងផ្ទាត់" : "Company & Verification",
  };

  const stepsList = [
    {
      num: 1,
      title: isKm ? "ជំហានទី ១" : "Step 1",
      subtitle: isKm ? "តួនាទី & ព័ត៌មានគណនី" : "Role & Account Details",
    },
    {
      num: 2,
      title: isKm ? "ជំហានទី ២" : "Step 2",
      subtitle: stepTwoLabelByRole[formData.role] || stepTwoLabelByRole.student,
    },
  ];

  return (
    <div className="auth-page">
      <section className="auth-card auth-card-unified auth-card-register ios-glass-card">
        <div className="auth-header">
          <h1>{t("auth.registerTitle")}</h1>
          <p>{t("auth.registerSubtitle")}</p>
        </div>

        {/* Clean Unified Step Progress Header */}
        <div className="auth-step-progress" role="navigation" aria-label="Registration progress">
          <div className="auth-step-progress-top">
            <span className="auth-step-badge-pill">
              {isKm ? `ជំហានទី ${step === 1 ? "១" : "២"} នៃ ២` : `Step ${step} of 2`}
            </span>
            <span className="auth-step-current-label">
              {step === 1
                ? isKm
                  ? "តួនាទី & ព័ត៌មានគណនី"
                  : "Role & Account Details"
                : stepTwoLabelByRole[formData.role] || stepTwoLabelByRole.student}
            </span>
          </div>
          <div className="auth-step-progress-segments">
            {stepsList.map((item) => {
              const isActive = step === item.num;
              const isDone = step > item.num;
              return (
                <button
                  key={item.num}
                  type="button"
                  onClick={() => {
                    if (item.num < step) setStep(item.num);
                  }}
                  disabled={item.num > step}
                  aria-label={`${item.title}: ${item.subtitle}`}
                  className={`auth-clear-step ${isActive ? "active" : ""} ${isDone ? "done" : ""}`}
                >
                  <span className="auth-step-bar-fill" />
                </button>
              );
            })}
          </div>
        </div>

        <form
          className="auth-form"
          onSubmit={step === 2 ? handleSubmit : handleNext}
          noValidate
        >
          {error && (
            <div className="auth-error ios-alert-glass" role="alert">
              <FiAlertCircle className="error-icon" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 && (
            <div className="ios-step-pane">
              {/* Role Cards Selector */}
              <div className="ios-input-group">
                <label>{t("auth.joinAs")}</label>
                <div className="role-cards-grid">
                  {roleCards.map((rc) => {
                    const Icon = rc.icon;
                    const selected = formData.role === rc.id;
                    return (
                      <button
                        key={rc.id}
                        type="button"
                        onClick={() => handleRoleSelect(rc.id)}
                        className={`role-squircle-card ${selected ? "selected" : ""}`}
                        aria-pressed={selected}
                      >
                        <div className="role-card-icon-wrap">
                          <Icon />
                        </div>
                        <div className="role-card-text-col">
                          <span className="role-card-title">{rc.label}</span>
                          <span className="role-card-desc">{rc.desc}</span>
                        </div>
                        {selected && (
                          <span className="role-card-check" aria-hidden="true">
                            <FiCheck />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2-Column Row: Full Name + Email */}
              <div className="auth-two-col-grid">
                <div className="ios-input-group">
                  <label htmlFor="reg-fullname">{t("auth.fullName")}</label>
                  <div className="ios-field-wrap">
                    <FiUser className="ios-field-icon" aria-hidden="true" />
                    <input
                      id="reg-fullname"
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder={t("auth.fullNamePlaceholder")}
                      autoComplete="name"
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
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder={t("auth.emailPlaceholder")}
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* 2-Column Row: Password + Confirm Password */}
              <div className="auth-two-col-grid">
                <div className="ios-input-group">
                  <label htmlFor="reg-password">{t("auth.password")}</label>
                  <div className="ios-field-wrap">
                    <FiLock className="ios-field-icon" aria-hidden="true" />
                    <input
                      id="reg-password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder={t("auth.createPassword")}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      className="ios-field-eye"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                <div className="ios-input-group">
                  <label htmlFor="reg-confirm">{t("auth.confirmPassword")}</label>
                  <div className="ios-field-wrap">
                    <FiLock className="ios-field-icon" aria-hidden="true" />
                    <input
                      id="reg-confirm"
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder={t("auth.repeatPassword")}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      className="ios-field-eye"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="ios-password-rules-inline">
                <span className={`rule-chip ${passwordRules.minLength ? "valid" : ""}`}>
                  <FiCheck className="rule-icon" /> {t("auth.ruleMinChars")}
                </span>
                <span className={`rule-chip ${passwordRules.mixedCase ? "valid" : ""}`}>
                  <FiCheck className="rule-icon" /> {t("auth.ruleUpperLower")}
                </span>
                <span className={`rule-chip ${passwordRules.hasNumber ? "valid" : ""}`}>
                  <FiCheck className="rule-icon" /> {t("auth.ruleNumber")}
                </span>
              </div>

              <button type="submit" className="btn btn-primary auth-submit ios-submit-btn">
                <span>
                  {isKm
                    ? `បន្តទៅជំហានទី ២ (${stepTwoLabelByRole[formData.role]})`
                    : `Continue to Step 2 (${stepTwoLabelByRole[formData.role]})`}
                </span>
                <FiArrowRight className="submit-arrow" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="ios-step-pane">
              {formData.role === "student" && (
                <>
                  <QuickSkillChipPicker
                    label={t("auth.skillsWantLearn")}
                    hint={isKm ? "ជ្រើសរើស ១ ឬច្រើន" : "Select 1 or more"}
                    value={formData.skillsToLearn}
                    onChange={(val) => setFieldValue("skillsToLearn", val)}
                    customPlaceholder={
                      isKm ? "បន្ថែមជំនាញដែលចង់រៀន..." : "Add skill to learn..."
                    }
                    addLabel={isKm ? "បន្ថែម" : "Add"}
                  />

                  <div className="ios-input-group">
                    <label htmlFor="reg-skills-teach">
                      {isKm
                        ? "ជំនាញដែលអ្នកអាចចែករំលែកជាមួយមិត្តភក្តិ (ជាជម្រើស)"
                        : "Skills You Can Share with Peers (Optional)"}
                    </label>
                    <div className="ios-field-wrap">
                      <FiBookOpen className="ios-field-icon" aria-hidden="true" />
                      <input
                        id="reg-skills-teach"
                        type="text"
                        name="skillsToTeach"
                        value={formData.skillsToTeach}
                        onChange={handleChange}
                        placeholder={
                          isKm
                            ? "ឧ. HTML & CSS, ភាសាអង់គ្លេស, Graphic Design..."
                            : "e.g. HTML & CSS, English, Graphic Design..."
                        }
                      />
                    </div>
                  </div>

                  <div className="ios-input-group">
                    <label htmlFor="reg-career-goal">
                      {isKm ? "គោលដៅអាជីព (ជាជម្រើស)" : "Career Goal (Optional)"}
                    </label>
                    <div className="ios-field-wrap">
                      <FiBriefcase className="ios-field-icon" aria-hidden="true" />
                      <input
                        id="reg-career-goal"
                        type="text"
                        name="careerGoal"
                        value={formData.careerGoal}
                        onChange={handleChange}
                        placeholder={
                          isKm
                            ? "ឧ. Full-Stack Developer ឬ UX/UI Designer"
                            : "e.g. Full-Stack Developer or UX/UI Designer"
                        }
                      />
                    </div>
                  </div>
                </>
              )}

              {formData.role === "mentor" && (
                <>
                  <div className="auth-verification-notice">
                    <FiInfo className="notice-icon" />
                    <p>
                      {isKm
                        ? "គណនីអ្នកណែនាំ (Mentor) នឹងស្ថិតក្នុងស្ថានភាពរង់ចាំការត្រួតពិនិត្យ (Pending Approval) រហូតដល់អ្នកគ្រប់គ្រងផ្ទៀងផ្ទាត់ជំនាញឯកទេសរបស់អ្នក។"
                        : "Mentor applications start in Pending Approval status until an administrator verifies your professional expertise."}
                    </p>
                  </div>

                  <div className="ios-input-group">
                    <label htmlFor="mentor-title">{t("auth.professionalTitle")}</label>
                    <div className="ios-field-wrap">
                      <FiAward className="ios-field-icon" aria-hidden="true" />
                      <input
                        id="mentor-title"
                        type="text"
                        name="mentorTitle"
                        value={formData.mentorTitle}
                        onChange={handleChange}
                        placeholder={t("auth.mentorTitlePlaceholder")}
                      />
                    </div>
                  </div>

                  <div className="ios-input-group">
                    <label htmlFor="mentor-exp">{t("auth.yearsExperience")}</label>
                    <div className="ios-field-wrap">
                      <FiBriefcase className="ios-field-icon" aria-hidden="true" />
                      <input
                        id="mentor-exp"
                        type="number"
                        min="0"
                        max="50"
                        name="mentorExperience"
                        value={formData.mentorExperience}
                        onChange={handleChange}
                        placeholder={t("auth.mentorExperiencePlaceholder")}
                      />
                    </div>
                  </div>

                  <QuickSkillChipPicker
                    label={t("auth.areasExpertise")}
                    hint={isKm ? "ជ្រើសរើស ១ ឬច្រើន" : "Select 1 or more"}
                    value={formData.mentorExpertise}
                    onChange={(val) => setFieldValue("mentorExpertise", val)}
                    customPlaceholder={
                      isKm ? "បន្ថែមជំនាញឯកទេសផ្សេងទៀត..." : "Add custom expertise..."
                    }
                    addLabel={isKm ? "បន្ថែម" : "Add"}
                  />
                </>
              )}

              {formData.role === "recruiter" && (
                <>
                  <div className="auth-verification-notice">
                    <FiInfo className="notice-icon" />
                    <p>
                      {isKm
                        ? "គណនីក្រុមហ៊ុន (Recruiter) នឹងស្ថិតក្នុងស្ថានភាពរង់ចាំការផ្ទៀងផ្ទាត់ (Pending Verification) មុនពេលអាចប្រកាសជ្រើសរើសបុគ្គលិកជាសាធារណៈ។"
                        : "Company profiles start in Pending Verification status before publishing public job or internship listings."}
                    </p>
                  </div>

                  <div className="ios-input-group">
                    <label htmlFor="recruiter-company">
                      {t("auth.companyName")} *
                    </label>
                    <div className="ios-field-wrap">
                      <FiBriefcase className="ios-field-icon" aria-hidden="true" />
                      <input
                        id="recruiter-company"
                        type="text"
                        name="recruiterCompany"
                        value={formData.recruiterCompany}
                        onChange={handleChange}
                        placeholder={t("auth.companyPlaceholder")}
                        required
                      />
                    </div>
                  </div>

                  <div className="ios-input-group">
                    <label htmlFor="job-title">{t("auth.internshipJobTitle")}</label>
                    <div className="ios-field-wrap">
                      <FiUser className="ios-field-icon" aria-hidden="true" />
                      <input
                        id="job-title"
                        type="text"
                        name="jobTitle"
                        value={formData.jobTitle}
                        onChange={handleChange}
                        placeholder={t("auth.jobTitlePlaceholder")}
                      />
                    </div>
                  </div>

                  <QuickSkillChipPicker
                    label={t("auth.candidateSkills")}
                    hint={isKm ? "ជ្រើសរើស ១ ឬច្រើន" : "Select 1 or more"}
                    value={formData.candidateSkills}
                    onChange={(val) => setFieldValue("candidateSkills", val)}
                    customPlaceholder={
                      isKm ? "បន្ថែមជំនាញដែលត្រូវការ..." : "Add required skill..."
                    }
                    addLabel={isKm ? "បន្ថែម" : "Add"}
                  />
                </>
              )}

              <div className="auth-step-actions">
                <button
                  type="button"
                  className="btn btn-secondary ios-back-btn"
                  onClick={handlePrev}
                >
                  <FiArrowLeft />
                  <span>{t("auth.back")}</span>
                </button>
                <button
                  type="submit"
                  className="btn btn-primary auth-submit ios-submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <ButtonLoader>{t("auth.creatingAccount")}</ButtonLoader>
                  ) : (
                    <>
                      <span>{t("auth.createAccount")}</span>
                      <FiArrowRight className="submit-arrow" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <>
              <div className="auth-divider">
                <span>{t("auth.continueWith")}</span>
              </div>

              <div className="auth-google-wrapper">
                <GoogleLoginButton
                  onCredential={handleGoogleCredential}
                  onError={setError}
                />
              </div>
            </>
          )}

          <div className="auth-footer-box">
            <p className="auth-footer">
              {t("auth.alreadyAccount")}{" "}
              <Link to="/login" className="auth-create-link">
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
