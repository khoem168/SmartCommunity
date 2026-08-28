const db = require("../config/db");

const parseList = (value) => {
  if (!value) return [];
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const parseSkills = (value) => {
  if (!value) return {};
  try {
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return {};
  }
};

const unique = (values) => [...new Set(values.filter(Boolean))];
const intersect = (source, target) => {
  const targetMap = new Map(target.map((item) => [String(item).toLowerCase(), item]));
  return unique(
    source
      .filter((item) => targetMap.has(String(item).toLowerCase()))
      .map((item) => targetMap.get(String(item).toLowerCase()) || item),
  );
};

const getSkillMatches = async (req, res, next) => {
  try {
    const [currentRows] = await db.query(
      "SELECT skills, interested_skills FROM users WHERE id = ?",
      [req.user.id],
    );
    const currentSkills = parseSkills(currentRows[0]?.skills);
    const myTeach = unique([...(currentSkills.teach || []), ...(currentSkills.candidate || [])]);
    const myLearn = unique(currentSkills.learn || []);
    const myInterests = parseList(currentRows[0]?.interested_skills);

    const [members] = await db.query(
      `SELECT id, full_name, role, bio, avatar_url, profession, location,
              skills, interested_skills
       FROM users
       WHERE id <> ? AND is_active = 1 AND is_verified = 1
         AND role NOT IN ('admin', 'recruiter')
       ORDER BY full_name`,
      [req.user.id],
    );
    const [activeRequests] = await db.query(
      `SELECT id, provider_id, status
       FROM skill_exchanges
       WHERE requester_id = ? AND status IN ('pending','accepted')`,
      [req.user.id],
    );
    const requestByProvider = new Map(activeRequests.map((item) => [item.provider_id, item]));

    const matches = members
      .map((member) => {
        const skills = parseSkills(member.skills);
        const theirTeach = unique([...(skills.teach || []), ...(skills.candidate || [])]);
        const theirLearn = unique(skills.learn || []);
        const canLearn = intersect(theirTeach, myLearn);
        const canTeach = intersect(myTeach, theirLearn);
        const sharedInterests = intersect(myInterests, parseList(member.interested_skills));
        const mutual = canLearn.length > 0 && canTeach.length > 0;
        const score = Math.min(
          100,
          10 +
            (canLearn.length ? 45 : 0) +
            (canTeach.length ? 35 : 0) +
            Math.min(10, (canLearn.length + canTeach.length + sharedInterests.length) * 2),
        );
        const activeRequest = requestByProvider.get(member.id);

        return {
          id: member.id,
          name: member.full_name,
          role: member.role === "user" ? "student" : member.role,
          bio: member.bio,
          avatarUrl: member.avatar_url,
          profession: member.profession,
          location: member.location,
          teachSkills: theirTeach,
          learnSkills: theirLearn,
          canLearn,
          canTeach,
          sharedInterests,
          matchScore: score,
          suggestedRequestedSkill: canLearn[0] || theirTeach[0] || myLearn[0] || "",
          suggestedOfferedSkill: canTeach[0] || myTeach[0] || theirLearn[0] || "",
          activeRequest: activeRequest
            ? { id: activeRequest.id, status: activeRequest.status }
            : null,
        };
      })
      .filter((member) => member.teachSkills.length || member.learnSkills.length)
      .sort((left, right) => right.matchScore - left.matchScore || left.name.localeCompare(right.name));

    return res.json({
      matches,
      profileSkills: { teach: myTeach, learn: myLearn, interests: myInterests },
    });
  } catch (err) {
    return next(err);
  }
};

const getExchangeForParticipant = async (exchangeId, userId) => {
  const [rows] = await db.query(
    `SELECT se.*, requester.full_name AS requester_name,
            provider.full_name AS provider_name, c.id AS conversation_id
     FROM skill_exchanges se
     JOIN users requester ON requester.id = se.requester_id
     JOIN users provider ON provider.id = se.provider_id
     LEFT JOIN conversations c
       ON c.participant1_id = LEAST(se.requester_id, se.provider_id)
      AND c.participant2_id = GREATEST(se.requester_id, se.provider_id)
     WHERE se.id = ? AND (se.requester_id = ? OR se.provider_id = ?)
     LIMIT 1`,
    [exchangeId, userId, userId],
  );
  return rows[0];
};

const formatExchange = (row, userId) => ({
  id: row.id,
  requesterId: row.requester_id,
  requesterName: row.requester_name,
  providerId: row.provider_id,
  providerName: row.provider_name,
  offeredSkill: row.skill_offered,
  requestedSkill: row.skill_requested,
  details: row.message,
  rejectionReason: row.rejection_reason,
  status: row.status,
  scheduledDate: row.scheduled_date,
  progressPercent: row.progress_percent || 0,
  requesterCompleted: Boolean(row.requester_completed_at),
  providerCompleted: Boolean(row.provider_completed_at),
  currentUserCompleted:
    row.requester_id === userId
      ? Boolean(row.requester_completed_at)
      : Boolean(row.provider_completed_at),
  completedAt: row.completed_at,
  conversationId: row.conversation_id,
  meetingLink: ["accepted", "completed"].includes(row.status)
    ? `https://meet.jit.si/smart-community-skill-exchange-${row.id}`
    : null,
  createdAt: row.created_at,
});

const getSkillExchangeDetail = async (req, res, next) => {
  try {
    const exchange = await getExchangeForParticipant(req.params.exchangeId, req.user.id);
    if (!exchange) return res.status(404).json({ error: "Skill exchange not found." });

    const [updates] = await db.query(
      `SELECT seu.id, seu.progress_percent AS progressPercent, seu.note,
              seu.created_at AS createdAt, u.id AS userId, u.full_name AS userName
       FROM skill_exchange_updates seu
       JOIN users u ON u.id = seu.user_id
       WHERE seu.exchange_id = ? ORDER BY seu.created_at DESC, seu.id DESC`,
      [exchange.id],
    );
    return res.json({ exchange: formatExchange(exchange, req.user.id), updates });
  } catch (err) {
    return next(err);
  }
};

const updateSkillExchangeProgress = async (req, res, next) => {
  try {
    const exchange = await getExchangeForParticipant(req.params.exchangeId, req.user.id);
    if (!exchange) return res.status(404).json({ error: "Skill exchange not found." });
    if (exchange.status !== "accepted") {
      return res.status(400).json({ error: "Only accepted exchanges can track progress." });
    }

    const progressPercent = Number(req.body.progressPercent);
    if (!Number.isInteger(progressPercent) || progressPercent < 0 || progressPercent > 100) {
      return res.status(400).json({ error: "Progress must be a whole number from 0 to 100." });
    }
    const note = String(req.body.note || "").trim().slice(0, 500) || null;
    await db.query("UPDATE skill_exchanges SET progress_percent = ? WHERE id = ?", [
      progressPercent,
      exchange.id,
    ]);
    await db.query(
      `INSERT INTO skill_exchange_updates (exchange_id, user_id, progress_percent, note)
       VALUES (?, ?, ?, ?)`,
      [exchange.id, req.user.id, progressPercent, note],
    );

    const io = req.app.get("io");
    if (io) {
      const payload = {
        exchangeId: exchange.id,
        progressPercent,
        note,
        updatedBy: req.user.fullName,
      };
      io.to(`user:${exchange.requester_id}`).emit("skill-exchange:progress", payload);
      io.to(`user:${exchange.provider_id}`).emit("skill-exchange:progress", payload);
    }
    return res.json({ message: "Learning progress updated.", progressPercent });
  } catch (err) {
    return next(err);
  }
};

const confirmSkillExchangeCompletion = async (req, res, next) => {
  try {
    let exchange = await getExchangeForParticipant(req.params.exchangeId, req.user.id);
    if (!exchange) return res.status(404).json({ error: "Skill exchange not found." });
    if (exchange.status === "completed") {
      return res.json({ message: "Skill exchange is already completed.", completed: true });
    }
    if (exchange.status !== "accepted") {
      return res.status(400).json({ error: "Only accepted exchanges can be completed." });
    }

    const completionColumn =
      exchange.requester_id === req.user.id
        ? "requester_completed_at"
        : "provider_completed_at";
    await db.query(
      `UPDATE skill_exchanges SET ${completionColumn} = COALESCE(${completionColumn}, NOW()) WHERE id = ?`,
      [exchange.id],
    );
    exchange = await getExchangeForParticipant(exchange.id, req.user.id);
    const completed = Boolean(
      exchange.requester_completed_at && exchange.provider_completed_at,
    );

    if (completed) {
      await db.query(
        `UPDATE skill_exchanges
         SET status = 'completed', progress_percent = 100, completed_at = NOW()
         WHERE id = ?`,
        [exchange.id],
      );
      await db.query(
        `INSERT INTO skill_exchange_updates (exchange_id, user_id, progress_percent, note)
         VALUES (?, ?, 100, ?)`,
        [exchange.id, req.user.id, String(req.body.note || "Exchange completed").slice(0, 500)],
      );
    }

    const otherUserId =
      exchange.requester_id === req.user.id
        ? exchange.provider_id
        : exchange.requester_id;
    await db.query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES (?, 'skill_exchange', ?, ?, ?)`,
      [
        otherUserId,
        completed ? "Skill exchange completed" : "Completion confirmation requested",
        completed
          ? `${req.user.fullName} confirmed completion. The exchange is now in your learning history.`
          : `${req.user.fullName} completed the exchange. Confirm when you are finished too.`,
        `/community/skill-exchange/${exchange.id}`,
      ],
    );

    return res.json({
      message: completed
        ? "Both members confirmed. Skill exchange completed."
        : "Completion saved. Waiting for the other member to confirm.",
      completed,
    });
  } catch (err) {
    return next(err);
  }
};

const getSkillLearningHistory = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT se.*, requester.full_name AS requester_name,
              provider.full_name AS provider_name
       FROM skill_exchanges se
       JOIN users requester ON requester.id = se.requester_id
       JOIN users provider ON provider.id = se.provider_id
       WHERE se.requester_id = ? OR se.provider_id = ?
       ORDER BY COALESCE(se.completed_at, se.updated_at) DESC`,
      [req.user.id, req.user.id],
    );
    const exchanges = rows.map((row) => ({
      ...formatExchange(row, req.user.id),
      learnedSkill:
        row.requester_id === req.user.id ? row.skill_requested : row.skill_offered,
      taughtSkill:
        row.requester_id === req.user.id ? row.skill_offered : row.skill_requested,
      partnerName:
        row.requester_id === req.user.id ? row.provider_name : row.requester_name,
    }));
    const completed = exchanges.filter((exchange) => exchange.status === "completed");
    const active = exchanges.filter((exchange) => exchange.status === "accepted");
    return res.json({
      history: completed,
      active,
      stats: {
        completed: completed.length,
        active: active.length,
        skillsLearned: unique(completed.map((exchange) => exchange.learnedSkill)).length,
        averageProgress: active.length
          ? Math.round(active.reduce((total, exchange) => total + exchange.progressPercent, 0) / active.length)
          : 0,
      },
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  confirmSkillExchangeCompletion,
  getSkillExchangeDetail,
  getSkillLearningHistory,
  getSkillMatches,
  updateSkillExchangeProgress,
};
