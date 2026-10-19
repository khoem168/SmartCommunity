const db = require("../config/db");
const { hashPassword } = require("../utils/auth");

const isProduction = process.env.NODE_ENV === "production";
const email = String(
  process.env.ADMIN_EMAIL || "admin@smartcommunity.com",
)
  .trim()
  .toLowerCase();
const password = process.env.ADMIN_PASSWORD || (isProduction ? "" : "admin123");
const fullName = String(process.env.ADMIN_NAME || "Smart Community Admin").trim();

const run = async () => {
  if (!email || !password) {
    throw new Error(
      "ADMIN_EMAIL and ADMIN_PASSWORD are required when seeding an administrator.",
    );
  }

  const passwordHash = await hashPassword(password);
  await db.query(
    `INSERT INTO users
       (email, password_hash, full_name, role, is_verified, is_active,
        auth_provider, email_verified_at)
     VALUES (?, ?, ?, 'admin', 1, 1, 'local', NOW())
     ON DUPLICATE KEY UPDATE
       password_hash = VALUES(password_hash),
       full_name = VALUES(full_name),
       role = 'admin',
       is_verified = 1,
       is_active = 1,
       auth_provider = 'local',
       email_verified_at = COALESCE(email_verified_at, NOW()),
       suspension_reason = NULL,
       suspended_at = NULL,
       suspended_by = NULL`,
    [email, passwordHash, fullName],
  );

  console.log(`Administrator account ready: ${email}`);
};

run()
  .catch((error) => {
    console.error("Administrator seed failed:", error.stack || error.message);
    process.exitCode = 1;
  })
  .finally(() => db.end());
