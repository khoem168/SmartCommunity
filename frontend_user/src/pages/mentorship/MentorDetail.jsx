import { useCallback, useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  IoLocationOutline,
  IoPeopleOutline,
  IoStar,
  IoTimeOutline,
} from "react-icons/io5";
import {
  createMentorshipRequest,
  fetchMentorDetail,
} from "../../services/platformService";
import { useGlobleContext } from "../../context/GlobleContext";
import { ButtonLoader, CardSkeleton } from "../../components/ui/LoadingStates";
import "./MentorDetail.css";

const tomorrow = () => {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  date.setMinutes(Math.ceil(date.getMinutes() / 15) * 15, 0, 0);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const MentorDetail = () => {
  const { mentorId } = useParams();
  const navigate = useNavigate();
  const { user } = useGlobleContext();
  const [mentor, setMentor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [booking, setBooking] = useState({
    topic: "",
    description: "",
    requestedTime: tomorrow(),
    durationMinutes: 60,
    meetingFrequency: "weekly",
  });
  const [showBooking, setShowBooking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadMentor = useCallback(async () => {
    const response = await fetchMentorDetail(mentorId);
    setMentor(response.mentor);
    setReviews(response.reviews || []);
  }, [mentorId]);

  useEffect(() => {
    let active = true;
    Promise.resolve()
      .then(loadMentor)
      .catch((err) => {
        if (active) setError(err.message || "Unable to load mentor profile.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [loadMentor]);

  const handleBook = async (event) => {
    event.preventDefault();
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      setIsSubmitting(true);
      setError("");
      setSuccess("");
      const response = await createMentorshipRequest({
        mentorId: mentor.id,
        ...booking,
        durationMinutes: Number(booking.durationMinutes),
      });
      setSuccess(response.message);
      setShowBooking(false);
    } catch (err) {
      setError(err.message || "Unable to send mentorship booking.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="mentor-detail-page">
        <section className="section container">
          <CardSkeleton variant="detail" />
        </section>
      </main>
    );
  }

  if (!mentor) {
    return (
      <main className="mentor-detail-page">
        <section className="section container">
          <h1>Mentor not found</h1>
          <p>{error || "The requested verified mentor could not be located."}</p>
          <Link to="/mentorship" className="btn outline">Back to mentorship</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mentor-detail-page">
      <section className="mentor-hero">
        <div className="container mentor-detail-layout">
          <div className="mentor-summary">
            <p className="eyebrow">Verified mentor profile</p>
            <h1>{mentor.name}</h1>
            <p className="mentor-title">{mentor.title}{mentor.company ? ` at ${mentor.company}` : ""}</p>
            <p>{mentor.bio}</p>
            {error && <div className="auth-error">{error}</div>}
            {success && <div className="profile-success">{success}</div>}
            <div className="mentor-info">
              <span><IoStar /> {mentor.rating || "New"} rating ({mentor.reviewCount} reviews)</span>
              <span><IoPeopleOutline /> {mentor.sessions} completed sessions</span>
              <span><IoLocationOutline /> {mentor.location}</span>
            </div>
            <div className="mentor-actions">
              {user?.id !== mentor.id && <button className="btn primary" type="button" onClick={() => setShowBooking((current) => !current)}>{showBooking ? "Close booking" : "Request a session"}</button>}
              <Link to="/mentorship" className="btn outline">Back to mentors</Link>
            </div>

            {showBooking && (
              <form className="mentor-booking-form" onSubmit={handleBook}>
                <h2>Request an appointment</h2>
                <label>Topic<input required value={booking.topic} onChange={(event) => setBooking((current) => ({ ...current, topic: event.target.value }))} placeholder="Portfolio review, career roadmap..." /></label>
                <label>What would you like help with?<textarea value={booking.description} onChange={(event) => setBooking((current) => ({ ...current, description: event.target.value }))} /></label>
                <div className="mentor-booking-grid">
                  <label>Preferred date and time<input required type="datetime-local" min={tomorrow()} value={booking.requestedTime} onChange={(event) => setBooking((current) => ({ ...current, requestedTime: event.target.value }))} /></label>
                  <label>Duration<select value={booking.durationMinutes} onChange={(event) => setBooking((current) => ({ ...current, durationMinutes: event.target.value }))}>{[30, 45, 60, 90, 120].map((minutes) => <option value={minutes} key={minutes}>{minutes} minutes</option>)}</select></label>
                  <label>Meeting frequency<select value={booking.meetingFrequency} onChange={(event) => setBooking((current) => ({ ...current, meetingFrequency: event.target.value }))}><option value="weekly">Weekly</option><option value="biweekly">Every two weeks</option><option value="monthly">Monthly</option></select></label>
                </div>
                <button className="btn primary" disabled={isSubmitting}>{isSubmitting ? <ButtonLoader>Sending...</ButtonLoader> : "Send booking request"}</button>
              </form>
            )}
          </div>

          <aside className="mentor-profile-card">
            <div className="mentor-card-section"><h2>Expertise</h2><div className="mentor-skills">{(mentor.skills || []).map((skill) => <span key={skill} className="skill-pill">{skill}</span>)}</div></div>
            <div className="mentor-card-section"><h2>Experience</h2><p>{mentor.experienceYears} years</p></div>
            <div className="mentor-card-section"><h2>Availability</h2><p><IoTimeOutline /> {mentor.availability}</p></div>
            {mentor.linkedinUrl && <a href={mentor.linkedinUrl} target="_blank" rel="noreferrer" className="btn outline small">LinkedIn profile</a>}
          </aside>
        </div>
      </section>

      <section className="section container mentor-review-section">
        <div className="section-header"><div><h2>Student feedback</h2><p>Reviews come from completed mentorship bookings.</p></div><span>{reviews.length} reviews</span></div>
        {reviews.length ? <div className="mentor-review-list">{reviews.map((review) => <article key={review.id}><div><strong>{review.studentName}</strong><span><IoStar /> {review.rating}/5</span></div><p>{review.review}</p><small>{new Date(review.createdAt).toLocaleDateString()}</small></article>)}</div> : <p className="mentorship-empty">This mentor has not received a review yet.</p>}
      </section>
    </main>
  );
};

export default MentorDetail;
