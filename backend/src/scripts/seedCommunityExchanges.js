const db = require("../config/db");

const users = [
  "MUY KALIN",
  "HORN PISEY",
  "KRY SORANUTH",
  "SAMRITH RATANA",
  "HEANG CHHENGKHOEM",
];

const exchanges = [
  {
    requester: "MUY KALIN",
    provider: "HORN PISEY",
    offered: "React basics",
    requested: "UI/UX presentation design",
    status: "accepted",
    progress: 65,
    message:
      "MUY KALIN is sharing React basics while learning cleaner UI presentation skills from HORN PISEY.",
  },
  {
    requester: "HORN PISEY",
    provider: "KRY SORANUTH",
    offered: "Graphic design",
    requested: "Node.js API practice",
    status: "completed",
    progress: 100,
    message:
      "HORN PISEY exchanged design guidance for backend API practice with KRY SORANUTH.",
  },
  {
    requester: "KRY SORANUTH",
    provider: "SAMRITH RATANA",
    offered: "SQL and database basics",
    requested: "Cyber security fundamentals",
    status: "accepted",
    progress: 72,
    message:
      "KRY SORANUTH is helping with database practice while learning cyber security fundamentals.",
  },
  {
    requester: "SAMRITH RATANA",
    provider: "HEANG CHHENGKHOEM",
    offered: "Career preparation",
    requested: "Full-stack project workflow",
    status: "completed",
    progress: 100,
    message:
      "SAMRITH RATANA shared career preparation tips and learned full-stack project workflow.",
  },
  {
    requester: "HEANG CHHENGKHOEM",
    provider: "MUY KALIN",
    offered: "Project management",
    requested: "Frontend polish",
    status: "accepted",
    progress: 84,
    message:
      "HEANG CHHENGKHOEM is exchanging project management support for frontend polish practice.",
  },
];

const mapUsersByName = async () => {
  const [rows] = await db.query(
    `SELECT id, full_name
     FROM users
     WHERE is_active = 1
       AND LOWER(full_name) IN (${users.map(() => "LOWER(?)").join(",")})`,
    users,
  );

  return new Map(rows.map((row) => [row.full_name.toUpperCase(), row.id]));
};

const seedCommunityExchanges = async () => {
  const userMap = await mapUsersByName();
  const missingUsers = users.filter((name) => !userMap.has(name));

  if (missingUsers.length) {
    throw new Error(
      `Missing active community users: ${missingUsers.join(", ")}. Run npm run seed:community-users first.`,
    );
  }

  await db.query(
    `UPDATE skill_exchanges se
     JOIN users requester ON requester.id = se.requester_id
     JOIN users provider ON provider.id = se.provider_id
     SET se.status = 'cancelled',
         se.updated_at = CURRENT_TIMESTAMP
     WHERE (
         LOWER(TRIM(requester.full_name)) = 'heang chheng khoem'
         OR LOWER(TRIM(provider.full_name)) = 'heang chheng khoem'
       )
       AND se.status IN ('accepted', 'completed')
       AND NOT (
         LOWER(TRIM(requester.full_name)) = 'heang chhengkhoem'
         AND se.skill_offered = 'Project management'
         AND se.skill_requested = 'Frontend polish'
       )`,
  );

  for (const [index, exchange] of exchanges.entries()) {
    const requesterId = userMap.get(exchange.requester);
    const providerId = userMap.get(exchange.provider);
    const completedAt =
      exchange.status === "completed"
        ? `DATE_SUB(NOW(), INTERVAL ${index + 1} DAY)`
        : "NULL";

    const [existing] = await db.query(
      `SELECT id
       FROM skill_exchanges
       WHERE requester_id = ?
         AND provider_id = ?
         AND skill_offered = ?
         AND skill_requested = ?
       LIMIT 1`,
      [requesterId, providerId, exchange.offered, exchange.requested],
    );

    if (existing.length) {
      await db.query(
        `UPDATE skill_exchanges
         SET message = ?,
             status = ?,
             progress_percent = ?,
             requester_completed_at = IF(? = 'completed', COALESCE(requester_completed_at, NOW()), requester_completed_at),
             provider_completed_at = IF(? = 'completed', COALESCE(provider_completed_at, NOW()), provider_completed_at),
             completed_at = IF(? = 'completed', COALESCE(completed_at, NOW()), completed_at),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          exchange.message,
          exchange.status,
          exchange.progress,
          exchange.status,
          exchange.status,
          exchange.status,
          existing[0].id,
        ],
      );
      continue;
    }

    await db.query(
      `INSERT INTO skill_exchanges
       (requester_id, provider_id, skill_offered, skill_requested, message,
        status, scheduled_date, progress_percent, requester_completed_at,
        provider_completed_at, completed_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? DAY), ?,
        IF(? = 'completed', NOW(), NULL),
        IF(? = 'completed', NOW(), NULL),
        ${completedAt},
        DATE_SUB(NOW(), INTERVAL ? HOUR),
        CURRENT_TIMESTAMP)`,
      [
        requesterId,
        providerId,
        exchange.offered,
        exchange.requested,
        exchange.message,
        exchange.status,
        index + 1,
        exchange.progress,
        exchange.status,
        exchange.status,
        index + 1,
      ],
    );
  }

  console.log(`Seeded ${exchanges.length} recent community exchanges.`);
};

seedCommunityExchanges()
  .catch((error) => {
    console.error("Community exchange seed failed:", error.stack || error.message);
    process.exitCode = 1;
  })
  .finally(() => db.end());
