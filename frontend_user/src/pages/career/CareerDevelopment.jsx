import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  IoCheckmarkCircleOutline,
  IoClipboardOutline,
  IoFlagOutline,
  IoTimeOutline,
  IoTrendingUpOutline,
} from "react-icons/io5";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useGlobleContext } from "../../context/GlobleContext";
import {
  fetchCareerArticle,
  fetchCareerArticles,
  fetchCareerAssessment,
  fetchCareerAssessments,
  fetchCareerBridge,
  fetchCareerOverview,
  fetchCareerPaths,
  startCareerRoadmapRequest,
  submitCareerAssessmentRequest,
  updateCareerRoadmapStepRequest,
} from "../../services/careerService";
import { ButtonLoader, SkeletonGrid } from "../../components/ui/LoadingStates";
import { useLanguage } from "../../context/LanguageContext";
import { CAREER_PATH_KM_MAP } from "../../utils/bilingualCatalog";
import "./CareerDevelopment.css";

const CareerDevelopment = () => {
  const { user } = useGlobleContext();
  const { language, t } = useLanguage();
  const isKm = language === "km";
  const [paths, setPaths] = useState([]);
  const [articles, setArticles] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [overview, setOverview] = useState(null);
  const [bridgeData, setBridgeData] = useState(null);
  const [activeAssessment, setActiveAssessment] = useState(null);
  const [answers, setAnswers] = useState({});
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [activeArticle, setActiveArticle] = useState(null);
  const [articleCategory, setArticleCategory] = useState("");
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadPage = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [pathRows, articleRows, assessmentRows] = await Promise.all([
        fetchCareerPaths(),
        fetchCareerArticles(),
        fetchCareerAssessments(),
      ]);
      setPaths(pathRows);
      setArticles(articleRows);
      setAssessments(assessmentRows);
      if (user) {
        const [overviewData, bridge] = await Promise.all([
          fetchCareerOverview(),
          fetchCareerBridge().catch(() => null),
        ]);
        setOverview(overviewData);
        setBridgeData(bridge);
      } else {
        setOverview(null);
        setBridgeData(null);
      }
    } catch (err) {
      setError(err.message || "Unable to load career development resources.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    Promise.resolve()
      .then(loadPage)
      .catch(() => undefined);
  }, [loadPage]);

  const recommendedMap = useMemo(
    () =>
      new Map(
        (overview?.recommendedPaths || []).map((path) => [
          path.id,
          path.matchScore,
        ]),
      ),
    [overview],
  );
  const categories = useMemo(
    () => [...new Set(articles.map((article) => article.category))],
    [articles],
  );
  const visibleArticles = articleCategory
    ? articles.filter((article) => article.category === articleCategory)
    : articles;
  const latestAssessment = assessmentResult || overview?.latestAssessment;
  const chartData = Object.entries(
    latestAssessment?.competencyScores || {},
  ).map(([competency, score]) => ({ competency, score }));

  const startRoadmap = async (path) => {
    if (!user) {
      setError("Login to select and track a career roadmap.");
      return;
    }
    try {
      setBusy(`path-${path.id}`);
      setError("");
      const response = await startCareerRoadmapRequest(path.id);
      setMessage(response.message);
      await loadPage();
    } catch (err) {
      setError(err.message || "Unable to select this roadmap.");
    } finally {
      setBusy("");
    }
  };

  const toggleStep = async (step) => {
    try {
      setBusy(`step-${step.id}`);
      setError("");
      const response = await updateCareerRoadmapStepRequest(
        overview.roadmap.id,
        step.id,
        !step.completed,
      );
      setMessage(response.message);
      await loadPage();
    } catch (err) {
      setError(err.message || "Unable to update roadmap progress.");
    } finally {
      setBusy("");
    }
  };

  const openAssessment = async (assessmentId) => {
    try {
      setBusy(`assessment-${assessmentId}`);
      setError("");
      const response = await fetchCareerAssessment(assessmentId);
      setActiveAssessment(response);
      setAnswers({});
      setAssessmentResult(null);
    } catch (err) {
      setError(err.message || "Unable to open this assessment.");
    } finally {
      setBusy("");
    }
  };

  const submitAssessment = async (event) => {
    event.preventDefault();
    if (!user) {
      setError("Login before saving an assessment result.");
      return;
    }
    try {
      setBusy("assessment-submit");
      setError("");
      const response = await submitCareerAssessmentRequest(
        activeAssessment.assessment.id,
        answers,
      );
      setAssessmentResult(response.attempt);
      setMessage(response.message);
      setActiveAssessment(null);
      await loadPage();
    } catch (err) {
      setError(err.message || "Unable to submit the assessment.");
    } finally {
      setBusy("");
    }
  };

  const openArticle = async (slug) => {
    try {
      setBusy(`article-${slug}`);
      const response = await fetchCareerArticle(slug);
      setActiveArticle(response.article);
    } catch (err) {
      setError(err.message || "Unable to open this article.");
    } finally {
      setBusy("");
    }
  };

  return (
    <main className="career-page">
      <section className="career-hero">
        <div className="container career-hero-inner">
          <div>
            <p className="eyebrow">{t("careerPage.eyebrow")}</p>
            <h1>{t("careerPage.heroTitle")}</h1>
            <p>{t("careerPage.heroDescription")}</p>
          </div>
          <div className="career-hero-actions">
            <Link className="btn primary" to="/cv-studio">
              {isKm ? "📄 បង្កើត PDF CV ឥតគិតថ្លៃ" : "📄 Free CV Builder (PDF)"}
            </Link>
            {user ? (
              <Link className="btn outline" to="/profile">
                {t("careerPage.updateGoal")}
              </Link>
            ) : (
              <Link className="btn outline" to="/login">
                {t("careerPage.loginTrack")}
              </Link>
            )}
            <a className="btn outline" href="#assessment">
              {t("careerPage.takeAssessment")}
            </a>
          </div>
        </div>
      </section>

      <section className="section container career-content">
        {error && <div className="auth-error">{error}</div>}
        {message && <div className="profile-success">{message}</div>}
        {user && (
          <div className="career-stats">
            <article>
              <IoTrendingUpOutline />
              <strong>{overview?.stats?.roadmapProgress || 0}%</strong>
              <span>{t("careerPage.roadmapProgress")}</span>
            </article>
            <article>
              <IoCheckmarkCircleOutline />
              <strong>{overview?.stats?.completedSteps || 0}</strong>
              <span>{t("careerPage.stepsCompleted")}</span>
            </article>
            <article>
              <IoClipboardOutline />
              <strong>{overview?.stats?.assessmentAttempts || 0}</strong>
              <span>{t("careerPage.assessments")}</span>
            </article>
            <article>
              <IoFlagOutline />
              <strong>{overview?.stats?.latestScore || 0}%</strong>
              <span>{t("careerPage.readinessScore")}</span>
            </article>
          </div>
        )}

        {overview?.roadmap && (
          <section className="active-roadmap-panel">
            <div className="career-section-header">
              <div>
                <p className="eyebrow">{t("careerPage.currentRoadmap")}</p>
                <h2>{overview.roadmap.path.title}</h2>
                <p>{overview.roadmap.path.description}</p>
              </div>
              <strong>{overview.roadmap.progressPercent}%</strong>
            </div>
            <div className="career-progress-track">
              <span style={{ width: `${overview.roadmap.progressPercent}%` }} />
            </div>
            <div className="roadmap-timeline">
              {overview.roadmap.steps.map((step) => (
                <article
                  className={step.completed ? "completed" : ""}
                  key={step.id}
                >
                  <button
                    type="button"
                    disabled={busy === `step-${step.id}`}
                    onClick={() => toggleStep(step)}
                    aria-label={`${step.completed ? "Reopen" : "Complete"} ${step.title}`}
                  >
                    {step.completed ? (
                      <IoCheckmarkCircleOutline />
                    ) : (
                      step.position
                    )}
                  </button>
                  <div>
                    <div className="roadmap-step-heading">
                      <h3>{step.title}</h3>
                      <span>
                        {step.skill} · {step.estimatedHours} {isKm ? "ម៉ោង" : "hours"}
                      </span>
                    </div>
                    <p>{step.description}</p>
                    <div className="roadmap-resources">
                      {step.resources.map((resource) => (
                        <span key={resource}>{resource}</span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {bridgeData?.nextMilestone && (
              <div className="milestone-learning-bridge">
                <div className="milestone-bridge-header">
                  <div className="milestone-bridge-icon">📚</div>
                  <div>
                    <h3>
                      {isKm
                        ? `ជំហានបន្ទាប់: ដំណាក់កាលទី ${bridgeData.nextMilestone.position} · ${bridgeData.nextMilestone.title}`
                        : `Next Milestone: Step ${bridgeData.nextMilestone.position} · ${bridgeData.nextMilestone.title}`}
                    </h3>
                    <p>
                      {isKm ? (
                        <>
                          វគ្គសិក្សាណែនាំដើម្បីចេះជំនាញ{" "}
                          <strong>{bridgeData.nextMilestone.skill}</strong> បានកាន់តែលឿន៖
                        </>
                      ) : (
                        <>
                          Recommended Academy courses to master{" "}
                          <strong>{bridgeData.nextMilestone.skill}</strong> faster:
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {bridgeData.nextMilestone.recommendedCourses?.length > 0 ? (
                  <div className="milestone-courses-grid">
                    {bridgeData.nextMilestone.recommendedCourses.map((c) => (
                      <article key={c.id} className="milestone-course-card">
                        {c.thumbnailUrl ? (
                          <img
                            src={c.thumbnailUrl}
                            alt={c.title}
                            className="milestone-course-thumb"
                          />
                        ) : (
                          <div className="milestone-course-thumb-placeholder">
                            📚
                          </div>
                        )}
                        <div className="milestone-course-details">
                          <span className="milestone-course-tag">
                            {c.category} · {c.level}
                          </span>
                          <h4>{c.title}</h4>
                          <Link
                            to={`/courses/${c.slug}`}
                            className="btn primary small milestone-learn-btn"
                          >
                            {isKm ? "ចាប់ផ្តើមរៀន →" : "Start Course →"}
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="milestone-courses-empty">
                    <p>
                      {isKm
                        ? `ស្វែងរកវគ្គសិក្សាពាក់ព័ន្ធនឹងជំនាញ ${bridgeData.nextMilestone.skill}៖`
                        : `Explore Academy courses covering ${bridgeData.nextMilestone.skill}:`}
                    </p>
                    <Link
                      to={`/courses?q=${encodeURIComponent(bridgeData.nextMilestone.skill)}`}
                      className="btn outline small"
                    >
                      {isKm
                        ? `ស្វែងរកវគ្គសិក្សា ${bridgeData.nextMilestone.skill} →`
                        : `Search Courses for ${bridgeData.nextMilestone.skill} →`}
                    </Link>
                  </div>
                )}

                {bridgeData.nextMilestone.recommendedPeers?.length > 0 && (
                  <div className="milestone-peers-callout">
                    <span>
                      {isKm
                        ? `🤝 សមាជិកសហគមន៍ដែលបង្រៀនជំនាញ ${bridgeData.nextMilestone.skill}៖`
                        : `🤝 Community Peers teaching ${bridgeData.nextMilestone.skill}:`}
                    </span>
                    <div className="milestone-peer-tags">
                      {bridgeData.nextMilestone.recommendedPeers.map((p) => (
                        <Link
                          key={p.id}
                          to={p.exchangeUrl}
                          className="peer-swap-chip"
                        >
                          {p.userName} ({p.skillOffered}) ➔
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {bridgeData?.internships &&
              bridgeData.internships.filter((j) => j.isRoadmapTarget).length > 0 && (
                <div className="roadmap-matching-jobs-section">
                  <div className="matching-jobs-header">
                    <div>
                      <span className="matching-jobs-eyebrow">
                        {isKm ? "ស្ពានភ្ជាប់អាជីពផ្ទាល់" : "Direct Career Bridge"}
                      </span>
                      <h3>
                        🎯{" "}
                        {isKm
                          ? `ឱកាសការងារសម្រាប់គោលដៅអាជីពរបស់អ្នក: ${overview.roadmap.path.targetRole}`
                          : `Open Opportunities for Your Target Role: ${overview.roadmap.path.targetRole}`}
                      </h3>
                      <p>
                        {isKm
                          ? "កម្មសិក្សា និងការងារពិតប្រាកដដែលកំពុងជ្រើសរើសបេក្ខជនតាមផែនទីអាជីពនេះ៖"
                          : "Real internships actively seeking candidates aligned with this roadmap:"}
                      </p>
                    </div>
                    <Link to="/jobs" className="btn outline small">
                      {isKm ? "មើលការងារទាំងអស់ →" : "View All in Jobs →"}
                    </Link>
                  </div>

                  <div className="matching-jobs-grid">
                    {bridgeData.internships
                      .filter((j) => j.isRoadmapTarget)
                      .slice(0, 3)
                      .map((job) => (
                        <article key={job.id} className="matching-job-card">
                          <div className="matching-job-top">
                            <div>
                              <h4>{job.title}</h4>
                              <p className="job-company-loc">
                                {job.company} · {job.location}
                              </p>
                            </div>
                            {job.matchScore !== null && (
                              <span
                                className={`matching-job-score ${
                                  job.matchScore >= 75
                                    ? "score-high"
                                    : "score-med"
                                }`}
                              >
                                ✨ {job.matchScore}% {isKm ? "ត្រូវគ្នា" : "Match"}
                              </span>
                            )}
                          </div>
                          <div className="matching-job-reqs">
                            {(job.requirements || []).slice(0, 4).map((r) => (
                              <span key={r} className="job-req-tag">
                                {r}
                              </span>
                            ))}
                          </div>
                          <div className="matching-job-footer">
                            <span className="job-stipend-text">
                              {job.stipend ||
                                (job.stipendAmount
                                  ? `$${job.stipendAmount}`
                                  : isKm
                                    ? "ប្រាក់ឧបត្ថម្ភសមរម្យ"
                                    : "Competitive")}
                            </span>
                            <Link to="/jobs" className="btn primary small">
                              {job.hasApplied
                                ? isKm
                                  ? "បានដាក់ពាក្យ ✓"
                                  : "Applied ✓"
                                : isKm
                                  ? "ដាក់ពាក្យការងារ →"
                                  : "Apply in Jobs →"}
                            </Link>
                          </div>
                        </article>
                      ))}
                  </div>
                </div>
              )}
          </section>
        )}

        <section>
          <div className="career-section-header">
            <div>
              <h2>
                {overview?.roadmap
                  ? t("careerPage.exploreAnother")
                  : t("careerPage.chooseRoadmap")}
              </h2>
              <p>{t("careerPage.roadmapDescription")}</p>
            </div>
          </div>
          {loading ? (
            <SkeletonGrid
              className="career-path-grid"
              count={3}
              label={t("careerPage.loadingRoadmaps")}
              variant="career"
            />
          ) : (
            <div className="career-path-grid">
              {paths.map((path) => {
                const kmPath =
                  CAREER_PATH_KM_MAP[String(path.title || "").trim().toLowerCase()];
                const displayTitle = isKm && kmPath ? kmPath.titleKm : path.title;
                const displayDesc = isKm && kmPath ? kmPath.descKm : path.description;
                const displayLevel =
                  isKm && String(path.level || "").toLowerCase() === "beginner"
                    ? "កម្រិតដំបូង"
                    : isKm && String(path.level || "").toLowerCase() === "intermediate"
                      ? "កម្រិតមធ្យម"
                      : path.level;
                return (
                <article className="career-path-card" key={path.id}>
                  <div className="career-path-heading">
                    <span>{displayLevel}</span>
                    {recommendedMap.has(path.id) && (
                      <strong>
                        {t("careerPage.profileMatch", {
                          score: recommendedMap.get(path.id),
                        })}
                      </strong>
                    )}
                  </div>
                  <h3>{displayTitle}</h3>
                  <p>{displayDesc}</p>
                  <div className="career-skill-list">
                    {path.skills.map((skill) => (
                      <span key={skill}>{skill}</span>
                    ))}
                  </div>
                  <div className="career-path-meta">
                    <span>
                      <IoTimeOutline />{" "}
                      {t("careerPage.weeks", { count: path.durationWeeks })}
                    </span>
                    <span>
                      {t("careerPage.milestones", { count: path.stepCount })}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn primary small"
                    disabled={
                      busy === `path-${path.id}` ||
                      overview?.roadmap?.path?.id === path.id
                    }
                    onClick={() => startRoadmap(path)}
                  >
                    {busy === `path-${path.id}` ? (
                      <ButtonLoader>{t("careerPage.selecting")}</ButtonLoader>
                    ) : overview?.roadmap?.path?.id === path.id ? (
                      t("careerPage.currentRoadmap")
                    ) : (
                      t("careerPage.selectRoadmap")
                    )}
                  </button>
                </article>
                );
              })}
            </div>
          )}
        </section>

        <section id="assessment" className="career-assessment-section">
          <div className="career-section-header">
            <div>
              <h2>{t("careerPage.skillAssessment")}</h2>
              <p>{t("careerPage.assessmentDescription")}</p>
            </div>
          </div>
          <div className={`assessment-layout ${latestAssessment ? "has-result" : "no-result"}`}>
            <div className="assessment-list">
              {assessments.map((assessment) => (
                <article key={assessment.id}>
                  <IoClipboardOutline />
                  <div>
                    <h3>
                      {isKm &&
                      String(assessment.title || "")
                        .toLowerCase()
                        .includes("career readiness")
                        ? "ការវាយតម្លៃសមត្ថភាពត្រៀមខ្លួនសម្រាប់អាជីព"
                        : assessment.title}
                    </h3>
                    <p>
                      {isKm &&
                      String(assessment.title || "")
                        .toLowerCase()
                        .includes("career readiness")
                        ? "វាស់វែងកម្រិតត្រៀមខ្លួនរបស់អ្នកលើជំនាញបច្ចេកទេស ការរៀបចំ Portfolio និងការសម្ភាសន៍ការងារ។"
                        : assessment.description}
                    </p>
                    <span>
                      {t("careerPage.questions", {
                        count: assessment.questionCount,
                      })}
                    </span>
                  </div>
                  <button
                    className="btn primary small"
                    type="button"
                    disabled={busy === `assessment-${assessment.id}`}
                    onClick={() => openAssessment(assessment.id)}
                  >
                    {busy === `assessment-${assessment.id}` ? (
                      <ButtonLoader>{t("careerPage.opening")}</ButtonLoader>
                    ) : (
                      t("careerPage.startAssessment")
                    )}
                  </button>
                </article>
              ))}
            </div>
            {latestAssessment && (
              <div className="assessment-result-panel">
                <div className="assessment-score">
                  <span>{t("careerPage.latestScore")}</span>
                  <strong>{latestAssessment.scorePercent}%</strong>
                </div>
                <div className="career-radar-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={chartData} outerRadius="70%">
                      <PolarGrid />
                      <PolarAngleAxis
                        dataKey="competency"
                        tick={{ fontSize: 11 }}
                      />
                      <PolarRadiusAxis domain={[0, 100]} tickCount={5} />
                      <Radar
                        name="Readiness"
                        dataKey="score"
                        stroke="#2563eb"
                        fill="#3b82f6"
                        fillOpacity={0.35}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="assessment-recommendations">
                  <h3>{t("careerPage.recommendedActions")}</h3>
                  {latestAssessment.recommendations.map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {activeAssessment && (
          <form className="assessment-form" onSubmit={submitAssessment}>
            <div className="career-section-header">
              <div>
                <h2>{activeAssessment.assessment.title}</h2>
                <p>{activeAssessment.assessment.description}</p>
              </div>
              <button
                type="button"
                className="btn outline"
                onClick={() => setActiveAssessment(null)}
              >
                {t("careerPage.close")}
              </button>
            </div>
            {activeAssessment.questions.map((question) => (
              <fieldset key={question.id}>
                <legend>
                  {question.position}. {question.question}
                </legend>
                <small>{question.competency}</small>
                <div>
                  {question.options.map((option, optionIndex) => (
                    <label key={option}>
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        checked={Number(answers[question.id]) === optionIndex}
                        onChange={() =>
                          setAnswers((current) => ({
                            ...current,
                            [question.id]: optionIndex,
                          }))
                        }
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
            <button
              className="btn primary"
              disabled={
                busy === "assessment-submit" ||
                Object.keys(answers).length !==
                  activeAssessment.questions.length
              }
            >
              {busy === "assessment-submit" ? (
                <ButtonLoader>{t("careerPage.scoring")}</ButtonLoader>
              ) : (
                t("careerPage.completeAssessment")
              )}
            </button>
          </form>
        )}

        <section className="career-advice-section">
          <div className="career-section-header">
            <div>
              <h2>{t("careerPage.careerAdvice")}</h2>
              <p>{t("careerPage.adviceDescription")}</p>
            </div>
            <select
              value={articleCategory}
              onChange={(event) => setArticleCategory(event.target.value)}
            >
              <option value="">{t("careerPage.allCategories")}</option>
              {categories.map((category) => (
                <option value={category} key={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          {loading ? (
            <SkeletonGrid
              className="career-article-grid"
              count={3}
              label={t("careerPage.loadingAdvice")}
              variant="career"
            />
          ) : (
            <div className="career-article-grid">
              {visibleArticles.map((article) => {
                const titleKey = String(article.title || "").trim().toLowerCase();
                const kmArticleMap = {
                  "how to choose a career path without guessing": {
                    categoryKm: "ការរៀបចំផែនការអាជីព",
                    titleKm: "របៀបជ្រើសរើសផ្លូវអាជីពបច្ចេកវិទ្យាឱ្យត្រូវនឹងសមត្ថភាពពិតប្រាកដ",
                    excerptKm: "ប្រើប្រាស់ភស្តុតាងពីគម្រោងសិក្សា ចំណូលចិត្ត និងមតិយោបល់ពីអ្នកណែនាំ ដើម្បីជ្រើសរើសទិសដៅអាជីពបន្ទាប់របស់អ្នកឱ្យបានច្បាស់លាស់។",
                  },
                  "build a portfolio that proves your skills": {
                    categoryKm: "គម្រោង Portfolio",
                    titleKm: "របៀបរៀបចំ Portfolio ដែលបង្ហាញពីសមត្ថភាពពិតប្រាកដរបស់អ្នក",
                    excerptKm: "Portfolio ដែលល្អមិនគ្រាន់តែបង្ហាញរូបភាពទេ ប៉ុន្តែពន្យល់ពីការសម្រេចចិត្តបច្ចេកទេស បញ្ហាប្រឈម លទ្ធផល និងអ្វីដែលអ្នកបានរៀន។",
                  },
                  "prepare for technical interviews with a feedback loop": {
                    categoryKm: "ការសម្ភាសន៍ការងារ",
                    titleKm: "តិចនិកត្រៀមសម្ភាសន៍បច្ចេកទេសប្រកបដោយប្រសិទ្ធភាព",
                    excerptKm: "ប្រែក្លាយការហាត់សមសម្ភាសន៍ឱ្យទៅជាប្រព័ន្ធប្រចាំសប្តាហ៍ ដោយពិនិត្យចំណុចខ្វះខាត និងកែលម្អជាមួយមិត្តភក្តិ ឬអ្នកណែនាំ។",
                  },
                  "make your first internship count": {
                    categoryKm: "កម្មសិក្សាការងារ",
                    titleKm: "គន្លឹះធ្វើឱ្យការហាត់ការ (Internship) លើកដំបូងទទួលបានជោគជ័យខ្ពស់",
                    excerptKm: "កំណត់គោលដៅច្បាស់លាស់ កត់ត្រាវឌ្ឍនភាពការងារ និងប្រែក្លាយបទពិសោធន៍ហាត់ការទៅជាភស្តុតាងសមត្ថភាពសម្រាប់ការងារពេញម៉ោង។",
                  },
                };
                const mapped = kmArticleMap[titleKey];
                const displayCat = isKm && mapped ? mapped.categoryKm : article.category;
                const displayTitle = isKm && mapped ? mapped.titleKm : article.title;
                const displayExcerpt = isKm && mapped ? mapped.excerptKm : article.excerpt;
                return (
                <article key={article.id}>
                  <span>{displayCat}</span>
                  <h3>{displayTitle}</h3>
                  <p>{displayExcerpt}</p>
                  <div>
                    <small>
                      {t("careerPage.minRead", {
                        count: article.readingMinutes,
                      })}
                    </small>
                    <button
                      type="button"
                      disabled={busy === `article-${article.slug}`}
                      onClick={() => openArticle(article.slug)}
                    >
                      {busy === `article-${article.slug}` ? (
                        <ButtonLoader>{t("careerPage.opening")}</ButtonLoader>
                      ) : (
                        t("careerPage.readArticle")
                      )}
                    </button>
                  </div>
                </article>
                );
              })}
            </div>
          )}
        </section>

        {activeArticle && (
          <div className="career-article-reader">
            <div className="career-section-header">
              <div>
                <span>
                  {activeArticle.category} ·{" "}
                  {t("careerPage.minRead", {
                    count: activeArticle.readingMinutes,
                  })}
                </span>
                <h2>{activeArticle.title}</h2>
              </div>
              <button
                className="btn outline"
                type="button"
                onClick={() => setActiveArticle(null)}
              >
                {t("careerPage.close")}
              </button>
            </div>
            <p>{activeArticle.content}</p>
          </div>
        )}
      </section>
    </main>
  );
};

export default CareerDevelopment;
