import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  IoArrowBackOutline,
  IoChatbubbleOutline,
  IoCheckmarkCircle,
  IoEyeOutline,
  IoHeart,
  IoHeartOutline,
  IoTrashOutline,
} from "react-icons/io5";
import { useGlobleContext } from "../../context/GlobleContext";
import { useLanguage } from "../../context/LanguageContext";
import UserAvatar from "../../components/ui/UserAvatar";
import {
  localizeForumAnswer,
  localizeForumPost,
} from "../../utils/bilingualCatalog";
import {
  acceptForumAnswerRequest,
  createForumAnswerRequest,
  createForumCommentRequest,
  deleteForumAnswerRequest,
  deleteForumCommentRequest,
  deleteForumPostRequest,
  fetchForumPost,
  toggleForumAnswerLikeRequest,
  toggleForumPostLikeRequest,
  updateForumPostRequest,
} from "../../services/forumService";
import "./Forum.css";

const formatDate = (value, isKm = false) => {
  if (!value) return "";
  return new Intl.DateTimeFormat(isKm ? "km-KH" : "en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const Avatar = ({ name, image }) => (
  <UserAvatar
    user={{ name, avatarUrl: image }}
    className="forum-avatar"
  />
);

const ForumDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useGlobleContext();
  const { language } = useLanguage();
  const isKm = language === "km";
  const [data, setData] = useState(null);
  const [answer, setAnswer] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadPost = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await fetchForumPost(postId));
    } catch (err) {
      setError(
        err.message ||
          (isKm
            ? "មិនអាចទាញយកទិន្នន័យការពិភាក្សានេះបានទេ។"
            : "Unable to load this post.")
      );
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    Promise.resolve()
      .then(loadPost)
      .catch(() => undefined);
  }, [loadPost]);

  const runAction = async (key, action, successMessage = "") => {
    if (!user) {
      navigate("/login");
      return false;
    }
    setBusy(key);
    setError("");
    setMessage("");
    try {
      await action();
      if (successMessage) setMessage(successMessage);
      await loadPost();
      return true;
    } catch (err) {
      setError(
        err.message ||
          (isKm
            ? "មិនអាចបំពេញសកម្មភាពនេះបានទេ។"
            : "The action could not be completed.")
      );
      return false;
    } finally {
      setBusy("");
    }
  };

  const submitAnswer = async (event) => {
    event.preventDefault();
    if (
      await runAction(
        "answer",
        () => createForumAnswerRequest(postId, answer),
        isKm ? "ចម្លើយរបស់អ្នកត្រូវបានបង្ហោះរួចរាល់។" : "Your response was published.",
      )
    )
      setAnswer("");
  };

  const submitComment = async (event) => {
    event.preventDefault();
    if (
      await runAction(
        "comment",
        () => createForumCommentRequest(postId, comment),
        isKm ? "មតិយោបល់របស់អ្នកត្រូវបានបង្ហោះរួចរាល់។" : "Your comment was published.",
      )
    )
      setComment("");
  };

  const removePost = async () => {
    if (
      !window.confirm(
        isKm
          ? "តើអ្នកពិតជាចង់លុបការពិភាក្សានេះ និងរាល់ចម្លើយទាំងអស់មែនទេ?"
          : "Delete this post and all of its answers and comments?",
      )
    )
      return;
    setBusy("delete-post");
    try {
      await deleteForumPostRequest(postId);
      navigate("/forum");
    } catch (err) {
      setError(
        err.message ||
          (isKm
            ? "មិនអាចលុបការពិភាក្សានេះបានទេ។"
            : "Unable to delete this post.")
      );
      setBusy("");
    }
  };

  if (loading && !data)
    return (
      <main className="container forum-detail-loading">
        {isKm ? "កំពុងទាញយកការពិភាក្សា..." : "Loading discussion..."}
      </main>
    );
  if (!data)
    return (
      <main className="container forum-detail-loading">
        <div className="forum-alert error">
          {error || (isKm ? "រកមិនឃើញការពិភាក្សានេះទេ។" : "Post not found.")}
        </div>
        <Link to="/forum">
          {isKm ? "ត្រឡប់ទៅវេទិកាសហគមន៍" : "Return to forum"}
        </Link>
      </main>
    );

  const rawPost = data.post;
  const post = localizeForumPost(rawPost, isKm);
  const answers = (data.answers || []).map((a) => localizeForumAnswer(a, isKm));
  const comments = data.comments || [];

  const postTypeLabel = isKm
    ? post.postType === "question"
      ? "សំណួរ"
      : post.postType === "resource"
        ? "ធនធានសិក្សា"
        : "ការពិភាក្សា"
    : post.postType;

  const roleLabel = (role) => {
    if (!isKm) return role;
    const r = String(role || "").toLowerCase();
    if (r === "student") return "សិស្ស/និស្សិត";
    if (r === "mentor") return "អ្នកណែនាំ";
    if (r === "recruiter") return "អ្នកជ្រើសរើសបុគ្គលិក";
    if (r === "admin") return "អ្នកគ្រប់គ្រងប្រព័ន្ធ";
    return role;
  };

  return (
    <main className="forum-detail-page">
      <div className="container forum-detail-wrap">
        <Link className="forum-back" to="/forum">
          <IoArrowBackOutline />{" "}
          {isKm ? "ត្រឡប់ទៅវេទិកាសហគមន៍" : "Back to community forum"}
        </Link>
        {error && <div className="forum-alert error">{error}</div>}
        {message && <div className="forum-alert success">{message}</div>}

        <article className="forum-detail-card">
          <div className="forum-detail-header">
            <div className="forum-post-meta">
              <span className={`forum-type ${post.postType}`}>
                {postTypeLabel}
              </span>
              <span
                className="forum-category-pill"
                style={{ "--category-color": post.category?.color }}
              >
                {post.category?.name}
              </span>
              {post.status === "closed" && (
                <span className="forum-closed">
                  {isKm ? "បានបិទ" : "Closed"}
                </span>
              )}
            </div>
            {post.canModerate && (
              <div className="forum-moderation">
                <button
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={() =>
                    runAction(
                      "status",
                      () =>
                        updateForumPostRequest(post.id, {
                          status:
                            post.status === "closed" ? "published" : "closed",
                        }),
                      post.status === "closed"
                        ? isKm
                          ? "បានបើកការពិភាក្សាឡើងវិញ។"
                          : "Post reopened."
                        : isKm
                          ? "បានបិទការពិភាក្សា។"
                          : "Post closed.",
                    )
                  }
                >
                  {post.status === "closed"
                    ? isKm
                      ? "បើកឡើងវិញ"
                      : "Reopen"
                    : isKm
                      ? "បិទការពិភាក្សា"
                      : "Close post"}
                </button>
                <button
                  className="danger"
                  aria-label="Delete post"
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={removePost}
                >
                  <IoTrashOutline />
                </button>
              </div>
            )}
          </div>
          <h1>{post.title}</h1>
          <div className="forum-author">
            <Avatar name={post.authorName} image={post.authorAvatar} />
            <div>
              <strong>{post.authorName}</strong>
              <span>
                {roleLabel(post.authorRole)} · {formatDate(post.createdAt, isKm)}
              </span>
            </div>
          </div>
          <div className="forum-rich-text">{post.body}</div>
          <div className="forum-detail-actions">
            <button
              className={post.liked ? "liked" : ""}
              type="button"
              disabled={busy === "post-like"}
              onClick={() =>
                runAction("post-like", () =>
                  toggleForumPostLikeRequest(post.id),
                )
              }
            >
              {post.liked ? <IoHeart /> : <IoHeartOutline />} {post.likeCount}{" "}
              {isKm ? "ចូលចិត្ត" : "likes"}
            </button>
            <span>
              <IoEyeOutline /> {post.viewsCount}{" "}
              {isKm ? "ចំនួនមើល" : "views"}
            </span>
            <span>
              <IoChatbubbleOutline /> {answers.length}{" "}
              {isKm ? "ការឆ្លើយតប" : "responses"}
            </span>
          </div>
        </article>

        <section className="forum-answer-section">
          <div className="forum-section-heading">
            <div>
              <span className="forum-eyebrow">
                {isKm ? "ចំណេះដឹងសហគមន៍" : "Community knowledge"}
              </span>
              <h2>
                {answers.length}{" "}
                {isKm
                  ? "ការឆ្លើយតប"
                  : answers.length === 1
                    ? "response"
                    : "responses"}
              </h2>
            </div>
          </div>
          {answers.map((item) => (
            <article
              className={`forum-answer-card ${item.isAccepted ? "accepted" : ""}`}
              key={item.id}
            >
              {item.isAccepted && (
                <div className="accepted-banner">
                  <IoCheckmarkCircle />{" "}
                  {isKm ? "ចម្លើយដែលបានទទួលស្គាល់" : "Accepted answer"}
                </div>
              )}
              <div className="forum-author">
                <Avatar name={item.authorName} image={item.authorAvatar} />
                <div>
                  <strong>{item.authorName}</strong>
                  <span>
                    {roleLabel(item.authorRole)} · {formatDate(item.createdAt, isKm)}
                  </span>
                </div>
              </div>
              <div className="forum-rich-text compact">{item.body}</div>
              <div className="forum-answer-actions">
                <button
                  className={item.liked ? "liked" : ""}
                  type="button"
                  disabled={busy === `like-${item.id}`}
                  onClick={() =>
                    runAction(`like-${item.id}`, () =>
                      toggleForumAnswerLikeRequest(item.id),
                    )
                  }
                >
                  {item.liked ? <IoHeart /> : <IoHeartOutline />}{" "}
                  {item.likeCount}
                </button>
                {item.canAccept &&
                  post.postType === "question" &&
                  !item.isAccepted && (
                    <button
                      type="button"
                      disabled={Boolean(busy)}
                      onClick={() =>
                        runAction(
                          `accept-${item.id}`,
                          () => acceptForumAnswerRequest(item.id),
                          isKm ? "បានទទួលស្គាល់ចម្លើយ។" : "Answer accepted.",
                        )
                      }
                    >
                      <IoCheckmarkCircle />{" "}
                      {isKm ? "ទទួលស្គាល់ចម្លើយ" : "Accept answer"}
                    </button>
                  )}
                {item.canModerate && (
                  <button
                    className="danger-link"
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() =>
                      runAction(
                        `delete-answer-${item.id}`,
                        () => deleteForumAnswerRequest(item.id),
                        isKm ? "បានលុបចម្លើយ។" : "Response deleted.",
                      )
                    }
                  >
                    <IoTrashOutline /> {isKm ? "លុប" : "Delete"}
                  </button>
                )}
              </div>
            </article>
          ))}

          {post.status === "published" && (
            <form className="forum-response-form" onSubmit={submitAnswer}>
              <h3>
                {user
                  ? isKm
                    ? "ចែករំលែកចម្លើយរបស់អ្នក"
                    : "Share your response"
                  : isKm
                    ? "ចូលរួមការពិភាក្សា"
                    : "Join the conversation"}
              </h3>
              {user ? (
                <>
                  <textarea
                    required
                    minLength="10"
                    rows="5"
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    placeholder={
                      isKm
                        ? "សរសេរចម្លើយណែនាំ ឬចែករំលែកបទពិសោធន៍របស់អ្នកនៅទីនេះ..."
                        : "Write a helpful, respectful response..."
                    }
                  />
                  <button
                    className="btn primary"
                    disabled={busy === "answer"}
                    type="submit"
                  >
                    {busy === "answer"
                      ? isKm
                        ? "កំពុងបង្ហោះ..."
                        : "Publishing..."
                      : isKm
                        ? "បង្ហោះចម្លើយ"
                        : "Publish response"}
                  </button>
                </>
              ) : (
                <p>
                  <Link to="/login">{isKm ? "ចូលគណនី" : "Login"}</Link>{" "}
                  {isKm
                    ? "ដើម្បីឆ្លើយតបក្នុងការពិភាក្សានេះ។"
                    : "to answer this post."}
                </p>
              )}
            </form>
          )}
        </section>

        <section className="forum-comment-section">
          <h2>
            {isKm ? `មតិយោបល់ (${comments.length})` : `Comments (${comments.length})`}
          </h2>
          <div className="forum-comments">
            {comments.map((item) => (
              <div className="forum-comment" key={item.id}>
                <Avatar name={item.authorName} image={item.authorAvatar} />
                <div>
                  <div>
                    <strong>{item.authorName}</strong>
                    <span>{formatDate(item.createdAt, isKm)}</span>
                  </div>
                  <p>{item.body}</p>
                  {item.canModerate && (
                    <button
                      className="danger-link"
                      type="button"
                      disabled={Boolean(busy)}
                      onClick={() =>
                        runAction(
                          `delete-comment-${item.id}`,
                          () => deleteForumCommentRequest(item.id),
                          isKm ? "បានលុបមតិយោបល់។" : "Comment deleted.",
                        )
                      }
                    >
                      {isKm ? "លុប" : "Delete"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {post.status === "published" && user && (
            <form className="forum-comment-form" onSubmit={submitComment}>
              <input
                required
                minLength="2"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder={
                  isKm ? "បន្ថែមមតិយោបល់ខ្លីៗ..." : "Add a short comment"
                }
              />
              <button disabled={busy === "comment"} type="submit">
                {isKm ? "បញ្ចេញមតិ" : "Comment"}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
};

export default ForumDetail;
