const db = require("../config/db");

const emitNotification = (req, userId, notification) => {
  const io = req.app.get("io");
  if (io) io.to(`user:${userId}`).emit("notification:new", notification);
};

const notifyPostAuthor = async (req, post, title, message) => {
  if (!post.author_id || post.author_id === req.user.id) return;
  await db.query(
    `INSERT INTO notifications (user_id, type, title, message, link)
     VALUES (?, 'forum', ?, ?, ?)`,
    [post.author_id, title, message, `/forum/${post.id}`],
  );
  emitNotification(req, post.author_id, {
    type: "forum",
    title,
    message,
    link: `/forum/${post.id}`,
    postId: post.id,
  });
};

const getForumCategories = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT fc.id, fc.slug, fc.name, fc.description, fc.color,
              COUNT(fp.id) AS postCount
       FROM forum_categories fc
       LEFT JOIN forum_posts fp
         ON fp.category_id = fc.id AND fp.status <> 'hidden'
       GROUP BY fc.id ORDER BY fc.name`,
    );
    return res.json({ categories: rows });
  } catch (err) {
    return next(err);
  }
};

const postSelect = `
  SELECT fp.id, fp.author_id, fp.title, fp.body, fp.post_type, fp.status,
         fp.views_count, fp.created_at, fp.updated_at,
         u.full_name AS author_name, u.avatar_url AS author_avatar, u.role AS author_role,
         fc.id AS category_id, fc.slug AS category_slug,
         fc.name AS category_name, fc.color AS category_color,
         COUNT(DISTINCT fa.id) AS answer_count,
         COUNT(DISTINCT fco.id) AS comment_count,
         COUNT(DISTINCT fpl.user_id) AS like_count,
         MAX(fa.is_accepted) AS has_accepted_answer
  FROM forum_posts fp
  JOIN users u ON u.id = fp.author_id
  JOIN forum_categories fc ON fc.id = fp.category_id
  LEFT JOIN forum_answers fa ON fa.post_id = fp.id
  LEFT JOIN forum_comments fco ON fco.post_id = fp.id
  LEFT JOIN forum_post_likes fpl ON fpl.post_id = fp.id
`;

const formatPost = (row, liked = false, currentUser = null) => ({
  id: row.id,
  authorId: row.author_id,
  authorName: row.author_name,
  authorAvatar: row.author_avatar,
  authorRole: row.author_role,
  category: {
    id: row.category_id,
    slug: row.category_slug,
    name: row.category_name,
    color: row.category_color,
  },
  title: row.title,
  body: row.body,
  postType: row.post_type,
  status: row.status,
  viewsCount: Number(row.views_count || 0),
  answerCount: Number(row.answer_count || 0),
  commentCount: Number(row.comment_count || 0),
  likeCount: Number(row.like_count || 0),
  hasAcceptedAnswer: Boolean(row.has_accepted_answer),
  liked,
  canModerate: Boolean(
    currentUser &&
      (Number(currentUser.id) === Number(row.author_id) || currentUser.role === "admin"),
  ),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const likedPostIds = async (userId, postIds) => {
  if (!userId || !postIds.length) return new Set();
  const placeholders = postIds.map(() => "?").join(",");
  const [rows] = await db.query(
    `SELECT post_id FROM forum_post_likes WHERE user_id = ? AND post_id IN (${placeholders})`,
    [userId, ...postIds],
  );
  return new Set(rows.map((row) => Number(row.post_id)));
};

const getForumPosts = async (req, res, next) => {
  try {
    const conditions = ["fp.status <> 'hidden'"];
    const params = [];
    const category = String(req.query.category || "").trim();
    const postType = String(req.query.type || "").trim();
    const query = String(req.query.q || "").trim();
    const sort = String(req.query.sort || "latest");
    if (category) {
      conditions.push("fc.slug = ?");
      params.push(category);
    }
    if (["question", "discussion"].includes(postType)) {
      conditions.push("fp.post_type = ?");
      params.push(postType);
    }
    if (query) {
      conditions.push("(fp.title LIKE ? OR fp.body LIKE ?)");
      params.push(`%${query.slice(0, 100)}%`, `%${query.slice(0, 100)}%`);
    }
    const having = sort === "unanswered" ? "HAVING answer_count = 0" : "";
    const orderBy =
      sort === "popular"
        ? "like_count DESC, answer_count DESC, fp.created_at DESC"
        : "fp.created_at DESC";
    const [rows] = await db.query(
      `${postSelect}
       WHERE ${conditions.join(" AND ")}
       GROUP BY fp.id, u.id, fc.id
       ${having}
       ORDER BY ${orderBy}
       LIMIT 50`,
      params,
    );
    const liked = await likedPostIds(req.user?.id, rows.map((row) => row.id));
    const [[stats]] = await db.query(
      `SELECT COUNT(*) AS posts,
              SUM(post_type = 'question') AS questions,
              SUM(post_type = 'discussion') AS discussions,
              SUM(status = 'closed') AS closedPosts
       FROM forum_posts WHERE status <> 'hidden'`,
    );
    return res.json({
      posts: rows.map((row) =>
        formatPost(row, liked.has(Number(row.id)), req.user),
      ),
      stats: {
        posts: Number(stats.posts || 0),
        questions: Number(stats.questions || 0),
        discussions: Number(stats.discussions || 0),
        closedPosts: Number(stats.closedPosts || 0),
      },
    });
  } catch (err) {
    return next(err);
  }
};

const getForumPost = async (req, res, next) => {
  try {
    await db.query(
      "UPDATE forum_posts SET views_count = views_count + 1 WHERE id = ? AND status <> 'hidden'",
      [req.params.postId],
    );
    const [rows] = await db.query(
      `${postSelect}
       WHERE fp.id = ? AND fp.status <> 'hidden'
       GROUP BY fp.id, u.id, fc.id`,
      [req.params.postId],
    );
    if (!rows.length) return res.status(404).json({ error: "Forum post not found." });
    const likedPosts = await likedPostIds(req.user?.id, [rows[0].id]);
    const [answers] = await db.query(
      `SELECT fa.id, fa.post_id AS postId, fa.author_id AS authorId,
              fa.body, fa.is_accepted AS isAccepted,
              fa.created_at AS createdAt, fa.updated_at AS updatedAt,
              u.full_name AS authorName, u.avatar_url AS authorAvatar,
              u.role AS authorRole, COUNT(fal.user_id) AS likeCount
       FROM forum_answers fa
       JOIN users u ON u.id = fa.author_id
       LEFT JOIN forum_answer_likes fal ON fal.answer_id = fa.id
       WHERE fa.post_id = ?
       GROUP BY fa.id, u.id
       ORDER BY fa.is_accepted DESC, fa.created_at ASC`,
      [req.params.postId],
    );
    const likedAnswerSet = new Set();
    if (req.user?.id && answers.length) {
      const placeholders = answers.map(() => "?").join(",");
      const [answerLikes] = await db.query(
        `SELECT answer_id FROM forum_answer_likes
         WHERE user_id = ? AND answer_id IN (${placeholders})`,
        [req.user.id, ...answers.map((answer) => answer.id)],
      );
      answerLikes.forEach((like) => likedAnswerSet.add(Number(like.answer_id)));
    }
    const [comments] = await db.query(
      `SELECT fc.id, fc.post_id AS postId, fc.author_id AS authorId,
              fc.body, fc.created_at AS createdAt, fc.updated_at AS updatedAt,
              u.full_name AS authorName, u.avatar_url AS authorAvatar
       FROM forum_comments fc JOIN users u ON u.id = fc.author_id
       WHERE fc.post_id = ? ORDER BY fc.created_at ASC`,
      [req.params.postId],
    );
    const post = formatPost(
      rows[0],
      likedPosts.has(Number(rows[0].id)),
      req.user,
    );
    return res.json({
      post,
      answers: answers.map((answer) => ({
        ...answer,
        isAccepted: Boolean(answer.isAccepted),
        likeCount: Number(answer.likeCount || 0),
        liked: likedAnswerSet.has(Number(answer.id)),
        canModerate: Boolean(
          req.user &&
            (Number(req.user.id) === Number(answer.authorId) || req.user.role === "admin"),
        ),
        canAccept: Boolean(
          req.user &&
            (Number(req.user.id) === Number(post.authorId) || req.user.role === "admin"),
        ),
      })),
      comments: comments.map((comment) => ({
        ...comment,
        canModerate: Boolean(
          req.user &&
            (Number(req.user.id) === Number(comment.authorId) || req.user.role === "admin"),
        ),
      })),
    });
  } catch (err) {
    return next(err);
  }
};

const createForumPost = async (req, res, next) => {
  try {
    const title = String(req.body.title || "").trim();
    const body = String(req.body.body || "").trim();
    const categoryId = Number(req.body.categoryId);
    const postType = String(req.body.postType || "question");
    if (!title || !body || !categoryId) {
      return res.status(400).json({ error: "Title, content, and category are required." });
    }
    if (title.length < 8 || body.length < 20) {
      return res.status(400).json({ error: "Add a clearer title and at least 20 characters of detail." });
    }
    if (!["question", "discussion"].includes(postType)) {
      return res.status(400).json({ error: "Choose question or discussion." });
    }
    const [categories] = await db.query("SELECT id FROM forum_categories WHERE id = ?", [
      categoryId,
    ]);
    if (!categories.length) return res.status(404).json({ error: "Forum category not found." });
    const [result] = await db.query(
      `INSERT INTO forum_posts (author_id, category_id, title, body, post_type)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, categoryId, title.slice(0, 250), body.slice(0, 10000), postType],
    );
    return res.status(201).json({
      message: postType === "question" ? "Question published." : "Discussion published.",
      post: { id: result.insertId },
    });
  } catch (err) {
    return next(err);
  }
};

const updateForumPost = async (req, res, next) => {
  try {
    const [rows] = await db.query("SELECT * FROM forum_posts WHERE id = ?", [
      req.params.postId,
    ]);
    const post = rows[0];
    if (!post) return res.status(404).json({ error: "Forum post not found." });
    if (post.author_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Only the author can edit this post." });
    }
    const status = String(req.body.status || post.status);
    const allowedStatuses = req.user.role === "admin"
      ? ["published", "closed", "hidden"]
      : ["published", "closed"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid post status." });
    }
    const title = String(req.body.title ?? post.title).trim();
    const body = String(req.body.body ?? post.body).trim();
    if (!title || !body) return res.status(400).json({ error: "Title and content are required." });
    await db.query(
      "UPDATE forum_posts SET title = ?, body = ?, status = ? WHERE id = ?",
      [title.slice(0, 250), body.slice(0, 10000), status, post.id],
    );
    return res.json({ message: "Forum post updated.", status });
  } catch (err) {
    return next(err);
  }
};

const deleteForumPost = async (req, res, next) => {
  try {
    const [result] = await db.query(
      `DELETE FROM forum_posts
       WHERE id = ? AND (author_id = ? OR ? = 'admin')`,
      [req.params.postId, req.user.id, req.user.role],
    );
    if (!result.affectedRows) return res.status(404).json({ error: "Post not found or not owned by you." });
    return res.json({ message: "Forum post deleted." });
  } catch (err) {
    return next(err);
  }
};

const createForumAnswer = async (req, res, next) => {
  try {
    const body = String(req.body.body || "").trim();
    if (body.length < 10) return res.status(400).json({ error: "Write a more complete answer." });
    const [posts] = await db.query(
      "SELECT id, author_id, title, status FROM forum_posts WHERE id = ?",
      [req.params.postId],
    );
    const post = posts[0];
    if (!post || post.status !== "published") {
      return res.status(400).json({ error: "This post is not accepting answers." });
    }
    const [result] = await db.query(
      "INSERT INTO forum_answers (post_id, author_id, body) VALUES (?, ?, ?)",
      [post.id, req.user.id, body.slice(0, 10000)],
    );
    await notifyPostAuthor(
      req,
      post,
      "New forum answer",
      `${req.user.fullName} answered "${post.title}".`,
    );
    return res.status(201).json({ message: "Answer published.", answer: { id: result.insertId } });
  } catch (err) {
    return next(err);
  }
};

const createForumComment = async (req, res, next) => {
  try {
    const body = String(req.body.body || "").trim();
    if (body.length < 2) return res.status(400).json({ error: "Write a comment first." });
    const [posts] = await db.query(
      "SELECT id, author_id, title, status FROM forum_posts WHERE id = ?",
      [req.params.postId],
    );
    const post = posts[0];
    if (!post || post.status !== "published") {
      return res.status(400).json({ error: "This post is not accepting comments." });
    }
    const [result] = await db.query(
      "INSERT INTO forum_comments (post_id, author_id, body) VALUES (?, ?, ?)",
      [post.id, req.user.id, body.slice(0, 1500)],
    );
    await notifyPostAuthor(
      req,
      post,
      "New forum comment",
      `${req.user.fullName} commented on "${post.title}".`,
    );
    return res.status(201).json({ message: "Comment published.", comment: { id: result.insertId } });
  } catch (err) {
    return next(err);
  }
};

const togglePostLike = async (req, res, next) => {
  try {
    const [posts] = await db.query("SELECT id FROM forum_posts WHERE id = ? AND status <> 'hidden'", [
      req.params.postId,
    ]);
    if (!posts.length) return res.status(404).json({ error: "Forum post not found." });
    const [existing] = await db.query(
      "SELECT post_id FROM forum_post_likes WHERE post_id = ? AND user_id = ?",
      [req.params.postId, req.user.id],
    );
    if (existing.length) {
      await db.query("DELETE FROM forum_post_likes WHERE post_id = ? AND user_id = ?", [
        req.params.postId,
        req.user.id,
      ]);
    } else {
      await db.query("INSERT INTO forum_post_likes (post_id, user_id) VALUES (?, ?)", [
        req.params.postId,
        req.user.id,
      ]);
    }
    const [[count]] = await db.query(
      "SELECT COUNT(*) AS total FROM forum_post_likes WHERE post_id = ?",
      [req.params.postId],
    );
    return res.json({ liked: !existing.length, likeCount: Number(count.total) });
  } catch (err) {
    return next(err);
  }
};

const toggleAnswerLike = async (req, res, next) => {
  try {
    const [answers] = await db.query("SELECT id FROM forum_answers WHERE id = ?", [
      req.params.answerId,
    ]);
    if (!answers.length) return res.status(404).json({ error: "Forum answer not found." });
    const [existing] = await db.query(
      "SELECT answer_id FROM forum_answer_likes WHERE answer_id = ? AND user_id = ?",
      [req.params.answerId, req.user.id],
    );
    if (existing.length) {
      await db.query("DELETE FROM forum_answer_likes WHERE answer_id = ? AND user_id = ?", [
        req.params.answerId,
        req.user.id,
      ]);
    } else {
      await db.query("INSERT INTO forum_answer_likes (answer_id, user_id) VALUES (?, ?)", [
        req.params.answerId,
        req.user.id,
      ]);
    }
    const [[count]] = await db.query(
      "SELECT COUNT(*) AS total FROM forum_answer_likes WHERE answer_id = ?",
      [req.params.answerId],
    );
    return res.json({ liked: !existing.length, likeCount: Number(count.total) });
  } catch (err) {
    return next(err);
  }
};

const acceptForumAnswer = async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    const [answers] = await connection.query(
      `SELECT fa.id, fa.author_id, fa.post_id, fp.author_id AS post_author_id,
              fp.title, fp.post_type
       FROM forum_answers fa JOIN forum_posts fp ON fp.id = fa.post_id
       WHERE fa.id = ?`,
      [req.params.answerId],
    );
    const answer = answers[0];
    if (!answer) return res.status(404).json({ error: "Forum answer not found." });
    if (answer.post_author_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Only the question author can accept an answer." });
    }
    if (answer.post_type !== "question") {
      return res.status(400).json({ error: "Only questions can have an accepted answer." });
    }
    await connection.beginTransaction();
    await connection.query("UPDATE forum_answers SET is_accepted = 0 WHERE post_id = ?", [
      answer.post_id,
    ]);
    await connection.query("UPDATE forum_answers SET is_accepted = 1 WHERE id = ?", [
      answer.id,
    ]);
    if (answer.author_id !== req.user.id) {
      await connection.query(
        `INSERT INTO notifications (user_id, type, title, message, link)
         VALUES (?, 'forum', 'Answer accepted', ?, ?)`,
        [
          answer.author_id,
          `Your answer to "${answer.title}" was accepted.`,
          `/forum/${answer.post_id}`,
        ],
      );
    }
    await connection.commit();
    if (answer.author_id !== req.user.id) {
      emitNotification(req, answer.author_id, {
        type: "forum",
        title: "Answer accepted",
        link: `/forum/${answer.post_id}`,
      });
    }
    return res.json({ message: "Answer accepted.", accepted: true });
  } catch (err) {
    await connection.rollback();
    return next(err);
  } finally {
    connection.release();
  }
};

const deleteOwnedResource = (table, idColumn, routeParam) => async (req, res, next) => {
  try {
    const [result] = await db.query(
      `DELETE FROM ${table} WHERE ${idColumn} = ? AND (author_id = ? OR ? = 'admin')`,
      [req.params[routeParam], req.user.id, req.user.role],
    );
    if (!result.affectedRows) return res.status(404).json({ error: "Content not found or not owned by you." });
    return res.json({ message: "Forum content deleted." });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  acceptForumAnswer,
  createForumAnswer,
  createForumComment,
  createForumPost,
  deleteForumAnswer: deleteOwnedResource("forum_answers", "id", "answerId"),
  deleteForumComment: deleteOwnedResource("forum_comments", "id", "commentId"),
  deleteForumPost,
  getForumCategories,
  getForumPost,
  getForumPosts,
  toggleAnswerLike,
  togglePostLike,
  updateForumPost,
};
