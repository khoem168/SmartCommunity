import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  FiArrowLeft,
  FiAward,
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
  FiUserPlus,
  FiVideo,
  FiX,
} from "react-icons/fi";
import { useGlobleContext } from "../../context/GlobleContext";
import {
  createKhqrCoursePayment,
  fetchCourse,
  fetchCourseLesson,
  verifyKhqrCoursePayment,
} from "../../services/courseService";
import { fetchCareerBridge } from "../../services/careerService";
import { ButtonLoader, CardSkeleton } from "../../components/ui/LoadingStates";
import { useLanguage } from "../../context/LanguageContext";
import { enrichCourseRecord } from "../../utils/bilingualCatalog";
import "./CourseDetail.css";

const PAYMENT_POLL_MS = 3000;

const LESSON_KM_MAP = {
  "Welcome and course roadmap": {
    titleKm: "ស្វាគមន៍ និងផែនទីបង្ហាញផ្លូវនៃការសិក្សា React.js",
    descKm: "ស្វែងយល់ពីរចនាសម្ព័ន្ធគម្រោង React ទំនើប ការរៀបចំឧបករណ៍សិក្សា និងគោលដៅនៃវគ្គសិក្សា។",
  },
  "Components, props, and composition": {
    titleKm: "ការបង្កើត Components, Props និងការរៀបចំប្លង់ UI",
    descKm: "រៀនបំបែកផ្ទៃកម្មវិធីទៅជា Components ដែលអាចប្រើឡើងវិញបាន និងការបញ្ជូនទិន្នន័យតាមរយៈ Props។",
  },
  "State, effects, and API data": {
    titleKm: "ការគ្រប់គ្រង State, useEffect និងការទាញទិន្នន័យពី API",
    descKm: "អនុវត្តការគ្រប់គ្រងទិន្នន័យថាមវន្តជាមួយ React Hooks និងភ្ជាប់ទិន្នន័យពិតប្រាកដពី REST API។",
  },
  "Node and Express foundations": {
    titleKm: "មូលដ្ឋានគ្រឹះនៃប្រព័ន្ធ Node.js និង Express Server",
    descKm: "ស្វែងយល់ពីដំណើរការ Backend Server ការរៀបចំ Middleware និងរចនាសម្ព័ន្ធគម្រោងស្តង់ដារ។",
  },
  "REST routes and controllers": {
    titleKm: "ការរចនា RESTful Routes និង Controllers",
    descKm: "បង្កើត Endpoint សម្រាប់ CRUD ទិន្នន័យ ការត្រួតពិនិត្យទិន្នន័យ (Validation) និងការឆ្លើយតប JSON។",
  },
  "Authentication and database security": {
    titleKm: "ប្រព័ន្ធផ្ទៀងផ្ទាត់ JWT Authentication និងសុវត្ថិភាព Database",
    descKm: "ការពារប្រព័ន្ធ API ជាមួយ JWT Token ការអ៊ិនគ្រីបពាក្យសម្ងាត់ និងការភ្ជាប់ MySQL ប្រកបដោយសុវត្ថិភាព។",
  },
  "Design thinking introduction": {
    titleKm: "មូលដ្ឋានគ្រឹះនៃ Design Thinking និងការស្រាវជ្រាវអ្នកប្រើប្រាស់",
    descKm: "ស្វែងយល់ពីដំណើរការគិតបែប UX ការវិភាគតម្រូវការអ្នកប្រើប្រាស់ និងការរៀបចំ User Journey។",
  },
  "Wireframes and visual hierarchy": {
    titleKm: "ការគូសប្លង់ Wireframes និងរចនាសម្ព័ន្ធ Visual Hierarchy",
    descKm: "រៀបចំប្លង់គេហទំព័រ និងកម្មវិធីទូរស័ព្ទក្នុង Figma ដោយប្រើប្រាស់ប្រព័ន្ធ Grid, Typography និងពណ៌។",
  },
  "Prototype and usability test": {
    titleKm: "ការបង្កើត Interactive Prototype និងការធ្វើតេស្តអ្នកប្រើប្រាស់",
    descKm: "ភ្ជាប់ផ្ទាំងរចនាទៅជា Prototype ដែលអាចចុចសាកល្បងបាន និងរបៀបរៀបចំ Design Handoff សម្រាប់ Developer។",
  },
  "Python foundations and first program": {
    titleKm: "មូលដ្ឋានគ្រឹះភាសា Python និងការសរសេរកម្មវិធីដំបូង",
    descKm: "ស្វែងយល់ពីអថេរ (Variables) ប្រភេទទិន្នន័យ និងរចនាសម្ព័ន្ធកូដ Python សម្រាប់អ្នកចាប់ផ្តើមដំបូង។",
  },
  "Collections, functions, and reusable logic": {
    titleKm: "ការប្រើប្រាស់ Lists, Dictionaries និង Functions",
    descKm: "រៀបចំទិន្នន័យជាក្រុម និងបង្កើតអនុគមន៍ (Functions) ដើម្បីដោះស្រាយបញ្ហាទិន្នន័យដោយស្វ័យប្រវត្តិ។",
  },
  "Read, clean, and summarize data": {
    titleKm: "ការអាន សម្អាត និងវិភាគទិន្នន័យជាមួយ Python",
    descKm: "អនុវត្តការទាញយកទិន្នន័យពីឯកសារ CSV/JSON ការសម្អាតទិន្នន័យ និងការបង្កើតរបាយការណ៍សង្ខេប។",
  },
  "Relational database foundations": {
    titleKm: "មូលដ្ឋានគ្រឹះនៃប្រព័ន្ធ Relational Database និង SQL",
    descKm: "យល់ដឹងពីតារាងទិន្នន័យ (Tables), Primary/Foreign Keys និងរបៀបរក្សាទុកទិន្នន័យក្នុងប្រព័ន្ធ MySQL។",
  },
  "Query, filter, group, and join data": {
    titleKm: "ការប្រើប្រាស់ SELECT, WHERE, GROUP BY និង JOIN",
    descKm: "ស្ទាត់ជំនាញការសរសេរសំណួរ SQL ដើម្បីទាញយក និងភ្ជាប់ទិន្នន័យពីតារាងច្រើនក្នុងពេលតែមួយ។",
  },
  "Schema quality and database safety": {
    titleKm: "ការរចនា Schema ស្តង់ដារ និងសុវត្ថិភាពទិន្នន័យ",
    descKm: "រៀនពីការធ្វើ Normalization ការបង្កើត Indexes ដើម្បីបង្កើនល្បឿន និងការការពារទិន្នន័យ។",
  },
  "Git and repository foundations": {
    titleKm: "មូលដ្ឋានគ្រឹះនៃ Git Version Control និង Repository",
    descKm: "រៀនគ្រប់គ្រងកំណែប្រែកូដជាមួយពាក្យបញ្ជា git init, add, commit និងការតាមដានប្រវត្តិកូដ។",
  },
  "Branches, merges, and conflict resolution": {
    titleKm: "ការប្រើប្រាស់ Branches, Merge និងការដោះស្រាយ Conflict",
    descKm: "អនុវត្តការបំបែក Branch សម្រាប់មុខងារថ្មីៗ និងរបៀបបញ្ចូលកូដគ្នាដោយមិនបាត់បង់ទិន្នន័យ។",
  },
  "Pull requests and professional teamwork": {
    titleKm: "ការបង្កើត Pull Requests និងការធ្វើការងារជាក្រុមលើ GitHub",
    descKm: "ស្វែងយល់ពីលំហូរការងារ GitHub ក្នុងក្រុមហ៊ុន ការពិនិត្យកូដ (Code Review) និងការរៀបចំ Portfolio។",
  },
};

const money = (amount, currency) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "KHR" ? 0 : 2,
  }).format(Number(amount || 0));

const youtubeEmbed = (value) => {
  if (!value) return "";
  const trimmed = String(value).trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return `https://www.youtube-nocookie.com/embed/${trimmed}?autoplay=1&rel=0`;
  }
  try {
    const url = new URL(trimmed);
    let id = "";
    if (url.hostname === "youtu.be") {
      id = url.pathname.slice(1);
    } else if (url.hostname.includes("youtube.com") || url.hostname.includes("youtube-nocookie.com")) {
      id = url.searchParams.get("v") || url.pathname.split("/embed/")[1] || "";
    }
    return id
      ? `https://www.youtube-nocookie.com/embed/${id.split(/[?&/]/)[0]}?autoplay=1&rel=0`
      : "";
  } catch {
    return "";
  }
};

const countdownValue = (expiresAt) => {
  const remaining = Math.max(0, new Date(expiresAt).getTime() - Date.now());
  const minutes = String(Math.floor(remaining / 60000)).padStart(2, "0");
  const seconds = String(Math.floor((remaining % 60000) / 1000)).padStart(
    2,
    "0",
  );
  return `${minutes}:${seconds}`;
};

const CourseDetail = () => {
  const { courseId: courseSlug } = useParams();
  const navigate = useNavigate();
  const { user, isLoading: userLoading } = useGlobleContext();
  const { t, language } = useLanguage();
  const isKm = language === "km";
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
  const [bridgeData, setBridgeData] = useState(null);
  const pollRef = useRef(null);

  const loadCourse = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [response, bridge] = await Promise.all([
        fetchCourse(courseSlug),
        fetchCareerBridge().catch(() => null),
      ]);
      const enriched = response.course
        ? {
            ...enrichCourseRecord(response.course),
            lessons: Array.isArray(response.course.lessons)
              ? response.course.lessons
              : [],
            highlights: Array.isArray(response.course.highlights)
              ? response.course.highlights
              : [],
          }
        : null;
      setCourse(enriched);
      setBridgeData(bridge);
      return enriched;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [courseSlug]);

  const selectLesson = useCallback(
    async (item) => {
      setSelectedLessonId(item.id);
      if (!user) {
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
    [courseSlug, user],
  );

  const matchingJobs = useMemo(() => {
    if (!course) return [];
    const cSlug = course.slug?.toLowerCase();
    const cTitle = course.title?.toLowerCase() || "";
    const cCat = course.category?.toLowerCase() || "";
    const highlights = (course.highlights || []).map((h) =>
      String(h).toLowerCase(),
    );

    const preMapped = bridgeData?.courseJobBridges?.find(
      (c) => c.courseSlug === cSlug || c.courseId === course.id,
    );
    if (preMapped?.jobs?.length) {
      return preMapped.jobs;
    }

    if (!bridgeData?.internships?.length) return [];
    return bridgeData.internships.filter((job) => {
      const reqs = (job.requirements || []).map((r) =>
        String(r).toLowerCase(),
      );
      return reqs.some(
        (r) =>
          cTitle.includes(r) ||
          r.includes(cTitle) ||
          cCat.includes(r) ||
          highlights.some((h) => h.includes(r) || r.includes(h)),
      );
    });
  }, [course, bridgeData]);

  useEffect(() => {
    if (userLoading) return undefined;
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
      navigate(
        `/login?redirect=${encodeURIComponent(`/courses/${courseSlug}`)}`,
      );
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
  }, [clearPolling, loadCourse, paymentId, selectLesson, selectedLessonId]);

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

  if (userLoading || loading) {
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
          <strong>{isKm ? "មិនអាចផ្ទុកវគ្គសិក្សាបានទេ" : "Course unavailable"}</strong>
          <p>{error}</p>
          <Link to="/courses" className="learning-button secondary">
            {isKm ? "ត្រឡប់ទៅបញ្ជីវគ្គសិក្សា" : "Back to courses"}
          </Link>
        </div>
      </main>
    );
  }

  if (!course) return null;

  const getLocalizedLessonTitle = (rawTitle) => {
    if (!isKm || !rawTitle) return rawTitle;
    return LESSON_KM_MAP[rawTitle]?.titleKm || rawTitle;
  };

  const getLocalizedLessonDesc = (rawTitle, rawDesc) => {
    if (!isKm) return rawDesc;
    return LESSON_KM_MAP[rawTitle]?.descKm || rawDesc;
  };

  return (
    <main className="course-detail-page">
      <section className="course-detail-hero">
        <div className="container">
          <Link to="/courses" className="course-back">
            <FiArrowLeft /> {isKm ? "បណ្ណាល័យវគ្គសិក្សា" : "Course library"}
          </Link>
          <div className="course-detail-heading">
            <div>
              <div className="course-detail-tags">
                <span>{isKm ? course.catKm || course.category : course.category}</span>
                <span>{isKm ? course.levelKm || course.level : course.level}</span>
                <span className="pdf-free-tag">
                  <FiFileText /> {isKm ? "ឯកសារ PDF ឥតគិតថ្លៃ" : "Free PDF Study Guide"}
                </span>
                {course.isEnrolled ? (
                  <span className="owned">
                    <FiCheckCircle /> {isKm ? "បានទិញវីដេអូពេញលេញ" : "Video Course Unlocked"}
                  </span>
                ) : (
                  <span className="video-price-tag">
                    <FiVideo /> {isKm ? "វីដេអូពេញលេញ $12.00" : "Full Video $12.00"}
                  </span>
                )}
              </div>
              <h1>{isKm ? course.titleKm || course.title : course.title}</h1>
              <p>{isKm ? course.descKm || course.description : course.description}</p>
              <div className="course-detail-meta">
                <span>
                  <FiBookOpen /> {course.lessonCount} {isKm ? "មេរៀន" : "lessons"}
                </span>
                <span>
                  <FiClock /> {isKm ? course.durationKm || course.duration : course.durationEn || course.duration}
                </span>
                <span>
                  <FiFileText /> {isKm ? "អាន PDF ឥតគិតថ្លៃសម្រាប់សមាជិក" : "Free PDF for registered members"}
                </span>
                <span>
                  <FiAward /> {isKm ? "វិញ្ញាបនបត្រឌីជីថលផ្លូវការ" : "Digital Certificate of Completion"}
                </span>
                <span>
                  🎓 {isKm ? `បង្រៀនដោយ ${course.instructor}` : `By ${course.instructor}`}
                </span>
              </div>
            </div>
            {!course.isEnrolled && (
              <aside className="course-price-card">
                <small>
                  {isKm
                    ? "គម្រោងសិក្សា · ឯកសារ PDF & វីដេអូ"
                    : "Course Access · Free PDF & Full Video"}
                </small>
                <strong>$12.00 USD</strong>
                <div className="course-access-breakdown">
                  <div className="access-row free">
                    <FiCheckCircle />
                    <span>
                      {isKm
                        ? "ឯកសារមេរៀន PDF: ឥតគិតថ្លៃ (គ្រាន់តែចុះឈ្មោះគណនី)"
                        : "Lesson PDF Guides: FREE (Registered account)"}
                    </span>
                  </div>
                  <div className="access-row paid">
                    <FiVideo />
                    <span>
                      {isKm
                        ? "វីដេអូបង្រៀនគ្រប់មេរៀន: $12.00 ថេរ (បង់តែម្តង)"
                        : "All Course Videos: $12.00 fixed (Lifetime access)"}
                    </span>
                  </div>
                  <div className="access-row cert">
                    <FiAward />
                    <span>
                      {isKm
                        ? "វិញ្ញាបនបត្រឌីជីថល: ទទួលបានក្រោយបញ្ចប់ការសិក្សា"
                        : "Digital Certificate: Included upon completion"}
                    </span>
                  </div>
                </div>
                {user ? (
                  <button
                    type="button"
                    className="learning-button primary full"
                    onClick={beginPayment}
                    disabled={paymentState === "creating"}
                  >
                    {paymentState === "creating" ? (
                      <ButtonLoader>{isKm ? "កំពុងបង្កើត KHQR…" : "Creating KHQR…"}</ButtonLoader>
                    ) : isKm ? (
                      "🔓 ទិញវីដេអូមេរៀនពេញលេញ $12.00 (KHQR)"
                    ) : (
                      "🔓 Unlock All Videos · $12.00 (KHQR)"
                    )}
                  </button>
                ) : (
                  <div className="guest-hero-actions">
                    <Link
                      to={`/register?redirect=${encodeURIComponent(`/courses/${courseSlug}`)}`}
                      className="learning-button primary full"
                    >
                      <FiUserPlus />{" "}
                      {isKm
                        ? "ចុះឈ្មោះគណនីឥតគិតថ្លៃ (អាន PDF Free)"
                        : "Register Free (Read PDFs Free)"}
                    </Link>
                    <Link
                      to={`/login?redirect=${encodeURIComponent(`/courses/${courseSlug}`)}`}
                      className="learning-button secondary full"
                    >
                      {isKm
                        ? "ចូលគណនីដើម្បីមើល PDF ឬទិញវីដេអូ $12"
                        : "Sign In for Free PDF or $12 Video"}
                    </Link>
                  </div>
                )}
                <span>
                  <FiShield />{" "}
                  {isKm
                    ? "ទូទាត់ប្រកបដោយសុវត្ថិភាពតាម Bakong KHQR ($12.00)"
                    : "Verified $12.00 checkout via Bakong KHQR"}
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
              <small>{isKm ? "មាតិកាវគ្គសិក្សា" : "Course content"}</small>
              <strong>
                {course.lessonCount} {isKm ? "មេរៀន" : "lessons"}
              </strong>
            </div>
            {course.isEnrolled ? (
              <span className="access-pill">
                <FiCheck /> {isKm ? "វីដេអូ + PDF បើកពេញលេញ" : "Video + PDF Unlocked"}
              </span>
            ) : user ? (
              <span className="access-pill pdf-free">
                <FiFileText /> {isKm ? "PDF ឥតគិតថ្លៃ" : "PDF Unlocked"}
              </span>
            ) : (
              <span className="access-pill preview">
                <FiLock /> {isKm ? "តម្រូវឱ្យចុះឈ្មោះ" : "Register Required"}
              </span>
            )}
          </header>
          <div className="lesson-list">
            {course.lessons.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`lesson-item ${selectedLessonId === item.id ? "active" : ""}`}
                onClick={() => selectLesson(item)}
              >
                <span className="lesson-item-icon">
                  {course.isEnrolled ? (
                    <FiPlay />
                  ) : user ? (
                    <FiFileText />
                  ) : (
                    <FiLock />
                  )}
                </span>
                <span className="lesson-item-body">
                  <small>
                    {isKm ? `មេរៀនទី ${item.position}` : `Lesson ${item.position}`}
                    {" · "}
                    <span className="lesson-inline-badge free">
                      {isKm ? "PDF ឥតគិតថ្លៃ" : "Free PDF"}
                    </span>
                  </small>
                  <strong>{getLocalizedLessonTitle(item.title)}</strong>
                </span>
                <em className="lesson-item-time">
                  {item.durationMinutes} {isKm ? "នាទី" : "min"}
                </em>
              </button>
            ))}
          </div>
        </aside>

        <div className="lesson-workspace">
          {lessonLoading ? (
            <div className="lesson-placeholder">
              <ButtonLoader>{isKm ? "កំពុងផ្ទុកមេរៀន…" : "Loading lesson…"}</ButtonLoader>
            </div>
          ) : !user ? (
            <div className="lesson-guest-gate">
              <div className="guest-gate-banner">
                <img
                  src={course.thumbnailUrl || course.fallbackThumbnailUrl}
                  alt={isKm ? course.titleKm : course.title}
                  onError={(e) => {
                    if (
                      course.fallbackThumbnailUrl &&
                      e.currentTarget.src !== course.fallbackThumbnailUrl
                    ) {
                      e.currentTarget.src = course.fallbackThumbnailUrl;
                    }
                  }}
                />
                <div className="guest-gate-overlay">
                  <span className="guest-gate-lock">
                    <FiLock />
                  </span>
                  <div className="guest-gate-badges">
                    <span className="gate-pill free">
                      📄 {isKm ? "ឯកសារមេរៀន PDF: ឥតគិតថ្លៃ" : "Lesson PDFs: FREE"}
                    </span>
                    <span className="gate-pill paid">
                      🎬 {isKm ? "វីដេអូមេរៀនពេញលេញ: $12.00" : "Full Video Course: $12.00"}
                    </span>
                  </div>
                  <h2>
                    {isKm
                      ? "សូមចុះឈ្មោះគណនី ដើម្បីបើកអានឯកសារ PDF ឥតគិតថ្លៃ!"
                      : "Register a Free Account to Read All Lesson PDFs!"}
                  </h2>
                  <p>
                    {isKm
                      ? "សមាជិកដែលបានចុះឈ្មោះគណនី អាចបើកអាន និងទាញយកឯកសារមេរៀន PDF គ្រប់មេរៀនដោយឥតគិតថ្លៃ។ ចំពោះការទស្សនាវីដេអូបង្រៀនពេញលេញ គឺតម្លៃថេរ $12.00 ក្នុងមួយវគ្គសិក្សា។"
                      : "Registered members can open and download every lesson's PDF study guide for FREE. Full HD video lessons require a one-time $12.00 course purchase."}
                  </p>
                  <div className="guest-gate-cta-row">
                    <Link
                      to={`/register?redirect=${encodeURIComponent(`/courses/${courseSlug}`)}`}
                      className="learning-button primary"
                    >
                      <FiUserPlus />{" "}
                      {isKm ? "ចុះឈ្មោះគណនីឥតគិតថ្លៃឥឡូវនេះ" : "Create Free Account Now"}
                    </Link>
                    <Link
                      to={`/login?redirect=${encodeURIComponent(`/courses/${courseSlug}`)}`}
                      className="learning-button secondary"
                    >
                      {isKm ? "មានគណនីរួចហើយ? ចូលប្រើប្រាស់" : "Already have an account? Sign In"}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : lesson ? (
            <>
              {/* 1. Video Player Shell Flush at Top of Workspace */}
              <div className="video-shell">
                {course.isEnrolled && embedUrl ? (
                  <iframe
                    src={embedUrl}
                    title={lesson.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                ) : (
                  <div className="video-locked-paywall">
                    <img
                      src={course.thumbnailUrl || course.fallbackThumbnailUrl}
                      alt={getLocalizedLessonTitle(lesson.title)}
                      className="video-locked-thumb"
                      onError={(e) => {
                        if (
                          course.fallbackThumbnailUrl &&
                          e.currentTarget.src !== course.fallbackThumbnailUrl
                        ) {
                          e.currentTarget.src = course.fallbackThumbnailUrl;
                        }
                      }}
                    />
                    <div className="video-locked-overlay">
                      <span className="video-locked-icon">
                        <FiLock />
                      </span>
                      <div className="guest-gate-badges">
                        <span className="gate-pill free">
                          📄 {isKm ? "ឯកសារ PDF: បើកអានឥតគិតថ្លៃ" : "PDF Guide: Unlocked Free"}
                        </span>
                        <span className="video-locked-pill">
                          🎬 {isKm ? "វីដេអូមេរៀនពេញលេញ: $12.00" : "Full Video Course: $12.00"}
                        </span>
                      </div>
                      <h3>{getLocalizedLessonTitle(lesson.title)}</h3>
                      <p>
                        {isKm
                          ? "អ្នកអាចបើកអានឯកសារមេរៀន PDF ដោយឥតគិតថ្លៃ! សម្រាប់ការទស្សនាវីដេអូបង្រៀនពេញលេញគ្រប់មេរៀន គឺតម្លៃថេរ $12.00 USD ក្នុងមួយវគ្គសិក្សា។"
                          : "You can read the PDF study guide for free! Unlock all full-length HD video lessons in this course for a one-time $12.00 USD payment."}
                      </p>
                      <div className="guest-gate-cta-row">
                        {lesson.pdfUrl && (
                          <a
                            href={lesson.pdfUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="learning-button secondary"
                          >
                            <FiFileText />{" "}
                            {isKm ? "បើកអានឯកសារ PDF (ឥតគិតថ្លៃ)" : "Read Free PDF Guide"}
                          </a>
                        )}
                        <button
                          type="button"
                          className="learning-button primary"
                          onClick={beginPayment}
                        >
                          <FiPlay />{" "}
                          {isKm
                            ? "ដោះសោវីដេអូគ្រប់មេរៀន ($12.00 KHQR)"
                            : "Unlock All Videos ($12.00 KHQR)"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Lesson Description & Prominent Free PDF Study Guide Bar */}
              <article className="lesson-detail">
                <div className="lesson-resource unlocked-pdf-banner">
                  <span>
                    <FiFileText />
                  </span>
                  <div>
                    <div className="pdf-banner-title-row">
                      <strong>
                        {isKm
                          ? `ឯកសារមេរៀនទី ${lesson.position} (PDF Study Guide)`
                          : `Lesson ${lesson.position} PDF Study Guide`}
                      </strong>
                      <span className="pdf-free-chip">
                        {isKm ? "ឥតគិតថ្លៃសម្រាប់សមាជិក" : "FREE FOR MEMBERS"}
                      </span>
                    </div>
                    <small>
                      {isKm
                        ? "អាចបើកអាន និងទាញយកឯកសារមេរៀន PDF នេះបានដោយឥតគិតថ្លៃ!"
                        : "Open or download this lesson's PDF study guide for free!"}
                    </small>
                  </div>
                  {lesson.pdfUrl ? (
                    <a
                      href={lesson.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="learning-button primary"
                    >
                      <FiDownload />{" "}
                      {isKm ? "បើកអាន PDF" : "Open Free PDF"}
                    </a>
                  ) : (
                    <small>{isKm ? "មិនមានភ្ជាប់ PDF" : "No PDF attached"}</small>
                  )}
                </div>

                <div className="lesson-detail-title">
                  <div>
                    <p className="courses-kicker">
                      {isKm ? `មេរៀនទី ${lesson.position}` : `Lesson ${lesson.position}`}
                      {" · "}
                      {course.isEnrolled
                        ? isKm
                          ? "បើកពេញលេញ (វីដេអូ + PDF)"
                          : "Full Access (Video + PDF)"
                        : isKm
                          ? "បើកអានឯកសារ PDF ឥតគិតថ្លៃ"
                          : "Free PDF Study Mode"}
                    </p>
                    <h2>{getLocalizedLessonTitle(lesson.title)}</h2>
                    <p>{getLocalizedLessonDesc(lesson.title, lesson.description)}</p>
                  </div>
                  <span>
                    <FiClock /> {lesson.durationMinutes} {isKm ? "នាទី" : "min"}
                  </span>
                </div>
              </article>
            </>
          ) : (
            <div className="lesson-placeholder">
              <FiBookOpen />
              <strong>{isKm ? "សូមជ្រើសរើសមេរៀនដើម្បីចាប់ផ្តើម" : "Select a lesson to begin"}</strong>
            </div>
          )}
        </div>
      </section>

      <section className="container course-outcomes">
        <div>
          <p className="courses-kicker">{isKm ? "លទ្ធផលនៃការសិក្សា" : "Learning outcomes"}</p>
          <h2>{isKm ? "អ្វីដែលអ្នកនឹងអាចធ្វើបានបន្ទាប់ពីបញ្ចប់វគ្គនេះ" : "What you will be able to do"}</h2>
        </div>
        <div className="outcome-grid">
          {(isKm && course.outcomesKm?.length ? course.outcomesKm : course.highlights).map(
            (item) => (
              <span key={item}>
                <FiCheckCircle /> {item}
              </span>
            ),
          )}
        </div>
      </section>

      {matchingJobs.length > 0 && (
        <section className="container course-career-bridge-section">
          <div className="course-career-bridge-card">
            <div className="bridge-card-header">
              <div className="bridge-icon-pill">💼</div>
              <div className="bridge-card-heading">
                <p className="courses-kicker">
                  {isKm
                    ? "ស្ពានភ្ជាប់អាជីព · ឱកាសការងារ និងកម្មសិក្សា"
                    : "Career Bridge · Employment Opportunities"}
                </p>
                <h2>
                  {isKm
                    ? "ការងារ និងកម្មសិក្សាដែលត្រូវការជំនាញក្នុងវគ្គសិក្សានេះ"
                    : "Jobs & Internships Requiring Skills in This Course"}
                </h2>
                <p>
                  {isKm
                    ? "ការបញ្ចប់វគ្គសិក្សានេះជួយឱ្យអ្នកមានលក្ខណៈសម្បត្តិគ្រប់គ្រាន់សម្រាប់ដាក់ពាក្យការងារខាងក្រោម៖"
                    : "Completing this course directly qualifies you for open positions on our platform:"}
                </p>
              </div>
              <Link to="/jobs" className="learning-button secondary bridge-all-btn">
                {isKm ? "មើលការងារទាំងអស់ →" : "Explore All Jobs →"}
              </Link>
            </div>
            <div className="course-jobs-list">
              {matchingJobs.slice(0, 3).map((job) => (
                <article key={job.id} className="course-job-item">
                  <div className="course-job-main">
                    <h4>{job.title}</h4>
                    <p className="course-job-meta">
                      {job.company} · {job.location}{" "}
                      {job.isRemote ? (isKm ? "· ធ្វើការពីចម្ងាយ" : "· Remote") : ""}
                    </p>
                  </div>
                  <div className="course-job-reqs">
                    {(Array.isArray(job.requirements)
                      ? job.requirements
                      : String(job.requirements || "").split(",")
                    )
                      .map((r) => String(r).replace(/^[\s[\]"']+|[\s[\]"']+$/g, "").trim())
                      .filter(Boolean)
                      .slice(0, 4)
                      .map((r) => (
                        <span key={r} className="course-req-pill">
                          {r}
                        </span>
                      ))}
                  </div>
                  <Link to="/jobs" className="learning-button primary small">
                    {isKm ? "មើលព័ត៌មានការងារ →" : "View in Jobs →"}
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {(payment || paymentState === "creating" || paymentState === "error") && (
        <div className="payment-backdrop" role="presentation">
          <section
            className="payment-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Bakong KHQR payment"
          >
            <header className="khqr-modal-header">
              <div className="khqr-brand-lockup">
                <span className="khqr-brand-mark" aria-hidden="true">
                  KHQR
                </span>
                <div>
                  <strong>
                    {isKm ? "ទូទាត់ថ្លៃវគ្គសិក្សាវីដេអូ ($12.00)" : "Secure Course Video Payment ($12.00)"}
                  </strong>
                  <small>{isKm ? "គាំទ្រដោយប្រព័ន្ធ Bakong KHQR" : "Powered by Bakong KHQR"}</small>
                </div>
              </div>
              <button
                type="button"
                onClick={closePayment}
                aria-label="Close payment"
              >
                <FiX />
              </button>
            </header>

            {paymentState === "creating" ? (
              <div className="payment-message">
                <h2>
                  <ButtonLoader>
                    {isKm ? "កំពុងបង្កើតកូដ KHQR សុវត្ថិភាព…" : "Creating secure KHQR…"}
                  </ButtonLoader>
                </h2>
                <p>
                  {isKm
                    ? "តម្លៃវគ្គសិក្សា $12.00 កំពុងត្រូវបានផ្ទៀងផ្ទាត់ដោយប្រព័ន្ធម៉ាស៊ីនមេ។"
                    : "The $12.00 course price is being verified by the server."}
                </p>
              </div>
            ) : paymentState === "success" ? (
              <div className="payment-message success">
                <span>
                  <FiCheck />
                </span>
                <h2>{isKm ? "ការទូទាត់បានជោគជ័យ!" : "Payment confirmed"}</h2>
                <p>
                  {isKm
                    ? `វីដេអូទាំងអស់ក្នុងវគ្គ ${course.titleKm || course.title} ត្រូវបានដោះសោសម្រាប់គណនីរបស់អ្នក។`
                    : `${course.title} is now unlocked for your account.`}
                </p>
                <button
                  type="button"
                  className="learning-button primary"
                  onClick={closePayment}
                >
                  {isKm ? "ចាប់ផ្តើមទស្សនាវីដេអូ" : "Start learning"}
                </button>
              </div>
            ) : paymentState === "error" && !payment ? (
              <div className="payment-message error">
                <h2>{isKm ? "មិនអាចបង្កើតកូដ KHQR បានទេ" : "KHQR unavailable"}</h2>
                <p>{paymentError}</p>
                <button
                  type="button"
                  className="learning-button secondary"
                  onClick={beginPayment}
                >
                  <FiRefreshCw /> {isKm ? "ព្យាយាមម្តងទៀត" : "Try again"}
                </button>
              </div>
            ) : (
              <div className="payment-body">
                <div className="khqr-receipt">
                  <div className="khqr-receiver">
                    <small>{isKm ? "ទូទាត់ជូន" : "PAY TO"}</small>
                    <strong>
                      {payment?.merchantName || "Smart Community"}
                    </strong>
                    <span>Smart Community Skill &amp; Career</span>
                  </div>

                  <div className="payment-summary">
                    <div>
                      <small>{isKm ? "វគ្គសិក្សាវីដេអូ" : "COURSE"}</small>
                      <strong>{isKm ? course.titleKm || course.title : course.title}</strong>
                    </div>
                    <div className="payment-amount">
                      <small>{isKm ? "តម្លៃថេរ" : "AMOUNT"}</small>
                      <strong>
                        {money(payment?.amount || 12, payment?.currency || "USD")}
                      </strong>
                    </div>
                  </div>

                  <div className="khqr-box">
                    {payment?.qrCode && (
                      <QRCodeSVG
                        value={payment.qrCode}
                        size={210}
                        level="H"
                        title="Bakong KHQR payment code"
                      />
                    )}
                  </div>

                  <div className="payment-timer">
                    <span
                      className={paymentState === "pending" ? "pulse" : ""}
                    />
                    {paymentState === "expired"
                      ? isKm
                        ? "កូដ QR បានផុតកំណត់"
                        : "QR expired"
                      : isKm
                        ? `កំពុងរង់ចាំការទូទាត់ · ${countdown}`
                        : `Waiting for payment · ${countdown}`}
                  </div>
                </div>

                <h2>{isKm ? "ស្កេនកូដ QR ដើម្បីទូទាត់ប្រាក់ $12.00" : "Scan to pay $12.00 securely"}</h2>
                <p>
                  {isKm
                    ? "សូមបើកកម្មវិធី Bakong ឬកម្មវិធីធនាគារដែលគាំទ្រ KHQR (ABA, ACLEDA, Wing...) រួចស្កេនកូដខាងលើដើម្បីដោះសោវីដេអូមេរៀនទាំងអស់ភ្លាមៗ។"
                    : "Open Bakong or any KHQR-supported banking app, scan the code, and confirm the $12.00 amount shown above."}
                </p>
                {paymentError && (
                  <div className="payment-error">{paymentError}</div>
                )}
                {paymentState === "expired" ? (
                  <button
                    type="button"
                    className="learning-button primary full"
                    onClick={beginPayment}
                  >
                    <FiRefreshCw /> {isKm ? "បង្កើតកូដ KHQR ថ្មី" : "Generate new KHQR"}
                  </button>
                ) : (
                  <div className="payment-safe-note">
                    <FiShield />
                    {isKm
                      ? "វីដេអូមេរៀនទាំងអស់នឹងបើកដោយស្វ័យប្រវត្តិភ្លាមៗបន្ទាប់ពីស្កេនបង់ប្រាក់រួច។"
                      : "Course video access unlocks automatically once payment is confirmed."}
                  </div>
                )}
                <div className="khqr-support-row">
                  <div>
                    <small>MEMBER OF</small>
                    <strong>BAKONG</strong>
                  </div>
                  <div>
                    <small>{isKm ? "ទទួលស្គាល់ដោយ" : "ACCEPTED BY"}</small>
                    <span>{isKm ? "គ្រប់ធនាគារគាំទ្រ KHQR" : "KHQR-enabled banks"}</span>
                  </div>
                  <a
                    href="https://bakong.nbc.gov.kh/"
                    target="_blank"
                    rel="noreferrer"
                    className="payment-help"
                  >
                    {isKm ? "ស្វែងយល់បន្ថែម" : "Learn more"} <FiExternalLink />
                  </a>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
};

export default CourseDetail;
