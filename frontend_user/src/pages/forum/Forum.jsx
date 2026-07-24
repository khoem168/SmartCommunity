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
import {
  createForumPostRequest,
  fetchForumCategories,
  fetchForumPosts,
} from "../../services/forumService";
import "./Forum.css";

const formatDate = (value) =>
  new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));

const Forum = () => {
  const { user } = useGlobleContext();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({ q: "", category: "", type: "", sort: "latest" });
  const [searchText, setSearchText] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", categoryId: "", postType: "question" });
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
      setError(err.message || "Unable to load the forum.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    Promise.resolve().then(loadForum).catch(() => undefined);
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
      setError(err.message || "Unable to publish your post.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="forum-page">
      <section className="forum-hero">
        <div className="container forum-hero-grid">
          <div>
            <span className="forum-eyebrow">Learn together</span>
            <h1>Community Forum</h1>
            <p>Ask focused questions, share useful ideas, and learn from the community.</p>
            <button className="btn primary" type="button" onClick={() => user ? setShowComposer((value) => !value) : navigate("/login")}>
              {user ? "Create a post" : "Login to ask"}
            </button>
          </div>
          <div className="forum-stat-grid">
            <div><strong>{stats.posts || 0}</strong><span>Total posts</span></div>
            <div><strong>{stats.questions || 0}</strong><span>Questions</span></div>
            <div><strong>{stats.discussions || 0}</strong><span>Discussions</span></div>
          </div>
        </div>
      </section>

      <section className="container forum-content">
        {error && <div className="forum-alert error">{error}</div>}
        {showComposer && user && (
          <form className="forum-composer" onSubmit={publishPost}>
            <div className="forum-section-heading"><div><span className="forum-eyebrow">Start a conversation</span><h2>Create a new post</h2></div><button className="forum-text-button" type="button" onClick={() => setShowComposer(false)}>Cancel</button></div>
            <div className="forum-form-row">
              <label>Post type<select value={form.postType} onChange={(event) => setForm({ ...form, postType: event.target.value })}><option value="question">Question</option><option value="discussion">Discussion</option></select></label>
              <label>Category<select value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
            </div>
            <label>Title<input required minLength="8" maxLength="250" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="What would you like to ask or discuss?" /></label>
            <label>Details<textarea required minLength="20" rows="6" value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} placeholder="Add context, what you tried, and the result you need." /></label>
            <button className="btn primary" disabled={busy} type="submit">{busy ? "Publishing..." : "Publish post"}</button>
          </form>
        )}

        <div className="forum-category-grid">
          <button className={`forum-category-card ${!filters.category ? "active" : ""}`} type="button" onClick={() => setFilters((current) => ({ ...current, category: "" }))}><span className="category-dot all" /><strong>All topics</strong><span>{stats.posts || 0} posts</span></button>
          {categories.map((category) => <button className={`forum-category-card ${filters.category === category.slug ? "active" : ""}`} key={category.id} type="button" onClick={() => setFilters((current) => ({ ...current, category: category.slug }))}><span className="category-dot" style={{ background: category.color }} /><strong>{category.name}</strong><span>{category.postCount} {Number(category.postCount) === 1 ? "post" : "posts"}</span></button>)}
        </div>

        <div className="forum-toolbar">
          <form className="forum-search" onSubmit={submitSearch}><IoSearchOutline /><input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search titles and posts" /><button type="submit">Search</button></form>
          <select aria-label="Post type" value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}><option value="">All types</option><option value="question">Questions</option><option value="discussion">Discussions</option></select>
          <select aria-label="Sort posts" value={filters.sort} onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value }))}><option value="latest">Latest</option><option value="popular">Popular</option><option value="unanswered">Unanswered</option></select>
        </div>

        <div className="forum-feed">
          {loading ? <div className="forum-empty">Loading community posts...</div> : posts.length === 0 ? <div className="forum-empty"><IoChatbubblesOutline className="forum-empty-icon" /><h2>No posts found</h2><p>Try another filter or start the first conversation.</p><button className="btn primary small" type="button" onClick={() => user ? setShowComposer(true) : navigate("/login")}>{user ? "Start a conversation" : "Login to create the first post"}</button></div> : posts.map((post) => (
            <article className="forum-post-card" key={post.id}>
              <div className="forum-vote-box"><IoHeartOutline /><strong>{post.likeCount}</strong><span>likes</span></div>
              <div className="forum-post-main">
                <div className="forum-post-meta"><span className={`forum-type ${post.postType}`}>{post.postType}</span><span className="forum-category-pill" style={{ "--category-color": post.category.color }}>{post.category.name}</span>{post.status === "closed" && <span className="forum-closed">Closed</span>}</div>
                <Link to={`/forum/${post.id}`}><h2>{post.title}</h2></Link>
                <p>{post.body.length > 220 ? `${post.body.slice(0, 220)}...` : post.body}</p>
                <div className="forum-post-footer"><span>By {post.authorName} · {formatDate(post.createdAt)}</span><div><span><IoChatbubblesOutline /> {post.answerCount} answers</span><span><IoEyeOutline /> {post.viewsCount} views</span>{post.hasAcceptedAnswer && <span className="forum-solved"><IoCheckmarkCircleOutline /> Solved</span>}</div></div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
};

export default Forum;
