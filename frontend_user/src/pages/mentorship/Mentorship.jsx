import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  IoCalendarOutline,
  IoCheckmarkCircleOutline,
  IoPeopleOutline,
  IoSearchOutline,
  IoStar,
  IoVideocamOutline,
} from "react-icons/io5";
import { useGlobleContext } from "../../context/GlobleContext";
import {
  fetchMentorApplications,
  fetchMentors,
  fetchMentorships,
  fetchMyMentorApplication,
  reviewMentorApplicationRequest,
  submitMentorApplicationRequest,
  submitMentorReviewRequest,
  updateMentorshipStatusRequest,
} from "../../services/platformService";
import { getSocket } from "../../services/realtimeService";
import "./Mentorship.css";

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(String(value).replace(" ", "T")))
    : "Time not selected";

const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

const Mentorship = () => {
  const { user } = useGlobleContext();
  const [mentors, setMentors] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [application, setApplication] = useState(null);
  const [adminApplications, setAdminApplications] = useState([]);
  const [query, setQuery] = useState("");
  const [skill, setSkill] = useState("");
  const [showApplication, setShowApplication] = useState(false);
  const [applicationForm, setApplicationForm] = useState({
    professionalTitle: "",
    company: "",
    expertise: "",
    experienceYears: 0,
    motivation: "",
    linkedinUrl: "",
    availability: "Flexible schedule",
  });
  const [reasonById, setReasonById] = useState({});
  const [reviewById, setReviewById] = useState({});
  const [busyId, setBusyId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadPage = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const mentorRows = await fetchMentors();
      setMentors(mentorRows);
      if (user) {
        const [bookingRows, applicationData] = await Promise.all([
          fetchMentorships(),
          fetchMyMentorApplication(),
        ]);
        setBookings(bookingRows);
        setApplication(applicationData.application);
        if (user.role === "admin") {
          setAdminApplications(await fetchMentorApplications("pending"));
        }
      } else {
        setBookings([]);
        setApplication(null);
      }
    } catch (err) {
      setError(err.message || "Unable to load mentorship information.");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    Promise.resolve()
      .then(loadPage)
      .catch(() => undefined);
  }, [loadPage]);

  useEffect(() => {
    if (!user?.id) return;
    const socket = getSocket();
    const refresh = (notification) => {
      if (notification?.type === "mentorship") loadPage();
    };
    socket.on("notification:new", refresh);
    return () => socket.off("notification:new", refresh);
  }, [loadPage, user]);

  const skills = useMemo(
    () => [...new Set(mentors.flatMap((mentor) => mentor.skills || []))].sort(),
    [mentors],
  );
  const filteredMentors = useMemo(() => {
    const search = query.trim().toLowerCase();
    return mentors.filter((mentor) => {
      const searchable = [
        mentor.name,
        mentor.title,
        mentor.company,
        mentor.bio,
        ...(mentor.skills || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return (
        (!search || searchable.includes(search)) &&
        (!skill || mentor.skills?.includes(skill))
      );
    });
  }, [mentors, query, skill]);

  const updateBooking = async (bookingId, status) => {
    try {
      setBusyId(`booking-${bookingId}`);
      setError("");
      const response = await updateMentorshipStatusRequest(bookingId, {
        status,
        rejectionReason: reasonById[bookingId] || "",
      });
      setMessage(response.message);
      await loadPage();
    } catch (err) {
      setError(err.message || "Unable to update the mentorship booking.");
    } finally {
      setBusyId("");
    }
  };

  const submitReview = async (bookingId) => {
    const form = reviewById[bookingId] || { rating: 5, review: "" };
    try {
      setBusyId(`review-${bookingId}`);
      setError("");
      const response = await submitMentorReviewRequest(bookingId, form);
      setMessage(response.message);
      await loadPage();
    } catch (err) {
      setError(err.message || "Unable to save your review.");
    } finally {
      setBusyId("");
    }
  };

  const submitApplication = async (event) => {
    event.preventDefault();
    try {
      setBusyId("application");
      setError("");
      const response = await submitMentorApplicationRequest({
        ...applicationForm,
        experienceYears: Number(applicationForm.experienceYears),
        expertise: applicationForm.expertise
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });
      setMessage(response.message);
      setShowApplication(false);
      await loadPage();
    } catch (err) {
      setError(err.message || "Unable to submit your mentor application.");
    } finally {
      setBusyId("");
    }
  };

  const reviewApplication = async (applicationId, status) => {
    try {
      setBusyId(`application-${applicationId}`);
      setError("");
      const response = await reviewMentorApplicationRequest(applicationId, {
        status,
        rejectionReason: reasonById[`application-${applicationId}`] || "",
      });
      setMessage(response.message);
      await loadPage();
    } catch (err) {
      setError(err.message || "Unable to review this application.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <main className="mentorship-page">
      <section className="page-hero mentorship-hero">
        <div className="hero-content">
          <p className="eyebrow">Verified Mentorship</p>
          <h1>Find an experienced guide for your next career step.</h1>
          <p>
            Search verified mentors, request a session, meet through Jitsi, and
            share feedback after completing your appointment.
          </p>
          <div className="mentorship-hero-actions">
            {user &&
              user.role !== "mentor" &&
              user.role !== "admin" &&
              (!application || application.status === "rejected") && (
              <button className="btn primary" type="button" onClick={() => setShowApplication(true)}>
                {application?.status === "rejected" ? "Apply again" : "Become a mentor"}
              </button>
            )}
            {application && (
              <span className={`mentor-application-status ${application.status}`}>
                Mentor application: {application.status}
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="section container mentorship-content">
        {error && <div className="auth-error">{error}</div>}
        {message && <div className="profile-success">{message}</div>}

        {showApplication && (
          <form className="mentor-application-form" onSubmit={submitApplication}>
            <div className="section-header">
              <div><h2>Apply to become a mentor</h2><p>An administrator will verify your experience before publishing your profile.</p></div>
              <button className="btn outline" type="button" onClick={() => setShowApplication(false)}>Close</button>
            </div>
            <div className="mentor-form-grid">
              <label>Professional title<input required value={applicationForm.professionalTitle} onChange={(event) => setApplicationForm((current) => ({ ...current, professionalTitle: event.target.value }))} /></label>
              <label>Company<input value={applicationForm.company} onChange={(event) => setApplicationForm((current) => ({ ...current, company: event.target.value }))} /></label>
              <label>Years of experience<input required type="number" min="0" max="80" value={applicationForm.experienceYears} onChange={(event) => setApplicationForm((current) => ({ ...current, experienceYears: event.target.value }))} /></label>
              <label>Availability<input value={applicationForm.availability} onChange={(event) => setApplicationForm((current) => ({ ...current, availability: event.target.value }))} /></label>
              <label className="wide">Expertise, separated by commas<input required placeholder="React, Career coaching, UI/UX" value={applicationForm.expertise} onChange={(event) => setApplicationForm((current) => ({ ...current, expertise: event.target.value }))} /></label>
              <label className="wide">LinkedIn URL<input type="url" value={applicationForm.linkedinUrl} onChange={(event) => setApplicationForm((current) => ({ ...current, linkedinUrl: event.target.value }))} /></label>
              <label className="wide">Why do you want to mentor?<textarea required value={applicationForm.motivation} onChange={(event) => setApplicationForm((current) => ({ ...current, motivation: event.target.value }))} /></label>
            </div>
            <button className="btn primary" disabled={busyId === "application"}>{busyId === "application" ? "Submitting..." : "Submit application"}</button>
          </form>
        )}

        {user?.role === "admin" && (
          <section className="mentor-admin-panel">
            <div className="section-header"><div><h2>Mentor verification</h2><p>Review pending mentor applications.</p></div><span>{adminApplications.length} pending</span></div>
            {adminApplications.length ? adminApplications.map((item) => (
              <article key={item.id} className="mentor-application-card">
                <div><h3>{item.userName}</h3><p>{item.professionalTitle}{item.company ? ` at ${item.company}` : ""} · {item.experienceYears} years</p><div className="mentor-skills">{item.expertise.map((entry) => <span className="skill-pill" key={entry}>{entry}</span>)}</div><p>{item.motivation}</p></div>
                <label>Rejection reason<textarea value={reasonById[`application-${item.id}`] || ""} onChange={(event) => setReasonById((current) => ({ ...current, [`application-${item.id}`]: event.target.value }))} /></label>
                <div className="mentor-card-actions"><button className="btn primary small" type="button" disabled={busyId === `application-${item.id}`} onClick={() => reviewApplication(item.id, "approved")}>Approve</button><button className="btn outline small" type="button" disabled={!reasonById[`application-${item.id}`]?.trim() || busyId === `application-${item.id}`} onClick={() => reviewApplication(item.id, "rejected")}>Reject</button></div>
              </article>
            )) : <p className="mentorship-empty">No pending applications.</p>}
          </section>
        )}

        {user && bookings.length > 0 && (
          <section className="my-mentorships">
            <div className="section-header"><div><h2>My mentorship bookings</h2><p>Manage approvals, meetings, completion, and reviews.</p></div></div>
            <div className="mentorship-booking-grid">
              {bookings.map((booking) => (
                <article className="mentorship-booking-card" key={booking.id}>
                  <div className="booking-heading"><div><h3>{booking.topic}</h3><p>{booking.currentUserRole === "mentor" ? `Student: ${booking.studentName}` : `Mentor: ${booking.mentorName}`}</p></div><span className={`booking-status ${booking.status}`}>{booking.status}</span></div>
                  <p>{booking.description}</p>
                  <div className="booking-meta"><span><IoCalendarOutline /> {formatDate(booking.requestedTime)}</span><span>{booking.durationMinutes} minutes</span><span>{booking.meetingFrequency}</span></div>
                  {booking.rejectionReason && <p className="booking-rejection">Reason: {booking.rejectionReason}</p>}
                  {booking.meetingLink && booking.status === "active" && <a className="btn primary small" href={booking.meetingLink} target="_blank" rel="noreferrer"><IoVideocamOutline /> Join Jitsi meeting</a>}
                  {booking.currentUserRole === "mentor" && booking.status === "pending" && <><label>Reason if declining<textarea value={reasonById[booking.id] || ""} onChange={(event) => setReasonById((current) => ({ ...current, [booking.id]: event.target.value }))} /></label><div className="mentor-card-actions"><button className="btn primary small" type="button" disabled={busyId === `booking-${booking.id}`} onClick={() => updateBooking(booking.id, "active")}>Approve appointment</button><button className="btn outline small" type="button" disabled={!reasonById[booking.id]?.trim() || busyId === `booking-${booking.id}`} onClick={() => updateBooking(booking.id, "rejected")}>Decline</button></div></>}
                  {booking.status === "active" && <div className="mentor-card-actions"><button className="btn outline small" type="button" disabled={busyId === `booking-${booking.id}`} onClick={() => updateBooking(booking.id, "completed")}><IoCheckmarkCircleOutline /> Mark completed</button><button className="btn outline small" type="button" disabled={busyId === `booking-${booking.id}`} onClick={() => updateBooking(booking.id, "cancelled")}>Cancel</button></div>}
                  {booking.currentUserRole === "student" && booking.status === "pending" && <button className="btn outline small" type="button" disabled={busyId === `booking-${booking.id}`} onClick={() => updateBooking(booking.id, "cancelled")}>Cancel request</button>}
                  {booking.currentUserRole === "student" && booking.status === "completed" && !booking.review && <div className="booking-review-form"><label>Rating<select value={reviewById[booking.id]?.rating || 5} onChange={(event) => setReviewById((current) => ({ ...current, [booking.id]: { ...current[booking.id], rating: Number(event.target.value) } }))}>{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} stars</option>)}</select></label><label>Review<textarea value={reviewById[booking.id]?.review || ""} onChange={(event) => setReviewById((current) => ({ ...current, [booking.id]: { rating: current[booking.id]?.rating || 5, review: event.target.value } }))} /></label><button className="btn primary small" type="button" disabled={!reviewById[booking.id]?.review?.trim() || busyId === `review-${booking.id}`} onClick={() => submitReview(booking.id)}>Submit review</button></div>}
                  {booking.review && <p className="booking-review"><IoStar /> {booking.review.rating}/5 · {booking.review.review}</p>}
                </article>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="section-header"><div><h2>Verified mentors</h2><p>Search by name, career field, or mentoring skill.</p></div><span>{filteredMentors.length} mentors</span></div>
          <div className="mentor-search-panel">
            <label><IoSearchOutline /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search mentors or careers" /></label>
            <select value={skill} onChange={(event) => setSkill(event.target.value)}><option value="">All skills</option>{skills.map((item) => <option key={item} value={item}>{item}</option>)}</select>
          </div>
          {isLoading ? <div className="mentorship-empty">Loading verified mentors...</div> : filteredMentors.length ? (
            <div className="mentor-grid">
              {filteredMentors.map((mentor) => (
                <article className="mentor-card" key={mentor.id}>
                  <div className="mentor-card-person">{mentor.avatarUrl ? <img src={mentor.avatarUrl} alt="" /> : <span>{initials(mentor.name)}</span>}<div><h3>{mentor.name}</h3><p className="mentor-title">{mentor.title}{mentor.company ? ` at ${mentor.company}` : ""}</p></div></div>
                  <p className="mentor-card-bio">{mentor.bio}</p>
                  <div className="mentor-skills">{(mentor.skills || []).slice(0, 5).map((item) => <span className="skill-pill" key={item}>{item}</span>)}</div>
                  <div className="mentor-meta"><span><IoStar /> {mentor.rating || "New"} {mentor.reviewCount ? `(${mentor.reviewCount})` : ""}</span><span><IoPeopleOutline /> {mentor.sessions} sessions</span><span>{mentor.location}</span></div>
                  <Link to={`/mentorship/${mentor.id}`} className="btn primary small">View and book</Link>
                </article>
              ))}
            </div>
          ) : <div className="mentorship-empty">No verified mentors match these filters.</div>}
        </section>
      </section>
    </main>
  );
};

export default Mentorship;
