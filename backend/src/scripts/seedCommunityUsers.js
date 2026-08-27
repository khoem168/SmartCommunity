const db = require("../config/db");
const { hashPassword } = require("../utils/auth");

const defaultPassword = process.env.DEMO_USER_PASSWORD || "Css1236*";

const communityUsers = [
  {
    fullName: "MUY KALIN",
    email: "muy.kalin@smartcommunity.local",
    profession: "Frontend Learning Partner",
    location: "Online",
    bio: "A friendly community member focused on building practical web projects and sharing frontend basics.",
    skills: {
      teach: ["HTML/CSS", "JavaScript", "React"],
      learn: ["UI/UX Design", "Portfolio Review", "Backend"],
    },
    interestedSkills: ["Frontend", "UI/UX", "Portfolio"],
  },
  {
    fullName: "HORN PISEY",
    email: "horn.pisey@smartcommunity.local",
    profession: "Design & Content Learner",
    location: "Remote",
    bio: "Interested in design, presentation, and content planning for student projects.",
    skills: {
      teach: ["Graphic Design", "Content Strategy", "Canva"],
      learn: ["React", "JavaScript", "Career Portfolio"],
    },
    interestedSkills: ["Design", "Frontend", "Career"],
  },
  {
    fullName: "KRY SORANUTH",
    email: "kry.soranuth@smartcommunity.local",
    profession: "Backend API Learner",
    location: "Hybrid",
    bio: "Enjoys backend logic, APIs, and database practice for real project workflows.",
    skills: {
      teach: ["Node.js", "SQL", "API Development"],
      learn: ["React", "UI/UX Design", "Cloud Deployment"],
    },
    interestedSkills: ["Backend", "Database", "Cloud"],
  },
  {
    fullName: "SAMRITH RATANA",
    email: "samrith.ratana@smartcommunity.local",
    profession: "Career & Cyber Security Learner",
    location: "Online",
    bio: "Practicing safe web habits, communication skills, and career preparation.",
    skills: {
      teach: ["Cyber Security", "Linux Basics", "Career Preparation"],
      learn: ["Backend", "Database", "Internship Preparation"],
    },
    interestedSkills: ["Cyber Security", "Career", "Internship"],
  },
  {
    fullName: "HEANG CHHENGKHOEM",
    email: "heang.chhengkhoem@smartcommunity.local",
    profession: "Full-stack Project Builder",
    location: "Cambodia",
    bio: "Building the Smart Community Skill & Career Development Platform and connecting learners through skills.",
    skills: {
      teach: ["React", "Node.js", "Database", "Project Management"],
      learn: ["Advanced UI/UX", "Deployment", "System Design"],
    },
    interestedSkills: ["Full-stack", "Deployment", "System Design"],
  },
];

const seedCommunityUsers = async () => {
  const passwordHash = await hashPassword(defaultPassword);

  for (const user of communityUsers) {
    const [[existingByName], [existingByEmail]] = await Promise.all([
      db.query(
        "SELECT id, email FROM users WHERE LOWER(full_name) = LOWER(?) ORDER BY id ASC LIMIT 1",
        [user.fullName],
      ),
      db.query("SELECT id FROM users WHERE email = ? LIMIT 1", [user.email]),
    ]);
    const existingUser = existingByName[0] || existingByEmail[0];

    if (existingUser) {
      await db.query(
        `UPDATE users
         SET full_name = ?,
             role = 'student',
             bio = ?,
             skills = ?,
             profession = ?,
             location = ?,
             interested_skills = ?,
             is_verified = 1,
             is_active = 1,
             email_verified_at = COALESCE(email_verified_at, NOW())
         WHERE id = ?`,
        [
          user.fullName,
          user.bio,
          JSON.stringify(user.skills),
          user.profession,
          user.location,
          JSON.stringify(user.interestedSkills),
          existingUser.id,
        ],
      );

      if (existingUser.email !== user.email) {
        await db.query(
          `UPDATE users
           SET is_active = 0
           WHERE email = ? AND id <> ?`,
          [user.email, existingUser.id],
        );
      }
      continue;
    }

    await db.query(
      `INSERT INTO users
       (email, password_hash, full_name, role, bio, skills, profession, location,
        interested_skills, is_verified, is_active, auth_provider, email_verified_at)
       VALUES (?, ?, ?, 'student', ?, ?, ?, ?, ?, 1, 1, 'local', NOW())`,
      [
        user.email,
        passwordHash,
        user.fullName,
        user.bio,
        JSON.stringify(user.skills),
        user.profession,
        user.location,
        JSON.stringify(user.interestedSkills),
      ],
    );
  }

  console.log(`Seeded ${communityUsers.length} community users.`);
};

seedCommunityUsers()
  .catch((error) => {
    console.error("Community user seed failed:", error.stack || error.message);
    process.exitCode = 1;
  })
  .finally(() => db.end());
