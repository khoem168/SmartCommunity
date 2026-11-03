import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
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
import { ButtonLoader, SkeletonGrid } from "../../components/ui/LoadingStates";
import { useLanguage } from "../../context/LanguageContext";
import UserAvatar from "../../components/ui/UserAvatar";
import { localizeMentorRecord } from "../../utils/bilingualCatalog";
import "./Mentorship.css";

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(String(value).replace(" ", "T")))
    : "Time not selected";

const Mentorship = () => {
  const { user } = useGlobleContext();
  const { t, language } = useLanguage();
  const isKm = language === "km";
  const [searchParams] = useSearchParams();
  const [mentors, setMentors] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [application, setApplication] = useState(null);
  const [adminApplications, setAdminApplications] = useState([]);
  const [query, setQuery] = useState("");
  const [skill, setSkill] = useState("");
  const [showApplication, setShowApplication] = useState(false);

  useEffect(() => {
    if (searchParams.get("apply") === "1" && user && user.role !== "mentor" && user.role !== "admin") {
      setShowApplication(true);
    }
  }, [searchParams, user]);
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
          <p className="eyebrow">{t("mentorshipPage.eyebrow")}</p>
          <h1>{t("mentorshipPage.heroTitle")}</h1>
          <p>{t("mentorshipPage.heroDescription")}</p>
          <div className="mentorship-hero-actions">
            {!user && (
              <Link to="/register?role=mentor" className="btn primary">
                {t("mentorshipPage.becomeMentor")} →
              </Link>
            )}
            {user &&
              user.role !== "mentor" &&
              user.role !== "admin" &&
              (!application || application.status === "rejected") && (
                <button
                  className="btn primary"
                  type="button"
                  onClick={() => setShowApplication(true)}
                >
                  {application?.status === "rejected"
                    ? t("mentorshipPage.applyAgain")
                    : t("mentorshipPage.becomeMentor")}
                </button>
              )}
            {user?.role === "mentor" && (
              <Link to="/dashboard" className="btn primary">
                {isKm ? "ផ្ទាំងការងារអ្នកណែនាំ" : "Mentor Workspace"} →
              </Link>
            )}
            {application && (
              <span
                className={`mentor-application-status ${application.status}`}
              >
                {t("mentorshipPage.applicationStatus", {
                  status: application.status,
                })}
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="section container mentorship-content">
        {error && <div className="auth-error">{error}</div>}
        {message && <div className="profile-success">{message}</div>}

        {showApplication && (
          <form
            className="mentor-application-form"
            onSubmit={submitApplication}
          >
            <div className="section-header">
              <div>
                <h2>{t("mentorshipPage.applyTitle")}</h2>
                <p>{t("mentorshipPage.applyDescription")}</p>
              </div>
              <button
                className="btn outline"
                type="button"
                onClick={() => setShowApplication(false)}
              >
                {t("mentorshipPage.close")}
              </button>
            </div>
            <div className="mentor-form-grid">
              <label>
                {t("mentorshipPage.professionalTitle")}
                <input
                  required
                  value={applicationForm.professionalTitle}
                  onChange={(event) =>
                    setApplicationForm((current) => ({
                      ...current,
                      professionalTitle: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                {t("mentorshipPage.company")}
                <input
                  value={applicationForm.company}
                  onChange={(event) =>
                    setApplicationForm((current) => ({
                      ...current,
                      company: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                {t("mentorshipPage.years")}
                <input
                  required
                  type="number"
                  min="0"
                  max="80"
                  value={applicationForm.experienceYears}
                  onChange={(event) =>
                    setApplicationForm((current) => ({
                      ...current,
                      experienceYears: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                {t("mentorshipPage.availability")}
                <input
                  value={applicationForm.availability}
                  onChange={(event) =>
                    setApplicationForm((current) => ({
                      ...current,
                      availability: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="wide">
                {t("mentorshipPage.expertise")}
                <input
                  required
                  placeholder="React, Career coaching, UI/UX"
                  value={applicationForm.expertise}
                  onChange={(event) =>
                    setApplicationForm((current) => ({
                      ...current,
                      expertise: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="wide">
                {t("mentorshipPage.linkedin")}
                <input
                  type="url"
                  value={applicationForm.linkedinUrl}
                  onChange={(event) =>
                    setApplicationForm((current) => ({
                      ...current,
                      linkedinUrl: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="wide">
                {t("mentorshipPage.motivation")}
                <textarea
                  required
                  value={applicationForm.motivation}
                  onChange={(event) =>
                    setApplicationForm((current) => ({
                      ...current,
                      motivation: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
            <button className="btn primary" disabled={busyId === "application"}>
              {busyId === "application" ? (
                <ButtonLoader>{t("mentorshipPage.submitting")}</ButtonLoader>
              ) : (
                t("mentorshipPage.submitApplication")
              )}
            </button>
          </form>
        )}

        {user?.role === "admin" && (
          <section className="mentor-admin-panel">
            <div className="section-header">
              <div>
                <h2>{t("mentorshipPage.verificationTitle")}</h2>
                <p>{t("mentorshipPage.verificationDescription")}</p>
              </div>
              <span>
                {t("mentorshipPage.pending", {
                  count: adminApplications.length,
                })}
              </span>
            </div>
            {adminApplications.length ? (
              adminApplications.map((item) => (
                <article key={item.id} className="mentor-application-card">
                  <div>
                    <h3>{item.userName}</h3>
                    <p>
                      {t("mentorshipPage.experienceLine", {
                        title: item.professionalTitle,
                        company: item.company ? ` - ${item.company}` : "",
                        years: item.experienceYears,
                      })}
                    </p>
                    <div className="mentor-skills">
                      {item.expertise.map((entry) => (
                        <span className="skill-pill" key={entry}>
                          {entry}
                        </span>
                      ))}
                    </div>
                    <p>{item.motivation}</p>
                  </div>
                  <label>
                    {t("mentorshipPage.rejectionReason")}
                    <textarea
                      value={reasonById[`application-${item.id}`] || ""}
                      onChange={(event) =>
                        setReasonById((current) => ({
                          ...current,
                          [`application-${item.id}`]: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <div className="mentor-card-actions">
                    <button
                      className="btn primary small"
                      type="button"
                      disabled={busyId === `application-${item.id}`}
                      onClick={() => reviewApplication(item.id, "approved")}
                    >
                      {busyId === `application-${item.id}` ? (
                        <ButtonLoader>
                          {t("mentorshipPage.approving")}
                        </ButtonLoader>
                      ) : (
                        t("mentorshipPage.approve")
                      )}
                    </button>
                    <button
                      className="btn outline small"
                      type="button"
                      disabled={
                        !reasonById[`application-${item.id}`]?.trim() ||
                        busyId === `application-${item.id}`
                      }
                      onClick={() => reviewApplication(item.id, "rejected")}
                    >
                      {busyId === `application-${item.id}` ? (
                        <ButtonLoader>
                          {t("mentorshipPage.rejecting")}
                        </ButtonLoader>
                      ) : (
                        t("mentorshipPage.reject")
                      )}
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <p className="mentorship-empty">
                {t("mentorshipPage.noPending")}
              </p>
            )}
          </section>
        )}

        {user && bookings.length > 0 && (
          <section className="my-mentorships">
            <div className="section-header">
              <div>
                <h2>{t("mentorshipPage.myBookings")}</h2>
                <p>{t("mentorshipPage.bookingsDescription")}</p>
              </div>
            </div>
            <div className="mentorship-booking-grid">
              {bookings.map((booking) => (
                <article className="mentorship-booking-card" key={booking.id}>
                  <div className="booking-heading">
                    <div>
                      <h3>{booking.topic}</h3>
                      <p>
                        {booking.currentUserRole === "mentor"
                          ? t("mentorshipPage.studentName", {
                              name: booking.studentName,
                            })
                          : t("mentorshipPage.mentorName", {
                              name: booking.mentorName,
                            })}
                      </p>
                    </div>
                    <span className={`booking-status ${booking.status}`}>
                      {booking.status}
                    </span>
                  </div>
                  <p>{booking.description}</p>
                  <div className="booking-meta">
                    <span>
                      <IoCalendarOutline /> {formatDate(booking.requestedTime)}
                    </span>
                    <span>
                      {t("mentorshipPage.minutes", {
                        count: booking.durationMinutes,
                      })}
                    </span>
                    <span>{booking.meetingFrequency}</span>
                  </div>
                  {booking.rejectionReason && (
                    <p className="booking-rejection">
                      {t("mentorshipPage.reason", {
                        reason: booking.rejectionReason,
                      })}
                    </p>
                  )}
                  {booking.meetingLink && booking.status === "active" && (
                    <a
                      className="btn primary small"
                      href={booking.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <IoVideocamOutline /> {t("mentorshipPage.joinMeeting")}
                    </a>
                  )}
                  {booking.currentUserRole === "mentor" &&
                    booking.status === "pending" && (
                      <>
                        <label>
                          {t("mentorshipPage.reasonDeclining")}
                          <textarea
                            value={reasonById[booking.id] || ""}
                            onChange={(event) =>
                              setReasonById((current) => ({
                                ...current,
                                [booking.id]: event.target.value,
                              }))
                            }
                          />
                        </label>
                        <div className="mentor-card-actions">
                          <button
                            className="btn primary small"
                            type="button"
                            disabled={busyId === `booking-${booking.id}`}
                            onClick={() => updateBooking(booking.id, "active")}
                          >
                            {busyId === `booking-${booking.id}` ? (
                              <ButtonLoader>
                                {t("mentorshipPage.updating")}
                              </ButtonLoader>
                            ) : (
                              t("mentorshipPage.approveAppointment")
                            )}
                          </button>
                          <button
                            className="btn outline small"
                            type="button"
                            disabled={
                              !reasonById[booking.id]?.trim() ||
                              busyId === `booking-${booking.id}`
                            }
                            onClick={() =>
                              updateBooking(booking.id, "rejected")
                            }
                          >
                            {busyId === `booking-${booking.id}` ? (
                              <ButtonLoader>
                                {t("mentorshipPage.updating")}
                              </ButtonLoader>
                            ) : (
                              t("mentorshipPage.decline")
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  {booking.status === "active" && (
                    <div className="mentor-card-actions">
                      <button
                        className="btn outline small"
                        type="button"
                        disabled={busyId === `booking-${booking.id}`}
                        onClick={() => updateBooking(booking.id, "completed")}
                      >
                        {busyId === `booking-${booking.id}` ? (
                          <ButtonLoader>
                            {t("mentorshipPage.updating")}
                          </ButtonLoader>
                        ) : (
                          <>
                            <IoCheckmarkCircleOutline />{" "}
                            {t("mentorshipPage.markCompleted")}
                          </>
                        )}
                      </button>
                      <button
                        className="btn outline small"
                        type="button"
                        disabled={busyId === `booking-${booking.id}`}
                        onClick={() => updateBooking(booking.id, "cancelled")}
                      >
                        {busyId === `booking-${booking.id}` ? (
                          <ButtonLoader>
                            {t("mentorshipPage.updating")}
                          </ButtonLoader>
                        ) : (
                          t("mentorshipPage.cancel")
                        )}
                      </button>
                    </div>
                  )}
                  {booking.currentUserRole === "student" &&
                    booking.status === "pending" && (
                      <button
                        className="btn outline small"
                        type="button"
                        disabled={busyId === `booking-${booking.id}`}
                        onClick={() => updateBooking(booking.id, "cancelled")}
                      >
                        {busyId === `booking-${booking.id}` ? (
                          <ButtonLoader>
                            {t("mentorshipPage.updating")}
                          </ButtonLoader>
                        ) : (
                          t("mentorshipPage.cancelRequest")
                        )}
                      </button>
                    )}
                  {booking.currentUserRole === "student" &&
                    booking.status === "completed" &&
                    !booking.review && (
                      <div className="booking-review-form">
                        <label>
                          {t("mentorshipPage.rating")}
                          <select
                            value={reviewById[booking.id]?.rating || 5}
                            onChange={(event) =>
                              setReviewById((current) => ({
                                ...current,
                                [booking.id]: {
                                  ...current[booking.id],
                                  rating: Number(event.target.value),
                                },
                              }))
                            }
                          >
                            {[5, 4, 3, 2, 1].map((value) => (
                              <option key={value} value={value}>
                                {t("mentorshipPage.stars", { count: value })}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          {t("mentorshipPage.review")}
                          <textarea
                            value={reviewById[booking.id]?.review || ""}
                            onChange={(event) =>
                              setReviewById((current) => ({
                                ...current,
                                [booking.id]: {
                                  rating: current[booking.id]?.rating || 5,
                                  review: event.target.value,
                                },
                              }))
                            }
                          />
                        </label>
                        <button
                          className="btn primary small"
                          type="button"
                          disabled={
                            !reviewById[booking.id]?.review?.trim() ||
                            busyId === `review-${booking.id}`
                          }
                          onClick={() => submitReview(booking.id)}
                        >
                          {busyId === `review-${booking.id}` ? (
                            <ButtonLoader>
                              {t("mentorshipPage.submitting")}
                            </ButtonLoader>
                          ) : (
                            t("mentorshipPage.submitReview")
                          )}
                        </button>
                      </div>
                    )}
                  {booking.review && (
                    <p className="booking-review">
                      <IoStar /> {booking.review.rating}/5 Â·{" "}
                      {booking.review.review}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="mentor-search-panel">
            <label>
              <IoSearchOutline />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("mentorshipPage.searchPlaceholder")}
              />
            </label>
            <select
              value={skill}
              onChange={(event) => setSkill(event.target.value)}
            >
              <option value="">{t("mentorshipPage.allSkills")}</option>
              {skills.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          {isLoading ? (
            <SkeletonGrid
              className="mentor-grid"
              count={3}
              label={t("mentorshipPage.loading")}
              variant="mentor"
            />
          ) : filteredMentors.length ? (
            <div className="mentor-grid">
              {filteredMentors.map((rawMentor) => {
                const mentor = localizeMentorRecord(rawMentor, isKm);
                return (
                  <article className="mentor-card" key={mentor.id}>
                    <div className="mentor-card-person">
                      <UserAvatar user={mentor} />
                      <div>
                        <h3>{mentor.name}</h3>
                        <p className="mentor-title">{mentor.displayTitle}</p>
                      </div>
                    </div>
                    <p className="mentor-card-bio">{mentor.displayBio}</p>
                    <div className="mentor-skills">
                      {(mentor.skills || []).slice(0, 5).map((item) => (
                        <span className="skill-pill" key={item}>
                          {item}
                        </span>
                      ))}
                    </div>
                    <div className="mentor-meta">
                      <span>
                        <IoStar /> {mentor.rating || (isKm ? "ថ្មី" : "New")}{" "}
                        {mentor.reviewCount ? `(${mentor.reviewCount})` : ""}
                      </span>
                      <span>
                        <IoPeopleOutline /> {mentor.displaySessions}
                      </span>
                      <span>{mentor.displayLocation}</span>
                    </div>
                    <Link
                      to={`/mentorship/${mentor.id}`}
                      className="btn primary small"
                    >
                      {t("mentorshipPage.viewBook")}
                    </Link>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mentorship-empty">
              {t("mentorshipPage.noMentors")}
            </div>
          )}
        </section>
      </section>
    </main>
  );
};

export default Mentorship;
