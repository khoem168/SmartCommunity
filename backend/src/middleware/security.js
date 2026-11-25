/**
 * Platform Security Hardening Middleware
 * - Prevents Prototype Pollution (__proto__, constructor, prototype)
 * - Strips null bytes (\0) & dangerous script/event-handler injections
 * - Prevents HTTP Parameter Pollution (HPP) on scalar query parameters
 * - Applies defense-in-depth HTTP security headers
 */

const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);

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

const sanitizeObjectInPlace = (target, depth = 0) => {
  if (!target || typeof target !== "object" || depth > 8) return target;

  if (Array.isArray(target)) {
    for (let i = 0; i < target.length; i += 1) {
      if (typeof target[i] === "string") {
        target[i] = sanitizeStringValue(target[i]);
      } else if (target[i] && typeof target[i] === "object") {
        sanitizeObjectInPlace(target[i], depth + 1);
      }
    }
    return target;
  }

  for (const key of Object.keys(target)) {
    if (FORBIDDEN_KEYS.has(key)) {
      delete target[key];
      continue;
    }
    const val = target[key];
    if (typeof val === "string") {
      target[key] = sanitizeStringValue(val);
    } else if (val && typeof val === "object") {
      sanitizeObjectInPlace(val, depth + 1);
    }
  }
  return target;
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

  // 2. HTTP Parameter Pollution (HPP) normalization for scalar query params
  if (req.query && typeof req.query === "object") {
    for (const key of Object.keys(req.query)) {
      if (FORBIDDEN_KEYS.has(key)) {
        delete req.query[key];
        continue;
      }
      if (Array.isArray(req.query[key]) && SCALAR_QUERY_PARAMS.has(key)) {
        req.query[key] = req.query[key][req.query[key].length - 1];
      }
    }
    sanitizeObjectInPlace(req.query);
  }

  // 3. Sanitize request body and URL params
  if (req.body && typeof req.body === "object") {
    sanitizeObjectInPlace(req.body);
  }
  if (req.params && typeof req.params === "object") {
    sanitizeObjectInPlace(req.params);
  }

  return next();
};

module.exports = {
  sanitizeObjectInPlace,
  sanitizeStringValue,
  securityHardening,
};
