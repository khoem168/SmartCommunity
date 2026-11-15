const isEnabled = (value) =>
  ["1", "true", "yes", "on"].includes(String(value || "").trim().toLowerCase());

// One place turns DB_* values into mysql2 options, so the server pool and the
// hosted-database scripts cannot connect with different TLS settings.
const connectionOptions = (env = process.env) => {
  const ca = String(env.DB_SSL_CA || "").replace(/\\n/g, "\n").trim();
  // DB_SSL_CA verifies the server certificate (Aiven and similar providers).
  // DB_SSL=true only encrypts the connection: Railway's MySQL presents a
  // self-signed certificate, so there is no public CA to verify it against.
  const ssl = ca
    ? { ca, rejectUnauthorized: true }
    : isEnabled(env.DB_SSL)
      ? { rejectUnauthorized: false }
      : null;

  return {
    host: env.DB_HOST || "127.0.0.1",
    user: env.DB_USER || "root",
    password: env.DB_PASSWORD || "",
    database: env.DB_NAME || "final_pro",
    port: Number(env.DB_PORT || 3306),
    ...(ssl ? { ssl } : {}),
  };
};

module.exports = { connectionOptions };
