const insecureValues = new Set([
  "change_me",
  "generate_a_long_random_secret",
  "local-development-secret-change-before-hosting",
]);

const isHttpsUrl = (value) => {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};

const validateEnvironment = () => {
  if (process.env.NODE_ENV !== "production") return;

  const errors = [];
  const requiredDatabaseValues = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];

  requiredDatabaseValues.forEach((name) => {
    const value = String(process.env[name] || "").trim();
    if (!value || insecureValues.has(value)) {
      errors.push(`${name} must be configured with a production value.`);
    }
  });

  const jwtSecret = String(process.env.JWT_SECRET || "");
  if (jwtSecret.length < 32 || insecureValues.has(jwtSecret)) {
    errors.push("JWT_SECRET must be a unique secret of at least 32 characters.");
  }

  const clientOrigins = String(process.env.CLIENT_URL || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (
    clientOrigins.length === 0 ||
    clientOrigins.includes("*") ||
    clientOrigins.some((origin) => !isHttpsUrl(origin))
  ) {
    errors.push("CLIENT_URL must contain only explicit HTTPS production origins.");
  }

  if (!isHttpsUrl(String(process.env.APP_URL || ""))) {
    errors.push("APP_URL must be the public HTTPS frontend URL.");
  }

  if (errors.length > 0) {
    throw new Error(`Invalid production environment:\n- ${errors.join("\n- ")}`);
  }
};

module.exports = validateEnvironment;
