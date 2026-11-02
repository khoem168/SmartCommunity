const express = require("express");
const { globalSearch } = require("../controllers/searchController");
const { optionalAuth } = require("../middleware/auth");

const router = express.Router();

// GET /api/search
// Publicly accessible with optional authorization (for future personalized weighting or access tracking)
router.get("/", optionalAuth, globalSearch);

module.exports = router;
