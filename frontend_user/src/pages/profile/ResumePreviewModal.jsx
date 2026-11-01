import { useRef } from "react";
import {
  IoCloseOutline,
  IoPrintOutline,
  IoMailOutline,
  IoCallOutline,
  IoLocationOutline,
  IoLogoGithub,
  IoLogoLinkedin,
  IoGlobeOutline,
  IoSchoolOutline,
  IoBriefcaseOutline,
  IoCodeSlashOutline,
  IoRibbonOutline,
} from "react-icons/io5";
import { useLanguage } from "../../context/LanguageContext";
import "./ResumePreviewModal.css";

const formatDate = (value) => {
  if (!value) return "Present";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
  }).format(date);
};

export default function ResumePreviewModal({
  isOpen,
  onClose,
  user,
  education = [],
  experiences = [],
  projects = [],
  certificates = [],
}) {
  const { language } = useLanguage();
  const isKm = language === "km";
  const printAreaRef = useRef(null);

  if (!isOpen || !user) return null;

  const skillsData = user.skills || {};
  const teachSkills = skillsData.teach || [];
  const learnSkills = skillsData.learn || [];
  const candidateSkills = skillsData.candidate || [];
  const allSkills = [...new Set([...teachSkills, ...candidateSkills, ...learnSkills])];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="resume-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="resume-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Toolbar (Non-printable) */}
        <div className="resume-toolbar no-print">
          <div className="resume-toolbar-info">
            <h2>{isKm ? "គំរូប្រវត្តិរូបសង្ខេប (Interactive CV / Resume)" : "Professional Resume Preview"}</h2>
            <p>{isKm ? "ទិន្នន័យត្រូវបានទាញចេញពី Profile របស់អ្នកដោយស្វ័យប្រវត្តិ" : "Auto-compiled from your verified profile and projects"}</p>
          </div>
          <div className="resume-toolbar-actions">
            <button
              type="button"
              className="btn primary small"
              onClick={handlePrint}
            >
              <IoPrintOutline />
              <span>{isKm ? "បោះពុម្ព ឬទាញយក PDF" : "Print / Save PDF"}</span>
            </button>
            <button
              type="button"
              className="resume-close-btn"
              onClick={onClose}
              aria-label="Close"
            >
              <IoCloseOutline />
            </button>
          </div>
        </div>

        {/* Printable Resume Sheet */}
        <div className="resume-sheet" ref={printAreaRef} id="printable-resume">
          {/* Header */}
          <header className="resume-header">
            <h1 className="resume-name">{user.fullName}</h1>
            <p className="resume-title">{user.profession || (isKm ? "និស្សិត / អ្នកអភិវឌ្ឍន៍ជំនាញ" : "Junior Developer & Student")}</p>

            <div className="resume-contacts">
              {user.email && (
                <span>
                  <IoMailOutline /> {user.email}
                </span>
              )}
              {user.phone && (
                <span>
                  <IoCallOutline /> {user.phone}
                </span>
              )}
              {user.location && (
                <span>
                  <IoLocationOutline /> {user.location}
                </span>
              )}
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
          </header>

          {/* Professional Summary */}
          {(user.bio || user.careerGoal) && (
            <section className="resume-section">
              <h2 className="resume-section-title">
                {isKm ? "សេចក្តីសង្ខេបវិជ្ជាជីវៈ (Professional Summary)" : "Professional Summary"}
              </h2>
              <p className="resume-summary-text">
                {user.bio || user.careerGoal}
              </p>
            </section>
          )}

          {/* Skills Grid */}
          {allSkills.length > 0 && (
            <section className="resume-section">
              <h2 className="resume-section-title">
                <IoCodeSlashOutline className="no-print" />
                {isKm ? "ជំនាញបច្ចេកវិទ្យា (Core Skills)" : "Technical & Core Skills"}
              </h2>
              <div className="resume-skills-list">
                {allSkills.map((skill) => (
                  <span key={skill} className="resume-skill-tag">
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Projects */}
          {projects.length > 0 && (
            <section className="resume-section">
              <h2 className="resume-section-title">
                <IoBriefcaseOutline className="no-print" />
                {isKm ? "គម្រោងសំខាន់ៗ (Featured Projects)" : "Featured Projects"}
              </h2>
              <div className="resume-items-list">
                {projects.map((proj) => (
                  <article key={proj.id} className="resume-item">
                    <div className="resume-item-top">
                      <h3 className="resume-item-heading">{proj.title}</h3>
                      <div className="resume-links">
                        {proj.projectUrl && (
                          <a href={proj.projectUrl} target="_blank" rel="noreferrer">
                            <IoGlobeOutline /> Live Demo
                          </a>
                        )}
                        {proj.githubUrl && (
                          <a href={proj.githubUrl} target="_blank" rel="noreferrer">
                            <IoLogoGithub /> Code
                          </a>
                        )}
                      </div>
                    </div>
                    {proj.technologies && (
                      <p className="resume-techs">
                        <strong>Technologies:</strong>{" "}
                        {Array.isArray(proj.technologies)
                          ? proj.technologies.join(", ")
                          : proj.technologies}
                      </p>
                    )}
                    {proj.description && (
                      <p className="resume-item-desc">{proj.description}</p>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Work / Practical Experience */}
          {experiences.length > 0 && (
            <section className="resume-section">
              <h2 className="resume-section-title">
                <IoBriefcaseOutline className="no-print" />
                {isKm ? "បទពិសោធន៍ការងារ (Experience)" : "Experience"}
              </h2>
              <div className="resume-items-list">
                {experiences.map((exp) => (
                  <article key={exp.id} className="resume-item">
                    <div className="resume-item-top">
                      <div>
                        <h3 className="resume-item-heading">{exp.title}</h3>
                        <p className="resume-item-sub">
                          {exp.company} {exp.employmentType && `· ${exp.employmentType}`}
                        </p>
                      </div>
                      <span className="resume-date">
                        {formatDate(exp.startDate)} — {exp.isCurrent ? "Present" : formatDate(exp.endDate)}
                      </span>
                    </div>
                    {exp.description && (
                      <p className="resume-item-desc">{exp.description}</p>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Education */}
          {education.length > 0 && (
            <section className="resume-section">
              <h2 className="resume-section-title">
                <IoSchoolOutline className="no-print" />
                {isKm ? "ការអប់រំ (Education)" : "Education"}
              </h2>
              <div className="resume-items-list">
                {education.map((edu) => (
                  <article key={edu.id} className="resume-item">
                    <div className="resume-item-top">
                      <div>
                        <h3 className="resume-item-heading">{edu.institution}</h3>
                        <p className="resume-item-sub">
                          {[edu.degree, edu.fieldOfStudy].filter(Boolean).join(" in ")}
                        </p>
                      </div>
                      <span className="resume-date">
                        {formatDate(edu.startDate)} — {formatDate(edu.endDate)}
                      </span>
                    </div>
                    {edu.description && (
                      <p className="resume-item-desc">{edu.description}</p>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Certificates */}
          {certificates.length > 0 && (
            <section className="resume-section">
              <h2 className="resume-section-title">
                <IoRibbonOutline className="no-print" />
                {isKm ? "វិញ្ញាបនបត្រ (Certifications)" : "Certifications"}
              </h2>
              <div className="resume-cert-grid">
                {certificates.map((cert) => (
                  <div key={cert.id} className="resume-cert-item">
                    <strong>{cert.name}</strong>
                    <span>{cert.issuer} {cert.issueDate && `· ${formatDate(cert.issueDate)}`}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Footer */}
          <footer className="resume-footer">
            <small>
              Generated by Smart Community Skill & Career Development Platform · {new Date().toLocaleDateString()}
            </small>
          </footer>
        </div>
      </div>
    </div>
  );
}
