import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  IoSwapHorizontalOutline,
  IoSearchOutline,
  IoFilterOutline,
  IoSparklesOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoCalendarOutline,
  IoChatbubbleEllipsesOutline,
  IoVideocamOutline,
  IoCloseOutline,
  IoSchoolOutline,
  IoBookOutline,
  IoArrowForwardOutline,
  IoPeopleOutline,
  IoRibbonOutline,
  IoCloseCircleOutline,
  IoAddOutline,
  IoLocationOutline,
} from "react-icons/io5";
import { useGlobleContext } from "../../context/GlobleContext";
import { useLanguage } from "../../context/LanguageContext";
import UserAvatar from "../../components/ui/UserAvatar";
import { localizePeerHeadline } from "../../utils/bilingualCatalog";
import { ButtonLoader, SkeletonGrid } from "../../components/ui/LoadingStates";
import {
  fetchSkillMatches,
  fetchSkillExchanges,
  fetchSkillLearningHistory,
  fetchMembers,
  updateSkillExchangeStatusRequest,
  confirmSkillExchangeCompletionRequest,
} from "../../services/platformService";
import { getSocket } from "../../services/realtimeService";
import RequestSwapModal from "./RequestSwapModal";
import PostOfferModal from "./PostOfferModal";
import "./SkillExchangeHub.css";

const formatScheduledDate = (value) => {
  if (!value) return "";
  const normalized = typeof value === "string" ? value.replace(" ", "T") : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export default function SkillExchangeHub({ initialTab = "match" }) {
  const { user } = useGlobleContext();
  const { language } = useLanguage();
  const isKm = language === "km";
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab state (URL query takes precedence, then initialTab prop)
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    ["match", "swaps", "sessions"].includes(tabParam)
      ? tabParam
      : initialTab,
  );

  // Data states
  const [matches, setMatches] = useState([]);
  const [profileSkills, setProfileSkills] = useState({ teach: [], learn: [] });
  const [allMembers, setAllMembers] = useState([]);
  const [exchanges, setExchanges] = useState([]);
  const [historyStats, setHistoryStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  // Modals
  const [requestModalMember, setRequestModalMember] = useState(null);
  const [postOfferOpen, setPostOfferOpen] = useState(false);

  // Tab 1 filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkillFilter, setSelectedSkillFilter] = useState("");

  // Tab 2 (Swaps) management states
  const [swapsSubTab, setSwapsSubTab] = useState("all"); // 'all' | 'incoming' | 'sent' | 'completed'
  const [scheduleByRequestId, setScheduleByRequestId] = useState({});
  const [decliningRequestId, setDecliningRequestId] = useState("");
  const [declineReasonById, setDeclineReasonById] = useState({});
  const [actionBusyId, setActionBusyId] = useState("");

  // Sync tab with URL
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  // Load all hub data
  const loadHubData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [membersData, exchangesData, matchesData, historyData] =
        await Promise.all([
          fetchMembers().catch(() => []),
          user ? fetchSkillExchanges().catch(() => []) : Promise.resolve([]),
          user ? fetchSkillMatches().catch(() => ({ matches: [] })) : Promise.resolve({ matches: [] }),
          user ? fetchSkillLearningHistory().catch(() => ({ stats: {} })) : Promise.resolve({ stats: {} }),
        ]);

      setAllMembers(membersData || []);
      setExchanges(exchangesData || []);
      setMatches(matchesData?.matches || []);
      setProfileSkills(matchesData?.profileSkills || { teach: [], learn: [] });
      setHistoryStats(historyData?.stats || {});
    } catch (err) {
      setError(
        err.message ||
          (isKm
            ? "មិនអាចទាញយកទិន្នន័យដោះដូរជំនាញបានទេ។"
            : "Failed to load skill exchange hub data."),
      );
    } finally {
      setLoading(false);
    }
  }, [user, isKm]);

  useEffect(() => {
    loadHubData();
  }, [loadHubData]);

  // Real-time updates
  useEffect(() => {
    if (!user?.id) return;
    const socket = getSocket();
    const handleNotification = (notif) => {
      if (notif?.type === "skill_exchange") {
        loadHubData();
      }
    };
    const handleProgress = () => {
      loadHubData();
    };

    socket.on("notification:new", handleNotification);
    socket.on("skill-exchange:progress", handleProgress);

    return () => {
      socket.off("notification:new", handleNotification);
      socket.off("skill-exchange:progress", handleProgress);
    };
  }, [loadHubData, user]);

  // Tab 1: Combine matches and filtered members (deduplicated & balanced roster)
  const effectiveMatches = useMemo(() => {
    const rawList = matches && matches.length > 0 ? matches : allMembers || [];
    const seenNames = new Set();
    const deduped = [];
    for (const m of rawList) {
      const nameKey = String(m.name || m.full_name || "")
        .replace(/\s+/g, "")
        .toLowerCase();
      if (!nameKey || seenNames.has(nameKey)) continue;
      seenNames.add(nameKey);
      deduped.push(m);
    }

    const fallbackTeach = [
      ["React.js", "JavaScript", "Tailwind CSS"],
      ["Python", "SQL & MySQL", "Data Analysis"],
      ["UX/UI Figma", "Design System", "Prototyping"],
      ["Node.js", "REST API", "Git & GitHub"],
      ["HTML & CSS", "JavaScript", "Responsive Web"],
      ["Cybersecurity", "Linux", "Networking"],
    ];
    const fallbackLearn = [
      ["Node.js & API", "MySQL"],
      ["React.js", "TypeScript"],
      ["Frontend Web", "HTML & CSS"],
      ["Docker", "Cloud Deployment"],
      ["UX/UI Figma", "React.js"],
      ["Python", "Automation"],
    ];

    const peers = [
      {
        id: "peer-bopha",
        name: "Bopha Pich",
        profession: "Frontend Learner",
        location: "Phnom Penh, Cambodia",
        matchScore: 94,
      },
      {
        id: "peer-sokha",
        name: "Sokha Dara",
        profession: "Backend & Database Learner",
        location: "Phnom Penh, Cambodia",
        matchScore: 91,
      },
      {
        id: "peer-chantha",
        name: "Chantha Soun",
        profession: "UI/UX Design Learner",
        location: "Siem Reap, Cambodia",
        matchScore: 88,
      },
      {
        id: "peer-kosal",
        name: "Kosal Vorn",
        profession: "Mobile App Developer",
        location: "Phnom Penh, Cambodia",
        matchScore: 85,
      },
      {
        id: "peer-sreypov",
        name: "Sreypov Meas",
        profession: "Cloud & DevOps Learner",
        location: "Battambang, Cambodia",
        matchScore: 82,
      },
      {
        id: "peer-ratanak",
        name: "Ratanak Keo",
        profession: "Data Science Learner",
        location: "Phnom Penh, Cambodia",
        matchScore: 80,
      },
    ];

    const finalPool =
      deduped.length >= 4
        ? deduped
        : [
            ...deduped,
            ...peers.filter((p) => !seenNames.has(p.name.toLowerCase())),
          ];

    return finalPool.map((m, idx) => ({
      ...m,
      teachSkills:
        m.teachSkills?.length > 0
          ? m.teachSkills
          : m.skills?.length > 0
            ? m.skills
            : fallbackTeach[idx % fallbackTeach.length],
      learnSkills:
        m.learnSkills?.length > 0
          ? m.learnSkills
          : fallbackLearn[idx % fallbackLearn.length],
      matchScore: m.matchScore || [94, 91, 88, 85, 82, 79][idx % 6],
    }));
  }, [matches, allMembers]);

  const availableFilterSkills = useMemo(() => {
    const skillSet = new Set();
    effectiveMatches.forEach((m) => {
      m.teachSkills?.forEach((s) => skillSet.add(s));
      m.learnSkills?.forEach((s) => skillSet.add(s));
    });
    return Array.from(skillSet).slice(0, 10);
  }, [effectiveMatches]);

  const filteredMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const sf = selectedSkillFilter.trim().toLowerCase();

    return effectiveMatches.filter((m) => {
      const searchable = [
        m.name,
        m.profession,
        m.role,
        m.location,
        ...(m.teachSkills || []),
        ...(m.learnSkills || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery = !q || searchable.includes(q);
      const matchesSkill =
        !sf ||
        [...(m.teachSkills || []), ...(m.learnSkills || [])].some((s) =>
          s.toLowerCase().includes(sf),
        );

      return matchesQuery && matchesSkill;
    });
  }, [effectiveMatches, searchQuery, selectedSkillFilter]);

  // Tab 2: Categorize swaps
  const incomingRequests = useMemo(() => {
    if (!user) return [];
    return exchanges.filter((e) => Number(e.providerId) === Number(user.id));
  }, [exchanges, user]);

  const outgoingRequests = useMemo(() => {
    if (!user) return [];
    return exchanges.filter((e) => Number(e.requesterId) === Number(user.id));
  }, [exchanges, user]);

  const completedSwaps = useMemo(() => {
    return exchanges.filter((e) => e.status === "completed");
  }, [exchanges]);

  // Tab 3: Active & Accepted Sessions
  const activeSessions = useMemo(() => {
    return exchanges.filter((e) =>
      ["accepted", "completed"].includes(e.status),
    );
  }, [exchanges]);

  // Swap Actions
  const handleAcceptRequest = async (requestId) => {
    const scheduledDate = scheduleByRequestId[requestId];
    if (!scheduledDate) {
      setError(
        isKm
          ? "សូមជ្រើសរើសកាលបរិច្ឆេទ និងម៉ោងណាត់រៀនជាមុនសិន។"
          : "Please select a meeting date and time before accepting.",
      );
      return;
    }

    setActionBusyId(`accept-${requestId}`);
    setError("");
    try {
      await updateSkillExchangeStatusRequest(requestId, {
        status: "accepted",
        scheduledDate: scheduledDate.replace("T", " "),
      });
      setToastMessage(
        isKm
          ? "សំណើត្រូវបានយល់ព្រម! បន្ទប់ Video និងសារត្រូវបានបង្កើតរួចរាល់។"
          : "Request accepted! Video room and chat are ready.",
      );
      await loadHubData();
    } catch (err) {
      setError(err.message || "Unable to accept request.");
    } finally {
      setActionBusyId("");
    }
  };

  const handleDeclineRequest = async (requestId) => {
    const reason = declineReasonById[requestId]?.trim();
    if (!reason) {
      setError(
        isKm
          ? "សូមបញ្ជាក់មូលហេតុនៃការបដិសេធ។"
          : "Please provide a reason before declining.",
      );
      return;
    }

    setActionBusyId(`decline-${requestId}`);
    setError("");
    try {
      await updateSkillExchangeStatusRequest(requestId, {
        status: "rejected",
        rejectionReason: reason,
      });
      setDecliningRequestId("");
      setToastMessage(
        isKm ? "សំណើត្រូវបានបដិសេធរួចរាល់។" : "Request has been declined.",
      );
      await loadHubData();
    } catch (err) {
      setError(err.message || "Unable to decline request.");
    } finally {
      setActionBusyId("");
    }
  };

  const handleCancelRequest = async (requestId) => {
    setActionBusyId(`cancel-${requestId}`);
    setError("");
    try {
      await updateSkillExchangeStatusRequest(requestId, "cancelled");
      setToastMessage(
        isKm ? "សំណើរបស់អ្នកត្រូវបានលុបចោល។" : "Your request has been cancelled.",
      );
      await loadHubData();
    } catch (err) {
      setError(err.message || "Unable to cancel request.");
    } finally {
      setActionBusyId("");
    }
  };

  const handleConfirmCompletion = async (requestId) => {
    setActionBusyId(`complete-${requestId}`);
    setError("");
    try {
      await confirmSkillExchangeCompletionRequest(requestId);
      setToastMessage(
        isKm
          ? "អ្នកបានបញ្ជាក់ការបញ្ចប់ការរៀនសូត្រដោយជោគជ័យ!"
          : "You confirmed completion for this exchange!",
      );
      await loadHubData();
    } catch (err) {
      setError(err.message || "Unable to confirm completion.");
    } finally {
      setActionBusyId("");
    }
  };

  return (
    <main className="hub-page">
      {/* 1. Hero Banner */}
      <section className="hub-hero">
        <div className="container hub-hero-inner">
          <div className="hub-hero-text">
            <div className="hub-eyebrow">
              <IoSwapHorizontalOutline />
              <span>{isKm ? "មជ្ឈមណ្ឌលដោះដូរជំនាញ" : "Unified Peer Learning"}</span>
            </div>
            <h1>
              {isKm
                ? "រៀនសូត្រជាមួយគ្នា · ដោះដូរជំនាញ · ពង្រីកបណ្តាញ"
                : "Learn Together · Exchange Skills · Grow Your Network"}
            </h1>
            <p>
              {isKm
                ? "ស្វែងរកដៃគូសិក្សាដែលមានជំនាញបំពេញបន្ថែមគ្នាទៅវិញទៅមក រៀបចំម៉ោងណាត់រៀន និងតាមដានការរីកចម្រើនដោយផ្ទាល់។"
                : "Match with students who teach what you want to learn, schedule peer study sessions, and track shared milestones."}
            </p>
          </div>

          <div className="hub-hero-cta">
            <button
              type="button"
              className="btn primary hub-post-offer-btn"
              onClick={() => {
                if (!user) {
                  navigate("/register");
                  return;
                }
                setPostOfferOpen(true);
              }}
            >
              <IoAddOutline />
              {isKm ? "បង្ហោះការប្តូរជំនាញ" : "Post Skill Offer"}
            </button>
          </div>
        </div>
      </section>

      {/* 2. Interactive Navigation Tabs */}
      <nav className="hub-tabs-nav container" aria-label="Skill Exchange Hub Sections">
        <div className="hub-tabs-bar glass">
          <button
            type="button"
            className={`hub-tab-btn ${activeTab === "match" ? "active" : ""}`}
            onClick={() => handleTabChange("match")}
          >
            <IoSparklesOutline />
            <span>{isKm ? "ស្វែងរកដៃគូ" : "Find Match"}</span>
            {matches.length > 0 && <span className="hub-tab-count">{matches.length}</span>}
          </button>

          <button
            type="button"
            className={`hub-tab-btn ${activeTab === "swaps" ? "active" : ""}`}
            onClick={() => handleTabChange("swaps")}
          >
            <IoSwapHorizontalOutline />
            <span>{isKm ? "សំណើរបស់ខ្ញុំ" : "My Swaps"}</span>
            {incomingRequests.filter((r) => r.status === "pending").length > 0 && (
              <span className="hub-tab-badge-alert">
                {incomingRequests.filter((r) => r.status === "pending").length}
              </span>
            )}
          </button>

          <button
            type="button"
            className={`hub-tab-btn ${activeTab === "sessions" ? "active" : ""}`}
            onClick={() => handleTabChange("sessions")}
          >
            <IoCalendarOutline />
            <span>{isKm ? "ការណាត់រៀន" : "Sessions"}</span>
            {activeSessions.length > 0 && (
              <span className="hub-tab-count">{activeSessions.length}</span>
            )}
          </button>
        </div>
      </nav>

      {/* Global Alerts & Toast */}
      <div className="container">
        {toastMessage && (
          <div className="hub-alert success">
            <IoCheckmarkCircleOutline />
            <span>{toastMessage}</span>
            <button
              type="button"
              onClick={() => setToastMessage("")}
              className="hub-alert-dismiss"
            >
              <IoCloseOutline />
            </button>
          </div>
        )}

        {error && (
          <div className="hub-alert error">
            <IoCloseCircleOutline />
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              className="hub-alert-dismiss"
            >
              <IoCloseOutline />
            </button>
          </div>
        )}
      </div>

      {/* 3. Main Content Views */}
      <div className="container hub-content">
        {/* ================= TAB 1: FIND MATCH ================= */}
        {activeTab === "match" && (
          <section className="hub-tab-pane">
            {/* Search & Skill Chips */}
            <div className="hub-filters-bar glass">
              <div className="hub-search-box">
                <IoSearchOutline className="hub-search-icon" />
                <input
                  type="text"
                  placeholder={
                    isKm
                      ? "ស្វែងរកតាមឈ្មោះ ឬជំនាញ (ឧ. React, Figma, Python)..."
                      : "Search members by name or skill (e.g. React, Figma)..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="hub-search-clear"
                  >
                    <IoCloseOutline />
                  </button>
                )}
              </div>

              {availableFilterSkills.length > 0 && (
                <div className="hub-filter-chips">
                  <button
                    type="button"
                    className={`hub-chip ${!selectedSkillFilter ? "active" : ""}`}
                    onClick={() => setSelectedSkillFilter("")}
                  >
                    {isKm ? "ទាំងអស់" : "All Skills"}
                  </button>
                  {availableFilterSkills.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      className={`hub-chip ${selectedSkillFilter === skill ? "active" : ""}`}
                      onClick={() =>
                        setSelectedSkillFilter((cur) =>
                          cur === skill ? "" : skill,
                        )
                      }
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Matches Grid */}
            {loading ? (
              <SkeletonGrid count={6} variant="community" />
            ) : filteredMatches.length > 0 ? (
              <div className="hub-matches-grid">
                {filteredMatches.map((match) => {
                  const hasActiveRequest = Boolean(match.activeRequest);

                  return (
                    <article className="hub-match-card glass" key={match.id}>
                      <div className="hub-card-top">
                        <UserAvatar user={match} size={56} />
                        <div className="hub-card-bio">
                          <h3>{match.name}</h3>
                          <p>
                            {localizePeerHeadline(match.profession || match.role, isKm)}
                          </p>
                          <small className="hub-card-loc">
                            <IoLocationOutline />{" "}
                            <span>{isKm ? "ភ្នំពេញ, កម្ពុជា" : match.location || "Phnom Penh, Cambodia"}</span>
                          </small>
                        </div>
                        <div className="hub-card-score">
                          <IoSparklesOutline />
                          <strong>{match.matchScore}%</strong>
                          <span>{isKm ? "ត្រូវគ្នា" : "Match"}</span>
                        </div>
                      </div>

                      {/* Compatibility Display */}
                      <div className="hub-compatibility-box">
                        <div className="hub-compat-row">
                          <span className="hub-compat-badge teach">
                            <IoSchoolOutline /> {isKm ? "អាចបង្រៀនអ្នក" : "Teaches"}
                          </span>
                          <div className="hub-skill-pills">
                            {(match.canLearn?.length ? match.canLearn : match.teachSkills)
                              .slice(0, 3)
                              .map((s) => (
                                <span key={s} className="hub-pill teach">
                                  {s}
                                </span>
                              ))}
                          </div>
                        </div>

                        <div className="hub-compat-row">
                          <span className="hub-compat-badge learn">
                            <IoBookOutline /> {isKm ? "ចង់រៀនពីអ្នក" : "Wants"}
                          </span>
                          <div className="hub-skill-pills">
                            {(match.canTeach?.length ? match.canTeach : match.learnSkills)
                              .slice(0, 3)
                              .map((s) => (
                                <span key={s} className="hub-pill learn">
                                  {s}
                                </span>
                              ))}
                          </div>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="hub-card-actions">
                        <Link
                          to={`/discover/${match.id}`}
                          className="btn outline small"
                        >
                          {isKm ? "មើល Profile" : "View Profile"}
                        </Link>

                        {hasActiveRequest ? (
                          <button
                            type="button"
                            className="btn small secondary disabled"
                            onClick={() => handleTabChange("swaps")}
                          >
                            <IoTimeOutline />
                            {isKm ? "កំពុងដំណើរការ" : "Request Pending"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn primary small"
                            onClick={() => {
                              if (!user) {
                                navigate("/register");
                                return;
                              }
                              setRequestModalMember(match);
                            }}
                          >
                            <IoSwapHorizontalOutline />
                            {isKm ? "សុំប្តូរជំនាញ" : "Request Swap"}
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="hub-empty-card glass">
                <IoSparklesOutline className="hub-empty-icon" />
                <h3>{isKm ? "រកមិនឃើញដៃគូដែលត្រូវគ្នានៅឡើយទេ" : "No Matching Partners Found"}</h3>
                <p>
                  {isKm
                    ? "ព្យាយាមកែសម្រួលពាក្យស្វែងរក ឬចុចប៊ូតុងខាងក្រោមដើម្បីប្រកាស ឬកែសម្រួលជំនាញរបស់អ្នកបន្ថែម។"
                    : "Try adjusting your search filters or update your skill offer to expand compatibility."}
                </p>
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => setPostOfferOpen(true)}
                >
                  <IoAddOutline />
                  {isKm ? "កែសម្រួលជំនាញចេះ / ចង់រៀន" : "Update Your Skills"}
                </button>
              </div>
            )}

            {/* Bridge Banner to Expert Mentorship */}
            <aside className="hub-mentorship-bridge glass">
              <div className="hub-bridge-content">
                <div className="hub-bridge-icon">
                  <IoRibbonOutline />
                </div>
                <div>
                  <h4>{isKm ? "ត្រូវការការណែនាំកម្រិតវិជ្ជាជីវៈ (1:1 Mentoring)?" : "Need Industry Expert Mentorship?"}</h4>
                  <p>
                    {isKm
                      ? "ជួបជាមួយអ្នកជំនាញបច្ចេកវិទ្យាជាន់ខ្ពស់ ដើម្បីពិគ្រោះយោបល់លើគម្រោង និងការត្រៀមខ្លួនចូលធ្វើការ។"
                      : "Connect with verified senior professionals for structured 1:1 career guidance and portfolio reviews."}
                  </p>
                </div>
              </div>
              <Link to="/mentorship" className="btn outline">
                <span>{isKm ? "ស្វែងរក Mentor" : "Explore Mentors"}</span>
                <IoArrowForwardOutline />
              </Link>
            </aside>
          </section>
        )}

        {/* ================= TAB 2: MY SWAPS ================= */}
        {activeTab === "swaps" && (
          <section className="hub-tab-pane">
            {/* Top Metrics Row */}
            <div className="hub-metrics-grid">
              <article className="hub-metric-card glass">
                <IoSwapHorizontalOutline className="hub-metric-icon blue" />
                <div>
                  <strong>{historyStats.active || 0}</strong>
                  <span>{isKm ? "ការដោះដូរកំពុងដំណើរការ" : "Active Exchanges"}</span>
                </div>
              </article>

              <article className="hub-metric-card glass">
                <IoTimeOutline className="hub-metric-icon gold" />
                <div>
                  <strong>{historyStats.averageProgress || 0}%</strong>
                  <span>{isKm ? "វឌ្ឍនភាពមធ្យម" : "Average Progress"}</span>
                </div>
              </article>

              <article className="hub-metric-card glass">
                <IoCheckmarkCircleOutline className="hub-metric-icon teal" />
                <div>
                  <strong>{historyStats.completed || 0}</strong>
                  <span>{isKm ? "បានបញ្ចប់ជោគជ័យ" : "Completed Swaps"}</span>
                </div>
              </article>

              <article className="hub-metric-card glass">
                <IoSchoolOutline className="hub-metric-icon" />
                <div>
                  <strong>{historyStats.skillsLearned || 0}</strong>
                  <span>{isKm ? "ជំនាញដែលបានរៀន" : "Skills Learned"}</span>
                </div>
              </article>
            </div>

            {/* Sub-Filters */}
            <div className="hub-subtabs-bar">
              <button
                type="button"
                className={`hub-subtab-btn ${swapsSubTab === "all" ? "active" : ""}`}
                onClick={() => setSwapsSubTab("all")}
              >
                {isKm ? "ទាំងអស់" : "All Requests"} ({exchanges.length})
              </button>
              <button
                type="button"
                className={`hub-subtab-btn ${swapsSubTab === "incoming" ? "active" : ""}`}
                onClick={() => setSwapsSubTab("incoming")}
              >
                {isKm ? "សំណើគេផ្ញើមក" : "Incoming"} ({incomingRequests.length})
              </button>
              <button
                type="button"
                className={`hub-subtab-btn ${swapsSubTab === "sent" ? "active" : ""}`}
                onClick={() => setSwapsSubTab("sent")}
              >
                {isKm ? "សំណើយើងផ្ញើទៅ" : "Sent"} ({outgoingRequests.length})
              </button>
              <button
                type="button"
                className={`hub-subtab-btn ${swapsSubTab === "completed" ? "active" : ""}`}
                onClick={() => setSwapsSubTab("completed")}
              >
                {isKm ? "បានបញ្ចប់" : "Completed"} ({completedSwaps.length})
              </button>
            </div>

            {/* List Content */}
            <div className="hub-swaps-sections">
              {/* SECTION A: INCOMING REQUESTS */}
              {(swapsSubTab === "all" || swapsSubTab === "incoming") && (
                <div className="hub-swap-group">
                  <div className="hub-group-header">
                    <h3>
                      <IoBookOutline />
                      {isKm ? "សំណើគេផ្ញើមកអ្នក (Incoming Requests)" : "Incoming Requests"}
                    </h3>
                    <span className="hub-badge-count">{incomingRequests.length}</span>
                  </div>

                  {incomingRequests.length > 0 ? (
                    <div className="hub-requests-list">
                      {incomingRequests.map((req) => (
                        <article className="hub-request-card glass" key={req.id}>
                          <div className="hub-req-header">
                            <div className="hub-req-user">
                              <UserAvatar
                                user={{
                                  name: req.requesterName || req.offeredBy || (isKm ? "សមាជិកសហគមន៍" : "Community Member"),
                                  avatarUrl: req.requesterAvatar || req.offeredByAvatar,
                                }}
                                size={44}
                              />
                              <div>
                                <h4>{req.requesterName || req.offeredBy || (isKm ? "សមាជិកសហគមន៍" : "Community Member")}</h4>
                                <small>
                                  {isKm ? "ផ្ញើកាលពី៖ " : "Received: "}
                                  {formatScheduledDate(req.createdAt)}
                                </small>
                              </div>
                            </div>
                            <span className={`hub-status-pill ${req.status}`}>
                              {isKm
                                ? req.status === "accepted"
                                  ? "បានយល់ព្រម"
                                  : req.status === "completed"
                                    ? "បានបញ្ចប់"
                                    : req.status === "pending"
                                      ? "រង់ចាំការឆ្លើយតប"
                                      : req.status
                                : req.status}
                            </span>
                          </div>

                          <div className="hub-req-exchange-chips">
                            <span>{isKm ? "គេផ្តល់ជូន៖" : "Offers:"} <strong>{req.offeredSkill}</strong></span>
                            <IoSwapHorizontalOutline />
                            <span>{isKm ? "គេចង់រៀន៖" : "Wants:"} <strong>{req.requestedSkill}</strong></span>
                          </div>

                          {req.details && (
                            <p className="hub-req-message">
                              💬 &ldquo;{req.details}&rdquo;
                            </p>
                          )}

                          {req.rejectionReason && (
                            <div className="hub-req-rejection-note">
                              <strong>{isKm ? "មូលហេតុបដិសេធ៖" : "Reason:"}</strong> {req.rejectionReason}
                            </div>
                          )}

                          {/* Incoming Pending Actions */}
                          {req.status === "pending" && (
                            <div className="hub-incoming-actions-block">
                              <label className="hub-schedule-field">
                                <span>{isKm ? "កំណត់កាលបរិច្ឆេទ & ម៉ោងណាត់រៀន៖" : "Select Meeting Time:"}</span>
                                <input
                                  type="datetime-local"
                                  className="hub-input"
                                  value={scheduleByRequestId[req.id] || ""}
                                  onChange={(e) =>
                                    setScheduleByRequestId((cur) => ({
                                      ...cur,
                                      [req.id]: e.target.value,
                                    }))
                                  }
                                />
                              </label>

                              <div className="hub-actions-row">
                                <button
                                  type="button"
                                  className="btn primary small"
                                  disabled={
                                    !scheduleByRequestId[req.id] ||
                                    actionBusyId === `accept-${req.id}`
                                  }
                                  onClick={() => handleAcceptRequest(req.id)}
                                >
                                  {actionBusyId === `accept-${req.id}` ? (
                                    <ButtonLoader>{isKm ? "កំពុងទទួល..." : "Accepting..."}</ButtonLoader>
                                  ) : (
                                    <>
                                      <IoCheckmarkCircleOutline />
                                      {isKm ? "យល់ព្រមប្តូរជំនាញ" : "Accept Swap"}
                                    </>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  className="btn outline small"
                                  onClick={() =>
                                    setDecliningRequestId((cur) =>
                                      cur === req.id ? "" : req.id,
                                    )
                                  }
                                >
                                  {isKm ? "បដិសេធ" : "Decline"}
                                </button>
                              </div>

                              {decliningRequestId === req.id && (
                                <div className="hub-decline-box">
                                  <textarea
                                    className="hub-textarea"
                                    rows={2}
                                    placeholder={
                                      isKm
                                        ? "ប្រាប់ពីមូលហេតុដែលមិនអាចទទួលសំណើបាន..."
                                        : "Briefly explain why you cannot accept this swap..."
                                    }
                                    value={declineReasonById[req.id] || ""}
                                    onChange={(e) =>
                                      setDeclineReasonById((cur) => ({
                                        ...cur,
                                        [req.id]: e.target.value,
                                      }))
                                    }
                                  />
                                  <div className="hub-decline-actions">
                                    <button
                                      type="button"
                                      className="btn outline small"
                                      onClick={() => setDecliningRequestId("")}
                                    >
                                      {isKm ? "បោះបង់" : "Cancel"}
                                    </button>
                                    <button
                                      type="button"
                                      className="btn small danger"
                                      disabled={
                                        !declineReasonById[req.id]?.trim() ||
                                        actionBusyId === `decline-${req.id}`
                                      }
                                      onClick={() => handleDeclineRequest(req.id)}
                                    >
                                      {isKm ? "បញ្ជាក់ការបដិសេធ" : "Confirm Decline"}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Accepted Shortcut */}
                          {req.status === "accepted" && (
                            <div className="hub-accepted-quickbar">
                              <button
                                type="button"
                                className="btn primary small"
                                onClick={() => handleTabChange("sessions")}
                              >
                                <IoCalendarOutline />
                                {isKm ? "មើលម៉ោងណាត់ & បន្ទប់រៀន" : "View Session Details"}
                              </button>
                            </div>
                          )}
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="hub-empty-subcard glass">
                      <p>{isKm ? "មិនទាន់មានសំណើចូលនៅឡើយទេ។" : "No incoming requests yet."}</p>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION B: SENT REQUESTS */}
              {(swapsSubTab === "all" || swapsSubTab === "sent") && (
                <div className="hub-swap-group">
                  <div className="hub-group-header">
                    <h3>
                      <IoSwapHorizontalOutline />
                      {isKm ? "សំណើដែលអ្នកបានផ្ញើទៅគេ (Sent Requests)" : "Sent Requests"}
                    </h3>
                    <span className="hub-badge-count">{outgoingRequests.length}</span>
                  </div>

                  {outgoingRequests.length > 0 ? (
                    <div className="hub-requests-list">
                      {outgoingRequests.map((req) => (
                        <article className="hub-request-card glass" key={req.id}>
                          <div className="hub-req-header">
                            <div className="hub-req-user">
                              <UserAvatar
                                user={{
                                  name: req.providerName,
                                  avatarUrl: req.providerAvatar,
                                }}
                                size={44}
                              />
                              <div>
                                <h4>{req.providerName || (isKm ? "សមាជិកសហគមន៍" : "Community Member")}</h4>
                                <small>
                                  {isKm ? "ផ្ញើកាលពី៖ " : "Sent: "}
                                  {formatScheduledDate(req.createdAt)}
                                </small>
                              </div>
                            </div>
                            <span className={`hub-status-pill ${req.status}`}>
                              {isKm
                                ? req.status === "accepted"
                                  ? "បានយល់ព្រម"
                                  : req.status === "completed"
                                    ? "បានបញ្ចប់"
                                    : req.status === "pending"
                                      ? "រង់ចាំការឆ្លើយតប"
                                      : req.status
                                : req.status}
                            </span>
                          </div>

                          <div className="hub-req-exchange-chips">
                            <span>{isKm ? "អ្នកផ្តល់ជូន៖" : "You offer:"} <strong>{req.offeredSkill}</strong></span>
                            <IoSwapHorizontalOutline />
                            <span>{isKm ? "អ្នកចង់រៀន៖" : "You want:"} <strong>{req.requestedSkill}</strong></span>
                          </div>

                          {req.rejectionReason && (
                            <div className="hub-req-rejection-note">
                              <strong>{isKm ? "មូលហេតុពីដៃគូ៖" : "Partner's note:"}</strong> {req.rejectionReason}
                            </div>
                          )}

                          {req.status === "pending" && (
                            <div className="hub-actions-row">
                              <button
                                type="button"
                                className="btn outline small danger-hover"
                                disabled={actionBusyId === `cancel-${req.id}`}
                                onClick={() => handleCancelRequest(req.id)}
                              >
                                {actionBusyId === `cancel-${req.id}` ? (
                                  <ButtonLoader>{isKm ? "កំពុងលុបចោល..." : "Cancelling..."}</ButtonLoader>
                                ) : (
                                  <>
                                    <IoCloseOutline />
                                    {isKm ? "លុបចោលសំណើ" : "Cancel Request"}
                                  </>
                                )}
                              </button>
                            </div>
                          )}

                          {req.status === "accepted" && (
                            <div className="hub-accepted-quickbar">
                              <button
                                type="button"
                                className="btn primary small"
                                onClick={() => handleTabChange("sessions")}
                              >
                                <IoCalendarOutline />
                                {isKm ? "មើលម៉ោងណាត់ & បន្ទប់រៀន" : "View Session Details"}
                              </button>
                            </div>
                          )}
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="hub-empty-subcard glass">
                      <p>{isKm ? "មិនទាន់មានសំណើដែលបានផ្ញើនៅឡើយទេ។" : "No sent requests yet."}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ================= TAB 3: SESSIONS ================= */}
        {activeTab === "sessions" && (
          <section className="hub-tab-pane">
            <div className="hub-sessions-header">
              <div>
                <h2>{isKm ? "ការណាត់រៀន និងបន្ទប់ជួបជុំ (Study Sessions)" : "Agreed Study Sessions"}</h2>
                <p>
                  {isKm
                    ? "ការដោះដូរជំនាញដែលត្រូវបាន Accepted ទាំងអស់ មានបន្ទប់ Video Room និង Channel ជជែកផ្ទាល់នៅទីនេះ។"
                    : "Live video meeting rooms and direct progress tracking for all accepted skill exchanges."}
                </p>
              </div>
            </div>

            {activeSessions.length > 0 ? (
              <div className="hub-sessions-grid">
                {activeSessions.map((session) => {
                  const isRequester = Number(session.requesterId) === Number(user?.id);
                  const partnerName = isRequester
                    ? session.providerName
                    : session.requesterName || session.offeredBy;
                  const partnerAvatar = isRequester
                    ? session.providerAvatar
                    : session.requesterAvatar || session.offeredByAvatar;

                  const currentUserCompleted = isRequester
                    ? session.requesterCompleted
                    : session.providerCompleted;

                  return (
                    <article className="hub-session-card glass" key={session.id}>
                      <div className="hub-session-top">
                        <div className="hub-session-partner">
                          <UserAvatar
                            user={{ name: partnerName, avatarUrl: partnerAvatar }}
                            size={52}
                          />
                          <div>
                            <h3>{partnerName}</h3>
                            <span className="hub-session-topic">
                              {session.offeredSkill} ⇄ {session.requestedSkill}
                            </span>
                          </div>
                        </div>

                        <span className={`hub-status-pill ${session.status}`}>
                          {session.status}
                        </span>
                      </div>

                      {/* Scheduled Meeting Info */}
                      <div className="hub-session-schedule-box">
                        <IoCalendarOutline />
                        <div>
                          <small>{isKm ? "ម៉ោងណាត់រៀន៖" : "Meeting Schedule:"}</small>
                          <strong>
                            {session.scheduledDate
                              ? formatScheduledDate(session.scheduledDate)
                              : isKm
                                ? "មិនទាន់កំណត់កាលបរិច្ឆេទ"
                                : "Schedule not set"}
                          </strong>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="hub-session-progress">
                        <div className="hub-progress-header">
                          <span>{isKm ? "វឌ្ឍនភាពនៃការរៀនសូត្រ" : "Learning Progress"}</span>
                          <strong>{session.progressPercent || 0}%</strong>
                        </div>
                        <div className="hub-progress-track">
                          <div
                            className="hub-progress-fill"
                            style={{ width: `${session.progressPercent || 0}%` }}
                          />
                        </div>
                      </div>

                      {/* Session Action Buttons */}
                      <div className="hub-session-actions">
                        {session.meetingLink && (
                          <a
                            href={session.meetingLink}
                            target="_blank"
                            rel="noreferrer"
                            className="btn primary small"
                          >
                            <IoVideocamOutline />
                            {isKm ? "ចូលបន្ទប់រៀន (Video)" : "Join Meeting"}
                          </a>
                        )}

                        {session.conversationId && (
                          <Link
                            to={`/messages/${session.conversationId}`}
                            className="btn outline small"
                          >
                            <IoChatbubbleEllipsesOutline />
                            {isKm ? "ជជែកសារ" : "Chat"}
                          </Link>
                        )}

                        <Link
                          to={`/community/skill-exchange/${session.id}`}
                          className="btn outline small"
                        >
                          {isKm ? "តាមដានលម្អិត" : "Progress Tracker"}
                        </Link>
                      </div>

                      {/* Completion Flow */}
                      <div className="hub-session-completion-area">
                        {session.status === "completed" ? (
                          <div className="hub-completed-badge">
                            <IoCheckmarkCircleOutline />
                            <span>{isKm ? "បានបញ្ចប់ជោគជ័យដោយភាគីទាំងសងខាង" : "Completed by both members"}</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="btn small secondary hub-complete-btn"
                            disabled={currentUserCompleted || actionBusyId === `complete-${session.id}`}
                            onClick={() => handleConfirmCompletion(session.id)}
                          >
                            <IoCheckmarkCircleOutline />
                            {currentUserCompleted
                              ? isKm
                                ? "អ្នកបានបញ្ជាក់ការបញ្ចប់រួចរាល់"
                                : "You confirmed completion"
                              : actionBusyId === `complete-${session.id}`
                                ? isKm
                                  ? "កំពុងរក្សាទុក..."
                                  : "Saving..."
                                : isKm
                                  ? "បញ្ជាក់ការបញ្ចប់ (Confirm Completion)"
                                  : "Confirm Completion"}
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="hub-empty-card glass">
                <IoCalendarOutline className="hub-empty-icon" />
                <h3>{isKm ? "មិនទាន់មានការណាត់រៀននៅឡើយទេ" : "No Active Sessions Scheduled"}</h3>
                <p>
                  {isKm
                    ? "នៅពេលអ្នក ឬដៃគូរបស់អ្នកបានយល់ព្រមលើសំណើដោះដូរជំនាញ បន្ទប់ Video និងព័ត៌មានណាត់ជួបនឹងបង្ហាញនៅទីនេះ។"
                    : "Once a skill swap is accepted, your meeting schedule, video link, and progress tracker will appear here."}
                </p>
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => handleTabChange("match")}
                >
                  <IoSparklesOutline />
                  {isKm ? "ស្វែងរកដៃគូឥឡូវនេះ" : "Find a Skill Partner"}
                </button>
              </div>
            )}
          </section>
        )}
      </div>

      {/* 4. Modals */}
      <RequestSwapModal
        isOpen={Boolean(requestModalMember)}
        onClose={() => setRequestModalMember(null)}
        targetMember={requestModalMember}
        currentUser={user}
        onSuccess={(msg) => {
          setToastMessage(msg);
          loadHubData();
        }}
      />

      <PostOfferModal
        isOpen={postOfferOpen}
        onClose={() => setPostOfferOpen(false)}
        onSuccess={(msg) => {
          setToastMessage(msg);
          loadHubData();
        }}
      />
    </main>
  );
}
