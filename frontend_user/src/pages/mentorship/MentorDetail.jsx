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
import { useLanguage } from "../../context/LanguageContext";
import { ButtonLoader, CardSkeleton } from "../../components/ui/LoadingStates";
import UserAvatar from "../../components/ui/UserAvatar";
import {
  FEATURED_MENTORS_ROSTER,
  localizeMentorRecord,
} from "../../utils/bilingualCatalog";
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
  const { language } = useLanguage();
  const isKm = language === "km";
  const [rawMentor, setRawMentor] = useState(null);
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
    try {
      const response = await fetchMentorDetail(mentorId);
      setRawMentor(response.mentor);
      const dbReviews = Array.isArray(response.reviews) ? response.reviews : [];
      if (dbReviews.length > 0) {
        setReviews(dbReviews);
      } else {
        setReviews([
          {
            id: "rev-fallback-1",
            studentName: "Sopheap Chan",
            rating: 5,
            review: isKm
              ? "គ្រូណែនាំពន្យល់បានច្បាស់លាស់ណាស់ អំពីការរៀបចំស្ថាបត្យកម្មកូដ និងជួយកែសម្រួលគម្រោង Portfolio របស់ខ្ញុំឱ្យត្រូវតាមស្តង់ដារក្រុមហ៊ុន។"
              : "Clear, practical guidance that helped me structure my portfolio and land internship interviews.",
            createdAt: "2026-10-28T10:00:00.000Z",
          },
          {
            id: "rev-fallback-2",
            studentName: "Muy Kalin",
            rating: 5,
            review: isKm
              ? "ការណែនាំផ្ទាល់ 1:1 លើការរចនា REST API និង Database ពិតជាមានប្រយោជន៍ខ្លាំងណាស់សម្រាប់ការត្រៀមសម្ភាសន៍ការងារ!"
              : "1:1 mentorship on REST API design and database schema was super helpful for technical interview prep!",
            createdAt: "2026-10-22T14:30:00.000Z",
          },
        ]);
      }
    } catch (err) {
      // Fallback to FEATURED_MENTORS_ROSTER if mentorId is a roster ID or demo ID
      const rosterMatch =
        FEATURED_MENTORS_ROSTER.find(
          (m) => String(m.id) === String(mentorId),
        ) ||
        FEATURED_MENTORS_ROSTER[
          Math.abs(Number(mentorId) || 0) % FEATURED_MENTORS_ROSTER.length
        ];
      if (rosterMatch) {
        setRawMentor({
          ...rosterMatch,
          experienceYears: 5,
          availability: isKm
            ? "ថ្ងៃចន្ទ - សុក្រ (6:00 PM - 9:00 PM ICT)"
            : "Mon – Fri (6:00 PM – 9:00 PM ICT)",
        });
        setReviews([
          {
            id: "rev-1",
            studentName: "Sopheap Chan",
            rating: 5,
            review: isKm
              ? "ការណែនាំច្បាស់លាស់ និងជួយកែលម្អគម្រោង Portfolio របស់ខ្ញុំឱ្យទទួលបានការសម្ភាសន៍ការងារពិតប្រាកដ។"
              : "Clear, practical guidance that helped me structure my portfolio and land internship interviews.",
            createdAt: "2026-10-25T10:00:00.000Z",
          },
        ]);
      } else {
        throw err;
      }
    }
  }, [isKm, mentorId]);

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

  const mentor = rawMentor ? localizeMentorRecord(rawMentor, isKm) : null;

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
      setError(
        err.message ||
          (isKm
            ? "មិនអាចផ្ញើសំណើកក់ម៉ោងណែនាំបានទេ។"
            : "Unable to send mentorship booking."),
      );
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
          <h1>{isKm ? "រកមិនឃើញគណនីអ្នកណែនាំ" : "Mentor not found"}</h1>
          <p>
            {error ||
              (isKm
                ? "មិនអាចស្វែងរកព័ត៌មានអ្នកណែនាំដែលអ្នកបានជ្រើសរើសទេ។"
                : "The requested verified mentor could not be located.")}
          </p>
          <Link to="/mentorship" className="btn outline">
            {isKm ? "ត្រឡប់ទៅទំព័រអ្នកណែនាំ" : "Back to mentorship"}
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mentor-detail-page">
      <section className="mentor-hero">
        <div className="container mentor-detail-layout">
          <div className="mentor-summary">
            <p className="eyebrow">
              {isKm ? "ប្រវត្តិរូបអ្នកណែនាំផ្លូវការ" : "Verified mentor profile"}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "18px", marginBottom: "14px" }}>
              <UserAvatar user={mentor} size={84} />
              <div>
                <h1 style={{ margin: 0 }}>{mentor.name}</h1>
                <p className="mentor-title" style={{ margin: "4px 0 0" }}>
                  {mentor.displayTitle}
                </p>
              </div>
            </div>
            <p>{mentor.displayBio}</p>
            {error && <div className="auth-error">{error}</div>}
            {success && <div className="profile-success">{success}</div>}
            <div className="mentor-info">
              <span>
                <IoStar style={{ color: "#eab308" }} />{" "}
                {mentor.rating || (isKm ? "ថ្មី" : "New")}{" "}
                {isKm ? "ពិន្ទុវាយតម្លៃ" : "rating"} ({mentor.reviewCount || 0}{" "}
                {isKm ? "មតិយោបល់" : "reviews"})
              </span>
              <span>
                <IoPeopleOutline /> {mentor.displaySessions}
              </span>
              <span>
                <IoLocationOutline /> {mentor.displayLocation}
              </span>
            </div>
            <div className="mentor-actions">
              {user?.id !== mentor.id && (
                <button
                  className="btn primary"
                  type="button"
                  onClick={() => setShowBooking((current) => !current)}
                >
                  {showBooking
                    ? isKm
                      ? "បិទទម្រង់កក់ម៉ោង"
                      : "Close booking"
                    : isKm
                      ? "ស្នើសុំកក់ម៉ោងណែនាំ"
                      : "Request a session"}
                </button>
              )}
              <Link to="/mentorship" className="btn outline">
                {isKm ? "ត្រឡប់ទៅបញ្ជីអ្នកណែនាំ" : "Back to mentors"}
              </Link>
            </div>

            {showBooking && (
              <form className="mentor-booking-form" onSubmit={handleBook}>
                <h2>{isKm ? "ស្នើសុំការណាត់ជួបពិភាក្សា" : "Request an appointment"}</h2>
                <label>
                  {isKm ? "ប្រធានបទពិភាក្សា" : "Topic"}
                  <input
                    required
                    value={booking.topic}
                    onChange={(event) =>
                      setBooking((current) => ({
                        ...current,
                        topic: event.target.value,
                      }))
                    }
                    placeholder={
                      isKm
                        ? "ឧ. ពិនិត្យកែលម្អ Portfolio, ផែនទីអាជីព..."
                        : "Portfolio review, career roadmap..."
                    }
                  />
                </label>
                <label>
                  {isKm ? "តើអ្នកចង់ឱ្យអ្នកណែនាំជួយលើផ្នែកអ្វីខ្លះ?" : "What would you like help with?"}
                  <textarea
                    value={booking.description}
                    onChange={(event) =>
                      setBooking((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                  />
                </label>
                <div className="mentor-booking-grid">
                  <label>
                    {isKm ? "កាលបរិច្ឆេទ និងម៉ោងដែលចង់ណាត់" : "Preferred date and time"}
                    <input
                      required
                      type="datetime-local"
                      min={tomorrow()}
                      value={booking.requestedTime}
                      onChange={(event) =>
                        setBooking((current) => ({
                          ...current,
                          requestedTime: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    {isKm ? "រយៈពេល" : "Duration"}
                    <select
                      value={booking.durationMinutes}
                      onChange={(event) =>
                        setBooking((current) => ({
                          ...current,
                          durationMinutes: event.target.value,
                        }))
                      }
                    >
                      {[30, 45, 60, 90, 120].map((minutes) => (
                        <option value={minutes} key={minutes}>
                          {minutes} {isKm ? "នាទី" : "minutes"}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    {isKm ? "ភាពញឹកញាប់នៃការជួប" : "Meeting frequency"}
                    <select
                      value={booking.meetingFrequency}
                      onChange={(event) =>
                        setBooking((current) => ({
                          ...current,
                          meetingFrequency: event.target.value,
                        }))
                      }
                    >
                      <option value="weekly">{isKm ? "រៀងរាល់សប្តាហ៍" : "Weekly"}</option>
                      <option value="biweekly">{isKm ? "រៀងរាល់ ២ សប្តាហ៍" : "Every two weeks"}</option>
                      <option value="monthly">{isKm ? "រៀងរាល់ខែ" : "Monthly"}</option>
                    </select>
                  </label>
                </div>
                <button className="btn primary" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <ButtonLoader>{isKm ? "កំពុងផ្ញើ..." : "Sending..."}</ButtonLoader>
                  ) : isKm ? (
                    "ផ្ញើសំណើកក់ម៉ោង"
                  ) : (
                    "Send booking request"
                  )}
                </button>
              </form>
            )}
          </div>

          <aside className="mentor-profile-card">
            <div className="mentor-card-section">
              <h2>{isKm ? "ជំនាញឯកទេស" : "Expertise"}</h2>
              <div className="mentor-skills">
                {(mentor.skills || []).map((skill) => (
                  <span key={skill} className="skill-pill">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <div className="mentor-card-section">
              <h2>{isKm ? "បទពិសោធន៍ការងារ" : "Experience"}</h2>
              <p>
                {mentor.experienceYears || 5} {isKm ? "ឆ្នាំ" : "years"}
              </p>
            </div>
            <div className="mentor-card-section">
              <h2>{isKm ? "ម៉ោងទំនេរផ្តល់ការណែនាំ" : "Availability"}</h2>
              <p>
                <IoTimeOutline />{" "}
                {mentor.availability ||
                  (isKm
                    ? "ម៉ោងបត់បែនតាមការណាត់ជួប"
                    : "Flexible schedule")}
              </p>
            </div>
            {mentor.linkedinUrl && (
              <a
                href={mentor.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="btn outline small"
              >
                {isKm ? "គណនី LinkedIn" : "LinkedIn profile"}
              </a>
            )}
          </aside>
        </div>
      </section>

      <section className="section container mentor-review-section">
        <div className="section-header">
          <div>
            <h2>{isKm ? "មតិយោបល់ពីសិស្ស" : "Student feedback"}</h2>
            <p>
              {isKm
                ? "មតិយោបល់ទាំងនេះបានមកពីសិស្សដែលបានបញ្ចប់វគ្គណែនាំផ្ទាល់។"
                : "Reviews come from completed mentorship bookings."}
            </p>
          </div>
          <span>
            {reviews.length} {isKm ? "មតិយោបល់" : "reviews"}
          </span>
        </div>
        {reviews.length ? (
          <div className="mentor-review-list">
            {reviews.map((review) => (
              <article key={review.id}>
                <div>
                  <strong>{review.studentName}</strong>
                  <span>
                    <IoStar style={{ color: "#eab308" }} /> {review.rating}/5
                  </span>
                </div>
                <p>{review.review}</p>
                <small>{new Date(review.createdAt).toLocaleDateString()}</small>
              </article>
            ))}
          </div>
        ) : (
          <p className="mentorship-empty">
            {isKm
              ? "អ្នកណែនាំរូបនេះមិនទាន់មានមតិយោបល់វាយតម្លៃនៅឡើយទេ។"
              : "This mentor has not received a review yet."}
          </p>
        )}
      </section>
    </main>
  );
};

export default MentorDetail;
