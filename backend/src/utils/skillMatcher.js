const parseJson = (value, fallback = []) => {
  if (!value) return fallback;
  try {
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return fallback;
  }
};

const extractUserSkills = (user) => {
  if (!user) return [];
  const profileSkills = user.skills || {};
  const rawList = [
    ...(Array.isArray(profileSkills.candidate) ? profileSkills.candidate : []),
    ...(Array.isArray(profileSkills.learn) ? profileSkills.learn : []),
    ...(Array.isArray(profileSkills.teach) ? profileSkills.teach : []),
    ...(Array.isArray(user.interestedSkills) ? user.interestedSkills : []),
    ...(typeof profileSkills === "string" ? profileSkills.split(/[,\n]/) : []),
  ];

  if (typeof user.interestedSkills === "string") {
    rawList.push(...user.interestedSkills.split(/[,\n]/));
  }

  const seen = new Set();
  const cleaned = [];
  for (const item of rawList) {
    const trimmed = String(item || "").trim();
    if (trimmed && !seen.has(trimmed.toLowerCase())) {
      seen.add(trimmed.toLowerCase());
      cleaned.push(trimmed);
    }
  }
  return cleaned;
};

const normalizeSkill = (s = "") =>
  String(s)
    .toLowerCase()
    .trim()
    .replace(/[./_-]/g, "");

const isSkillMatch = (userSkill, reqSkill) => {
  const u = String(userSkill || "").toLowerCase().trim();
  const r = String(reqSkill || "").toLowerCase().trim();
  if (!u || !r) return false;

  if (u === r) return true;
  if (u.includes(r) || r.includes(u)) return true;

  const nu = normalizeSkill(u);
  const nr = normalizeSkill(r);
  if (nu === nr || nu.includes(nr) || nr.includes(nu)) return true;

  // Synonyms and common abbreviations
  const synonyms = [
    ["js", "javascript"],
    ["ts", "typescript"],
    ["py", "python"],
    ["react", "reactjs", "react.js"],
    ["node", "nodejs", "node.js"],
    ["vue", "vuejs", "vue.js"],
    ["html/css", "html", "css", "html5", "css3"],
    ["db", "database", "sql", "mysql", "postgresql"],
    ["git", "github", "version control"],
    ["ui/ux", "ui", "ux", "figma", "design"],
    ["stats", "statistics", "analytics", "data analysis"],
    ["rest", "api", "rest api", "express"],
  ];

  return synonyms.some((group) => {
    const matchU = group.some((item) => u.includes(item) || item.includes(u));
    const matchR = group.some((item) => r.includes(item) || item.includes(r));
    return matchU && matchR;
  });
};

const matchSkills = (userSkills = [], requirements = []) => {
  const reqList = Array.isArray(requirements)
    ? requirements.map((item) => String(item).trim()).filter(Boolean)
    : String(requirements || "")
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter(Boolean);

  if (!reqList.length) {
    return {
      matchScore: userSkills.length ? 100 : null,
      matched: [],
      missing: [],
      totalCount: 0,
    };
  }

  const matched = [];
  const missing = [];

  for (const req of reqList) {
    const hasMatch = userSkills.some((uSkill) => isSkillMatch(uSkill, req));
    if (hasMatch) {
      matched.push(req);
    } else {
      missing.push(req);
    }
  }

  const matchScore = Math.round((matched.length / reqList.length) * 100);
  return {
    matchScore,
    matched,
    missing,
    totalCount: reqList.length,
  };
};

const findCourseForSkill = (courses = [], skill = "") => {
  if (!skill || !courses.length) return null;
  const target = String(skill).toLowerCase().trim();

  // 1. Direct title/category/slug match
  const found = courses.find((course) => {
    const title = (course.title || "").toLowerCase();
    const category = (course.category || "").toLowerCase();
    const slug = (course.slug || "").toLowerCase();
    const highlights = parseJson(course.highlights, []).map((h) => String(h).toLowerCase());

    return (
      isSkillMatch(target, title) ||
      isSkillMatch(target, category) ||
      isSkillMatch(target, slug) ||
      highlights.some((h) => isSkillMatch(target, h))
    );
  });

  if (!found) return null;

  return {
    id: found.id,
    slug: found.slug,
    title: found.title,
    category: found.category,
    level: found.level,
    thumbnailUrl: found.thumbnail_url || found.thumbnailUrl,
    durationText: found.duration_text || found.durationText || found.duration,
    price: Number(found.price || 0),
    currency: found.currency || "USD",
  };
};

module.exports = {
  extractUserSkills,
  findCourseForSkill,
  isSkillMatch,
  matchSkills,
  parseJson,
};
