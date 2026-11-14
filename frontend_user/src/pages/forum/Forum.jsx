import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  IoAddCircleOutline,
  IoChatbubbleEllipsesOutline,
  IoCheckmarkDoneCircleOutline,
  IoEyeOutline,
  IoHeartOutline,
  IoHeart,
  IoHelpBuoyOutline,
  IoPricetagsOutline,
  IoSearchOutline,
  IoSparklesOutline,
  IoShareSocialOutline,
  IoBookmarkOutline,
  IoBookmark,
  IoSend,
  IoFlameOutline,
  IoPeopleOutline,
  IoDocumentTextOutline,
  IoRepeatOutline,
  IoSchoolOutline,
  IoCodeSlashOutline,
  IoBulbOutline,
  IoRocketOutline,
} from "react-icons/io5";
import { useGlobleContext } from "../../context/GlobleContext";
import { useLanguage } from "../../context/LanguageContext";
import UserAvatar from "../../components/ui/UserAvatar";
import {
  createForumPostRequest,
  fetchForumCategories,
  fetchForumPosts,
  fetchForumPost,
  toggleForumPostLikeRequest,
  createForumAnswerRequest,
} from "../../services/forumService";
import "./Forum.css";

const initialForm = {
  title: "",
  body: "",
  categoryId: "",
  postType: "discussion",
};

const TECH_REELS_STORIES = [
  {
    id: "reel-1",
    tagKm: "⚡ គន្លឹះ React 60s",
    tagEn: "⚡ 60s React Tip",
    titleKm: "ប្រើប្រាស់ useMemo & useCallback ឱ្យត្រឹមត្រូវ",
    titleEn: "Master useMemo & useCallback in React",
    author: "Dr. Sokha Chan",
    roleKm: "Senior Mentor",
    gradient: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)",
    searchKeyword: "React",
  },
  {
    id: "reel-2",
    tagKm: "🎯 អាជីព & CV",
    tagEn: "🎯 Career & CV",
    titleKm: "៣ ចំណុចដែល HR មើលមុនគេលើ PDF CV របស់និស្សិត IT",
    titleEn: "3 Things Tech Recruiters Check First on Your CV",
    author: "Dara Kem",
    roleKm: "Tech Recruiter",
    gradient: "linear-gradient(135deg, #047857 0%, #10b981 100%)",
    searchKeyword: "CV",
  },
  {
    id: "reel-3",
    tagKm: "🚀 គម្រោងនិស្សិត",
    tagEn: "🚀 Project Reel",
    titleKm: "របៀបរៀបចំ Portfolio GitHub ឱ្យទាក់ទាញក្រុមហ៊ុន",
    titleEn: "How to Structure Your GitHub Portfolio for Internships",
    author: "Vannak Pich",
    roleKm: "Full-Stack Mentor",
    gradient: "linear-gradient(135deg, #4338ca 0%, #6366f1 100%)",
    searchKeyword: "Portfolio",
  },
  {
    id: "reel-4",
    tagKm: "💡 UX/UI ទំនើប",
    tagEn: "💡 UI/UX Shorts",
    titleKm: "គោលការណ៍រចនា Dark Mode និងពុម្ពអក្សរខ្មែរឱ្យស្អាត",
    titleEn: "Designing Clean Khmer Typography & Dark Mode UI",
    author: "Bopha Meas",
    roleKm: "UI/UX Designer",
    gradient: "linear-gradient(135deg, #be123c 0%, #f43f5e 100%)",
    searchKeyword: "UI",
  },
];

const formatDate = (value, isKm = false) => {
  if (!value) return "";
  return new Intl.DateTimeFormat(isKm ? "km-KH" : "en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
};

const translateCategoryName = (name, isKm) => {
  if (!isKm || !name) return name;
  const map = {
    "Career": "អាជីព & ការងារ",
    "Career Growth": "ការអភិវឌ្ឍអាជីព",
    "Design": "ការរចនា UX/UI",
    "Design Critique": "ការរចនា UX/UI",
    "Internship": "ឱកាសកម្មសិក្សា",
    "Internships": "ឱកាសកម្មសិក្សា",
    "Programming": "ការសរសេរកូដ",
    "Programming Help": "ជំនួយការសរសេរកូដ",
    "Skill Exchange": "ការផ្លាស់ប្តូរជំនាញ",
    "Study Groups": "ក្រុមសិក្សារួមគ្នា",
    "General Discussion": "ការពិភាក្សាទូទៅ",
  };
  return map[name] || name;
};

const translateRoleBadge = (role, isKm) => {
  const r = String(role || "student").toLowerCase();
  if (r === "mentor") return isKm ? "អ្នកណែនាំជំនាញ (Mentor)" : "Verified Mentor";
  if (r === "recruiter") return isKm ? "អ្នកជ្រើសរើសបុគ្គលិក (HR)" : "Tech Recruiter";
  if (r === "admin") return isKm ? "អ្នកគ្រប់គ្រងសហគមន៍" : "Community Admin";
  return isKm ? "សមាជិកសហគមន៍ / និស្សិត" : "Community Member";
};

const Forum = () => {
  const { user } = useGlobleContext();
  const { language } = useLanguage();
  const isKm = language === "km";

  const [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [postType, setPostType] = useState("");
  const [sort, setSort] = useState("popular");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(initialForm);
  const [showComposer, setShowComposer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Social Interactive States (Likes, Saved Bookmarks, Expanded Text, Inline Comments)
  const [likedMap, setLikedMap] = useState({});
  const [savedPosts, setSavedPosts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sc_saved_forum_posts") || "[]");
    } catch {
      return [];
    }
  });
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [expandedBodies, setExpandedBodies] = useState({});
  const [openCommentsMap, setOpenCommentsMap] = useState({});
  const [postDetailsMap, setPostDetailsMap] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [commentSubmitting, setCommentSubmitting] = useState({});

  const loadForum = async (filters = {}) => {
    setLoading(true);
    setError("");
    try {
      const [categoryData, postData] = await Promise.all([
        fetchForumCategories(),
        fetchForumPosts({
          category: filters.category ?? selectedCategory,
          type: filters.type ?? postType,
          search: filters.search ?? search,
          sort: filters.sort ?? sort,
        }),
      ]);
      const categoryList = Array.isArray(categoryData)
        ? categoryData
        : categoryData?.categories || [];
      const postList = Array.isArray(postData)
        ? postData
        : postData?.posts || [];
      setCategories(categoryList);
      setPosts(postList);
      setForm((current) => ({
        ...current,
        categoryId: current.categoryId || categoryList[0]?.id || "",
      }));
    } catch (err) {
      setError(
        err.message ||
          (isKm
            ? "មិនអាចទាញយកការពិភាក្សាក្នុងសហគមន៍បានទេ។"
            : "Unable to load community discussions.")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForum();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, postType, search, sort]);

  const displayedPosts = useMemo(() => {
    if (!showSavedOnly) return posts;
    return posts.filter((p) => savedPosts.includes(p.id));
  }, [posts, showSavedOnly, savedPosts]);

  const trendingPosts = useMemo(() => {
    return [...posts]
      .sort(
        (a, b) =>
          (b.likesCount || 0) * 2 +
          (b.answersCount || 0) * 3 +
          (b.viewsCount || 0) -
          ((a.likesCount || 0) * 2 +
            (a.answersCount || 0) * 3 +
            (a.viewsCount || 0))
      )
      .slice(0, 4);
  }, [posts]);

  const stats = useMemo(
    () => ({
      posts: posts.length,
      solved: posts.filter((post) => post.isSolved).length,
      interactions: posts.reduce(
        (total, post) =>
          total +
          (post.answersCount || 0) +
          (post.commentsCount || 0) +
          (post.likesCount || 0),
        0
      ),
    }),
    [posts]
  );

  const handleSearch = (event) => {
    event.preventDefault();
    setSearch(searchInput.trim());
  };

  const handleCreatePost = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const created = await createForumPostRequest(form);
      setPosts((current) => [created, ...current]);
      setForm((current) => ({
        ...initialForm,
        categoryId: current.categoryId || categories[0]?.id || "",
      }));
      setShowComposer(false);
      setMessage(
        isKm
          ? "បានបង្ហោះចែករំលែកទៅកាន់បណ្តាញសង្គមសហគមន៍ដោយជោគជ័យ!"
          : "Your post is now live in the community feed!"
      );
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      setError(
        err.message ||
          (isKm ? "មិនអាចបង្កើតការបង្ហោះបានទេ។" : "Unable to publish post.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Like on Post in Feed
  const handleToggleLike = async (post) => {
    const currentlyLiked = Boolean(likedMap[post.id]);
    const delta = currentlyLiked ? -1 : 1;

    setLikedMap((prev) => ({ ...prev, [post.id]: !currentlyLiked }));
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, likesCount: Math.max(0, (p.likesCount || 0) + delta) }
          : p
      )
    );

    if (user) {
      try {
        const res = await toggleForumPostLikeRequest(post.id);
        if (typeof res?.likesCount === "number") {
          setPosts((prev) =>
            prev.map((p) =>
              p.id === post.id ? { ...p, likesCount: res.likesCount } : p
            )
          );
          setLikedMap((prev) => ({ ...prev, [post.id]: Boolean(res.liked) }));
        }
      } catch {
        // Keep optimistic UI state
      }
    }
  };

  // Toggle Save / Bookmark Post
  const handleToggleSave = (postId) => {
    setSavedPosts((prev) => {
      const exists = prev.includes(postId);
      const next = exists
        ? prev.filter((id) => id !== postId)
        : [...prev, postId];
      try {
        localStorage.setItem("sc_saved_forum_posts", JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  // Share Post Link
  const handleSharePost = (postId) => {
    const url = `${window.location.origin}/forum/${postId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    setMessage(
      isKm
        ? "🔗 បានចម្លងតំណភ្ជាប់ Post សម្រាប់ចែករំលែកបន្ត!"
        : "🔗 Post link copied to clipboard!"
    );
    setTimeout(() => setMessage(""), 3000);
  };

  // Open Inline Comment / Answer Drawer
  const handleToggleCommentDrawer = async (postId) => {
    const isOpen = Boolean(openCommentsMap[postId]);
    setOpenCommentsMap((prev) => ({ ...prev, [postId]: !isOpen }));

    if (!isOpen && !postDetailsMap[postId]) {
      try {
        const detail = await fetchForumPost(postId);
        setPostDetailsMap((prev) => ({ ...prev, [postId]: detail }));
      } catch {
        // Fallback empty
      }
    }
  };

  // Submit Inline Comment / Answer
  const handleInlineCommentSubmit = async (e, postId) => {
    e.preventDefault();
    const text = (commentInputs[postId] || "").trim();
    if (!text) return;

    if (!user) {
      setError(
        isKm
          ? "សូមចូលគណនីជាមុនសិន ដើម្បីបញ្ចេញមតិយោបល់។"
          : "Please sign in to post a comment."
      );
      return;
    }

    setCommentSubmitting((prev) => ({ ...prev, [postId]: true }));
    try {
      await createForumAnswerRequest(postId, text);
      const updatedDetail = await fetchForumPost(postId);
      setPostDetailsMap((prev) => ({ ...prev, [postId]: updatedDetail }));
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, answersCount: (p.answersCount || 0) + 1 }
            : p
        )
      );
    } catch (err) {
      setError(
        err.message ||
          (isKm ? "មិនអាចបញ្ចេញមតិបានទេ។" : "Unable to post comment.")
      );
    } finally {
      setCommentSubmitting((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const openQuickComposer = (type) => {
    setForm((prev) => ({ ...prev, postType: type }));
    setShowComposer(true);
  };

  return (
    <main className="forum-page social-community-page">
      {/* 1. COMPACT SOCIAL COMMUNITY HEADER + TECH REELS STORIES */}
      <section className="social-community-top-banner">
        <div className="container">
          <div className="social-top-header-row">
            <div>
              <span className="forum-eyebrow">
                <IoSparklesOutline />
                {isKm
                  ? "បណ្តាញសង្គមចែករំលែកចំណេះដឹង • Q&A • គន្លឹះខ្លីៗ"
                  : "Social Learning Network • Tech Reels • Q&A Feed"}
              </span>
              <h1 className="social-main-title">
                {isKm
                  ? "បណ្តាញសង្គមសហគមន៍ Smart Community"
                  : "Smart Community Social Feed"}
              </h1>
              <p className="social-main-sub">
                {isKm
                  ? "មើលចំណេះដឹងថ្មីៗ ចែករំលែកបទពិសោធន៍កូដ សួរសំណួរ និងទាក់ទងជាមួយមិត្តរួមជំនាញដូចនៅលើ Facebook, LinkedIn និង TikTok!"
                  : "Discover bite-sized tech tips, share projects, ask coding questions, and connect with peers and mentors."}
              </p>
            </div>

            <div className="social-mini-kpis">
              <div className="social-kpi-pill">
                <strong>{stats.posts}</strong>
                <span>{isKm ? "ការបង្ហោះ" : "Posts"}</span>
              </div>
              <div className="social-kpi-pill">
                <strong>{stats.interactions}</strong>
                <span>{isKm ? "សកម្មភាព" : "Interactions"}</span>
              </div>
              <div className="social-kpi-pill">
                <strong>{stats.solved}</strong>
                <span>{isKm ? "ដំណោះស្រាយ" : "Solved"}</span>
              </div>
            </div>
          </div>

          {/* TIKTOK / STORIES INSPIRED "TECH REELS & QUICK INSIGHTS" BAR */}
          <div className="tech-reels-strip-wrap">
            <div className="reels-strip-header">
              <span className="reels-badge-title">
                <IoFlameOutline />{" "}
                {isKm
                  ? "គន្លឹះខ្លីៗ & បទពិសោធន៍លេចធ្លោ (Tech Reels / Stories)"
                  : "Featured Tech Reels & Quick Insights"}
              </span>
              {search && (
                <button
                  type="button"
                  className="reels-reset-btn"
                  onClick={() => {
                    setSearch("");
                    setSearchInput("");
                  }}
                >
                  {isKm ? "បង្ហាញទាំងអស់វិញ ✕" : "Show All Posts ✕"}
                </button>
              )}
            </div>
            <div className="tech-reels-grid">
              {TECH_REELS_STORIES.map((reel) => (
                <button
                  key={reel.id}
                  type="button"
                  className="tech-reel-card"
                  style={{ background: reel.gradient }}
                  onClick={() => {
                    setSearchInput(reel.searchKeyword);
                    setSearch(reel.searchKeyword);
                  }}
                >
                  <span className="reel-top-tag">
                    {isKm ? reel.tagKm : reel.tagEn}
                  </span>
                  <strong className="reel-card-title">
                    {isKm ? reel.titleKm : reel.titleEn}
                  </strong>
                  <div className="reel-card-footer">
                    <span>{reel.author}</span>
                    <small>{reel.roleKm}</small>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. THREE-COLUMN SOCIAL MEDIA WORKSPACE */}
      <section className="container social-three-col-layout">
        {/* LEFT SIDEBAR: PROFILE CARD + CHANNEL FILTER + QUICK LINKS */}
        <aside className="social-left-sidebar">
          <div className="social-sidebar-card profile-mini-card glass">
            {user ? (
              <>
                <div className="mini-profile-top">
                  <UserAvatar user={user} size={54} />
                  <div>
                    <strong>{user.fullName}</strong>
                    <span>{translateRoleBadge(user.role, isKm)}</span>
                  </div>
                </div>
                <div className="mini-profile-links">
                  <Link to="/profile" className="mini-Quick-link">
                    <IoPeopleOutline />{" "}
                    {isKm ? "ប្រវត្តិរូបរបស់ខ្ញុំ" : "My Profile"}
                  </Link>
                  <Link to="/cv-studio" className="mini-Quick-link highlight">
                    <IoDocumentTextOutline />{" "}
                    {isKm
                      ? "បង្កើត CV ឥតគិតថ្លៃ (PDF)"
                      : "Free CV Builder (PDF)"}
                  </Link>
                  <Link to="/skill-exchange" className="mini-Quick-link">
                    <IoRepeatOutline />{" "}
                    {isKm ? "ផ្លាស់ប្តូរជំនាញគ្នា" : "Peer Skill Swap"}
                  </Link>
                </div>
              </>
            ) : (
              <div className="mini-guest-box">
                <h3>
                  {isKm ? "ចូលរួមសហគមន៍របស់យើង!" : "Join Smart Community!"}
                </h3>
                <p>
                  {isKm
                    ? "បង្កើតគណនីឥតគិតថ្លៃ ដើម្បីបង្ហោះសំណួរ ចែករំលែកចំណេះដឹង និងបង្កើត PDF CV។"
                    : "Sign in to share posts, comment, and build your free PDF CV."}
                </p>
                <div className="mini-guest-btns">
                  <Link to="/login" className="btn primary btn-full">
                    {isKm ? "ចូលគណនី (Sign In)" : "Sign In"}
                  </Link>
                  <Link to="/cv-studio" className="btn outline btn-full">
                    📄 {isKm ? "សាកល្បងបង្កើត CV ឥតគិតថ្លៃ" : "Try Free CV Builder"}
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Topic Channels */}
          <div className="social-sidebar-card channels-card glass">
            <h3 className="sidebar-box-title">
              <IoPricetagsOutline />{" "}
              {isKm ? "ប្រធានបទសហគមន៍ (Channels)" : "Topic Channels"}
            </h3>
            <div className="channel-nav-list">
              <button
                type="button"
                className={`channel-nav-item ${
                  !selectedCategory && !showSavedOnly ? "active" : ""
                }`}
                onClick={() => {
                  setSelectedCategory("");
                  setShowSavedOnly(false);
                }}
              >
                <span className="channel-hash">#</span>
                <span>
                  {isKm ? "មើលទាំងអស់ (All Feed)" : "All Community Feed"}
                </span>
              </button>

              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={`channel-nav-item ${
                    selectedCategory === category.slug ? "active" : ""
                  }`}
                  onClick={() => {
                    setSelectedCategory(category.slug);
                    setShowSavedOnly(false);
                  }}
                >
                  <span
                    className="channel-dot"
                    style={{ background: category.color || "#2563eb" }}
                  />
                  <span>{translateCategoryName(category.name, isKm)}</span>
                </button>
              ))}

              <button
                type="button"
                className={`channel-nav-item ${showSavedOnly ? "active" : ""}`}
                onClick={() => setShowSavedOnly((prev) => !prev)}
              >
                <IoBookmarkOutline />
                <span>
                  {isKm
                    ? `បានរក្សាទុក (${savedPosts.length})`
                    : `Saved Posts (${savedPosts.length})`}
                </span>
              </button>
            </div>
          </div>
        </aside>

        {/* CENTER COLUMN: INLINE COMPOSER + INTERACTIVE SOCIAL FEED */}
        <div className="social-center-feed">
          {error && <div className="forum-alert error">{error}</div>}
          {message && <div className="forum-alert success">{message}</div>}

          {/* FACEBOOK / LINKEDIN STYLE INLINE COMPOSER TRIGGER & FORM */}
          <div className="social-composer-box glass">
            <div className="composer-top-trigger">
              <UserAvatar
                user={user || { fullName: "Guest User" }}
                size={44}
              />
              <button
                type="button"
                className="composer-fake-input"
                onClick={() => {
                  if (!user) {
                    window.location.href = "/login";
                    return;
                  }
                  setShowComposer((prev) => !prev);
                }}
              >
                {isKm
                  ? "ចែករំលែកចំណេះដឹង សំណួរកូដ ឬស្នាដៃរបស់អ្នកទៅកាន់សហគមន៍..."
                  : "Share a coding tip, ask a question, or showcase your project..."}
              </button>
            </div>

            <div className="composer-action-pills">
              <button
                type="button"
                className="composer-pill-btn"
                onClick={() =>
                  user
                    ? openQuickComposer("discussion")
                    : (window.location.href = "/login")
                }
              >
                <IoBulbOutline style={{ color: "#10b981" }} />
                <span>
                  {isKm ? "ចែករំលែកចំណេះដឹង" : "Share Tech Insight"}
                </span>
              </button>
              <button
                type="button"
                className="composer-pill-btn"
                onClick={() =>
                  user
                    ? openQuickComposer("question")
                    : (window.location.href = "/login")
                }
              >
                <IoCodeSlashOutline style={{ color: "#2563eb" }} />
                <span>{isKm ? "សួរសំណួរកូដ (Q&A)" : "Ask Code Question"}</span>
              </button>
              <button
                type="button"
                className="composer-pill-btn"
                onClick={() =>
                  user
                    ? openQuickComposer("discussion")
                    : (window.location.href = "/login")
                }
              >
                <IoRocketOutline style={{ color: "#8b5cf6" }} />
                <span>{isKm ? "បង្ហាញគម្រោងស្នាដៃ" : "Showcase Project"}</span>
              </button>
            </div>

            {showComposer && user && (
              <form
                className="social-expanded-form"
                onSubmit={handleCreatePost}
              >
                <div className="forum-form-row">
                  <label>
                    {isKm ? "ប្រភេទការបង្ហោះ" : "Post Type"}
                    <select
                      value={form.postType}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          postType: event.target.value,
                        }))
                      }
                    >
                      <option value="discussion">
                        {isKm
                          ? "💡 ចែករំលែកចំណេះដឹង / ការពិភាក្សា"
                          : "💡 Tech Insight / Discussion"}
                      </option>
                      <option value="question">
                        {isKm
                          ? "❓ សំណួរកូដត្រូវការចម្លើយ"
                          : "❓ Question needing answers"}
                      </option>
                    </select>
                  </label>

                  <label>
                    {isKm ? "ប្រធានបទ (Channel)" : "Topic Channel"}
                    <select
                      value={form.categoryId}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          categoryId: event.target.value,
                        }))
                      }
                      required
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {translateCategoryName(category.name, isKm)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label>
                  {isKm ? "ចំណងជើងការបង្ហោះ" : "Headline / Title"}
                  <input
                    value={form.title}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    placeholder={
                      isKm
                        ? "ឧ. គន្លឹះរៀបចំ Database ឱ្យលឿន ឬ សួរពីបញ្ហា React Hook..."
                        : "e.g. How I optimized PostgreSQL queries or React state question..."
                    }
                    minLength={8}
                    maxLength={180}
                    required
                  />
                </label>

                <label>
                  {isKm ? "ខ្លឹមសារលម្អិត" : "Post Content"}
                  <textarea
                    rows={4}
                    value={form.body}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        body: event.target.value,
                      }))
                    }
                    placeholder={
                      isKm
                        ? "សរសេរចំណេះដឹង កូដ ឬសំណួររបស់អ្នកឱ្យបានច្បាស់លាស់..."
                        : "Write your insight, code snippet, or question..."
                    }
                    minLength={20}
                    required
                  />
                </label>

                <div className="composer-submit-row">
                  <button
                    type="button"
                    className="btn outline"
                    onClick={() => setShowComposer(false)}
                  >
                    {isKm ? "បោះបង់" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="btn primary"
                    disabled={submitting}
                  >
                    <IoSend />{" "}
                    {submitting
                      ? isKm
                        ? "កំពុងបង្ហោះ..."
                        : "Posting..."
                      : isKm
                        ? "បង្ហោះទៅកាន់សហគមន៍"
                        : "Publish Post"}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* SEARCH & FEED FILTER TABS */}
          <div className="social-feed-controls glass">
            <form className="social-search-bar" onSubmit={handleSearch}>
              <IoSearchOutline />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder={
                  isKm
                    ? "ស្វែងរកប្រធានបទ, React, UI/UX, CV..."
                    : "Search posts, React, UI/UX, CV..."
                }
              />
              <button type="submit">
                {isKm ? "ស្វែងរក" : "Search"}
              </button>
            </form>

            <div className="social-filter-pills">
              <button
                type="button"
                className={`feed-tab-pill ${
                  sort === "popular" && !postType ? "active" : ""
                }`}
                onClick={() => {
                  setSort("popular");
                  setPostType("");
                  setShowSavedOnly(false);
                }}
              >
                🔥 {isKm ? "ពេញនិយម" : "Trending"}
              </button>
              <button
                type="button"
                className={`feed-tab-pill ${
                  sort === "latest" && !postType ? "active" : ""
                }`}
                onClick={() => {
                  setSort("latest");
                  setPostType("");
                  setShowSavedOnly(false);
                }}
              >
                ✨ {isKm ? "ថ្មីៗបំផុត" : "Latest"}
              </button>
              <button
                type="button"
                className={`feed-tab-pill ${
                  postType === "question" ? "active" : ""
                }`}
                onClick={() => {
                  setPostType(postType === "question" ? "" : "question");
                  setShowSavedOnly(false);
                }}
              >
                ❓ {isKm ? "សំណួរកូដ" : "Questions"}
              </button>
              <button
                type="button"
                className={`feed-tab-pill ${
                  sort === "unanswered" ? "active" : ""
                }`}
                onClick={() => {
                  setSort("unanswered");
                  setShowSavedOnly(false);
                }}
              >
                🆘 {isKm ? "រង់ចាំចម្លើយ" : "Unanswered"}
              </button>
            </div>
          </div>

          {/* SOCIAL FEED STREAM */}
          <div className="social-posts-stream">
            {loading ? (
              <div className="forum-empty">
                {isKm
                  ? "កំពុងទាញយកបណ្តាញសង្គមសហគមន៍..."
                  : "Loading community social feed..."}
              </div>
            ) : displayedPosts.length ? (
              displayedPosts.map((post) => {
                const isLiked = Boolean(likedMap[post.id]);
                const isSaved = savedPosts.includes(post.id);
                const isExpanded = Boolean(expandedBodies[post.id]);
                const isCommentsOpen = Boolean(openCommentsMap[post.id]);
                const detail = postDetailsMap[post.id];
                const answersList = detail?.answers || [];
                const bodyText = String(post.body || "");
                const isLongBody = bodyText.length > 260;

                return (
                  <article className="social-post-card glass" key={post.id}>
                    {/* 1. Author Header */}
                    <div className="social-post-header">
                      <div className="social-author-info">
                        <UserAvatar
                          user={
                            post.author || {
                              fullName: "Community Member",
                            }
                          }
                          size={44}
                        />
                        <div>
                          <div className="author-name-line">
                            <strong>
                              {post.author?.fullName || "Community Member"}
                            </strong>
                            <span
                              className={`forum-type ${
                                post.postType || "discussion"
                              }`}
                            >
                              {post.postType === "question"
                                ? isKm
                                  ? "❓ សំណួរ"
                                  : "❓ Question"
                                : isKm
                                  ? "💡 ចំណេះដឹង"
                                  : "💡 Insight"}
                            </span>
                            {post.isSolved && (
                              <span className="social-solved-badge">
                                <IoCheckmarkDoneCircleOutline />{" "}
                                {isKm ? "ដោះស្រាយរួច" : "Solved"}
                              </span>
                            )}
                          </div>
                          <div className="author-sub-line">
                            <span>
                              {translateRoleBadge(post.author?.role, isKm)}
                            </span>
                            <span>•</span>
                            <span>{formatDate(post.createdAt, isKm)}</span>
                          </div>
                        </div>
                      </div>

                      {post.category && (
                        <span
                          className="forum-category-pill"
                          style={{
                            "--category-color":
                              post.category.color || "#315ca8",
                          }}
                        >
                          #{" "}
                          {translateCategoryName(post.category.name, isKm)}
                        </span>
                      )}
                    </div>

                    {/* 2. Post Content Body */}
                    <div className="social-post-body">
                      <Link
                        to={`/forum/${post.id}`}
                        className="social-post-title-link"
                      >
                        <h2>{post.title}</h2>
                      </Link>
                      <p className="social-post-text">
                        {isLongBody && !isExpanded
                          ? `${bodyText.slice(0, 260)}...`
                          : bodyText}
                      </p>
                      {isLongBody && (
                        <button
                          type="button"
                          className="social-read-more-btn"
                          onClick={() =>
                            setExpandedBodies((prev) => ({
                              ...prev,
                              [post.id]: !isExpanded,
                            }))
                          }
                        >
                          {isExpanded
                            ? isKm
                              ? "បង្រួមវិញ"
                              : "Show less"
                            : isKm
                              ? "អានបន្ថែម..."
                              : "Read more..."}
                        </button>
                      )}
                    </div>

                    {/* 3. Engagement Stats Strip */}
                    <div className="social-stats-strip">
                      <span>
                        ❤️ {post.likesCount || 0}{" "}
                        {isKm ? "ចូលចិត្ត" : "Likes"}
                      </span>
                      <div className="stats-right-group">
                        <button
                          type="button"
                          className="stats-link-btn"
                          onClick={() => handleToggleCommentDrawer(post.id)}
                        >
                          💬 {(post.answersCount || 0) + (post.commentsCount || 0)}{" "}
                          {isKm ? "មតិយោបល់ & ចម្លើយ" : "Comments & Answers"}
                        </button>
                        <span>
                          <IoEyeOutline /> {post.viewsCount || 0}{" "}
                          {isKm ? "បានមើល" : "Views"}
                        </span>
                      </div>
                    </div>

                    {/* 4. Interactive Social Action Bar */}
                    <div className="social-action-bar">
                      <button
                        type="button"
                        className={`social-action-btn ${
                          isLiked ? "liked" : ""
                        }`}
                        onClick={() => handleToggleLike(post)}
                      >
                        {isLiked ? <IoHeart /> : <IoHeartOutline />}
                        <span>{isKm ? "ចូលចិត្ត" : "Like"}</span>
                      </button>

                      <button
                        type="button"
                        className={`social-action-btn ${
                          isCommentsOpen ? "active" : ""
                        }`}
                        onClick={() => handleToggleCommentDrawer(post.id)}
                      >
                        <IoChatbubbleEllipsesOutline />
                        <span>{isKm ? "មតិយោបល់" : "Comment"}</span>
                      </button>

                      <button
                        type="button"
                        className="social-action-btn"
                        onClick={() => handleSharePost(post.id)}
                      >
                        <IoShareSocialOutline />
                        <span>{isKm ? "ចែករំលែក" : "Share"}</span>
                      </button>

                      <button
                        type="button"
                        className={`social-action-btn ${
                          isSaved ? "saved" : ""
                        }`}
                        onClick={() => handleToggleSave(post.id)}
                      >
                        {isSaved ? <IoBookmark /> : <IoBookmarkOutline />}
                        <span>{isKm ? "រក្សាទុក" : "Save"}</span>
                      </button>
                    </div>

                    {/* 5. Expandable Inline Comments & Answers Drawer */}
                    {isCommentsOpen && (
                      <div className="social-inline-comments-drawer">
                        <form
                          className="inline-comment-form"
                          onSubmit={(e) => handleInlineCommentSubmit(e, post.id)}
                        >
                          <UserAvatar
                            user={user || { fullName: "Guest" }}
                            size={34}
                          />
                          <input
                            type="text"
                            value={commentInputs[post.id] || ""}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({
                                ...prev,
                                [post.id]: e.target.value,
                              }))
                            }
                            placeholder={
                              isKm
                                ? "សរសេរមតិយោបល់ ឬចម្លើយជួយមិត្តរួមសហគមន៍..."
                                : "Write a helpful comment or answer..."
                            }
                          />
                          <button
                            type="submit"
                            disabled={commentSubmitting[post.id]}
                          >
                            <IoSend />
                          </button>
                        </form>

                        {answersList.length > 0 ? (
                          <div className="inline-answers-list">
                            {answersList.slice(0, 3).map((ans) => (
                              <div key={ans.id} className="inline-answer-item">
                                <UserAvatar
                                  user={ans.author || { fullName: "Member" }}
                                  size={32}
                                />
                                <div className="inline-answer-bubble">
                                  <div className="inline-ans-top">
                                    <strong>
                                      {ans.author?.fullName || "Member"}
                                    </strong>
                                    {ans.isAccepted && (
                                      <span className="ans-accepted-pill">
                                        ✓ {isKm ? "ចម្លើយត្រឹមត្រូវ" : "Accepted"}
                                      </span>
                                    )}
                                  </div>
                                  <p>{ans.body}</p>
                                </div>
                              </div>
                            ))}
                            <Link
                              to={`/forum/${post.id}`}
                              className="view-full-thread-link"
                            >
                              {isKm
                                ? `មើលការពិភាក្សាពេញលេញទាំងអស់ (${answersList.length}) →`
                                : `View full discussion thread (${answersList.length}) →`}
                            </Link>
                          </div>
                        ) : (
                          <div className="inline-empty-comments">
                            <span>
                              {isKm
                                ? "មិនទាន់មានមតិយោបល់នៅឡើយទេ។ ក្លាយជាអ្នកឆ្លើយដំបូងគេ!"
                                : "No comments yet. Be the first to share your thoughts!"}
                            </span>
                            <Link
                              to={`/forum/${post.id}`}
                              className="view-full-thread-link"
                            >
                              {isKm ? "បើកទំព័រលម្អិត →" : "Open full post →"}
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })
            ) : (
              <div className="forum-empty">
                <IoHelpBuoyOutline className="forum-empty-icon" />
                <h2>
                  {isKm ? "មិនមានការបង្ហោះត្រូវនឹងការស្វែងរកទេ" : "No matching posts found"}
                </h2>
                <p>
                  {isKm
                    ? "សូមសាកល្បងប្តូរពាក្យស្វែងរក ឬបង្កើតការបង្ហោះថ្មីទៅកាន់សហគមន៍។"
                    : "Try clearing your filter or publish a new post."}
                </p>
                <button
                  type="button"
                  className="btn outline"
                  onClick={() => {
                    setSelectedCategory("");
                    setPostType("");
                    setSearch("");
                    setSearchInput("");
                    setShowSavedOnly(false);
                  }}
                >
                  {isKm ? "បង្ហាញការបង្ហោះទាំងអស់" : "Reset All Filters"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDEBAR: TRENDING DISCUSSIONS & ECOSYSTEM SHORTCUTS */}
        <aside className="social-right-sidebar">
          <div className="social-sidebar-card trending-card glass">
            <h3 className="sidebar-box-title">
              <IoFlameOutline style={{ color: "#f97316" }} />{" "}
              {isKm ? "កំពុងពេញនិយម (Trending)" : "Trending Discussions"}
            </h3>
            <div className="trending-list">
              {trendingPosts.map((tp, idx) => (
                <Link
                  to={`/forum/${tp.id}`}
                  key={tp.id}
                  className="trending-item-link"
                >
                  <span className="trend-rank">0{idx + 1}</span>
                  <div>
                    <strong>{tp.title}</strong>
                    <small>
                      ❤️ {tp.likesCount || 0} • 💬 {tp.answersCount || 0}{" "}
                      {isKm ? "ចម្លើយ" : "replies"}
                    </small>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="social-sidebar-card ecosystem-promo-card glass">
            <h3 className="sidebar-box-title">
              <IoSchoolOutline style={{ color: "#2563eb" }} />{" "}
              {isKm ? "ភ្ជាប់ទំនាក់ទំនងក្នុងសហគមន៍" : "Community Ecosystem"}
            </h3>
            <p className="promo-desc">
              {isKm
                ? "ក្រៅពីការពិភាក្សាលើ Feed អ្នកអាចផ្លាស់ប្តូរជំនាញ 1:1 ឬបង្កើត PDF CV ដោយឥតគិតថ្លៃ!"
                : "Beyond the feed, swap skills with peers 1:1 or generate your free ATS PDF CV!"}
            </p>
            <div className="promo-links-stack">
              <Link to="/cv-studio" className="promo-action-card">
                <IoDocumentTextOutline className="promo-ico" />
                <div>
                  <strong>
                    {isKm ? "បង្កើត PDF CV ឥតគិតថ្លៃ" : "Free PDF CV Builder"}
                  </strong>
                  <small>
                    {isKm ? "4 ទម្រង់ស្អាតៗ • ទាញយកភ្លាម" : "4 Templates • Instant PDF"}
                  </small>
                </div>
              </Link>
              <Link to="/skill-exchange" className="promo-action-card">
                <IoRepeatOutline className="promo-ico" />
                <div>
                  <strong>
                    {isKm ? "ផ្លាស់ប្តូរជំនាញ (Skill Swap)" : "Peer Skill Exchange"}
                  </strong>
                  <small>
                    {isKm ? "រៀន និងបង្រៀនគ្នាដោយឥតគិតថ្លៃ" : "Learn & teach peers for free"}
                  </small>
                </div>
              </Link>
              <Link to="/mentorship" className="promo-action-card">
                <IoPeopleOutline className="promo-ico" />
                <div>
                  <strong>
                    {isKm ? "ជួបអ្នកណែនាំជំនាញ 1:1" : "1:1 Expert Mentors"}
                  </strong>
                  <small>
                    {isKm ? "ប្រឹក្សាអាជីព និងកូដផ្ទាល់" : "Book career & code reviews"}
                  </small>
                </div>
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
};

export default Forum;
