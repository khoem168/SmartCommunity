import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGlobleContext } from "../../context/GlobleContext";
import { useLanguage } from "../../context/LanguageContext";
import { fetchCalendarEvents } from "../../services/calendarService";
import {
  FiCalendar,
  FiClock,
  FiVideo,
  FiExternalLink,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
  FiCheckCircle,
  FiAlertCircle,
  FiUsers,
  FiBriefcase,
  FiBookOpen,
  FiArrowRight,
  FiRefreshCw,
  FiX,
  FiMapPin,
} from "react-icons/fi";
import "./CalendarPage.css";

const EVENT_TYPE_CONFIG = {
  mentorship: {
    labelEn: "Mentorship",
    labelKm: "ការណែនាំពី Mentor",
    colorClass: "event-mentorship",
    badgeClass: "badge-mentorship",
    icon: FiUsers,
  },
  learning_session: {
    labelEn: "Live Class",
    labelKm: "ថ្នាក់រៀនផ្ទាល់",
    colorClass: "event-class",
    badgeClass: "badge-class",
    icon: FiBookOpen,
  },
  interview: {
    labelEn: "Job Interview",
    labelKm: "សម្ភាសន៍ការងារ",
    colorClass: "event-interview",
    badgeClass: "badge-interview",
    icon: FiBriefcase,
  },
  skill_exchange: {
    labelEn: "Skill Swap",
    labelKm: "ផ្លាស់ប្តូរជំនាញ",
    colorClass: "event-skill",
    badgeClass: "badge-skill",
    icon: FiRefreshCw,
  },
};

const formatTimeRange = (startIso, endIso, isKm) => {
  if (!startIso) return "";
  const start = new Date(startIso);
  const end = endIso ? new Date(endIso) : null;

  const timeOptions = { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Phnom_Penh" };
  const startTime = start.toLocaleTimeString("en-US", timeOptions);
  const endTime = end ? end.toLocaleTimeString("en-US", timeOptions) : "";

  return `${startTime}${endTime ? ` - ${endTime}` : ""} ICT`;
};

const formatDateFull = (isoString, isKm) => {
  if (!isoString) return "";
  const d = new Date(isoString);
  const locale = isKm ? "km-KH" : "en-US";
  return d.toLocaleDateString(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Phnom_Penh",
  });
};

export default function CalendarPage() {
  const { user } = useGlobleContext();
  const { language } = useLanguage();
  const isKm = language === "km";
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState("agenda"); // "month" | "agenda"
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Load calendar events
  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchCalendarEvents();
      setEvents(res.events || []);
    } catch (err) {
      console.error("Failed to load calendar events:", err);
      setError(isKm ? "មិនអាចទាញយកកាលវិភាគបានទេ។ សូមព្យាយាមម្តងទៀត។" : "Unable to load calendar events. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (typeFilter !== "all" && e.sourceType !== typeFilter) return false;
      return true;
    });
  }, [events, typeFilter]);

  // Month navigation helpers
  const nextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const resetToday = () => {
    setCurrentDate(new Date());
  };

  const monthName = currentDate.toLocaleDateString(isKm ? "km-KH" : "en-US", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Phnom_Penh",
  });

  // Days for month grid
  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sun
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Padding from prev month
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ dayNumber: null, isCurrentMonth: false });
    }
    // Days of current month
    const today = new Date();
    for (let d = 1; d <= totalDays; d++) {
      const dateObj = new Date(year, month, d);
      const isToday =
        dateObj.getDate() === today.getDate() &&
        dateObj.getMonth() === today.getMonth() &&
        dateObj.getFullYear() === today.getFullYear();

      // Find events on this day
      const dayEvents = filteredEvents.filter((ev) => {
        const evDate = new Date(ev.startAt);
        return (
          evDate.getDate() === d &&
          evDate.getMonth() === month &&
          evDate.getFullYear() === year
        );
      });

      days.push({
        dayNumber: d,
        dateObj,
        isCurrentMonth: true,
        isToday,
        events: dayEvents,
      });
    }
    return days;
  }, [currentDate, filteredEvents]);

  // Group events by date for Agenda view
  const agendaGrouped = useMemo(() => {
    const groups = {};
    filteredEvents.forEach((ev) => {
      const dateKey = new Date(ev.startAt).toLocaleDateString("en-CA", {
        timeZone: "Asia/Phnom_Penh",
      }); // YYYY-MM-DD
      if (!groups[dateKey]) {
        groups[dateKey] = {
          rawDate: ev.startAt,
          items: [],
        };
      }
      groups[dateKey].items.push(ev);
    });
    return Object.values(groups);
  }, [filteredEvents]);

  const weekDayLabels = isKm
    ? ["អាទិត្យ", "ចន្ទ", "អង្គារ", "ពុធ", "ព្រហ", "សុក្រ", "សៅរ៍"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="unified-calendar-container">
      {/* Top Breadcrumb & Navigation */}
      <div className="calendar-breadcrumbs">
        <Link to="/dashboard" className="breadcrumb-link">
          {isKm ? "ផ្ទាំងការងារ (Dashboard)" : "Dashboard"}
        </Link>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">
          {isKm ? "កាលវិភាគសកម្មភាពរួម" : "Unified Activity Calendar"}
        </span>
      </div>

      {/* Header Banner */}
      <header className="calendar-header">
        <div className="calendar-title-wrap">
          <div className="calendar-title-badge">
            <FiCalendar size={18} />
            <span>{isKm ? "កាលវិភាគកម្ពុជា (ICT)" : "Cambodia Standard Time (ICT)"}</span>
          </div>
          <h1>{isKm ? "កាលវិភាគសកម្មភាពរួម" : "Unified Activity Calendar"}</h1>
          <p className="calendar-subtitle">
            {isKm
              ? "គ្រប់គ្រង និងតាមដានរាល់ការណែនាំពី Mentor, ថ្នាក់រៀនផ្ទាល់, ការផ្លាស់ប្តូរជំនាញ និងការសម្ភាសន៍ការងារក្នុងកន្លែងតែមួយ។"
              : "Consolidated, real-time schedule for your mentorship sessions, live workshops, skill swaps, and recruiter interviews."}
          </p>
        </div>

        {/* View Switcher & Action Bar */}
        <div className="calendar-view-controls">
          <div className="view-toggle-group">
            <button
              className={`view-toggle-btn ${activeView === "agenda" ? "active" : ""}`}
              onClick={() => setActiveView("agenda")}
            >
              {isKm ? "បញ្ជីកាលវិភាគ (Agenda)" : "Agenda View"}
            </button>
            <button
              className={`view-toggle-btn ${activeView === "month" ? "active" : ""}`}
              onClick={() => setActiveView("month")}
            >
              {isKm ? "ទិដ្ឋភាពខែ (Month)" : "Month View"}
            </button>
          </div>

          <button className="calendar-refresh-btn" onClick={loadEvents} title="Refresh calendar">
            <FiRefreshCw size={16} className={loading ? "spin" : ""} />
            <span>{isKm ? "ធ្វើបច្ចុប្បន្នភាព" : "Refresh"}</span>
          </button>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="calendar-filter-bar">
        <div className="filter-label">
          <FiFilter size={15} />
          <span>{isKm ? "ប្រភេទសកម្មភាព៖" : "Activity Type:"}</span>
        </div>
        <div className="filter-chips">
          {[
            { id: "all", labelEn: "All Activities", labelKm: "សកម្មភាពទាំងអស់" },
            { id: "mentorship", labelEn: "Mentorship", labelKm: "ការណែនាំ" },
            { id: "learning_session", labelEn: "Live Classes", labelKm: "ថ្នាក់រៀនផ្ទាល់" },
            { id: "interview", labelEn: "Interviews", labelKm: "សម្ភាសន៍" },
            { id: "skill_exchange", labelEn: "Skill Swaps", labelKm: "ផ្លាស់ប្តូរជំនាញ" },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`filter-chip ${typeFilter === tab.id ? "active" : ""}`}
              onClick={() => setTypeFilter(tab.id)}
            >
              {isKm ? tab.labelKm : tab.labelEn}
              <span className="chip-count">
                {tab.id === "all"
                  ? events.length
                  : events.filter((e) => e.sourceType === tab.id).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {loading && (
        <div className="calendar-loading-state">
          <div className="loading-spinner" />
          <p>{isKm ? "កំពុងទាញយកកាលវិភាគ..." : "Loading unified schedule..."}</p>
        </div>
      )}

      {error && (
        <div className="calendar-error-banner">
          <FiAlertCircle size={20} />
          <span>{error}</span>
          <button onClick={loadEvents} className="btn-retry">
            {isKm ? "ព្យាយាមម្តងទៀត" : "Retry"}
          </button>
        </div>
      )}

      {!loading && !error && filteredEvents.length === 0 && (
        <div className="calendar-empty-card">
          <FiCalendar size={48} className="empty-icon" />
          <h3>{isKm ? "គ្មានសកម្មភាពក្នុងកាលវិភាគទេ" : "No Scheduled Activities"}</h3>
          <p>
            {isKm
              ? "អ្នកមិនទាន់មានការណែនាំ ថ្នាក់រៀន ឬការសម្ភាសន៍ដែលបានកំណត់ពេលនៅឡើយទេ។"
              : "You have no upcoming mentorship bookings, live workshops, or interviews scheduled."}
          </p>
          <div className="empty-actions">
            <Link to="/mentorship" className="btn-primary-ghost">
              {isKm ? "ស្វែងរក Mentor" : "Book a Mentor"}
            </Link>
            <Link to="/sessions" className="btn-primary-ghost">
              {isKm ? "មើលថ្នាក់រៀនផ្ទាល់" : "Browse Live Classes"}
            </Link>
          </div>
        </div>
      )}

      {/* Month View */}
      {!loading && !error && filteredEvents.length > 0 && activeView === "month" && (
        <div className="calendar-month-wrapper">
          <div className="month-navigation-bar">
            <div className="month-selector">
              <h2>{monthName}</h2>
              <span className="tz-label">Asia/Phnom_Penh (UTC+7)</span>
            </div>
            <div className="month-nav-actions">
              <button className="btn-nav" onClick={prevMonth} aria-label="Previous Month">
                <FiChevronLeft size={18} />
              </button>
              <button className="btn-today" onClick={resetToday}>
                {isKm ? "ថ្ងៃនេះ" : "Today"}
              </button>
              <button className="btn-nav" onClick={nextMonth} aria-label="Next Month">
                <FiChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="month-grid">
            {weekDayLabels.map((lbl, idx) => (
              <div key={idx} className="month-grid-header">
                {lbl}
              </div>
            ))}
            {daysInMonth.map((cell, idx) => (
              <div
                key={idx}
                className={`month-cell ${cell.isCurrentMonth ? "" : "cell-empty"} ${
                  cell.isToday ? "cell-today" : ""
                } ${cell.events?.length ? "cell-has-events" : ""}`}
              >
                {cell.dayNumber && (
                  <div className="cell-day-number">
                    <span>{cell.dayNumber}</span>
                    {cell.isToday && <span className="today-dot" title="Today" />}
                  </div>
                )}
                <div className="cell-events-list">
                  {cell.events?.map((ev) => {
                    const cfg = EVENT_TYPE_CONFIG[ev.sourceType] || EVENT_TYPE_CONFIG.mentorship;
                    return (
                      <div
                        key={ev.id}
                        className={`calendar-event-pill ${cfg.colorClass} ${
                          ev.isPending ? "pill-pending" : ""
                        }`}
                        onClick={() => setSelectedEvent(ev)}
                        title={`${ev.title} (${ev.durationMinutes}m)`}
                      >
                        <span className="pill-dot" />
                        <span className="pill-title">{ev.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agenda / List View */}
      {!loading && !error && filteredEvents.length > 0 && activeView === "agenda" && (
        <div className="calendar-agenda-wrapper">
          {agendaGrouped.map((group, gIdx) => (
            <section key={gIdx} className="agenda-date-group">
              <div className="agenda-date-header">
                <div className="date-icon-box">
                  <span className="date-month">
                    {new Date(group.rawDate).toLocaleDateString(isKm ? "km-KH" : "en-US", {
                      month: "short",
                      timeZone: "Asia/Phnom_Penh",
                    })}
                  </span>
                  <span className="date-day">
                    {new Date(group.rawDate).toLocaleDateString("en-US", {
                      day: "numeric",
                      timeZone: "Asia/Phnom_Penh",
                    })}
                  </span>
                </div>
                <div className="date-text-meta">
                  <h3>{formatDateFull(group.rawDate, isKm)}</h3>
                  <span className="date-count">
                    {group.items.length} {isKm ? "សកម្មភាព" : "activity(ies)"}
                  </span>
                </div>
              </div>

              <div className="agenda-items-list">
                {group.items.map((ev) => {
                  const cfg = EVENT_TYPE_CONFIG[ev.sourceType] || EVENT_TYPE_CONFIG.mentorship;
                  const Icon = cfg.icon;
                  const hasMeeting = Boolean(ev.meetingLink);

                  return (
                    <article
                      key={ev.id}
                      className={`agenda-card ${cfg.colorClass} ${ev.isPending ? "card-pending" : ""}`}
                    >
                      <div className="agenda-card-top">
                        <div className="card-type-tag">
                          <Icon size={14} />
                          <span>{isKm ? cfg.labelKm : cfg.labelEn}</span>
                        </div>
                        <div className="card-status-tag">
                          {ev.isPending ? (
                            <span className="status-badge badge-pending">
                              <FiAlertCircle size={13} />
                              <span>{isKm ? "រង់ចាំការយល់ព្រម" : "Pending Approval"}</span>
                            </span>
                          ) : (
                            <span className="status-badge badge-confirmed">
                              <FiCheckCircle size={13} />
                              <span>{isKm ? "បានបញ្ជាក់" : "Confirmed"}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="agenda-card-body">
                        <h4 className="agenda-event-title">
                          {isKm && String(ev.title || "").startsWith("Skill Swap:")
                            ? ev.title.replace("Skill Swap:", "ផ្លាស់ប្តូរជំនាញ៖")
                            : isKm && String(ev.title || "").toLowerCase().includes("full-stack portfolio review")
                              ? "ការពិនិត្យកែលម្អគម្រោង Full-Stack Portfolio"
                              : ev.title}
                        </h4>
                        {ev.description && (
                          <p className="agenda-event-desc">
                            {isKm && String(ev.description).includes("is sharing")
                              ? ev.description
                                  .replace("is sharing", "ចែករំលែកជំនាញ")
                                  .replace("while learning", "និងរៀនជំនាញ")
                                  .replace("and learning", "និងរៀន")
                                  .replace("from", "ពី")
                                  .replace("with", "ជាមួយ")
                              : isKm && String(ev.description).toLowerCase().includes("discuss react & node.js")
                                ? "ពិភាក្សាអំពីស្ថាបត្យកម្ម React.js និង Node.js សម្រាប់គម្រោងបញ្ចប់ការសិក្សា"
                                : ev.description}
                          </p>
                        )}

                        <div className="agenda-meta-grid">
                          <div className="meta-slot">
                            <FiClock size={14} />
                            <span>{formatTimeRange(ev.startAt, ev.endAt, isKm)}</span>
                          </div>
                          <div className="meta-slot">
                            <span className="meta-duration">
                              ({ev.durationMinutes} {isKm ? "នាទី" : "min"})
                            </span>
                          </div>
                          {ev.partner?.name && (
                            <div className="meta-slot">
                              <FiUsers size={14} />
                              <span>
                                {ev.participantRole === "mentor"
                                  ? isKm
                                    ? "សិស្ស៖ "
                                    : "Student: "
                                  : isKm
                                    ? "ជាមួយ៖ "
                                    : "With: "}
                                <strong>{ev.partner.name}</strong>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="agenda-card-footer">
                        {hasMeeting && (
                          <a
                            href={ev.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-join-session"
                            title="Join Jitsi Video Session"
                          >
                            <FiVideo size={15} />
                            <span>{isKm ? "ចូលរួម Session (Video)" : "Join Video Room"}</span>
                          </a>
                        )}

                        <button
                          type="button"
                          className="btn-view-details"
                          onClick={() => setSelectedEvent(ev)}
                        >
                          <span>{isKm ? "ព័ត៌មានលម្អិត" : "Details"}</span>
                          <FiArrowRight size={14} />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="calendar-modal-backdrop" onClick={() => setSelectedEvent(null)}>
          <div className="calendar-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-type-chip">
                {EVENT_TYPE_CONFIG[selectedEvent.sourceType]?.labelEn || "Activity"}
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setSelectedEvent(null)}
                aria-label="Close"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="modal-body">
              <h3 className="modal-title">{selectedEvent.title}</h3>
              {selectedEvent.description && (
                <p className="modal-description">{selectedEvent.description}</p>
              )}

              <div className="modal-info-grid">
                <div className="info-item">
                  <span className="info-label">{isKm ? "កាលបរិច្ឆេទ" : "Date"}</span>
                  <span className="info-value">{formatDateFull(selectedEvent.startAt, isKm)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">{isKm ? "ពេលវេលា" : "Time"}</span>
                  <span className="info-value">
                    {formatTimeRange(selectedEvent.startAt, selectedEvent.endAt, isKm)}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">{isKm ? "រយៈពេល" : "Duration"}</span>
                  <span className="info-value">{selectedEvent.durationMinutes} minutes</span>
                </div>
                <div className="info-item">
                  <span className="info-label">{isKm ? "ស្ថានភាព" : "Status"}</span>
                  <span
                    className={`status-pill ${
                      selectedEvent.isPending ? "pill-pending" : "pill-confirmed"
                    }`}
                  >
                    {selectedEvent.isPending ? "Pending Confirmation" : "Confirmed"}
                  </span>
                </div>
                {selectedEvent.partner?.name && (
                  <div className="info-item span-2">
                    <span className="info-label">{isKm ? "ដៃគូសហការ" : "Partner"}</span>
                    <span className="info-value">
                      {selectedEvent.partner.name} ({selectedEvent.partner.role})
                    </span>
                  </div>
                )}
                {selectedEvent.meetingLink && (
                  <div className="info-item span-2 meeting-box">
                    <span className="info-label">{isKm ? "បន្ទប់វីដេអូ (Jitsi)" : "Meeting Link"}</span>
                    <a
                      href={selectedEvent.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="meeting-link-anchor"
                    >
                      <FiVideo size={14} />
                      <span>{selectedEvent.meetingLink}</span>
                      <FiExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              {selectedEvent.detailRoute && (
                <Link
                  to={selectedEvent.detailRoute}
                  className="btn-modal-link"
                  onClick={() => setSelectedEvent(null)}
                >
                  <span>{isKm ? "បើកទំព័រគ្រប់គ្រង" : "Open Module Workspace"}</span>
                  <FiExternalLink size={14} />
                </Link>
              )}
              {selectedEvent.meetingLink && (
                <a
                  href={selectedEvent.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-modal-join"
                >
                  <FiVideo size={16} />
                  <span>{isKm ? "ចូលរួមឥឡូវ" : "Join Session Now"}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
