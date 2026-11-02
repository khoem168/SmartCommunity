const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { getCalendarEvents } = require("../controllers/calendarController");

const router = express.Router();

// GET /api/calendar/events - Unified read-only calendar feed scoped to authenticated user's role
router.get("/events", requireAuth, getCalendarEvents);

module.exports = router;
