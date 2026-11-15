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
  const configurationFields = [];
  const requiredDatabaseValues = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];

  requiredDatabaseValues.forEach((name) => {
    const value = String(process.env[name] || "").trim();
    if (!value || insecureValues.has(value)) {
      configurationFields.push(name);
      errors.push(`${name} must be configured with a production value.`);
    }
  });

  const jwtSecret = String(process.env.JWT_SECRET || "");
  if (jwtSecret.length < 32 || insecureValues.has(jwtSecret)) {
    configurationFields.push("JWT_SECRET");
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
    configurationFields.push("CLIENT_URL");
    errors.push("CLIENT_URL must contain only explicit HTTPS production origins.");
  }

  if (!isHttpsUrl(String(process.env.APP_URL || ""))) {
    configurationFields.push("APP_URL");
    errors.push("APP_URL must be the public HTTPS frontend URL.");
  }

  if (errors.length > 0) {
    const error = new Error(`Invalid production environment:\n- ${errors.join("\n- ")}`);
    error.code = "INVALID_PRODUCTION_CONFIGURATION";
    error.configurationFields = configurationFields;
    throw error;
  }
};

module.exports = validateEnvironment;
