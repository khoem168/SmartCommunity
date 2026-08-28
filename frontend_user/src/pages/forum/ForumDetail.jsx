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
import UserAvatar from "../../components/ui/UserAvatar";
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

const formatDate = (value) =>
  new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

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
      setError(err.message || "Unable to load this post.");
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
      setError(err.message || "The action could not be completed.");
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
        "Your response was published.",
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
        "Your comment was published.",
      )
    )
      setComment("");
  };

  const removePost = async () => {
    if (
      !window.confirm("Delete this post and all of its answers and comments?")
    )
      return;
    setBusy("delete-post");
    try {
      await deleteForumPostRequest(postId);
      navigate("/forum");
    } catch (err) {
      setError(err.message || "Unable to delete this post.");
      setBusy("");
    }
  };

  if (loading && !data)
    return (
      <main className="container forum-detail-loading">
        Loading discussion...
      </main>
    );
  if (!data)
    return (
      <main className="container forum-detail-loading">
        <div className="forum-alert error">{error || "Post not found."}</div>
        <Link to="/forum">Return to forum</Link>
      </main>
    );

  const { post, answers, comments } = data;

  return (
    <main className="forum-detail-page">
      <div className="container forum-detail-wrap">
        <Link className="forum-back" to="/forum">
          <IoArrowBackOutline /> Back to community forum
        </Link>
        {error && <div className="forum-alert error">{error}</div>}
        {message && <div className="forum-alert success">{message}</div>}

        <article className="forum-detail-card">
          <div className="forum-detail-header">
            <div className="forum-post-meta">
              <span className={`forum-type ${post.postType}`}>
                {post.postType}
              </span>
              <span
                className="forum-category-pill"
                style={{ "--category-color": post.category.color }}
              >
                {post.category.name}
              </span>
              {post.status === "closed" && (
                <span className="forum-closed">Closed</span>
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
                        ? "Post reopened."
                        : "Post closed.",
                    )
                  }
                >
                  {post.status === "closed" ? "Reopen" : "Close post"}
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
                {post.authorRole} · {formatDate(post.createdAt)}
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
              likes
            </button>
            <span>
              <IoEyeOutline /> {post.viewsCount} views
            </span>
            <span>
              <IoChatbubbleOutline /> {answers.length} responses
            </span>
          </div>
        </article>

        <section className="forum-answer-section">
          <div className="forum-section-heading">
            <div>
              <span className="forum-eyebrow">Community knowledge</span>
              <h2>
                {answers.length}{" "}
                {answers.length === 1 ? "response" : "responses"}
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
                  <IoCheckmarkCircle /> Accepted answer
                </div>
              )}
              <div className="forum-author">
                <Avatar name={item.authorName} image={item.authorAvatar} />
                <div>
                  <strong>{item.authorName}</strong>
                  <span>
                    {item.authorRole} · {formatDate(item.createdAt)}
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
                          "Answer accepted.",
                        )
                      }
                    >
                      <IoCheckmarkCircle /> Accept answer
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
                        "Response deleted.",
                      )
                    }
                  >
                    <IoTrashOutline /> Delete
                  </button>
                )}
              </div>
            </article>
          ))}

          {post.status === "published" && (
            <form className="forum-response-form" onSubmit={submitAnswer}>
              <h3>{user ? "Share your response" : "Join the conversation"}</h3>
              {user ? (
                <>
                  <textarea
                    required
                    minLength="10"
                    rows="5"
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    placeholder="Write a helpful, respectful response..."
                  />
                  <button
                    className="btn primary"
                    disabled={busy === "answer"}
                    type="submit"
                  >
                    {busy === "answer" ? "Publishing..." : "Publish response"}
                  </button>
                </>
              ) : (
                <p>
                  <Link to="/login">Login</Link> to answer this post.
                </p>
              )}
            </form>
          )}
        </section>

        <section className="forum-comment-section">
          <h2>Comments ({comments.length})</h2>
          <div className="forum-comments">
            {comments.map((item) => (
              <div className="forum-comment" key={item.id}>
                <Avatar name={item.authorName} image={item.authorAvatar} />
                <div>
                  <div>
                    <strong>{item.authorName}</strong>
                    <span>{formatDate(item.createdAt)}</span>
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
                          "Comment deleted.",
                        )
                      }
                    >
                      Delete
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
                placeholder="Add a short comment"
              />
              <button disabled={busy === "comment"} type="submit">
                Comment
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
};

export default ForumDetail;
