import { useState } from "react";
import { Link } from "react-router-dom";
import {
  IoCameraOutline,
  IoLogoGithub,
  IoLogoLinkedin,
  IoDocumentTextOutline,
  IoCreateOutline,
  IoBriefcaseOutline,
  IoSchoolOutline,
  IoCalendarOutline,
  IoRibbonOutline,
  IoCodeSlashOutline,
  IoLocationOutline,
} from "react-icons/io5";
import UserAvatar from "../../components/ui/UserAvatar";
import ResumePreviewModal from "./ResumePreviewModal";
import { useLanguage } from "../../context/LanguageContext";

const formatDate = (value) => {
  if (!value) return "Present";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
  }).format(date);
};

export default function StudentProfileView({
  user,
  profileData,
  onAvatarUpload,
  onBeginEdit,
  renderRecordSection,
  educationFields,
  experienceFields,
  certificateFields,
  projectFields,
  onRecordChanged,
  onUploadProjectBeforeSave,
}) {
  const { language } = useLanguage();
  const isKm = language === "km";
  const [resumeOpen, setResumeOpen] = useState(false);

  const skillData = user.skills || {};
  const skillsToTeach = skillData.teach || [];
  const skillsToLearn = skillData.learn || [];
  const interestedSkills = user.interestedSkills || [];

  const education = profileData?.education || [];
  const experiences = profileData?.experiences || [];
  const projects = profileData?.projects || [];
  const certificates = profileData?.certificates || [];

  const displayProfession = isKm
    ? user.profession === "Frontend Learning Partner"
      ? "ដៃគូសិក្សាផ្នែក Frontend (Frontend Learning Partner)"
      : user.profession || "និស្សិតកំពុងអភិវឌ្ឍន៍ជំនាញ"
    : user.profession || "Aspiring Software Engineer & Student";

  const displayLocation = isKm
    ? user.location === "Online"
      ? "តាមប្រព័ន្ធអនឡាញ"
      : user.location === "Phnom Penh, Cambodia"
        ? "ភ្នំពេញ, កម្ពុជា"
        : user.location
    : user.location;

  const displayLevel = isKm
    ? (skillData.experienceLevel || "Beginner") === "Beginner"
      ? "កម្រិតដំបូង (Beginner)"
      : skillData.experienceLevel
    : `${skillData.experienceLevel || "Beginner"} level`;

  const displayBio = isKm
    ? user.bio === "A friendly community member focused on building practical web projects and sharing frontend basics."
      ? "សមាជិកសហគមន៍ដែលផ្តោតលើការបង្កើតគម្រោងគេហទំព័រជាក់ស្តែង និងការចែករំលែកចំណេះដឹងមូលដ្ឋានផ្នែក Frontend ជាមួយមិត្តរួមថ្នាក់។"
      : user.bio
    : user.bio;

  return (
    <div className="student-profile-view">
      {/* 1. Student Hero */}
      <section className="profile-hero">
        <div className="container profile-hero-inner">
          <div className="profile-identity">
            <div className="profile-avatar-wrap">
              <UserAvatar user={user} className="profile-large-avatar" size={96} />
              <label
                className="profile-avatar-upload"
                title={isKm ? "ប្តូររូបថត Profile" : "Upload profile picture"}
              >
                <IoCameraOutline />
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={onAvatarUpload}
                />
              </label>
            </div>
            <div>
              <span className="profile-role-tag student">
                <IoSchoolOutline /> {isKm ? "គណនីសិស្ស / និស្សិត" : "Student / Learner"}
              </span>
              <h1>{user.fullName}</h1>
              <p className="profile-headline">
                {displayProfession}
              </p>
              {displayLocation && (
                <small className="profile-location" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                  <IoLocationOutline /> {displayLocation}
                </small>
              )}

              <div className="profile-social-links">
                {user.githubUrl && (
                  <a href={user.githubUrl} target="_blank" rel="noreferrer">
                    <IoLogoGithub /> GitHub
                  </a>
                )}
                {user.linkedinUrl && (
                  <a href={user.linkedinUrl} target="_blank" rel="noreferrer">
                    <IoLogoLinkedin /> LinkedIn
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="profile-hero-buttons">
            <Link
              to="/cv-studio"
              className="btn primary profile-cv-btn"
            >
              <IoDocumentTextOutline />
              <span>{isKm ? "បង្កើត & ទាញយក PDF CV ឥតគិតថ្លៃ" : "Free CV Builder & PDF"}</span>
            </Link>
            <button
              type="button"
              className="btn outline"
              onClick={onBeginEdit}
            >
              <IoCreateOutline />
              <span>{isKm ? "កែសម្រួល Profile" : "Edit Profile"}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Quick Post-Login Navigation Bar */}
      <div className="container" style={{ marginTop: "-14px", marginBottom: "18px" }}>
        <div
          className="glass"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            padding: "14px 20px",
            borderRadius: "16px",
            border: "1px solid rgba(37, 99, 235, 0.18)",
            background: "rgba(255, 255, 255, 0.9)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "#2563eb" }}>
              {isKm ? "⚡ មុខងាររហ័ស៖" : "⚡ Quick Actions:"}
            </span>
            <Link to="/cv-studio" className="btn outline" style={{ padding: "6px 14px", fontSize: "0.84rem" }}>
              📄 {isKm ? "ជ្រើសរើសគំរូ CV & ទាញយក PDF (ឥតគិតថ្លៃ)" : "Choose CV Templates & Download PDF (Free)"}
            </Link>
            <Link to="/skill-exchange" className="btn outline" style={{ padding: "6px 14px", fontSize: "0.84rem" }}>
              🔄 {isKm ? "ផ្លាស់ប្តូរជំនាញ (Skill Swap)" : "Peer Skill Exchange"}
            </Link>
            <Link to="/my-applications" className="btn outline" style={{ padding: "6px 14px", fontSize: "0.84rem" }}>
              💼 {isKm ? "តាមដានពាក្យសុំការងារ" : "My Job Applications"}
            </Link>
            <Link to="/forum" className="btn outline" style={{ padding: "6px 14px", fontSize: "0.84rem" }}>
              💬 {isKm ? "បណ្តាញសង្គមសហគមន៍" : "Community Social Feed"}
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Overview & Skills Row */}
      <div className="container profile-content">
        <div className="profile-overview-grid">
          {/* Career Overview */}
          <section className="profile-panel glass">
            <h2>{isKm ? "ព័ត៌មានទូទៅ និងគោលដៅ" : "Career Overview & Goals"}</h2>
            <div className="profile-info-list">
              <span>
                <IoBriefcaseOutline /> {displayProfession}
              </span>
              <span>
                <IoSchoolOutline /> {displayLevel}
              </span>
              <span>
                <IoCalendarOutline /> {isKm ? "ចូលរួមតាំងពី" : "Joined"} {formatDate(user.createdAt)}
              </span>
            </div>
            {user.careerGoal && (
              <div className="profile-career-goal-box">
                <small>{isKm ? "គោលដៅអាជីព (Career Goal):" : "Career Goal:"}</small>
                <p>{user.careerGoal}</p>
              </div>
            )}
            {displayBio && (
              <p className="profile-bio-text">{displayBio}</p>
            )}
          </section>

          {/* Skills Breakdown */}
          <section className="profile-panel glass">
            <h2>{isKm ? "ជំនាញដោះដូរ និងចំណាប់អារម្មណ៍" : "Skills & Interests"}</h2>
            <div className="profile-skill-group">
              <strong className="teach-label">
                <IoSchoolOutline /> {isKm ? "ជំនាញអាចបង្រៀន (Teach)" : "Skills I Can Teach"}
              </strong>
              <div className="profile-skill-wrap">
                {skillsToTeach.length > 0 ? (
                  skillsToTeach.map((skill) => (
                    <span className="profile-skill teach" key={skill}>
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="profile-skill-empty">{isKm ? "មិនទាន់បានបន្ថែម" : "None added"}</span>
                )}
              </div>
            </div>

            <div className="profile-skill-group">
              <strong className="learn-label">
                <IoSchoolOutline /> {isKm ? "ជំនាញចង់រៀន (Learn)" : "Skills I Want to Learn"}
              </strong>
              <div className="profile-skill-wrap">
                {skillsToLearn.length > 0 ? (
                  skillsToLearn.map((skill) => (
                    <span className="profile-skill learn" key={skill}>
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="profile-skill-empty">{isKm ? "មិនទាន់បានបន្ថែម" : "None added"}</span>
                )}
              </div>
            </div>

            {interestedSkills.length > 0 && (
              <div className="profile-skill-group">
                <strong>{isKm ? "ជំនាញចាប់អារម្មណ៍" : "Interested Fields"}</strong>
                <div className="profile-skill-wrap">
                  {interestedSkills.map((skill) => (
                    <span className="profile-skill interested" key={skill}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* 3. Portfolio Projects */}
        {renderRecordSection({
          title: isKm ? "គម្រោងសំខាន់ៗ (Portfolio Projects)" : "Portfolio Projects",
          icon: <IoCodeSlashOutline />,
          resource: "projects",
          fields: projectFields,
          items: projects,
          emptyText: isKm ? "មិនទាន់មានគម្រោងត្រូវបានបន្ថែមនៅឡើយទេ។" : "No projects published yet.",
          onChanged: onRecordChanged,
          beforeSubmit: onUploadProjectBeforeSave,
          renderItem: (item) => (
            <div className="project-record-card">
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="project-record-thumb"
                />
              )}
              <div className="project-record-details">
                <h3>{item.title}</h3>
                {item.technologies && (
                  <div className="project-tech-tags">
                    {(Array.isArray(item.technologies)
                      ? item.technologies
                      : String(item.technologies).split(",")
                    ).map((t) => (
                      <span key={t} className="tech-badge">
                        {String(t).trim()}
                      </span>
                    ))}
                  </div>
                )}
                {item.description && <p>{item.description}</p>}
                <div className="project-links-row">
                  {item.projectUrl && (
                    <a href={item.projectUrl} target="_blank" rel="noreferrer">
                      🔗 Live Demo
                    </a>
                  )}
                  {item.githubUrl && (
                    <a href={item.githubUrl} target="_blank" rel="noreferrer">
                      <IoLogoGithub /> GitHub Repo
                    </a>
                  )}
                </div>
              </div>
            </div>
          ),
        })}

        {/* 4. Practical Work Experience */}
        {renderRecordSection({
          title: isKm ? "បទពិសោធន៍ការងារ ឬកម្មសិក្សា (Experience)" : "Work Experience & Internships",
          icon: <IoBriefcaseOutline />,
          resource: "experiences",
          fields: experienceFields,
          items: experiences,
          emptyText: isKm ? "មិនទាន់មានបទពិសោធន៍ការងារនៅឡើយទេ។" : "No experience entries added yet.",
          onChanged: onRecordChanged,
          renderItem: (item) => (
            <div>
              <h3>{item.title}</h3>
              <p className="record-subtitle">
                <strong>{item.company}</strong> {item.employmentType && `· ${item.employmentType}`}
              </p>
              <small className="record-dates">
                {formatDate(item.startDate)} — {item.isCurrent ? "Present" : formatDate(item.endDate)}
              </small>
              {item.description && <p className="record-desc">{item.description}</p>}
            </div>
          ),
        })}

        {/* 5. Education */}
        {renderRecordSection({
          title: isKm ? "ប្រវត្តិការសិក្សា (Education)" : "Education",
          icon: <IoSchoolOutline />,
          resource: "education",
          fields: educationFields,
          items: education,
          emptyText: isKm ? "មិនទាន់មានប្រវត្តិសិក្សានៅឡើយទេ។" : "No education records added yet.",
          onChanged: onRecordChanged,
          renderItem: (item) => (
            <div>
              <h3>{item.institution}</h3>
              <p className="record-subtitle">
                {[item.degree, item.fieldOfStudy].filter(Boolean).join(" in ")}
              </p>
              <small className="record-dates">
                {formatDate(item.startDate)} — {formatDate(item.endDate)}
              </small>
              {item.description && <p className="record-desc">{item.description}</p>}
            </div>
          ),
        })}

        {/* 6. Certifications */}
        {renderRecordSection({
          title: isKm ? "វិញ្ញាបនបត្រ (Certificates)" : "Certificates & Credentials",
          icon: <IoRibbonOutline />,
          resource: "certificates",
          fields: certificateFields,
          items: certificates,
          emptyText: isKm ? "មិនទាន់មានវិញ្ញាបនបត្រនៅឡើយទេ។" : "No certificates recorded yet.",
          onChanged: onRecordChanged,
          renderItem: (item) => (
            <div>
              <h3>{item.name}</h3>
              <p className="record-subtitle">
                {item.issuer} {item.issueDate && `· ${formatDate(item.issueDate)}`}
              </p>
              {item.credentialUrl && (
                <a href={item.credentialUrl} target="_blank" rel="noreferrer" className="record-link">
                  View Credential ↗
                </a>
              )}
            </div>
          ),
        })}
      </div>

      {/* 7. Resume Preview Modal */}
      <ResumePreviewModal
        isOpen={resumeOpen}
        onClose={() => setResumeOpen(false)}
        user={user}
        education={education}
        experiences={experiences}
        projects={projects}
        certificates={certificates}
      />
    </div>
  );
}
