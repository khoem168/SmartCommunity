// Only supplied, editable fields are updated. Missing fields must survive PATCH.
const buildProfilePatch = (body = {}, currentSkills = {}) => {
  const updates = {};
  const fields = {
    fullName: ["full_name", 100], bio: ["bio", 5000], location: ["location", 100],
    jobTitle: ["profession", 100], recruiterCompany: ["company", 150],
    githubUrl: ["github_url", 500], linkedinUrl: ["linkedin_url", 500],
    careerGoal: ["career_goal", 1000],
  };
  for (const [key, [column, limit]] of Object.entries(fields)) {
    if (!Object.hasOwn(body, key)) continue;
    if (typeof body[key] !== "string" && body[key] !== null) throw new Error(`Invalid ${key}.`);
    const value = String(body[key] || "").trim();
    if (value.length > limit || (key === "fullName" && !value)) throw new Error(`Invalid ${key}.`);
    if (value && key.endsWith("Url")) {
      let url;
      try { url = new URL(value); } catch { throw new Error(`Invalid ${key}.`); }
      if (!["https:", "http:"].includes(url.protocol)) throw new Error(`Invalid ${key}.`);
    }
    updates[column] = value || null;
  }
  const list = (value, key) => {
    if (!Array.isArray(value) || value.length > 100 || value.some(item => typeof item !== "string" || item.length > 150)) {
      throw new Error(`Invalid ${key}.`);
    }
    return [...new Set(value.map(item => item.trim()).filter(Boolean))];
  };
  const skills = currentSkills && typeof currentSkills === "object" && !Array.isArray(currentSkills) ? { ...currentSkills } : {};
  let changedSkills = false;
  for (const [input, key] of Object.entries({ skillsToTeach: "teach", skillsToLearn: "learn", candidateSkills: "candidate" })) {
    if (!Object.hasOwn(body, input)) continue;
    skills[key] = list(body[input], input);
    changedSkills = true;
  }
  for (const key of ["availability", "experienceLevel"]) {
    if (!Object.hasOwn(body, key)) continue;
    if (typeof body[key] !== "string" || body[key].length > 150) throw new Error(`Invalid ${key}.`);
    skills[key] = body[key].trim();
    changedSkills = true;
  }
  if (Object.hasOwn(body, "darkMode")) {
    if (typeof body.darkMode !== "boolean") throw new Error("Invalid darkMode.");
    skills.preferences = { ...skills.preferences, darkMode: body.darkMode };
    changedSkills = true;
  }
  if (changedSkills) updates.skills = JSON.stringify(skills);
  if (Object.hasOwn(body, "interestedSkills")) updates.interested_skills = JSON.stringify(list(body.interestedSkills, "interestedSkills"));
  if (!Object.keys(updates).length) throw new Error("No editable profile fields provided.");
  return updates;
};

module.exports = { buildProfilePatch };
