import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  IoAddOutline,
  IoBriefcaseOutline,
  IoCalendarOutline,
  IoCameraOutline,
  IoCreateOutline,
  IoLogoGithub,
  IoLogoLinkedin,
  IoRibbonOutline,
  IoSchoolOutline,
  IoTrashOutline,
} from "react-icons/io5";
import { useGlobleContext } from "../../context/GlobleContext";
import {
  createProfileItemRequest,
  deleteProfileItemRequest,
  fetchProfileRequest,
  updateProfileItemRequest,
  uploadAvatarRequest,
  uploadProjectImageRequest,
} from "../../services/profileService";
import "./Profile.css";

const splitList = (value = "") =>
  String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, values) => values.indexOf(item) === index);

const formatDate = (value) => {
  if (!value) return "Present";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

const educationFields = [
  { name: "institution", label: "School or institution", required: true },
  { name: "degree", label: "Degree" },
  { name: "fieldOfStudy", label: "Field of study" },
  { name: "startDate", label: "Start date", type: "date" },
  { name: "endDate", label: "End date", type: "date" },
  { name: "description", label: "Description", type: "textarea" },
];

const experienceFields = [
  { name: "title", label: "Job title", required: true },
  { name: "company", label: "Company", required: true },
  { name: "employmentType", label: "Employment type" },
  { name: "startDate", label: "Start date", type: "date" },
  { name: "endDate", label: "End date", type: "date" },
  { name: "isCurrent", label: "I currently work here", type: "checkbox" },
  { name: "description", label: "Description", type: "textarea" },
];

const certificateFields = [
  { name: "name", label: "Certificate name", required: true },
  { name: "issuer", label: "Issuer" },
  { name: "issueDate", label: "Issue date", type: "date" },
  { name: "credentialUrl", label: "Credential URL", type: "url" },
  { name: "certificateUrl", label: "Certificate file URL", type: "url" },
];

const projectFields = [
  { name: "title", label: "Project title", required: true },
  { name: "description", label: "Description", type: "textarea" },
  { name: "technologies", label: "Technologies (comma separated)" },
  { name: "projectUrl", label: "Live project URL", type: "url" },
  { name: "githubUrl", label: "GitHub URL", type: "url" },
  {
    name: "imageFile",
    label: "Project image",
    type: "file",
    accept: "image/jpeg,image/png,image/webp",
  },
];

const emptyFormFor = (fields) =>
  Object.fromEntries(
    fields.map((field) => [field.name, field.type === "checkbox" ? false : ""]),
  );

const ProfileRecordSection = ({
  title,
  icon,
  resource,
  fields,
  items,
  emptyText,
  renderItem,
  onChanged,
  beforeSubmit,
}) => {
  const emptyForm = useMemo(() => emptyFormFor(fields), [fields]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const beginEdit = (item) => {
    setEditingId(item.id);
    setForm(
      Object.fromEntries(
        fields.map((field) => {
          let value = item[field.name];
          if (field.name === "technologies" && Array.isArray(value))
            value = value.join(", ");
          if (field.type === "date" && value)
            value = String(value).slice(0, 10);
          if (field.type === "file") value = "";
          return [
            field.name,
            value ?? (field.type === "checkbox" ? false : ""),
          ];
        }),
      ),
    );
    setShowForm(true);
    setError("");
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      let payload = Object.fromEntries(
        fields
          .filter((field) => field.type !== "file")
          .map((field) => [
            field.name,
            field.name === "technologies"
              ? splitList(form[field.name])
              : form[field.name],
          ]),
      );
      if (beforeSubmit) payload = await beforeSubmit(payload, form.imageFile);
      if (editingId) {
        await updateProfileItemRequest(resource, editingId, payload);
      } else {
        await createProfileItemRequest(resource, payload);
      }
      await onChanged();
      resetForm();
    } catch (err) {
      setError(err.message || "Unable to save this profile item.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm("Remove this profile item?")) return;
    setError("");
    try {
      await deleteProfileItemRequest(resource, itemId);
      await onChanged();
    } catch (err) {
      setError(err.message || "Unable to remove this profile item.");
    }
  };

  return (
    <section className="profile-panel profile-record-section">
      <div className="profile-section-heading">
        <h2>
          {icon}
          {title}
        </h2>
        <button
          type="button"
          className="btn outline profile-small-action"
          onClick={() => (showForm ? resetForm() : setShowForm(true))}
        >
          <IoAddOutline /> {showForm ? "Cancel" : "Add"}
        </button>
      </div>

      {error && <div className="profile-error">{error}</div>}
      {showForm && (
        <form className="profile-record-form" onSubmit={handleSubmit}>
          {fields.map((field) =>
            field.type === "checkbox" ? (
              <label className="profile-checkbox" key={field.name}>
                <input
                  type="checkbox"
                  checked={Boolean(form[field.name])}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      [field.name]: event.target.checked,
                    }))
                  }
                />
                {field.label}
              </label>
            ) : (
              <label key={field.name}>
                {field.label}
                {field.type === "textarea" ? (
                  <textarea
                    value={form[field.name] || ""}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        [field.name]: event.target.value,
                      }))
                    }
                  />
                ) : (
                  <input
                    type={field.type || "text"}
                    value={
                      field.type === "file" ? undefined : form[field.name] || ""
                    }
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        [field.name]:
                          field.type === "file"
                            ? event.target.files?.[0]
                            : event.target.value,
                      }))
                    }
                    accept={field.accept}
                    required={field.required && !editingId}
                  />
                )}
              </label>
            ),
          )}
          <button className="btn primary" disabled={busy}>
            {busy ? "Saving..." : editingId ? "Update" : "Add to profile"}
          </button>
        </form>
      )}

      <div className="profile-record-list">
        {items.length ? (
          items.map((item) => (
            <article className="profile-record" key={item.id}>
              <div className="profile-record-content">{renderItem(item)}</div>
              <div className="profile-record-actions">
                <button
                  type="button"
                  title="Edit"
                  onClick={() => beginEdit(item)}
                >
                  <IoCreateOutline />
                </button>
                <button
                  type="button"
                  title="Delete"
                  onClick={() => handleDelete(item.id)}
                >
                  <IoTrashOutline />
                </button>
              </div>
            </article>
          ))
        ) : (
          <p className="profile-muted">{emptyText}</p>
        )}
      </div>
    </section>
  );
};

const Profile = () => {
  const { user, updateUser, refreshUser } = useGlobleContext();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      Promise.resolve().then(() => setLoading(false));
      return undefined;
    }
    let active = true;
    fetchProfileRequest()
      .then((data) => {
        if (active) setProfile(data);
      })
      .catch((err) => {
        if (active) setError(err.message || "Unable to load your profile.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  const reloadProfile = async () => {
    const data = await fetchProfileRequest();
    setProfile(data);
    return data;
  };

  if (loading)
    return (
      <main className="profile-page profile-loading">Loading profile...</main>
    );
  if (!user) {
    return (
      <main className="profile-page">
        <section className="profile-empty container">
          <h1>Create an account to build your professional profile.</h1>
          <Link className="btn primary" to="/register">
            Create account
          </Link>
        </section>
      </main>
    );
  }

  const profileUser = profile?.user || user;
  const skillData = profileUser.skills || {};
  const skillsToTeach = skillData.teach || [];
  const skillsToLearn = skillData.learn || [];

  const beginEdit = () => {
    setForm({
      fullName: profileUser.fullName || "",
      bio: profileUser.bio || "",
      location: profileUser.location || "",
      jobTitle: profileUser.profession || "",
      recruiterCompany: profileUser.company || "",
      githubUrl: profileUser.githubUrl || "",
      linkedinUrl: profileUser.linkedinUrl || "",
      careerGoal: profileUser.careerGoal || "",
      availability: skillData.availability || "Flexible schedule",
      experienceLevel: skillData.experienceLevel || "beginner",
      skillsToTeach: skillsToTeach.join(", "),
      skillsToLearn: skillsToLearn.join(", "),
      candidateSkills: (skillData.candidate || []).join(", "),
      interestedSkills: (profileUser.interestedSkills || []).join(", "),
    });
    setEditing(true);
    setMessage("");
    setError("");
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await updateUser({
        ...form,
        skillsToTeach: splitList(form.skillsToTeach),
        skillsToLearn: splitList(form.skillsToLearn),
        candidateSkills: splitList(form.candidateSkills),
        interestedSkills: splitList(form.interestedSkills),
      });
      await reloadProfile();
      setEditing(false);
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err.message || "Unable to update your profile.");
    } finally {
      setBusy(false);
    }
  };

  const handleAvatar = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const result = await uploadAvatarRequest(file);
      await refreshUser();
      await reloadProfile();
      setMessage(`Profile picture uploaded using ${result.provider}.`);
    } catch (err) {
      setError(err.message || "Unable to upload your profile picture.");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  };

  const uploadProjectBeforeSave = async (payload, imageFile) => {
    if (!imageFile) return payload;
    const result = await uploadProjectImageRequest(imageFile);
    return { ...payload, imageUrl: result.imageUrl };
  };

  return (
    <main className="profile-page">
      <section className="profile-hero">
        <div className="container profile-hero-inner">
          <div className="profile-identity">
            <div className="profile-avatar-wrap">
              {profileUser.avatarUrl ? (
                <img
                  className="profile-large-avatar image"
                  src={profileUser.avatarUrl}
                  alt={profileUser.fullName}
                />
              ) : (
                <span className="profile-large-avatar">
                  {getInitials(profileUser.fullName || profileUser.email)}
                </span>
              )}
              <label
                className="profile-avatar-upload"
                title="Upload profile picture"
              >
                <IoCameraOutline />
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatar}
                  disabled={busy}
                />
              </label>
            </div>
            <div>
              <p className="eyebrow">{profileUser.role}</p>
              <h1>{profileUser.fullName}</h1>
              <p>
                {profileUser.bio ||
                  profileUser.careerGoal ||
                  "Build your skills and career with the community."}
              </p>
              <div className="profile-social-links">
                {profileUser.githubUrl && (
                  <a
                    href={profileUser.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <IoLogoGithub /> GitHub
                  </a>
                )}
                {profileUser.linkedinUrl && (
                  <a
                    href={profileUser.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <IoLogoLinkedin /> LinkedIn
                  </a>
                )}
              </div>
            </div>
          </div>
          <button className="btn primary" type="button" onClick={beginEdit}>
            Edit profile
          </button>
        </div>
      </section>

      <section className="section container profile-content">
        {message && <div className="profile-success">{message}</div>}
        {error && <div className="profile-error">{error}</div>}

        {editing && (
          <section className="profile-panel profile-editor-panel">
            <div className="profile-section-heading">
              <h2>Personal and career information</h2>
            </div>
            <form
              className="profile-edit-form profile-edit-grid"
              onSubmit={handleSave}
            >
              {[
                ["fullName", "Full name"],
                ["location", "Location"],
                ["jobTitle", "Profession or job title"],
                ["recruiterCompany", "Company"],
                ["githubUrl", "GitHub URL", "url"],
                ["linkedinUrl", "LinkedIn URL", "url"],
                ["availability", "Availability"],
                ["experienceLevel", "Experience level"],
                ["skillsToTeach", "Skills I can teach"],
                ["skillsToLearn", "Skills I want to learn"],
                ["interestedSkills", "Interested skills"],
              ].map(([name, label, type]) => (
                <label key={name}>
                  {label}
                  <input
                    type={type || "text"}
                    value={form[name] || ""}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        [name]: event.target.value,
                      }))
                    }
                  />
                </label>
              ))}
              <label className="profile-wide-field">
                Bio
                <textarea
                  value={form.bio || ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      bio: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="profile-wide-field">
                Career goal
                <textarea
                  value={form.careerGoal || ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      careerGoal: event.target.value,
                    }))
                  }
                />
              </label>
              <div className="profile-form-actions profile-wide-field">
                <button
                  className="btn outline"
                  type="button"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </button>
                <button className="btn primary" disabled={busy}>
                  {busy ? "Saving..." : "Save profile"}
                </button>
              </div>
            </form>
          </section>
        )}

        <div className="profile-overview-grid">
          <section className="profile-panel">
            <h2>Career overview</h2>
            <div className="profile-info-list">
              <span>
                <IoBriefcaseOutline />{" "}
                {profileUser.profession || "Add your profession"}
              </span>
              <span>
                <IoSchoolOutline /> {skillData.experienceLevel || "Beginner"}{" "}
                level
              </span>
              <span>
                <IoCalendarOutline /> Joined {formatDate(profileUser.createdAt)}
              </span>
            </div>
            {profileUser.careerGoal && (
              <p className="profile-career-goal">{profileUser.careerGoal}</p>
            )}
          </section>
          <section className="profile-panel">
            <h2>Skills and interests</h2>
            <div className="profile-skill-group">
              <strong>Teach</strong>
              <div className="profile-skill-wrap">
                {skillsToTeach.map((skill) => (
                  <span className="profile-skill" key={skill}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <div className="profile-skill-group">
              <strong>Learn</strong>
              <div className="profile-skill-wrap">
                {skillsToLearn.map((skill) => (
                  <span className="profile-skill" key={skill}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <div className="profile-skill-group">
              <strong>Interested</strong>
              <div className="profile-skill-wrap">
                {(profileUser.interestedSkills || []).map((skill) => (
                  <span className="profile-skill interested" key={skill}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="profile-record-grid">
          <ProfileRecordSection
            title="Education"
            icon={<IoSchoolOutline />}
            resource="education"
            fields={educationFields}
            items={profile?.education || []}
            emptyText="Add your education history."
            onChanged={reloadProfile}
            renderItem={(item) => (
              <>
                <h3>{item.institution}</h3>
                <p>
                  {[item.degree, item.fieldOfStudy].filter(Boolean).join(" · ")}
                </p>
                <small>
                  {formatDate(item.startDate)} – {formatDate(item.endDate)}
                </small>
                {item.description && <p>{item.description}</p>}
              </>
            )}
          />
          <ProfileRecordSection
            title="Experience"
            icon={<IoBriefcaseOutline />}
            resource="experiences"
            fields={experienceFields}
            items={profile?.experiences || []}
            emptyText="Add your professional experience."
            onChanged={reloadProfile}
            renderItem={(item) => (
              <>
                <h3>{item.title}</h3>
                <p>
                  {item.company}
                  {item.employmentType ? ` · ${item.employmentType}` : ""}
                </p>
                <small>
                  {formatDate(item.startDate)} –{" "}
                  {item.isCurrent ? "Present" : formatDate(item.endDate)}
                </small>
                {item.description && <p>{item.description}</p>}
              </>
            )}
          />
          <ProfileRecordSection
            title="Certificates"
            icon={<IoRibbonOutline />}
            resource="certificates"
            fields={certificateFields}
            items={profile?.certificates || []}
            emptyText="Add certificates and credentials."
            onChanged={reloadProfile}
            renderItem={(item) => (
              <>
                <h3>{item.name}</h3>
                <p>{item.issuer || "Certificate"}</p>
                <small>{formatDate(item.issueDate)}</small>
                {item.credentialUrl && (
                  <a href={item.credentialUrl} target="_blank" rel="noreferrer">
                    View credential
                  </a>
                )}
              </>
            )}
          />
        </div>

        <ProfileRecordSection
          title="Portfolio projects"
          icon={<IoLogoGithub />}
          resource="projects"
          fields={projectFields}
          items={profile?.projects || []}
          emptyText="Upload your first portfolio project."
          onChanged={reloadProfile}
          beforeSubmit={uploadProjectBeforeSave}
          renderItem={(item) => (
            <div className="portfolio-record">
              {item.imageUrl && <img src={item.imageUrl} alt="" />}
              <div>
                <h3>{item.title}</h3>
                {item.description && <p>{item.description}</p>}
                <div className="profile-skill-wrap">
                  {item.technologies.map((technology) => (
                    <span className="profile-skill" key={technology}>
                      {technology}
                    </span>
                  ))}
                </div>
                <div className="portfolio-links">
                  {item.projectUrl && (
                    <a href={item.projectUrl} target="_blank" rel="noreferrer">
                      Live project
                    </a>
                  )}
                  {item.githubUrl && (
                    <a href={item.githubUrl} target="_blank" rel="noreferrer">
                      GitHub
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        />
      </section>
    </main>
  );
};

export default Profile;
