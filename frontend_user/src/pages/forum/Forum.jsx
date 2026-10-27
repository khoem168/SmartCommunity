import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  IoChatbubblesOutline,
  IoCheckmarkCircleOutline,
  IoEyeOutline,
  IoHeartOutline,
  IoSearchOutline,
} from "react-icons/io5";
import { useGlobleContext } from "../../context/GlobleContext";
import { useLanguage } from "../../context/LanguageContext";
import { forumCopy } from "../../i18n/forumCopy";
import {
  createForumPostRequest,
  fetchForumCategories,
  fetchForumPosts,
} from "../../services/forumService";
import "./Forum.css";

const formatDate = (value, language) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat(
    language === "km" ? "km-KH" : "en", { dateStyle: "medium" },
  ).format(date);
};

const Forum = () => {
  const { user } = useGlobleContext();
  const { language } = useLanguage();
  const copy = forumCopy[language] || forumCopy.en;
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({
    q: "",
    category: "",
    type: "",
    sort: "latest",
  });
  const [searchText, setSearchText] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [form, setForm] = useState({
    title: "",
    body: "",
    categoryId: "",
    postType: "question",
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadForum = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [categoryRows, postData] = await Promise.all([
        fetchForumCategories(),
        fetchForumPosts(filters),
      ]);
      setCategories(categoryRows);
      setPosts(postData.posts || []);
      setStats(postData.stats || {});
      setForm((current) => ({
        ...current,
        categoryId: current.categoryId || String(categoryRows[0]?.id || ""),
      }));
    } catch (err) {
      setError(err.message || copy.loadError);
    } finally {
      setLoading(false);
    }
  }, [filters, copy]);

  useEffect(() => {
    Promise.resolve()
      .then(loadForum)
      .catch(() => undefined);
  }, [loadForum]);

  const submitSearch = (event) => {
    event.preventDefault();
    setFilters((current) => ({ ...current, q: searchText.trim() }));
  };

  const publishPost = async (event) => {
    event.preventDefault();
    if (!user) {
      navigate("/login");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await createForumPostRequest({
        ...form,
        categoryId: Number(form.categoryId),
      });
      navigate(`/forum/${response.post.id}`);
    } catch (err) {
      setError(err.message || copy.publishError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="forum-page">
      <section className="forum-hero">
        <div className="container forum-hero-grid">
          <div>
            <span className="forum-eyebrow">{copy.eyebrow}</span>
            <h1>{copy.title}</h1>
            <p>
              {copy.intro}
            </p>
            <button
              className="btn primary"
              type="button"
              onClick={() =>
                user ? setShowComposer((value) => !value) : navigate("/login")
              }
            >
              {user ? copy.create : copy.login}
            </button>
          </div>
          <div className="forum-stat-grid">
            <div>
              <strong>{stats.posts || 0}</strong>
              <span>{copy.total}</span>
            </div>
            <div>
              <strong>{stats.questions || 0}</strong>
              <span>{copy.questions}</span>
            </div>
            <div>
              <strong>{stats.discussions || 0}</strong>
              <span>{copy.discussions}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="container forum-content">
        {error && <div className="forum-alert error">{error}</div>}
        {showComposer && user && (
          <form className="forum-composer" onSubmit={publishPost}>
            <div className="forum-section-heading">
              <div>
                <span className="forum-eyebrow">{copy.start}</span>
                <h2>{copy.newPost}</h2>
              </div>
              <button
                className="forum-text-button"
                type="button"
                onClick={() => setShowComposer(false)}
              >
                {copy.cancel}
              </button>
            </div>
            <div className="forum-form-row">
              <label>
                {copy.type}
                <select
                  value={form.postType}
                  onChange={(event) =>
                    setForm({ ...form, postType: event.target.value })
                  }
                >
                  <option value="question">{copy.question}</option>
                  <option value="discussion">{copy.discussion}</option>
                </select>
              </label>
              <label>
                {copy.category}
                <select
                  value={form.categoryId}
                  onChange={(event) =>
                    setForm({ ...form, categoryId: event.target.value })
                  }
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              {copy.postTitle}
              <input
                required
                minLength="8"
                maxLength="250"
                value={form.title}
                onChange={(event) =>
                  setForm({ ...form, title: event.target.value })
                }
                placeholder={copy.titleHint}
              />
            </label>
            <label>
              {copy.details}
              <textarea
                required
                minLength="20"
                rows="6"
                value={form.body}
                onChange={(event) =>
                  setForm({ ...form, body: event.target.value })
                }
                placeholder={copy.detailsHint}
              />
            </label>
            <button className="btn primary" disabled={busy} type="submit">
              {busy ? copy.publishing : copy.publish}
            </button>
          </form>
        )}

        <div className="forum-category-grid">
          <button
            className={`forum-category-card ${!filters.category ? "active" : ""}`}
            type="button"
            aria-pressed={!filters.category}
            onClick={() =>
              setFilters((current) => ({ ...current, category: "" }))
            }
          >
            <span className="category-dot all" />
            <strong>{copy.allTopics}</strong>
            <span>{stats.posts || 0} {copy.posts}</span>
          </button>
          {categories.map((category) => (
            <button
              className={`forum-category-card ${filters.category === category.slug ? "active" : ""}`}
              key={category.id}
              aria-pressed={filters.category === category.slug}
              type="button"
              onClick={() =>
                setFilters((current) => ({
                  ...current,
                  category: category.slug,
                }))
              }
            >
              <span
                className="category-dot"
                style={{ background: category.color }}
              />
              <strong>{category.name}</strong>
              <span>
                {category.postCount}{" "}
                {copy.posts}
              </span>
            </button>
          ))}
        </div>

        <div className="forum-toolbar">
          <form className="forum-search" onSubmit={submitSearch}>
            <IoSearchOutline />
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder={copy.searchHint}
              aria-label={copy.searchHint}
            />
            <button type="submit">{copy.search}</button>
          </form>
          <select
            aria-label={copy.type}
            value={filters.type}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                type: event.target.value,
              }))
            }
          >
            <option value="">{copy.allTypes}</option>
            <option value="question">{copy.questions}</option>
            <option value="discussion">{copy.discussions}</option>
          </select>
          <select
            aria-label={copy.sort}
            value={filters.sort}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                sort: event.target.value,
              }))
            }
          >
            <option value="latest">{copy.latest}</option>
            <option value="popular">{copy.popular}</option>
            <option value="unanswered">{copy.unanswered}</option>
          </select>
        </div>

        <div className="forum-feed">
          {loading ? (
            <div className="forum-empty" role="status">{copy.loading}</div>
          ) : error && posts.length === 0 ? (
            <div className="forum-empty"><h2>{copy.loadError}</h2><button type="button" className="btn primary" onClick={loadForum}>{copy.retry}</button></div>
          ) : posts.length === 0 ? (
            <div className="forum-empty">
              <IoChatbubblesOutline className="forum-empty-icon" />
              <h2>{copy.empty}</h2>
              <p>{copy.emptyHint}</p>
              <button
                className="btn primary small"
                type="button"
                onClick={() =>
                  user ? setShowComposer(true) : navigate("/login")
                }
              >
                {user
                  ? copy.start
                  : copy.loginCreate}
              </button>
            </div>
          ) : (
            posts.map((post) => (
              <article className="forum-post-card" key={post.id}>
                <div className="forum-vote-box">
                  <IoHeartOutline />
                  <strong>{post.likeCount}</strong>
                  <span>{copy.likes}</span>
                </div>
                <div className="forum-post-main">
                  <div className="forum-post-meta">
                    <span className={`forum-type ${post.postType}`}>
                      {copy[post.postType] || post.postType}
                    </span>
                    <span
                      className="forum-category-pill"
                      style={{ "--category-color": post.category.color }}
                    >
                      {post.category.name}
                    </span>
                    {post.status === "closed" && (
                      <span className="forum-closed">{copy.closed}</span>
                    )}
                  </div>
                  <Link to={`/forum/${post.id}`}>
                    <h2>{post.title}</h2>
                  </Link>
                  <p>
                    {post.body.length > 220
                      ? `${post.body.slice(0, 220)}...`
                      : post.body}
                  </p>
                  <div className="forum-post-footer">
                    <span>
                      {copy.by} {post.authorName} · {formatDate(post.createdAt, language)}
                    </span>
                    <div>
                      <span>
                        <IoChatbubblesOutline /> {post.answerCount} {copy.answers}
                      </span>
                      <span>
                        <IoEyeOutline /> {post.viewsCount} {copy.views}
                      </span>
                      {post.hasAcceptedAnswer && (
                        <span className="forum-solved">
                          <IoCheckmarkCircleOutline /> {copy.solved}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
};

export default Forum;
