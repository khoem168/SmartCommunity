import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  IoSchoolOutline,
  IoLogoLinkedin,
  IoCheckmarkCircle,
  IoStar,
  IoCalendarOutline,
  IoVideocamOutline,
  IoCameraOutline,
  IoCreateOutline,
  IoPeopleOutline,
  IoRibbonOutline,
  IoTimeOutline,
  IoArrowForwardOutline,
} from "react-icons/io5";
import UserAvatar from "../../components/ui/UserAvatar";
import {
  fetchMentorships,
  fetchMyMentorApplication,
} from "../../services/platformService";
import { ButtonLoader } from "../../components/ui/LoadingStates";
import { useLanguage } from "../../context/LanguageContext";

export default function MentorProfileView({
  user,
  onAvatarUpload,
  onUpdateMentorProfile,
}) {
  const { language } = useLanguage();
  const isKm = language === "km";

  const [bookings, setBookings] = useState([]);
  const [mentorApp, setMentorApp] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    professionalTitle: "",
    company: "",
    experienceYears: 0,
    bio: "",
    availability: "Flexible schedule",
    linkedinUrl: "",
    expertise: "",
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const skillData = user.skills || {};
  const expertiseList = [
    ...(skillData.teach || []),
    ...(skillData.candidate || []),
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      const [bookingRows, appData] = await Promise.all([
        fetchMentorships().catch(() => []),
        fetchMyMentorApplication().catch(() => ({ application: null })),
      ]);

      setBookings(bookingRows || []);
      const app = appData.application || {};
      setMentorApp(app);

      setForm({
        professionalTitle: user.profession || app.professionalTitle || "Senior Software Engineer",
        company: user.company || app.company || "",
        experienceYears: Number(user.experienceYears || app.experienceYears || 5),
        bio: user.bio || app.motivation || "",
        availability: skillData.availability || app.availability || "Flexible schedule",
        linkedinUrl: user.linkedinUrl || app.linkedinUrl || "",
        expertise: expertiseList.join(", ") || (app.expertise || []).join(", "),
      });
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const expArray = form.expertise
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      await onUpdateMentorProfile({
        jobTitle: form.professionalTitle,
        recruiterCompany: form.company,
        experienceYears: Number(form.experienceYears),
        bio: form.bio,
        availability: form.availability,
        linkedinUrl: form.linkedinUrl,
        skillsToTeach: expArray,
      });

      setEditing(false);
      setMessage(isKm ? "ព័ត៌មាន Mentor ត្រូវបាន Update ជោគជ័យ!" : "Mentor profile updated successfully!");
    } catch (err) {
      setError(err.message || "Failed to update mentor profile.");
    } finally {
      setBusy(false);
    }
  };

  const completedSessions = bookings.filter((b) => b.status === "completed").length;
  const activeBookings = bookings.filter((b) => ["pending", "active", "accepted"].includes(b.status));

  return (
    <div className="mentor-profile-view">
      {/* 1. Mentor Hero */}
      <section className="profile-hero mentor-hero">
        <div className="container profile-hero-inner">
          <div className="profile-identity">
            <div className="profile-avatar-wrap">
              <UserAvatar user={user} className="profile-large-avatar" size={96} />
              <label className="profile-avatar-upload" title="Upload avatar">
                <IoCameraOutline />
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={onAvatarUpload}
                />
              </label>
            </div>

            <div>
              <div className="mentor-badge-row">
                <span className="profile-role-tag mentor">
                  <IoRibbonOutline /> {isKm ? "អ្នកណែនាំវិជ្ជាជីវៈ (Industry Mentor)" : "Verified Industry Mentor"}
                </span>
                <span className="verification-pill verified">
                  <IoCheckmarkCircle />
                  <span>{isKm ? "បានផ្ទៀងផ្ទាត់ (Approved)" : "Approved Mentor"}</span>
                </span>
              </div>

              <h1>{user.fullName}</h1>
              <p className="profile-headline">
                {!user.profession || ["beginner", "intermediate", "advanced"].includes(String(user.profession).toLowerCase())
                  ? isKm
                    ? "អ្នកណែនាំជំនាញអភិវឌ្ឍន៍ប្រព័ន្ធ Full-Stack & Cloud"
                    : "Senior Full-Stack & Cloud Specialist"
                  : user.profession}{" "}
                {user.company && `at ${user.company}`}
              </p>

              <div className="profile-social-links">
                {user.linkedinUrl && (
                  <a href={user.linkedinUrl} target="_blank" rel="noreferrer">
                    <IoLogoLinkedin /> LinkedIn Profile
                  </a>
                )}
                <span>
                  <IoTimeOutline /> {user.experienceYears || 5}+ {isKm ? "ឆ្នាំបទពិសោធន៍" : "Years Experience"}
                </span>
                <span>
                  <IoCalendarOutline />{" "}
                  {isKm ? "ម៉ោងណែនាំបត់បែន (Flexible Schedule)" : skillData.availability || "Flexible Schedule"}
                </span>
              </div>
            </div>
          </div>

          <div className="profile-hero-buttons">
            <button
              type="button"
              className="btn outline"
              onClick={() => setEditing((cur) => !cur)}
            >
              <IoCreateOutline />
              <span>{editing ? (isKm ? "បិទកែប្រែ" : "Close Edit") : (isKm ? "កែសម្រួល Profile" : "Edit Profile")}</span>
            </button>
            <Link to="/mentorship" className="btn primary">
              <IoCalendarOutline />
              <span>{isKm ? "មើលសំណើកក់ម៉ោង" : "Manage Bookings"}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Global Alerts */}
      <div className="container">
        {message && <div className="profile-success">{message}</div>}
        {error && <div className="profile-error">{error}</div>}
      </div>

      <div className="container profile-content">
        {/* 2. Mentor Stats Row */}
        <div className="mentor-stats-grid">
          <article className="mentor-stat-card glass">
            <IoStar className="stat-icon gold" />
            <div>
              <strong>4.9 / 5.0</strong>
              <span>{isKm ? "ពិន្ទុវាយតម្លៃមធ្យមពីសិស្ស" : "Average Mentee Rating"}</span>
            </div>
          </article>

          <article className="mentor-stat-card glass">
            <IoCheckmarkCircle className="stat-icon teal" />
            <div>
              <strong>{completedSessions}</strong>
              <span>{isKm ? "វគ្គណែនាំ 1:1 បានបញ្ចប់" : "Completed 1:1 Sessions"}</span>
            </div>
          </article>

          <article className="mentor-stat-card glass">
            <IoPeopleOutline className="stat-icon blue" />
            <div>
              <strong>{activeBookings.length}</strong>
              <span>{isKm ? "សំណើកំពុងដំណើរការ" : "Active Mentees / Bookings"}</span>
            </div>
          </article>
        </div>

        {/* 3. Mentor Profile Edit Form */}
        {editing && (
          <section className="profile-panel glass profile-editor-panel">
            <h2>{isKm ? "កែសម្រួលព័ត៌មានអ្នកណែនាំ (Mentor Profile)" : "Edit Mentor Profile & Availability"}</h2>
            <form onSubmit={handleSave} className="mentor-edit-form">
              <div className="hub-form-row">
                <label className="hub-form-label">
                  <span>{isKm ? "តួនាទីវិជ្ជាជីវៈ (Professional Title)" : "Professional Title"} *</span>
                  <input
                    type="text"
                    className="hub-input"
                    value={form.professionalTitle}
                    onChange={(e) => setForm({ ...form, professionalTitle: e.target.value })}
                    required
                  />
                </label>

                <label className="hub-form-label">
                  <span>{isKm ? "ក្រុមហ៊ុន ឬស្ថាប័នបច្ចុប្បន្ន (Current Company)" : "Current Company"}</span>
                  <input
                    type="text"
                    className="hub-input"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                  />
                </label>
              </div>

              <div className="hub-form-row">
                <label className="hub-form-label">
                  <span>{isKm ? "ចំនួនឆ្នាំបទពិសោធន៍ (Years of Experience)" : "Years of Experience"}</span>
                  <input
                    type="number"
                    className="hub-input"
                    min="1"
                    max="40"
                    value={form.experienceYears}
                    onChange={(e) => setForm({ ...form, experienceYears: e.target.value })}
                  />
                </label>

                <label className="hub-form-label">
                  <span>{isKm ? "ពេលវេលាទំនេរសម្រាប់កក់ម៉ោង (Availability)" : "Booking Availability"}</span>
                  <select
                    className="hub-select"
                    value={form.availability}
                    onChange={(e) => setForm({ ...form, availability: e.target.value })}
                  >
                    <option value="Flexible schedule">{isKm ? "ពេលវេលាបត់បែន (Flexible)" : "Flexible schedule"}</option>
                    <option value="Weekends only">{isKm ? "ចុងសប្តាហ៍ (Weekends Only)" : "Weekends only"}</option>
                    <option value="Weekday evenings">{isKm ? "ពេលល្ងាចថ្ងៃធ្វើការ (Weekday Evenings)" : "Weekday evenings"}</option>
                  </select>
                </label>
              </div>

              <label className="hub-form-label">
                <span>{isKm ? "LinkedIn Profile URL" : "LinkedIn Profile URL"}</span>
                <input
                  type="url"
                  className="hub-input"
                  value={form.linkedinUrl}
                  onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
                  placeholder="https://linkedin.com/in/username"
                />
              </label>

              <label className="hub-form-label">
                <span>{isKm ? "ជំនាញឯកទេស (Expertise - បញ្ចូលដោយប្រើក្បៀស)" : "Areas of Expertise (Comma-separated)"}</span>
                <input
                  type="text"
                  className="hub-input"
                  value={form.expertise}
                  onChange={(e) => setForm({ ...form, expertise: e.target.value })}
                  placeholder="e.g. System Design, React, Career Coaching, Cloud Architecture"
                />
              </label>

              <label className="hub-form-label">
                <span>{isKm ? "ការពិពណ៌នា និងការលើកទឹកចិត្ត (Mentoring Bio & Motivation)" : "Mentoring Bio & Motivation"}</span>
                <textarea
                  className="hub-textarea"
                  rows={4}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder={isKm ? "ចែករំលែកពីរបៀបដែលអ្នកអាចជួយណែនាំសិស្ស..." : "Share how you guide mentees and what topics you love to coach on..."}
                />
              </label>

              <div className="hub-modal-actions">
                <button
                  type="button"
                  className="btn outline"
                  onClick={() => setEditing(false)}
                >
                  {isKm ? "បោះបង់" : "Cancel"}
                </button>
                <button type="submit" className="btn primary" disabled={busy}>
                  {busy ? <ButtonLoader>{isKm ? "កំពុងរក្សាទុក..." : "Saving..."}</ButtonLoader> : (isKm ? "រក្សាទុកព័ត៌មាន" : "Save Mentor Profile")}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* 4. Mentorship Overview & Expertise */}
        <div className="profile-overview-grid">
          <section className="profile-panel glass">
            <h2>{isKm ? "អំពីការណែនាំ និងការលើកទឹកចិត្ត" : "About & Mentorship Philosophy"}</h2>
            <p className="mentor-bio-text">
              {user.bio || mentorApp?.motivation || (isKm ? "អ្នកណែនាំដែលមានបទពិសោធន៍ខ្ពស់ ត្រៀមខ្លួនជួយសិស្សនិស្សិតឱ្យរីកចម្រើនក្នុងអាជីពបច្ចេកវិទ្យា។" : "Experienced professional dedicated to helping junior developers and students achieve their dream tech careers.")}
            </p>
          </section>

          <section className="profile-panel glass">
            <h2>{isKm ? "ជំនាញឯកទេសនៃការណែនាំ" : "Mentorship Specializations"}</h2>
            <div className="mentor-expertise-tags">
              {expertiseList.length > 0 ? (
                expertiseList.map((skill) => (
                  <span key={skill} className="mentor-skill-pill">
                    <IoRibbonOutline /> {skill}
                  </span>
                ))
              ) : (
                <span className="profile-skill-empty">{isKm ? "មិនទាន់បានកំណត់" : "No specializations set"}</span>
              )}
            </div>
          </section>
        </div>

        {/* 5. Active & Upcoming Mentorship Bookings */}
        <section className="profile-panel glass">
          <div className="profile-section-heading">
            <div>
              <h2>{isKm ? "ការកក់ម៉ោងណែនាំ 1:1 (Mentorship Bookings)" : "Your Mentorship Bookings"}</h2>
              <p>{isKm ? "គ្រប់គ្រងសំណើណាត់ជួប និងបន្ទប់ពិគ្រោះយោបល់" : "Manage upcoming sessions and video links"}</p>
            </div>
            <Link to="/mentorship" className="btn primary small">
              <IoCalendarOutline /> {isKm ? "មើលទាំងអស់" : "View All Bookings"}
            </Link>
          </div>

          {bookings.length > 0 ? (
            <div className="mentor-bookings-list">
              {bookings.slice(0, 5).map((booking) => (
                <article key={booking.id} className="mentor-booking-card glass">
                  <div className="mb-user">
                    <UserAvatar
                      user={{ name: booking.student_name, avatarUrl: booking.student_avatar }}
                      size={44}
                    />
                    <div>
                      <h4>{booking.student_name || "Student Mentee"}</h4>
                      <small>Topic: <strong>{booking.topic}</strong></small>
                    </div>
                  </div>

                  <div className="mb-time">
                    <IoTimeOutline />
                    <span>{booking.requested_time ? new Date(booking.requested_time).toLocaleString() : "Flexible"}</span>
                  </div>

                  <span className={`hub-status-pill ${booking.status}`}>
                    {booking.status}
                  </span>

                  <div className="mb-actions">
                    {booking.meeting_link && (
                      <a
                        href={booking.meeting_link}
                        target="_blank"
                        rel="noreferrer"
                        className="btn primary small"
                      >
                        <IoVideocamOutline /> {isKm ? "ចូលជួប" : "Meeting Room"}
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="hub-empty-subcard">
              <p>{isKm ? "មិនទាន់មានសំណើកក់ម៉ោងណែនាំនៅឡើយទេ។" : "No 1:1 mentorship bookings received yet."}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
