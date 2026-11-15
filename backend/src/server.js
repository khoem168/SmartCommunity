const http = require("http");
const express = require("express");

let server;
try {
  server = require("./application");
} catch (error) {
  // Keep the deployment diagnosable while failing closed for every API request.
  console.error("Backend startup failed:", error);
  const app = express();
  app.disable("x-powered-by");
  app.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });
  app.get("/health", (req, res) => {
    res.status(503).json({
      status: "error",
      service: "smart-community-api",
      code: error.code === "INVALID_PRODUCTION_CONFIGURATION"
        ? error.code : "BACKEND_STARTUP_FAILED",
      // Only known variable names are returned, never values or stack traces.
      ...(error.code === "INVALID_PRODUCTION_CONFIGURATION"
        ? { configurationFields: error.configurationFields } : {}),
    });
  });
  app.use((req, res) => {
    res.status(503).json({
      error: "The server is temporarily unavailable. Please try again later.",
      code: "SERVER_UNAVAILABLE",
    });
  });
  server = http.createServer(app);
}

if (require.main === module) {
  const port = process.env.PORT || 4000;
  server.listen(port, () => console.log(`Server running on port ${port}`));
}

module.exports = server;
