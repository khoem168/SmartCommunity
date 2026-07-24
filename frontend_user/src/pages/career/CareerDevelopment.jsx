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
  fetchCareerOverview,
  fetchCareerPaths,
  startCareerRoadmapRequest,
  submitCareerAssessmentRequest,
  updateCareerRoadmapStepRequest,
} from "../../services/careerService";
import "./CareerDevelopment.css";

const CareerDevelopment = () => {
  const { user } = useGlobleContext();
  const [paths, setPaths] = useState([]);
  const [articles, setArticles] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [overview, setOverview] = useState(null);
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
      if (user) setOverview(await fetchCareerOverview());
      else setOverview(null);
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
        (overview?.recommendedPaths || []).map((path) => [path.id, path.matchScore]),
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
  const chartData = Object.entries(latestAssessment?.competencyScores || {}).map(
    ([competency, score]) => ({ competency, score }),
  );

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
          <div><p className="eyebrow">Career Development</p><h1>Turn your career goal into a measurable learning plan.</h1><p>Choose a roadmap, assess your readiness, complete focused steps, and use practical advice to prepare for projects, interviews, and internships.</p></div>
          <div className="career-hero-actions">{user ? <Link className="btn primary" to="/profile">Update career goal</Link> : <Link className="btn primary" to="/login">Login to track progress</Link>}<a className="btn outline" href="#assessment">Take assessment</a></div>
        </div>
      </section>

      <section className="section container career-content">
        {error && <div className="auth-error">{error}</div>}
        {message && <div className="profile-success">{message}</div>}
        {loading && <p className="career-empty">Loading career resources...</p>}

        {user && (
          <div className="career-stats">
            <article><IoTrendingUpOutline /><strong>{overview?.stats?.roadmapProgress || 0}%</strong><span>Roadmap progress</span></article>
            <article><IoCheckmarkCircleOutline /><strong>{overview?.stats?.completedSteps || 0}</strong><span>Steps completed</span></article>
            <article><IoClipboardOutline /><strong>{overview?.stats?.assessmentAttempts || 0}</strong><span>Assessments</span></article>
            <article><IoFlagOutline /><strong>{overview?.stats?.latestScore || 0}%</strong><span>Readiness score</span></article>
          </div>
        )}

        {overview?.roadmap && (
          <section className="active-roadmap-panel">
            <div className="career-section-header"><div><p className="eyebrow">Current roadmap</p><h2>{overview.roadmap.path.title}</h2><p>{overview.roadmap.path.description}</p></div><strong>{overview.roadmap.progressPercent}%</strong></div>
            <div className="career-progress-track"><span style={{ width: `${overview.roadmap.progressPercent}%` }} /></div>
            <div className="roadmap-timeline">
              {overview.roadmap.steps.map((step) => (
                <article className={step.completed ? "completed" : ""} key={step.id}>
                  <button type="button" disabled={busy === `step-${step.id}`} onClick={() => toggleStep(step)} aria-label={`${step.completed ? "Reopen" : "Complete"} ${step.title}`}>{step.completed ? <IoCheckmarkCircleOutline /> : step.position}</button>
                  <div><div className="roadmap-step-heading"><h3>{step.title}</h3><span>{step.skill} · {step.estimatedHours} hours</span></div><p>{step.description}</p><div className="roadmap-resources">{step.resources.map((resource) => <span key={resource}>{resource}</span>)}</div></div>
                </article>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="career-section-header"><div><h2>{overview?.roadmap ? "Explore another path" : "Choose your career roadmap"}</h2><p>Each roadmap turns a target role into ordered, trackable milestones.</p></div></div>
          <div className="career-path-grid">
            {paths.map((path) => <article className="career-path-card" key={path.id}><div className="career-path-heading"><span>{path.level}</span>{recommendedMap.has(path.id) && <strong>{recommendedMap.get(path.id)}% profile match</strong>}</div><h3>{path.title}</h3><p>{path.description}</p><div className="career-skill-list">{path.skills.map((skill) => <span key={skill}>{skill}</span>)}</div><div className="career-path-meta"><span><IoTimeOutline /> {path.durationWeeks} weeks</span><span>{path.stepCount} milestones</span></div><button type="button" className="btn primary small" disabled={busy === `path-${path.id}` || overview?.roadmap?.path?.id === path.id} onClick={() => startRoadmap(path)}>{overview?.roadmap?.path?.id === path.id ? "Current roadmap" : "Select roadmap"}</button></article>)}
          </div>
        </section>

        <section id="assessment" className="career-assessment-section">
          <div className="career-section-header"><div><h2>Skill readiness assessment</h2><p>Self-evaluate four competencies and receive focused recommendations.</p></div></div>
          <div className="assessment-layout">
            <div className="assessment-list">{assessments.map((assessment) => <article key={assessment.id}><IoClipboardOutline /><div><h3>{assessment.title}</h3><p>{assessment.description}</p><span>{assessment.questionCount} questions</span></div><button className="btn primary small" type="button" disabled={busy === `assessment-${assessment.id}`} onClick={() => openAssessment(assessment.id)}>Start assessment</button></article>)}</div>
            {latestAssessment && <div className="assessment-result-panel"><div className="assessment-score"><span>Latest score</span><strong>{latestAssessment.scorePercent}%</strong></div><div className="career-radar-chart"><ResponsiveContainer width="100%" height="100%"><RadarChart data={chartData} outerRadius="70%"><PolarGrid /><PolarAngleAxis dataKey="competency" tick={{ fontSize: 11 }} /><PolarRadiusAxis domain={[0, 100]} tickCount={5} /><Radar name="Readiness" dataKey="score" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.35} /><Tooltip /></RadarChart></ResponsiveContainer></div><div className="assessment-recommendations"><h3>Recommended next actions</h3>{latestAssessment.recommendations.map((item) => <p key={item}>{item}</p>)}</div></div>}
          </div>
        </section>

        {activeAssessment && (
          <form className="assessment-form" onSubmit={submitAssessment}>
            <div className="career-section-header"><div><h2>{activeAssessment.assessment.title}</h2><p>{activeAssessment.assessment.description}</p></div><button type="button" className="btn outline" onClick={() => setActiveAssessment(null)}>Close</button></div>
            {activeAssessment.questions.map((question) => <fieldset key={question.id}><legend>{question.position}. {question.question}</legend><small>{question.competency}</small><div>{question.options.map((option, optionIndex) => <label key={option}><input type="radio" name={`question-${question.id}`} checked={Number(answers[question.id]) === optionIndex} onChange={() => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))} />{option}</label>)}</div></fieldset>)}
            <button className="btn primary" disabled={busy === "assessment-submit" || Object.keys(answers).length !== activeAssessment.questions.length}>{busy === "assessment-submit" ? "Scoring..." : "Complete assessment"}</button>
          </form>
        )}

        <section className="career-advice-section">
          <div className="career-section-header"><div><h2>Career advice</h2><p>Short, practical guidance for your next decision or application.</p></div><select value={articleCategory} onChange={(event) => setArticleCategory(event.target.value)}><option value="">All categories</option>{categories.map((category) => <option value={category} key={category}>{category}</option>)}</select></div>
          <div className="career-article-grid">{visibleArticles.map((article) => <article key={article.id}><span>{article.category}</span><h3>{article.title}</h3><p>{article.excerpt}</p><div><small>{article.readingMinutes} min read</small><button type="button" disabled={busy === `article-${article.slug}`} onClick={() => openArticle(article.slug)}>Read article</button></div></article>)}</div>
        </section>

        {activeArticle && <div className="career-article-reader"><div className="career-section-header"><div><span>{activeArticle.category} · {activeArticle.readingMinutes} min read</span><h2>{activeArticle.title}</h2></div><button className="btn outline" type="button" onClick={() => setActiveArticle(null)}>Close</button></div><p>{activeArticle.content}</p></div>}
      </section>
    </main>
  );
};

export default CareerDevelopment;
