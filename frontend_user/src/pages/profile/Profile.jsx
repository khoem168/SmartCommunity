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
import { useLanguage } from "../../context/LanguageContext";
import UserAvatar from "../../components/ui/UserAvatar";
import { CardSkeleton } from "../../components/ui/LoadingStates";
import {
  createProfileItemRequest,
  deleteProfileItemRequest,
  fetchProfileRequest,
  updateProfileItemRequest,
  uploadAvatarRequest,
  uploadProjectImageRequest,
} from "../../services/profileService";
import StudentProfileView from "./StudentProfileView";
import RecruiterProfileView from "./RecruiterProfileView";
import MentorProfileView from "./MentorProfileView";
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

const educationFields = [
  { name: "institution", label: "School or institution", labelKm: "សាលា ឬគ្រឹះស្ថានសិក្សា", required: true },
  { name: "degree", label: "Degree", labelKm: "កម្រិតសញ្ញាបត្រ" },
  { name: "fieldOfStudy", label: "Field of study", labelKm: "ជំនាញសិក្សា" },
  { name: "startDate", label: "Start date", labelKm: "ថ្ងៃចាប់ផ្តើម", type: "date" },
  { name: "endDate", label: "End date", labelKm: "ថ្ងៃបញ្ចប់", type: "date" },
  { name: "description", label: "Description", labelKm: "ការពិពណ៌នាបន្ថែម", type: "textarea" },
];

const experienceFields = [
  { name: "title", label: "Job title", labelKm: "តួនាទីការងារ", required: true },
  { name: "company", label: "Company", labelKm: "ក្រុមហ៊ុន / ស្ថាប័ន", required: true },
  { name: "employmentType", label: "Employment type", labelKm: "ប្រភេទការងារ (ពេញម៉ោង/កម្មសិក្សា)" },
  { name: "startDate", label: "Start date", labelKm: "ថ្ងៃចាប់ផ្តើម", type: "date" },
  { name: "endDate", label: "End date", labelKm: "ថ្ងៃបញ្ចប់", type: "date" },
  { name: "isCurrent", label: "I currently work here", labelKm: "កំពុងធ្វើការនៅទីនេះបច្ចុប្បន្ន", type: "checkbox" },
  { name: "description", label: "Description", labelKm: "ការពិពណ៌នាការងារ", type: "textarea" },
];

const certificateFields = [
  { name: "name", label: "Certificate name", labelKm: "ឈ្មោះវិញ្ញាបនបត្រ", required: true },
  { name: "issuer", label: "Issuer", labelKm: "ស្ថាប័នចេញវិញ្ញាបនបត្រ" },
  { name: "issueDate", label: "Issue date", labelKm: "កាលបរិច្ឆេទទទួលបាន", type: "date" },
  { name: "credentialUrl", label: "Credential URL", labelKm: "តំណភ្ជាប់ផ្ទៀងផ្ទាត់ (URL)", type: "url" },
  { name: "certificateUrl", label: "Certificate file URL", labelKm: "តំណភ្ជាប់ឯកសារវិញ្ញាបនបត្រ", type: "url" },
];

const projectFields = [
  { name: "title", label: "Project title", labelKm: "ឈ្មោះគម្រោងស្នាដៃ", required: true },
  { name: "description", label: "Description", labelKm: "ការពិពណ៌នាគម្រោង", type: "textarea" },
  { name: "technologies", label: "Technologies (comma separated)", labelKm: "បច្ចេកវិទ្យាប្រើប្រាស់ (បំបែកដោយសញ្ញាក្បៀស)" },
  { name: "projectUrl", label: "Live project URL", labelKm: "តំណភ្ជាប់គម្រោងផ្ទាល់ (Live URL)", type: "url" },
  { name: "githubUrl", label: "GitHub URL", labelKm: "តំណភ្ជាប់កូដ GitHub", type: "url" },
  {
    name: "imageFile",
    label: "Project image",
    labelKm: "រូបភាពគម្រោង",
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
  const { language } = useLanguage();
  const isKm = language === "km";
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
          <IoAddOutline /> {showForm ? (isKm ? "បោះបង់" : "Cancel") : (isKm ? "បន្ថែម" : "Add")}
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
                {isKm ? field.labelKm || field.label : field.label}
              </label>
            ) : (
              <label key={field.name}>
                {isKm ? field.labelKm || field.label : field.label}
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
            {busy
              ? isKm
                ? "កំពុងរក្សាទុក..."
                : "Saving..."
              : editingId
                ? isKm
                  ? "ធ្វើបច្ចុប្បន្នភាព"
                  : "Update"
                : isKm
                  ? "បន្ថែមទៅក្នុងប្រវត្តិរូប"
                  : "Add to profile"}
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
  const { language } = useLanguage();
  const isKm = language === "km";
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [adminRoleView, setAdminRoleView] = useState("admin");
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
      <main
        className="profile-page profile-loading"
        aria-busy="true"
        aria-label={isKm ? "កំពុងទាញយកប្រវត្តិរូប..." : "Loading profile..."}
      >
        <div
          className="container"
          style={{
            maxWidth: 960,
            paddingBlock: 28,
            display: "grid",
            gap: 18,
          }}
        >
          <CardSkeleton variant="detail" />
          <CardSkeleton variant="mentor" />
        </div>
      </main>
    );
  if (!user) {
    return (
      <main className="profile-page">
        <section className="profile-empty container">
          <h1>
            {isKm
              ? "បង្កើតគណនីដើម្បីរៀបចំប្រវត្តិរូបវិជ្ជាជីវៈរបស់អ្នក"
              : "Create an account to build your professional profile."}
          </h1>
          <Link className="btn primary" to="/register">
            {isKm ? "បង្កើតគណនី" : "Create account"}
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

  const handleMentorProfileUpdate = async (updates) => {
    await updateUser(updates);
    await reloadProfile();
    await refreshUser();
  };

  const uploadProjectBeforeSave = async (payload, imageFile) => {
    if (!imageFile) return payload;
    const result = await uploadProjectImageRequest(imageFile);
    return { ...payload, imageUrl: result.imageUrl };
  };

  // Determine effective role
  const effectiveRole =
    user.role === "admin" && adminRoleView !== "admin"
      ? adminRoleView
      : user.role;

  const roleNames = {
    admin: { km: "អ្នកគ្រប់គ្រង", en: "Admin" },
    student: { km: "សិស្ស", en: "Student" },
    recruiter: { km: "អ្នកជ្រើសរើស", en: "Recruiter" },
    mentor: { km: "អ្នកណែនាំ", en: "Mentor" },
  };

  const renderAdminSwitcher = () => (
    <div className="container" style={{ paddingTop: "1rem" }}>
      <div className="admin-role-switcher glass">
        <span>{isKm ? "មើលទំព័រជា៖" : "Preview as:"}</span>
        {["admin", "student", "recruiter", "mentor"].map((r) => (
          <button
            key={r}
            type="button"
            className={`role-switch-btn ${adminRoleView === r ? "active" : ""}`}
            aria-pressed={adminRoleView === r}
            onClick={() => setAdminRoleView(r)}
          >
            {roleNames[r][isKm ? "km" : "en"]}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <main className="profile-page">
      {user.role === "admin" && renderAdminSwitcher()}

      {/* Recruiter Role View */}
      {effectiveRole === "recruiter" ? (
        <RecruiterProfileView user={profileUser} />
      ) : effectiveRole === "mentor" ? (
        /* Mentor Role View */
        <MentorProfileView
          user={profileUser}
          onAvatarUpload={handleAvatar}
          onUpdateMentorProfile={handleMentorProfileUpdate}
        />
      ) : (
        /* Student Role View (Default) */
        <>
          <div className="container">
            {message && <div className="profile-success">{message}</div>}
            {error && <div className="profile-error">{error}</div>}
          </div>

          {editing && (
            <section className="container section">
              <div className="profile-panel profile-editor-panel glass">
                <div className="profile-section-heading">
                  <h2>
                    {isKm
                      ? "ព័ត៌មានផ្ទាល់ខ្លួន និងគោលដៅអាជីព"
                      : "Personal and Career Information"}
                  </h2>
                </div>
                <form
                  className="profile-edit-form profile-edit-grid"
                  onSubmit={handleSave}
                >
                  {[
                    ["fullName", isKm ? "ឈ្មោះពេញ" : "Full name"],
                    ["location", isKm ? "ទីតាំង" : "Location"],
                    ["jobTitle", isKm ? "មុខរបរ ឬតួនាទី" : "Profession or job title"],
                    ["recruiterCompany", isKm ? "ក្រុមហ៊ុន / សាលា" : "Company"],
                    ["githubUrl", isKm ? "តំណភ្ជាប់ GitHub" : "GitHub URL", "url"],
                    ["linkedinUrl", isKm ? "តំណភ្ជាប់ LinkedIn" : "LinkedIn URL", "url"],
                    ["availability", isKm ? "ពេលវេលាទំនេរ" : "Availability"],
                    ["experienceLevel", isKm ? "កម្រិតបទពិសោធន៍" : "Experience level"],
                    ["skillsToTeach", isKm ? "ជំនាញដែលអាចបង្រៀន" : "Skills I can teach"],
                    ["skillsToLearn", isKm ? "ជំនាញដែលចង់រៀន" : "Skills I want to learn"],
                    ["interestedSkills", isKm ? "ជំនាញដែលចាប់អារម្មណ៍" : "Interested skills"],
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
                    {isKm ? "អំពីខ្ញុំ (Bio)" : "Bio"}
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
                    {isKm ? "គោលដៅអាជីព" : "Career goal"}
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
                      {isKm ? "បោះបង់" : "Cancel"}
                    </button>
                    <button className="btn primary" disabled={busy}>
                      {busy
                        ? isKm
                          ? "កំពុងរក្សាទុក..."
                          : "Saving..."
                        : isKm
                          ? "រក្សាទុកប្រវត្តិរូប"
                          : "Save profile"}
                    </button>
                  </div>
                </form>
              </div>
            </section>
          )}

          <StudentProfileView
            user={profileUser}
            isAdminView={effectiveRole === "admin"}
            profileData={profile}
            onAvatarUpload={handleAvatar}
            onBeginEdit={beginEdit}
            renderRecordSection={(props) => <ProfileRecordSection {...props} />}
            educationFields={educationFields}
            experienceFields={experienceFields}
            certificateFields={certificateFields}
            projectFields={projectFields}
            onRecordChanged={reloadProfile}
            onUploadProjectBeforeSave={uploadProjectBeforeSave}
          />
        </>
      )}
    </main>
  );
};

export default Profile;
