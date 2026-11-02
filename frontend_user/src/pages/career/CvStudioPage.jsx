import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGlobleContext } from "../../context/GlobleContext";
import { useLanguage } from "../../context/LanguageContext";
import {
  fetchProfileRequest,
  updateBasicProfileRequest,
  createProfileItemRequest,
  updateProfileItemRequest,
  deleteProfileItemRequest,
} from "../../services/profileService";
import {
  FiUser,
  FiBookOpen,
  FiAward,
  FiFolder,
  FiEye,
  FiPrinter,
  FiCheck,
  FiPlus,
  FiTrash2,
  FiArrowRight,
  FiArrowLeft,
  FiSave,
  FiMail,
  FiPhone,
  FiMapPin,
  FiGlobe,
  FiGithub,
  FiLinkedin,
  FiBriefcase,
  FiCheckCircle,
} from "react-icons/fi";
import "./CvStudioPage.css";

const STEPS = [
  { id: "basic", icon: FiUser, labelEn: "Basic Info", labelKm: "ព័ត៌មានផ្ទាល់ខ្លួន" },
  { id: "education", icon: FiBookOpen, labelEn: "Education", labelKm: "ការអប់រំ" },
  { id: "skills", icon: FiAward, labelEn: "Skills", labelKm: "ជំនាញ" },
  { id: "projects", icon: FiFolder, labelEn: "Projects & Exp", labelKm: "គម្រោង & បទពិសោធន៍" },
  { id: "preview", icon: FiEye, labelEn: "Preview & PDF", labelKm: "មើលគំរូ & ទាញយក" },
];

export default function CvStudioPage() {
  const { user: authUser } = useGlobleContext();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isKm = language === "km";

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  // CV Data State
  const [basicInfo, setBasicInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
    profession: "",
    location: "",
    bio: "",
    githubUrl: "",
    linkedinUrl: "",
  });

  const [educationList, setEducationList] = useState([]);
  const [experiencesList, setExperiencesList] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
  const [certificatesList, setCertificatesList] = useState([]);
  const [skillsList, setSkillsList] = useState([]);
  const [newSkillInput, setNewSkillInput] = useState("");

  // New Item Temporary Forms
  const [newEdu, setNewEdu] = useState({
    institution: "",
    degree: "",
    fieldOfStudy: "",
    startDate: "",
    endDate: "",
    description: "",
  });

  const [newProj, setNewProj] = useState({
    title: "",
    description: "",
    technologies: "",
    projectUrl: "",
    githubUrl: "",
  });

  const [newExp, setNewExp] = useState({
    company: "",
    title: "",
    employmentType: "Internship",
    startDate: "",
    endDate: "",
    description: "",
  });

  // Load User Profile Data on Mount
  useEffect(() => {
    let mounted = true;
    const loadProfile = async () => {
      try {
        setLoading(true);
        const data = await fetchProfileRequest();
        if (!mounted) return;

        const u = data.user || {};
        setBasicInfo({
          fullName: u.fullName || "",
          email: u.email || "",
          phone: u.phone || "",
          profession: u.profession || "",
          location: u.location || "",
          bio: u.bio || "",
          githubUrl: u.githubUrl || "",
          linkedinUrl: u.linkedinUrl || "",
        });

        setEducationList(data.education || []);
        setExperiencesList(data.experiences || []);
        setProjectsList(data.projects || []);
        setCertificatesList(data.certificates || []);

        const userSkills = u.skills || {};
        const combinedSkills = [
          ...(userSkills.teach || []),
          ...(userSkills.learn || []),
          ...(userSkills.candidate || []),
          ...(u.interestedSkills || []),
        ];
        const unique = Array.from(new Set(combinedSkills)).filter(Boolean);
        setSkillsList(unique.length ? unique : ["JavaScript", "React", "HTML/CSS", "Git"]);
      } catch (err) {
        if (!mounted) return;
        setStatusMsg({
          type: "error",
          text: isKm ? "មិនអាចទាញយកទិន្នន័យ Profile បានទេ។" : "Failed to load profile data.",
        });
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      mounted = false;
    };
  }, [isKm]);

  // Calculate CV Completion Percentage
  const completionStats = useMemo(() => {
    let score = 0;
    const checks = {
      basic: Boolean(basicInfo.fullName && basicInfo.profession && basicInfo.email),
      bio: Boolean(basicInfo.bio && basicInfo.bio.length > 20),
      education: educationList.length > 0,
      skills: skillsList.length >= 3,
      projects: projectsList.length > 0 || experiencesList.length > 0,
    };

    if (checks.basic) score += 25;
    if (checks.bio) score += 15;
    if (checks.education) score += 20;
    if (checks.skills) score += 20;
    if (checks.projects) score += 20;

    return { score, checks };
  }, [basicInfo, educationList, skillsList, projectsList, experiencesList]);

  // Save Basic Info Changes
  const handleSaveBasicInfo = async () => {
    try {
      setSaving(true);
      await updateBasicProfileRequest({
        profession: basicInfo.profession,
        phone: basicInfo.phone,
        location: basicInfo.location,
        bio: basicInfo.bio,
        githubUrl: basicInfo.githubUrl,
        linkedinUrl: basicInfo.linkedinUrl,
      });
      setStatusMsg({
        type: "success",
        text: isKm ? "បានរក្សាទុកព័ត៌មានផ្ទាល់ខ្លួនដោយជោគជ័យ!" : "Basic info saved successfully!",
      });
      setTimeout(() => setStatusMsg({ type: "", text: "" }), 3000);
    } catch (err) {
      setStatusMsg({
        type: "error",
        text: err.message || (isKm ? "មានបញ្ហាក្នុងការរក្សាទុក" : "Failed to save"),
      });
    } finally {
      setSaving(false);
    }
  };

  // Education Handlers
  const handleAddEducation = async (e) => {
    e.preventDefault();
    if (!newEdu.institution.trim()) return;

    try {
      setSaving(true);
      const res = await createProfileItemRequest("education", {
        institution: newEdu.institution,
        degree: newEdu.degree || "Bachelor of IT",
        fieldOfStudy: newEdu.fieldOfStudy || "Computer Science",
        startDate: newEdu.startDate || null,
        endDate: newEdu.endDate || null,
        description: newEdu.description || "",
      });

      setEducationList([
        { ...newEdu, id: res.id || Date.now() },
        ...educationList,
      ]);
      setNewEdu({
        institution: "",
        degree: "",
        fieldOfStudy: "",
        startDate: "",
        endDate: "",
        description: "",
      });
      setStatusMsg({
        type: "success",
        text: isKm ? "បានបន្ថែមប្រវត្តិអប់រំជោគជ័យ!" : "Education added successfully!",
      });
      setTimeout(() => setStatusMsg({ type: "", text: "" }), 3000);
    } catch (err) {
      setStatusMsg({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEducation = async (id) => {
    try {
      await deleteProfileItemRequest("education", id);
      setEducationList(educationList.filter((item) => item.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Project Handlers
  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!newProj.title.trim()) return;

    try {
      setSaving(true);
      const techsArray = newProj.technologies
        ? newProj.technologies.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

      const res = await createProfileItemRequest("projects", {
        title: newProj.title,
        description: newProj.description,
        technologies: techsArray,
        projectUrl: newProj.projectUrl || null,
        githubUrl: newProj.githubUrl || null,
      });

      setProjectsList([
        { ...newProj, id: res.id || Date.now(), technologies: techsArray },
        ...projectsList,
      ]);
      setNewProj({
        title: "",
        description: "",
        technologies: "",
        projectUrl: "",
        githubUrl: "",
      });
      setStatusMsg({
        type: "success",
        text: isKm ? "បានបន្ថែមគម្រោងស្នាដៃជោគជ័យ!" : "Project added successfully!",
      });
      setTimeout(() => setStatusMsg({ type: "", text: "" }), 3000);
    } catch (err) {
      setStatusMsg({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async (id) => {
    try {
      await deleteProfileItemRequest("projects", id);
      setProjectsList(projectsList.filter((item) => item.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Skill Handlers
  const handleAddSkill = (e) => {
    e.preventDefault();
    const s = newSkillInput.trim();
    if (s && !skillsList.includes(s)) {
      setSkillsList([...skillsList, s]);
      setNewSkillInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkillsList(skillsList.filter((s) => s !== skillToRemove));
  };

  // Print PDF Trigger
  const handlePrintPdf = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="cv-studio-loading-state">
        <div className="loading-spinner" />
        <p>{isKm ? "កំពុងរៀបចំស្ទូឌីយោ CV របស់អ្នក..." : "Loading your CV Studio..."}</p>
      </div>
    );
  }

  return (
    <div className="cv-studio-page">
      {/* 1. TOP STUDIO HEADER */}
      <header className="cv-studio-header no-print">
        <div className="cv-studio-header-inner">
          <div className="header-titles">
            <span className="studio-pill-tag">
              <FiBriefcase className="tag-icon" />
              <span>{isKm ? "ស្ទូឌីយោ CV ផ្លូវការ V7" : "Minimal CV & Portfolio Studio V7"}</span>
            </span>
            <h1>{isKm ? "ប្រវត្តិរូបសង្ខេប & Portfolio របស់ខ្ញុំ" : "My CV & Portfolio Studio"}</h1>
            <p>
              {isKm
                ? "ទាញទិន្នន័យស្វ័យប្រវត្តិចេញពី Profile របស់អ្នក។ កែសម្រួលម្តង អាចទាញយកជា PDF ឬប្រើសម្រាប់ដាក់ពាក្យកម្មសិក្សា។"
                : "Auto-compiled from your verified platform profile. Edit once, preview live, export to PDF, and apply for internships."}
            </p>
          </div>

          {/* Completion Meter */}
          <div className="cv-completion-box glass">
            <div className="completion-top-row">
              <span className="comp-label">{isKm ? "ភាពពេញលេញនៃ CV" : "CV Completion"}</span>
              <span className="comp-percent">{completionStats.score}%</span>
            </div>
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${completionStats.score}%` }}
              />
            </div>
            <span className="comp-hint">
              {completionStats.score >= 80 ? (
                <span className="ready-text">
                  <FiCheckCircle /> {isKm ? "រួចរាល់សម្រាប់ដាក់ពាក្យ!" : "Ready to apply for jobs!"}
                </span>
              ) : (
                <span>
                  {isKm
                    ? "បំពេញបន្ថែមដើម្បីទាក់ទាញក្រុមហ៊ុន"
                    : "Add education and projects to reach 100%"}
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Global Feedback Alert */}
        {statusMsg.text && (
          <div className={`studio-alert-banner ${statusMsg.type}`}>
            <FiCheckCircle /> <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Step Navigation Bar */}
        <nav className="cv-stepper-bar">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = activeStep === index;
            const isDone = index < activeStep;
            return (
              <button
                key={step.id}
                type="button"
                className={`stepper-tab-item ${isActive ? "active" : ""} ${isDone ? "done" : ""}`}
                onClick={() => setActiveStep(index)}
              >
                <span className="step-num">{isDone ? <FiCheck /> : index + 1}</span>
                <Icon className="step-ico" />
                <span className="step-text">{isKm ? step.labelKm : step.labelEn}</span>
              </button>
            );
          })}
        </nav>
      </header>

      {/* 2. MAIN STUDIO WORKSPACE */}
      <main className="cv-studio-main-grid">
        {/* LEFT / CENTER: ACTIVE STEP EDITOR (Hidden when printing preview) */}
        <div className={`cv-editor-panel glass ${activeStep === 4 ? "hidden-on-preview" : ""}`}>
          {/* STEP 0: BASIC INFORMATION */}
          {activeStep === 0 && (
            <section className="step-editor-card">
              <div className="card-header-bar">
                <h2>{isKm ? "ព័ត៌មានផ្ទាល់ខ្លួន និងទំនាក់ទំនង" : "Personal Details & Contact"}</h2>
                <p>
                  {isKm
                    ? "ព័ត៌មាននេះបង្ហាញនៅផ្នែកខាងលើនៃ CV របស់អ្នក"
                    : "This information will appear in the header of your CV."}
                </p>
              </div>

              <div className="form-two-col">
                <div className="form-group">
                  <label>{isKm ? "ឈ្មោះពេញ (Full Name)" : "Full Name"}</label>
                  <input
                    type="text"
                    value={basicInfo.fullName}
                    onChange={(e) => setBasicInfo({ ...basicInfo, fullName: e.target.value })}
                    placeholder="e.g. Sokha Chan"
                  />
                </div>

                <div className="form-group">
                  <label>{isKm ? "តួនាទី / ជំនាញ (Professional Title)" : "Headline / Title"}</label>
                  <input
                    type="text"
                    value={basicInfo.profession}
                    onChange={(e) => setBasicInfo({ ...basicInfo, profession: e.target.value })}
                    placeholder="e.g. Junior Frontend Developer"
                  />
                </div>

                <div className="form-group">
                  <label>{isKm ? "អ៊ីមែល (Email)" : "Email"}</label>
                  <input
                    type="email"
                    value={basicInfo.email}
                    disabled
                    title="Email is verified from your account"
                  />
                </div>

                <div className="form-group">
                  <label>{isKm ? "លេខទូរស័ព្ទ (Phone)" : "Phone Number"}</label>
                  <input
                    type="text"
                    value={basicInfo.phone}
                    onChange={(e) => setBasicInfo({ ...basicInfo, phone: e.target.value })}
                    placeholder="+855 12 345 678"
                  />
                </div>

                <div className="form-group">
                  <label>{isKm ? "ទីតាំង (Location)" : "Location"}</label>
                  <input
                    type="text"
                    value={basicInfo.location}
                    onChange={(e) => setBasicInfo({ ...basicInfo, location: e.target.value })}
                    placeholder="Phnom Penh, Cambodia"
                  />
                </div>

                <div className="form-group">
                  <label>{isKm ? "GitHub URL" : "GitHub URL"}</label>
                  <input
                    type="url"
                    value={basicInfo.githubUrl}
                    onChange={(e) => setBasicInfo({ ...basicInfo, githubUrl: e.target.value })}
                    placeholder="https://github.com/username"
                  />
                </div>

                <div className="form-group full-width">
                  <label>{isKm ? "LinkedIn URL" : "LinkedIn URL"}</label>
                  <input
                    type="url"
                    value={basicInfo.linkedinUrl}
                    onChange={(e) => setBasicInfo({ ...basicInfo, linkedinUrl: e.target.value })}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>

                <div className="form-group full-width">
                  <label>{isKm ? "សង្ខេបអំពីខ្លួនឯង (Professional Summary / Bio)" : "Professional Summary"}</label>
                  <textarea
                    rows={4}
                    value={basicInfo.bio}
                    onChange={(e) => setBasicInfo({ ...basicInfo, bio: e.target.value })}
                    placeholder={
                      isKm
                        ? "សរសេរ 2-3 ប្រយោគអំពីចំណាប់អារម្មណ៍ បទពិសោធន៍ និងគោលដៅការងាររបស់អ្នក..."
                        : "Passionate developer eager to contribute to real-world software projects..."
                    }
                  />
                </div>
              </div>

              <div className="step-actions-footer">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveBasicInfo}
                  disabled={saving}
                >
                  <FiSave />
                  <span>{saving ? (isKm ? "កំពុងរក្សាទុក..." : "Saving...") : isKm ? "រក្សាទុកចូល Profile" : "Save to Profile"}</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveStep(1)}
                >
                  <span>{isKm ? "បន្តទៅ ការអប់រំ" : "Next: Education"}</span>
                  <FiArrowRight />
                </button>
              </div>
            </section>
          )}

          {/* STEP 1: EDUCATION */}
          {activeStep === 1 && (
            <section className="step-editor-card">
              <div className="card-header-bar">
                <h2>{isKm ? "ប្រវត្តិការអប់រំ (Education)" : "Education History"}</h2>
                <p>{isKm ? "បញ្ជាក់សាកលវិទ្យាល័យ ឬវគ្គបណ្តុះបណ្តាលដែលអ្នកបានបញ្ចប់" : "List your university degrees, diplomas, or relevant academic studies."}</p>
              </div>

              {/* Existing Education List */}
              <div className="items-list-wrapper">
                {educationList.length === 0 ? (
                  <p className="empty-subtext">{isKm ? "មិនទាន់មានទិន្នន័យអប់រំនៅឡើយទេ។ សូមបន្ថែមខាងក្រោម។" : "No education records added yet. Add one below."}</p>
                ) : (
                  educationList.map((item) => (
                    <div key={item.id} className="item-row-card glass">
                      <div className="item-details">
                        <h4>{item.institution}</h4>
                        <p className="item-sub">
                          {item.degree} • {item.fieldOfStudy}
                        </p>
                        {item.startDate && (
                          <span className="item-dates">
                            {item.startDate?.slice(0, 7)} — {item.endDate ? item.endDate.slice(0, 7) : isKm ? "បច្ចុប្បន្ន" : "Present"}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="btn-delete-item"
                        onClick={() => handleDeleteEducation(item.id)}
                        title="Delete"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add New Education Form */}
              <form className="add-subform glass" onSubmit={handleAddEducation}>
                <h3>{isKm ? "+ បន្ថែមការអប់រំថ្មី" : "+ Add Education Record"}</h3>
                <div className="form-two-col">
                  <div className="form-group full-width">
                    <label>{isKm ? "គ្រឹះស្ថានសិក្សា / សាកលវិទ្យាល័យ *" : "Institution / University *"}</label>
                    <input
                      required
                      type="text"
                      value={newEdu.institution}
                      onChange={(e) => setNewEdu({ ...newEdu, institution: e.target.value })}
                      placeholder="e.g. Cambodia Mekong University (CMU)"
                    />
                  </div>
                  <div className="form-group">
                    <label>{isKm ? "កម្រិតសញ្ញាបត្រ" : "Degree"}</label>
                    <input
                      type="text"
                      value={newEdu.degree}
                      onChange={(e) => setNewEdu({ ...newEdu, degree: e.target.value })}
                      placeholder="e.g. Bachelor Degree"
                    />
                  </div>
                  <div className="form-group">
                    <label>{isKm ? "ជំនាញឯកទេស" : "Field of Study"}</label>
                    <input
                      type="text"
                      value={newEdu.fieldOfStudy}
                      onChange={(e) => setNewEdu({ ...newEdu, fieldOfStudy: e.target.value })}
                      placeholder="e.g. Information Technology"
                    />
                  </div>
                  <div className="form-group">
                    <label>{isKm ? "ឆ្នាំចាប់ផ្តើម" : "Start Date"}</label>
                    <input
                      type="date"
                      value={newEdu.startDate}
                      onChange={(e) => setNewEdu({ ...newEdu, startDate: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>{isKm ? "ឆ្នាំបញ្ចប់ (ទុកទទេបើកំពុងរៀន)" : "End Date (Blank if current)"}</label>
                    <input
                      type="date"
                      value={newEdu.endDate}
                      onChange={(e) => setNewEdu({ ...newEdu, endDate: e.target.value })}
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-outline" disabled={saving}>
                  <FiPlus /> <span>{isKm ? "រក្សាទុកការអប់រំ" : "Save Education"}</span>
                </button>
              </form>

              <div className="step-actions-footer">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setActiveStep(0)}
                >
                  <FiArrowLeft /> <span>{isKm ? "ថយក្រោយ" : "Back"}</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveStep(2)}
                >
                  <span>{isKm ? "បន្តទៅ ជំនាញ" : "Next: Skills"}</span>
                  <FiArrowRight />
                </button>
              </div>
            </section>
          )}

          {/* STEP 2: SKILLS */}
          {activeStep === 2 && (
            <section className="step-editor-card">
              <div className="card-header-bar">
                <h2>{isKm ? "ជំនាញបច្ចេកវិទ្យា & សមត្ថភាព (Skills)" : "Skills & Competencies"}</h2>
                <p>{isKm ? "បញ្ចូលជំនាញដែលអ្នកចេះ ដើម្បីបង្ហាញទៅកាន់ក្រុមហ៊ុន" : "Showcase the technologies and tools you are proficient in."}</p>
              </div>

              {/* Add Skill Input */}
              <form className="add-skill-form" onSubmit={handleAddSkill}>
                <input
                  type="text"
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  placeholder={isKm ? "វាយបញ្ចូលជំនាញ (ឧ. React, Docker, Python)..." : "Type a skill (e.g. React, Node.js, SQL)..."}
                />
                <button type="submit" className="btn btn-primary">
                  <FiPlus /> {isKm ? "បន្ថែម" : "Add Skill"}
                </button>
              </form>

              {/* Current Skills Pill Cloud */}
              <div className="skills-cloud-wrap">
                {skillsList.map((skill) => (
                  <span key={skill} className="skill-bubble-pill">
                    <span>{skill}</span>
                    <button
                      type="button"
                      className="skill-remove-btn"
                      onClick={() => handleRemoveSkill(skill)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="popular-skills-suggestions">
                <span className="suggestions-label">{isKm ? "សំណើពេញនិយម៖" : "Quick suggestions:"}</span>
                {["TypeScript", "PostgreSQL", "Tailwind CSS", "Figma", "Git", "Next.js", "Express", "REST API"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="suggestion-chip"
                    onClick={() => {
                      if (!skillsList.includes(s)) setSkillsList([...skillsList, s]);
                    }}
                  >
                    + {s}
                  </button>
                ))}
              </div>

              <div className="step-actions-footer">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setActiveStep(1)}
                >
                  <FiArrowLeft /> <span>{isKm ? "ថយក្រោយ" : "Back"}</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveStep(3)}
                >
                  <span>{isKm ? "បន្តទៅ គម្រោងស្នាដៃ" : "Next: Projects"}</span>
                  <FiArrowRight />
                </button>
              </div>
            </section>
          )}

          {/* STEP 3: PROJECTS & EXPERIENCE */}
          {activeStep === 3 && (
            <section className="step-editor-card">
              <div className="card-header-bar">
                <h2>{isKm ? "គម្រោងស្នាដៃ (Portfolio Projects)" : "Projects & Hands-on Work"}</h2>
                <p>{isKm ? "គម្រោងអនុវត្តផ្ទាល់ជួយឱ្យ Student ទទួលបានការងារលឿនបំផុត" : "Projects validate your practical skills to tech recruiters."}</p>
              </div>

              {/* Projects List */}
              <div className="items-list-wrapper">
                {projectsList.length === 0 ? (
                  <p className="empty-subtext">{isKm ? "មិនទាន់មានគម្រោងនៅឡើយទេ។ សូមបន្ថែមខាងក្រោម។" : "No projects added yet."}</p>
                ) : (
                  projectsList.map((item) => (
                    <div key={item.id} className="item-row-card glass">
                      <div className="item-details">
                        <h4>{item.title}</h4>
                        <p className="item-sub">{item.description}</p>
                        {Array.isArray(item.technologies) && (
                          <div className="proj-tech-tags">
                            {item.technologies.map((t, idx) => (
                              <span key={idx} className="tech-mini-pill">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="proj-links-row">
                          {item.projectUrl && (
                            <a href={item.projectUrl} target="_blank" rel="noreferrer">
                              <FiGlobe /> {isKm ? "តំណផ្ទាល់ (Live)" : "Live Demo"}
                            </a>
                          )}
                          {item.githubUrl && (
                            <a href={item.githubUrl} target="_blank" rel="noreferrer">
                              <FiGithub /> GitHub
                            </a>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn-delete-item"
                        onClick={() => handleDeleteProject(item.id)}
                        title="Delete"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add New Project Form */}
              <form className="add-subform glass" onSubmit={handleAddProject}>
                <h3>{isKm ? "+ បន្ថែមគម្រោងថ្មី" : "+ Add Portfolio Project"}</h3>
                <div className="form-two-col">
                  <div className="form-group full-width">
                    <label>{isKm ? "ឈ្មោះគម្រោង *" : "Project Title *"}</label>
                    <input
                      required
                      type="text"
                      value={newProj.title}
                      onChange={(e) => setNewProj({ ...newProj, title: e.target.value })}
                      placeholder="e.g. Smart Community E-Learning Platform"
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>{isKm ? "ការពិពណ៌នាខ្លី" : "Description"}</label>
                    <textarea
                      rows={2}
                      value={newProj.description}
                      onChange={(e) => setNewProj({ ...newProj, description: e.target.value })}
                      placeholder="Built a full-stack platform with React, Node.js, and MySQL..."
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>{isKm ? "បច្ចេកវិទ្យាប្រើប្រាស់ (បំបែកដោយក្បៀស ,)" : "Technologies (comma-separated)"}</label>
                    <input
                      type="text"
                      value={newProj.technologies}
                      onChange={(e) => setNewProj({ ...newProj, technologies: e.target.value })}
                      placeholder="React, Node.js, Express, MySQL"
                    />
                  </div>
                  <div className="form-group">
                    <label>Live URL</label>
                    <input
                      type="url"
                      value={newProj.projectUrl}
                      onChange={(e) => setNewProj({ ...newProj, projectUrl: e.target.value })}
                      placeholder="https://my-app.vercel.app"
                    />
                  </div>
                  <div className="form-group">
                    <label>GitHub Repository URL</label>
                    <input
                      type="url"
                      value={newProj.githubUrl}
                      onChange={(e) => setNewProj({ ...newProj, githubUrl: e.target.value })}
                      placeholder="https://github.com/user/project"
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-outline" disabled={saving}>
                  <FiPlus /> <span>{isKm ? "រក្សាទុកគម្រោង" : "Save Project"}</span>
                </button>
              </form>

              <div className="step-actions-footer">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setActiveStep(2)}
                >
                  <FiArrowLeft /> <span>{isKm ? "ថយក្រោយ" : "Back"}</span>
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setActiveStep(4)}
                >
                  <span>{isKm ? "មើលគំរូ CV & ទាញយក PDF" : "View Live CV & Export"}</span>
                  <FiArrowRight />
                </button>
              </div>
            </section>
          )}
        </div>

        {/* RIGHT / FULL-WIDTH: REAL-TIME PRINTABLE CV SHEET */}
        <div className={`cv-preview-sheet-wrapper ${activeStep === 4 ? "full-preview-mode" : ""}`}>
          {/* STEP 4: PREVIEW & EXPORT ACTIONS (Visible in Full Preview Mode) */}
          {activeStep === 4 && (
            <div className="preview-control-banner no-print glass">
              <div className="preview-banner-text">
                <h3>{isKm ? "គំរូ CV ផ្លូវការរបស់អ្នក" : "Your Official Recruiter-Ready CV"}</h3>
                <p>
                  {isKm
                    ? "ចុចប៊ូតុងខាងក្រោមដើម្បីទាញយកជា PDF ឬដាក់ពាក្យទៅកាន់ឱកាសការងារភ្លាមៗ។"
                    : "Ready to download as a clean PDF or apply directly to verified internships."}
                </p>
              </div>
              <div className="preview-banner-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handlePrintPdf}
                >
                  <FiPrinter />
                  <span>{isKm ? "បោះពុម្ព ឬ Save ជា PDF" : "Print / Save PDF"}</span>
                </button>
                <Link to="/jobs" className="btn btn-success">
                  <FiBriefcase />
                  <span>{isKm ? "ដាក់ពាក្យការងារ (Apply Jobs)" : "Apply for Internships"}</span>
                  <FiArrowRight />
                </Link>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setActiveStep(0)}
                >
                  <span>{isKm ? "កែសម្រួលព័ត៌មាន" : "Edit Info"}</span>
                </button>
              </div>
            </div>
          )}

          <div className="cv-printable-document" id="printable-cv">
            {/* CV Header */}
            <header className="cv-doc-header">
              <div className="header-primary">
                <h1 className="cv-applicant-name">
                  {basicInfo.fullName || authUser?.fullName || "Your Full Name"}
                </h1>
                <p className="cv-applicant-title">
                  {basicInfo.profession || "Software Engineering Student"}
                </p>
              </div>

              <div className="cv-contact-strip">
                {basicInfo.email && (
                  <span className="contact-item">
                    <FiMail /> {basicInfo.email}
                  </span>
                )}
                {basicInfo.phone && (
                  <span className="contact-item">
                    <FiPhone /> {basicInfo.phone}
                  </span>
                )}
                {basicInfo.location && (
                  <span className="contact-item">
                    <FiMapPin /> {basicInfo.location}
                  </span>
                )}
                {basicInfo.githubUrl && (
                  <span className="contact-item">
                    <FiGithub /> {basicInfo.githubUrl.replace(/^https?:\/\//, "")}
                  </span>
                )}
                {basicInfo.linkedinUrl && (
                  <span className="contact-item">
                    <FiLinkedin /> {basicInfo.linkedinUrl.replace(/^https?:\/\//, "")}
                  </span>
                )}
              </div>
            </header>

            {/* Professional Summary */}
            {basicInfo.bio && (
              <section className="cv-doc-section">
                <h3 className="section-heading">{isKm ? "សេចក្តីសង្ខេបអាជីព (Professional Summary)" : "Professional Summary"}</h3>
                <p className="cv-body-text">{basicInfo.bio}</p>
              </section>
            )}

            {/* Core Skills */}
            {skillsList.length > 0 && (
              <section className="cv-doc-section">
                <h3 className="section-heading">{isKm ? "ជំនាញបច្ចេកវិទ្យា (Technical Skills)" : "Technical Skills"}</h3>
                <div className="cv-skills-grid">
                  {skillsList.map((skill, i) => (
                    <span key={i} className="cv-doc-skill-pill">
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Projects */}
            {projectsList.length > 0 && (
              <section className="cv-doc-section">
                <h3 className="section-heading">{isKm ? "គម្រោងស្នាដៃ (Portfolio Projects)" : "Featured Projects"}</h3>
                <div className="cv-timeline">
                  {projectsList.map((proj) => (
                    <div key={proj.id} className="cv-entry">
                      <div className="entry-header">
                        <strong className="entry-title">{proj.title}</strong>
                        {proj.projectUrl && (
                          <span className="entry-link">{proj.projectUrl.replace(/^https?:\/\//, "")}</span>
                        )}
                      </div>
                      <p className="entry-desc">{proj.description}</p>
                      {Array.isArray(proj.technologies) && proj.technologies.length > 0 && (
                        <p className="entry-tech-line">
                          <em>Stack: </em> {proj.technologies.join(", ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Education */}
            {educationList.length > 0 && (
              <section className="cv-doc-section">
                <h3 className="section-heading">{isKm ? "ការអប់រំ (Education)" : "Education"}</h3>
                <div className="cv-timeline">
                  {educationList.map((edu) => (
                    <div key={edu.id} className="cv-entry">
                      <div className="entry-header">
                        <strong className="entry-title">{edu.institution}</strong>
                        <span className="entry-dates">
                          {edu.startDate?.slice(0, 4) || ""} — {edu.endDate?.slice(0, 4) || (isKm ? "បច្ចុប្បន្ន" : "Present")}
                        </span>
                      </div>
                      <p className="entry-sub">
                        {edu.degree} in {edu.fieldOfStudy}
                      </p>
                      {edu.description && <p className="entry-desc">{edu.description}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Experience */}
            {experiencesList.length > 0 && (
              <section className="cv-doc-section">
                <h3 className="section-heading">{isKm ? "បទពិសោធន៍ការងារ (Experience)" : "Experience"}</h3>
                <div className="cv-timeline">
                  {experiencesList.map((exp) => (
                    <div key={exp.id} className="cv-entry">
                      <div className="entry-header">
                        <strong className="entry-title">{exp.title} — {exp.company}</strong>
                        <span className="entry-dates">
                          {exp.startDate?.slice(0, 7) || ""} — {exp.isCurrent ? (isKm ? "បច្ចុប្បន្ន" : "Present") : exp.endDate?.slice(0, 7)}
                        </span>
                      </div>
                      <p className="entry-desc">{exp.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Platform Credential Footer */}
            <footer className="cv-doc-footer">
              <span className="platform-verified-seal">
                ✓ Verified by Smart Community Skill &amp; Career Development Platform • Cambodia Mekong University (CMU)
              </span>
            </footer>
          </div>
        </div>
      </main>
    </div>
  );
}
