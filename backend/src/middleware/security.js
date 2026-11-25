/**
 * Platform Security Hardening Middleware
 * - Enforces Super Admin Blocked IP list and Emergency Lockdown mode
 * - Detects & blocks Prototype Pollution (__proto__, constructor, prototype)
 * - Detects & strips null bytes (\0), XSS <script> tags, and SQLi/path-traversal probes
 * - Dispatches real-time Telegram Security Alerts on attack detection
 * - Prevents HTTP Parameter Pollution (HPP) on scalar query parameters
 * - Applies defense-in-depth HTTP security headers
 */
const securityAlerts = require("../services/securityAlertService");

const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);

const ATTACK_PATTERNS = [
  { name: "XSS_SCRIPT_TAG", regex: /<\s*\/?\s*script\b|javascript\s*:\s*|onerror\s*=|onload\s*=/i },
  { name: "SQL_INJECTION_PROBE", regex: /(\bunion\b[\s/+*]+\bselect\b|\bor\b\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?|\b(sleep|benchmark)\s*\(|information_schema\b)/i },
  { name: "PATH_TRAVERSAL_PROBE", regex: /(\.\.[/\\]){2,}(etc\/passwd|windows\/win\.ini|\.env)/i },
];

const SCALAR_QUERY_PARAMS = new Set([
  "q",
  "type",
  "category",
  "level",
  "price",
  "jobType",
  "sort",
  "page",
  "limit",
  "email",
  "token",
  "role",
  "status",
  "search",
]);

const sanitizeStringValue = (value) => {
  if (typeof value !== "string") return value;
  return value
    .replace(/\0/g, "")
    .replace(/<\s*script\b[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, "")
    .replace(/<\s*\/?\s*script\b[^>]*>/gi, "");
};

const detectSuspiciousString = (value) => {
  if (typeof value !== "string" || value.length < 4) return null;
  for (const rule of ATTACK_PATTERNS) {
    if (rule.regex.test(value)) return rule.name;
  }
  return null;
};

const sanitizeObjectInPlace = (target, depth = 0, findings = null) => {
  if (!target || typeof target !== "object" || depth > 8) return target;

  if (Array.isArray(target)) {
    for (let i = 0; i < target.length; i += 1) {
      if (typeof target[i] === "string") {
        const hit = findings && detectSuspiciousString(target[i]);
        if (hit) findings.push({ type: hit, sample: target[i].slice(0, 100) });
        target[i] = sanitizeStringValue(target[i]);
      } else if (target[i] && typeof target[i] === "object") {
        sanitizeObjectInPlace(target[i], depth + 1, findings);
      }
    }
    return target;
  }

  for (const key of Object.keys(target)) {
    if (FORBIDDEN_KEYS.has(key)) {
      if (findings) findings.push({ type: "PROTOTYPE_POLLUTION", sample: key });
      delete target[key];
      continue;
    }
    const val = target[key];
    if (typeof val === "string") {
      const hit = findings && detectSuspiciousString(val);
      if (hit) findings.push({ type: hit, sample: `${key}=${val.slice(0, 80)}` });
      target[key] = sanitizeStringValue(val);
    } else if (val && typeof val === "object") {
      sanitizeObjectInPlace(val, depth + 1, findings);
    }
  }
  return target;
};

const ipBlockAndLockdownGuard = async (req, res, next) => {
  // Always keep Telegram webhook and health check accessible
  if (req.path === "/health" || req.path.startsWith("/api/telegram/")) {
    return next();
  }

  try {
    const ip = securityAlerts.extractClientIp(req);
    if (await securityAlerts.isIpBlocked(ip)) {
      return res.status(403).json({
        error: "Access restricted for this IP address.",
        code: "IP_BLOCKED",
      });
    }

    // Emergency Lockdown blocks public mutating traffic while preserving Admin login & reads
    if (
      ["POST", "PUT", "PATCH", "DELETE"].includes(req.method) &&
      !req.path.startsWith("/api/auth/") &&
      !req.path.startsWith("/api/admin/")
    ) {
      if (await securityAlerts.isLockdownActive()) {
        return res.status(503).json({
          error: "Platform is temporarily in maintenance security mode. Please try again shortly.",
          code: "EMERGENCY_LOCKDOWN",
        });
      }
    }
  } catch {
    // Never break requests if DB is momentarily unavailable
  }
  return next();
};

const securityHardening = (req, res, next) => {
  // 1. Defense-in-depth HTTP Security Headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()",
  );

  // Skip payload scanning on Telegram webhook JSON (already secret-token authenticated)
  if (req.path.startsWith("/api/telegram/")) {
    return next();
  }

  const findings = [];

  // 2. HTTP Parameter Pollution (HPP) normalization for scalar query params
  if (req.query && typeof req.query === "object") {
    for (const key of Object.keys(req.query)) {
      if (FORBIDDEN_KEYS.has(key)) {
        findings.push({ type: "PROTOTYPE_POLLUTION", sample: `query.${key}` });
        delete req.query[key];
        continue;
      }
      if (Array.isArray(req.query[key]) && SCALAR_QUERY_PARAMS.has(key)) {
        req.query[key] = req.query[key][req.query[key].length - 1];
      }
    }
    sanitizeObjectInPlace(req.query, 0, findings);
  }

  // 3. Sanitize request body and URL params
  if (req.body && typeof req.body === "object") {
    sanitizeObjectInPlace(req.body, 0, findings);
  }
  if (req.params && typeof req.params === "object") {
    sanitizeObjectInPlace(req.params, 0, findings);
  }

  // 4. Also check URL path itself for path traversal probes
  let decodedUrl = String(req.originalUrl || "");
  try {
    decodedUrl = decodeURIComponent(decodedUrl);
  } catch {
    // Malformed percent-encoding itself is kept raw for pattern check
  }
  const pathProbe = detectSuspiciousString(decodedUrl);
  if (pathProbe) {
    findings.push({ type: pathProbe, sample: String(req.originalUrl || "").slice(0, 120) });
  }

  if (findings.length > 0) {
    const primary = findings[0];
    securityAlerts.triggerSecurityAlert({
      eventType: primary.type,
      severity: primary.type === "SQL_INJECTION_PROBE" || primary.type === "PROTOTYPE_POLLUTION" ? "critical" : "warning",
      req,
      title: `រកឃើញការវាយប្រហារ៖ ${primary.type}`,
      details: {
        detectedCount: findings.length,
        sample: primary.sample,
      },
      alertSettingKey: "attack_alerts",
      cooldownKey: `attack:${primary.type}:${securityAlerts.extractClientIp(req)}`,
      cooldownMs: 60_000,
    });
  }

  return next();
};

module.exports = {
  ipBlockAndLockdownGuard,
  sanitizeObjectInPlace,
  sanitizeStringValue,
  securityHardening,
};
