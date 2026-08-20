import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  FiArrowLeft,
  FiBookOpen,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiExternalLink,
  FiFileText,
  FiLock,
  FiPlay,
  FiRefreshCw,
  FiShield,
  FiX,
} from "react-icons/fi";
import { useGlobleContext } from "../../context/GlobleContext";
import {
  createKhqrCoursePayment,
  fetchCourse,
  fetchCourseLesson,
  verifyKhqrCoursePayment,
} from "../../services/courseService";
import { ButtonLoader, CardSkeleton } from "../../components/ui/LoadingStates";
import { useLanguage } from "../../context/LanguageContext";
import "./CourseDetail.css";

const PAYMENT_POLL_MS = 3000;

const money = (amount, currency) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "KHR" ? 0 : 2,
  }).format(Number(amount || 0));

const youtubeEmbed = (value) => {
  try {
    const url = new URL(value);
    let id = "";
    if (url.hostname === "youtu.be") id = url.pathname.slice(1);
    if (url.hostname.includes("youtube.com")) {
      id = url.searchParams.get("v") || url.pathname.split("/embed/")[1] || "";
    }
    return id ? `https://www.youtube.com/embed/${id.split(/[?&/]/)[0]}` : "";
  } catch {
    return "";
  }
};

const countdownValue = (expiresAt) => {
  const remaining = Math.max(0, new Date(expiresAt).getTime() - Date.now());
  const minutes = String(Math.floor(remaining / 60000)).padStart(2, "0");
  const seconds = String(Math.floor((remaining % 60000) / 1000)).padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const CourseDetail = () => {
  const { courseId: courseSlug } = useParams();
  const navigate = useNavigate();
  const { user, isLoading: userLoading } = useGlobleContext();
  const { t } = useLanguage();
  const [course, setCourse] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [error, setError] = useState("");
  const [payment, setPayment] = useState(null);
  const [paymentState, setPaymentState] = useState("idle");
  const [paymentError, setPaymentError] = useState("");
  const [countdown, setCountdown] = useState("05:00");
  const pollRef = useRef(null);

  const loadCourse = useCallback(async () => {
    if (!user) {
      return null;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetchCourse(courseSlug);
      setCourse(response.course);
      return response.course;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [courseSlug, user]);

  const selectLesson = useCallback(
    async (item) => {
      setSelectedLessonId(item.id);
      if (item.isLocked) {
        setLesson(null);
        return;
      }
      setLessonLoading(true);
      setError("");
      try {
        const response = await fetchCourseLesson(courseSlug, item.id);
        setLesson(response.lesson);
      } catch (err) {
        setLesson(null);
        setError(err.message);
      } finally {
        setLessonLoading(false);
      }
    },
    [courseSlug],
  );

  useEffect(() => {
    if (userLoading) return undefined;
    if (!user) {
      return undefined;
    }
    let active = true;
    Promise.resolve()
      .then(loadCourse)
      .then((loadedCourse) => {
        if (!active || !loadedCourse?.lessons?.length) return;
        selectLesson(loadedCourse.lessons[0]);
      });
    return () => {
      active = false;
    };
  }, [loadCourse, selectLesson, user, userLoading]);

  const selectedMeta = useMemo(
    () => course?.lessons?.find((item) => item.id === selectedLessonId),
    [course, selectedLessonId],
  );
  const embedUrl = youtubeEmbed(lesson?.videoUrl);
  const paymentId = payment?.id || null;

  const clearPolling = useCallback(() => {
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const closePayment = () => {
    clearPolling();
    setPayment(null);
    setPaymentState("idle");
    setPaymentError("");
  };

  const beginPayment = async () => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/courses/${courseSlug}`)}`);
      return;
    }
    setPaymentState("creating");
    setPaymentError("");
    try {
      const response = await createKhqrCoursePayment(course.id);
      if (response.enrolled) {
        await loadCourse();
        setPaymentState("success");
        return;
      }
      setPayment(response.payment);
      setCountdown(countdownValue(response.payment.expiresAt));
      setPaymentState("pending");
    } catch (err) {
      if (err.code === "COURSE_ALREADY_OWNED") {
        await loadCourse();
        setPaymentState("success");
      } else {
        setPaymentError(err.message);
        setPaymentState("error");
      }
    }
  };

  const pollPayment = useCallback(async () => {
    if (!paymentId) return;
    try {
      const response = await verifyKhqrCoursePayment(paymentId);
      if (response.confirmed) {
        clearPolling();
        setPayment((current) => ({ ...current, ...response.payment }));
        setPaymentState("success");
        const refreshed = await loadCourse();
        const firstUnlocked =
          refreshed?.lessons?.find((item) => item.id === selectedLessonId) ||
          refreshed?.lessons?.[0];
        if (firstUnlocked) await selectLesson(firstUnlocked);
        return;
      }
      setPaymentError("");
    } catch (err) {
      if (err.code === "KHQR_EXPIRED" || err.response?.status === 410) {
        clearPolling();
        setPaymentState("expired");
        setPaymentError(err.message);
        return;
      }
      setPaymentError("Checking payment… " + err.message);
    }
  }, [
    clearPolling,
    loadCourse,
    paymentId,
    selectLesson,
    selectedLessonId,
  ]);

  useEffect(() => {
    if (paymentState !== "pending" || !paymentId) return undefined;
    Promise.resolve().then(pollPayment);
    pollRef.current = window.setInterval(pollPayment, PAYMENT_POLL_MS);
    return clearPolling;
  }, [clearPolling, paymentId, paymentState, pollPayment]);

  useEffect(() => {
    if (paymentState !== "pending" || !payment?.expiresAt) return undefined;
    const update = () => {
      const next = countdownValue(payment.expiresAt);
      setCountdown(next);
      if (next === "00:00") {
        clearPolling();
        setPaymentState("expired");
        setPaymentError("This KHQR code expired. Generate a new one.");
      }
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [clearPolling, payment?.expiresAt, paymentState]);

  useEffect(() => clearPolling, [clearPolling]);

  if (userLoading) {
    return (
      <main className="course-detail-page">
        <div className="container course-detail-state">
          <CardSkeleton variant="detail" />
        </div>
      </main>
    );
  }

  if (!user) {
    const redirectPath = `/courses/${courseSlug}`;
    const encodedRedirect = encodeURIComponent(redirectPath);

    return (
      <main className="course-detail-page">
        <div className="course-detail-state">
          <strong>{t("courseDetailPage.accountTitle")}</strong>
          <p>{t("courseDetailPage.accountDescription")}</p>
          <div className="course-detail-actions">
            <Link
              to={`/register?redirect=${encodedRedirect}`}
              className="learning-button primary"
            >
              {t("courseDetailPage.createAccount")}
            </Link>
            <Link
              to={`/login?redirect=${encodedRedirect}`}
              className="learning-button secondary"
            >
              {t("courseDetailPage.signIn")}
            </Link>
          </div>
          <Link to="/courses" className="course-back">
            <FiArrowLeft /> {t("courseDetailPage.backCourses")}
          </Link>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="course-detail-page">
        <div className="container course-detail-state">
          <CardSkeleton variant="detail" />
        </div>
      </main>
    );
  }

  if (error && !course) {
    return (
      <main className="course-detail-page">
        <div className="course-detail-state">
          <strong>Course unavailable</strong>
          <p>{error}</p>
          <Link to="/courses" className="learning-button secondary">
            Back to courses
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="course-detail-page">
      <section className="course-detail-hero">
        <div className="container">
          <Link to="/courses" className="course-back">
            <FiArrowLeft /> Course library
          </Link>
          <div className="course-detail-heading">
            <div>
              <div className="course-detail-tags">
                <span>{course.category}</span>
                <span>{course.level}</span>
                {course.isEnrolled && (
                  <span className="owned">
                    <FiCheckCircle /> Enrolled
                  </span>
                )}
              </div>
              <h1>{course.title}</h1>
              <p>{course.description}</p>
              <div className="course-detail-meta">
                <span>
                  <FiBookOpen /> {course.lessonCount} lessons
                </span>
                <span>
                  <FiClock /> {course.duration}
                </span>
                <span>By {course.instructor}</span>
              </div>
            </div>
            {!course.isEnrolled && (
              <aside className="course-price-card">
                <small>Unlock the complete course</small>
                <strong>{money(course.price, course.currency)}</strong>
                <p>One secure payment · Lifetime access</p>
                <button
                  type="button"
                  className="learning-button primary"
                  onClick={beginPayment}
                  disabled={paymentState === "creating"}
                >
                  {paymentState === "creating"
                    ? <ButtonLoader>Creating KHQR…</ButtonLoader>
                    : user
                      ? "Pay with Bakong KHQR"
                      : "Login to purchase"}
                </button>
                <span>
                  <FiShield /> Amount verified by the server
                </span>
              </aside>
            )}
          </div>
        </div>
      </section>

      <section className="container course-classroom">
        <aside className="lesson-sidebar">
          <header>
            <div>
              <small>Course content</small>
              <strong>{course.lessonCount} lessons</strong>
            </div>
            {course.isEnrolled ? (
              <span className="access-pill">
                <FiCheck /> Full access
              </span>
            ) : (
              <span className="access-pill preview">Preview</span>
            )}
          </header>
          <div className="lesson-list">
            {course.lessons.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`${selectedLessonId === item.id ? "active" : ""} ${
                  item.isLocked ? "locked" : ""
                }`}
                onClick={() => selectLesson(item)}
              >
                <span className="lesson-number">
                  {item.isLocked ? <FiLock /> : <FiPlay />}
                </span>
                <span>
                  <small>
                    Lesson {item.position}
                    {item.isPreview ? " · Free preview" : ""}
                  </small>
                  <strong>{item.title}</strong>
                  <em>{item.durationMinutes} min</em>
                </span>
              </button>
            ))}
          </div>
        </aside>

        <div className="lesson-workspace">
          {lessonLoading ? (
            <div className="lesson-placeholder">
              <ButtonLoader>Loading lesson…</ButtonLoader>
            </div>
          ) : selectedMeta?.isLocked ? (
            <div className="lesson-lock-screen">
              <span>
                <FiLock />
              </span>
              <p className="courses-kicker">Premium lesson</p>
              <h2>{selectedMeta.title}</h2>
              <p>
                Watch the free first lesson, then purchase once to unlock every
                video and PDF in this course.
              </p>
              <button
                type="button"
                className="learning-button primary"
                onClick={beginPayment}
              >
                {user
                  ? `Unlock for ${money(course.price, course.currency)}`
                  : "Login to unlock course"}
              </button>
            </div>
          ) : lesson ? (
            <>
              <div className="video-shell">
                {embedUrl ? (
                  <iframe
                    src={embedUrl}
                    title={lesson.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                ) : (
                  <div className="video-unavailable">
                    <FiPlay />
                    <span>Video link is not available for this lesson.</span>
                  </div>
                )}
              </div>
              <article className="lesson-detail">
                <div className="lesson-detail-title">
                  <div>
                    <p className="courses-kicker">
                      Lesson {lesson.position}
                      {lesson.isPreview ? " · Free preview" : ""}
                    </p>
                    <h2>{lesson.title}</h2>
                    <p>{lesson.description}</p>
                  </div>
                  <span>
                    <FiClock /> {lesson.durationMinutes} min
                  </span>
                </div>
                <div className="lesson-resource">
                  <span>
                    <FiFileText />
                  </span>
                  <div>
                    <strong>Lesson PDF resource</strong>
                    <small>Open or save the study material for offline review.</small>
                  </div>
                  {lesson.pdfUrl ? (
                    <a
                      href={lesson.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="learning-button secondary"
                    >
                      <FiDownload /> Open PDF
                    </a>
                  ) : (
                    <small>No PDF attached</small>
                  )}
                </div>
              </article>
            </>
          ) : (
            <div className="lesson-placeholder">
              <FiBookOpen />
              <strong>Select a lesson to begin</strong>
            </div>
          )}
        </div>
      </section>

      <section className="container course-outcomes">
        <div>
          <p className="courses-kicker">Learning outcomes</p>
          <h2>What you will be able to do</h2>
        </div>
        <div className="outcome-grid">
          {course.highlights.map((item) => (
            <span key={item}>
              <FiCheckCircle /> {item}
            </span>
          ))}
        </div>
      </section>

      {(payment || paymentState === "creating" || paymentState === "error") && (
        <div className="payment-backdrop" role="presentation">
          <section
            className="payment-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Bakong KHQR payment"
          >
            <header>
              <div>
                <span>KHQR</span>
                <small>Bakong secure course payment</small>
              </div>
              <button type="button" onClick={closePayment} aria-label="Close payment">
                <FiX />
              </button>
            </header>

            {paymentState === "creating" ? (
              <div className="payment-message">
                <h2><ButtonLoader>Creating secure KHQR…</ButtonLoader></h2>
                <p>The course price is being verified by the server.</p>
              </div>
            ) : paymentState === "success" ? (
              <div className="payment-message success">
                <span>
                  <FiCheck />
                </span>
                <h2>Payment confirmed</h2>
                <p>{course.title} is now unlocked for your account.</p>
                <button
                  type="button"
                  className="learning-button primary"
                  onClick={closePayment}
                >
                  Start learning
                </button>
              </div>
            ) : paymentState === "error" && !payment ? (
              <div className="payment-message error">
                <h2>KHQR unavailable</h2>
                <p>{paymentError}</p>
                <button
                  type="button"
                  className="learning-button secondary"
                  onClick={beginPayment}
                >
                  <FiRefreshCw /> Try again
                </button>
              </div>
            ) : (
              <div className="payment-body">
                <div className="payment-summary">
                  <div>
                    <small>Course</small>
                    <strong>{course.title}</strong>
                  </div>
                  <strong>{money(payment?.amount, payment?.currency)}</strong>
                </div>
                <div className="khqr-box">
                  {payment?.qrCode && (
                    <QRCodeSVG value={payment.qrCode} size={250} level="H" />
                  )}
                </div>
                <div className="payment-timer">
                  <span className={paymentState === "pending" ? "pulse" : ""} />
                  {paymentState === "expired"
                    ? "QR expired"
                    : `Waiting for payment · ${countdown}`}
                </div>
                <h2>Scan with your banking app</h2>
                <p>
                  Open Bakong or a KHQR-supported bank, scan this code, and
                  confirm the exact amount.
                </p>
                {paymentError && <div className="payment-error">{paymentError}</div>}
                {paymentState === "expired" ? (
                  <button
                    type="button"
                    className="learning-button primary full"
                    onClick={beginPayment}
                  >
                    <FiRefreshCw /> Generate new KHQR
                  </button>
                ) : (
                  <div className="payment-safe-note">
                    <FiShield />
                    Access unlocks only after Bakong confirms the transaction.
                  </div>
                )}
                <a
                  href="https://bakong.nbc.gov.kh/"
                  target="_blank"
                  rel="noreferrer"
                  className="payment-help"
                >
                  About Bakong KHQR <FiExternalLink />
                </a>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
};

export default CourseDetail;
