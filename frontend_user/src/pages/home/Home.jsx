import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";

import { useGlobleContext } from "../../context/GlobleContext";
import { useLanguage } from "../../context/LanguageContext";
import { fetchStats } from "../../services/platformService";
import DotField from "../../components/ui/DotField";
import DashBanner from "../../components/ui/DashBanner";
import TiltCard from "../../components/ui/TiltCard";
import AnimatedCounter from "../../components/ui/AnimatedCounter";

import heangChhengKhoemPhoto from "../../assets/team/heang-chheng-khoem.jpg";
import hornPiseyPhoto from "../../assets/team/horn-pisey.jpg";
import krySoranuthPhoto from "../../assets/team/kry-soranuth.jpg";
import muyKalinPhoto from "../../assets/team/muy-kalin.jpg";
import samrithRatanaPhoto from "../../assets/team/samrith-ratana.jpg";
import {
  FiSearch,
  FiArrowRight,
  FiCheck,
  FiCheckCircle,
  FiPlus,
  FiUsers,
  FiBookOpen,
  FiBriefcase,
  FiCompass,
  FiRepeat,
  FiUserCheck,
  FiClock,
  FiAward,
  FiDollarSign,
  FiMessageCircle,
  FiMessageSquare,
  FiThumbsUp,
  FiBell,
  FiBarChart2,
  FiCode,
  FiLayout,
  FiTerminal,
  FiCreditCard,
  FiX,
} from "react-icons/fi";
import { FaStar, FaHourglassHalf, FaPlay, FaYoutube } from "react-icons/fa";
import { MdVerified } from "react-icons/md";
import "./Home.css";

const COURSE_CAT_OPTIONS = [
  { id: "All", en: "All", km: "ទាំងអស់" },
  { id: "Technology", en: "Technology", km: "បច្ចេកវិទ្យា" },
  { id: "Design", en: "Design", km: "ការរចនា" },
  { id: "Business", en: "Business", km: "ពាណិជ្ជកម្ម" },
  { id: "Career", en: "Career", km: "អាជីព" },
];

const COURSE_LVL_OPTIONS = [
  { id: "All", en: "All Levels", km: "គ្រប់កម្រិត" },
  { id: "Beginner", en: "Beginner", km: "ដំបូង" },
  { id: "Intermediate", en: "Intermediate", km: "មធ្យម" },
  { id: "Advanced", en: "Advanced", km: "កម្រិតខ្ពស់" },
];

const COURSE_PRICE_OPTIONS = [
  { id: "All", en: "All Prices", km: "គ្រប់តម្លៃ" },
  { id: "Free", en: "Free", km: "ឥតគិតថ្លៃ" },
  { id: "Paid", en: "Paid", km: "បង់ប្រាក់" },
];

const COURSES_DATA = [
  {
    id: 1,
    slug: "react-modern-web",
    titleEn: "Web Development",
    titleKm: "ការអភិវឌ្ឍគេហទំព័រ",
    cat: "Technology",
    catKm: "បច្ចេកវិទ្យា",
    level: "Beginner",
    levelKm: "ដំបូង",
    price: 15,
    by: "Muy Kalin",
    lessons: 8,
    youtubeId: "mU6anWqZJcc",
    duration: "4h 12m",
    g: "linear-gradient(135deg,#8fa9ff,#3B6BFF 55%,#1b2f8f)",
  },
  {
    id: 2,
    slug: "ui-ux-design-essentials",
    titleEn: "UX/UI Design",
    titleKm: "ការរចនា UX/UI",
    cat: "Design",
    catKm: "ការរចនា",
    level: "Beginner",
    levelKm: "ដំបូង",
    price: 0,
    by: "Sophea Chan",
    lessons: 6,
    youtubeId: "FTFaQWZBqQ8",
    duration: "3h 45m",
    g: "linear-gradient(135deg,#ffd35c,#F5B301 55%,#c2570c)",
  },
  {
    id: 3,
    slug: "python-data-foundations",
    titleEn: "Data Analysis",
    titleKm: "ការវិភាគទិន្នន័យ",
    cat: "Technology",
    catKm: "បច្ចេកវិទ្យា",
    level: "Intermediate",
    levelKm: "មធ្យម",
    price: 20,
    by: "Dara Sok",
    lessons: 7,
    youtubeId: "r-uOLxNrNk8",
    duration: "4h 20m",
    g: "linear-gradient(135deg,#7ff0df,#14B8A6 55%,#0b5f58)",
  },
  {
    id: 4,
    slug: "git-github-collaboration",
    titleEn: "Digital Marketing",
    titleKm: "ទីផ្សារឌីជីថល",
    cat: "Business",
    catKm: "ពាណិជ្ជកម្ម",
    level: "Beginner",
    levelKm: "ដំបូង",
    price: 0,
    by: "Sophea Chan",
    lessons: 5,
    youtubeId: "bixR-KIJKYM",
    duration: "5h 10m",
    g: "linear-gradient(135deg,#f9a8d4,#ec4899 55%,#9d174d)",
  },
  {
    id: 5,
    slug: "python-data-foundations",
    titleEn: "Python Programming",
    titleKm: "ការសរសេរកូដ Python",
    cat: "Technology",
    catKm: "បច្ចេកវិទ្យា",
    level: "Intermediate",
    levelKm: "មធ្យម",
    price: 18,
    by: "Dara Sok",
    lessons: 8,
    youtubeId: "_uQrJ0TkZlc",
    duration: "6h 14m",
    g: "linear-gradient(135deg,#86efac,#22c55e 55%,#166534)",
  },
  {
    id: 6,
    slug: "git-github-collaboration",
    titleEn: "Interview Skills",
    titleKm: "ជំនាញសម្ភាសន៍ការងារ",
    cat: "Career",
    catKm: "អាជីព",
    level: "Advanced",
    levelKm: "កម្រិតខ្ពស់",
    price: 0,
    by: "Muy Kalin",
    lessons: 5,
    youtubeId: "1qw5ITr3k9E",
    duration: "2h 30m",
    g: "linear-gradient(135deg,#c4b5fd,#8b5cf6 55%,#5b21b6)",
  },
];

const PEER_MATCHES = [
  {
    id: "p1",
    name: "Vanna",
    match: 92,
    teach: ["JavaScript", "Photoshop"],
    want: ["English", "HTML"],
    avatar: "V",
    color: "#3B6BFF",
  },
  {
    id: "p2",
    name: "Rina",
    match: 85,
    teach: ["UI Design", "English"],
    want: ["JavaScript", "HTML"],
    avatar: "R",
    color: "#F5B301",
  },
  {
    id: "p3",
    name: "Sokha",
    match: 78,
    teach: ["Python", "Excel"],
    want: ["English", "UI Design"],
    avatar: "S",
    color: "#14B8A6",
  },
];

const FEATURED_MENTORS = [
  {
    id: "muy-kalin",
    name: "MUY KALIN",
    roleEn: "Full-Stack & Frontend Development",
    roleKm: "អ្នកអភិវឌ្ឍ Full-Stack & Frontend",
    company: "Cambodian Mekong University",
    avatar: muyKalinPhoto,
    rating: 4.9,
    reviewsCount: 28,
    tags: ["React.js", "Node.js", "PHP", "MySQL"],
  },
  {
    id: "horn-pisey",
    name: "HORN PISEY",
    roleEn: "IT Audit & Cyber Risk",
    roleKm: "សវនកម្ម IT និងហានិភ័យប្រព័ន្ធ",
    company: "Camma Microfinance Limited",
    avatar: hornPiseyPhoto,
    rating: 4.8,
    reviewsCount: 22,
    tags: ["IT Audit", "ITGC", "Cyber Risk", "Power BI"],
  },
  {
    id: "kry-soranuth",
    name: "KRY SORANUTH",
    roleEn: "Cybersecurity & Network Foundations",
    roleKm: "សន្តិសុខបណ្តាញ និងមូលដ្ឋាន Network",
    company: "Cambodian Mekong University",
    avatar: krySoranuthPhoto,
    rating: 4.9,
    reviewsCount: 25,
    tags: ["Cybersecurity", "Linux", "Python", "Network"],
  },
  {
    id: "samrith-ratana",
    name: "SAMRITH RATANA",
    roleEn: "B2B Account & Technical Support",
    roleKm: "គាំទ្របច្ចេកទេស និងគណនី B2B",
    company: "Viettel (Cambodia) PTE. LTD.",
    avatar: samrithRatanaPhoto,
    rating: 4.8,
    reviewsCount: 19,
    tags: ["B2B", "Client Support", "MS Office", "IT Setup"],
  },
  {
    id: "heang-chheng-khoem",
    name: "HEANG CHHENGKHOEM",
    roleEn: "Digital Marketing & IT Support",
    roleKm: "ទីផ្សារឌីជីថល និងគាំទ្រ IT",
    company: "888 UP FAST CASH",
    avatar: heangChhengKhoemPhoto,
    rating: 4.9,
    reviewsCount: 26,
    tags: ["Marketing", "SEO", "IT Support", "Automation"],
  },
];

const LIVE_SESSIONS_DATA = [
  {
    id: "s1",
    titleEn: "React Q&A Night",
    titleKm: "វគ្គសំណួរ-ចម្លើយ React",
    host: "Muy Kalin",
    cat: "Programming",
    level: "Beginner",
    timeTextEn: "Today 7:00 PM · 60 min",
    timeTextKm: "ថ្ងៃនេះ 7:00 យប់ · 60 នាទី",
    countdownEn: "Starts in 8 min",
    countdownKm: "ចាប់ផ្តើមក្នុង 8 នាទី",
    registered: 24,
    capacity: 30,
    isOpen: true,
  },
  {
    id: "s2",
    titleEn: "Portfolio Review Workshop",
    titleKm: "សិក្ខាសាលាពិនិត្យ Portfolio",
    host: "Sophea Chan",
    cat: "Design",
    level: "Intermediate",
    timeTextEn: "Tomorrow 6:30 PM · 90 min",
    timeTextKm: "ថ្ងៃស្អែក 6:30 ល្ងាច · 90 នាទី",
    countdownEn: "In 1 day",
    countdownKm: "ក្នុង 1 ថ្ងៃ",
    registered: 20,
    capacity: 20,
    isOpen: false,
    isFull: true,
  },
  {
    id: "s3",
    titleEn: "SQL for Beginners",
    titleKm: "មូលដ្ឋានគ្រឹះ SQL សម្រាប់អ្នកចាប់ផ្តើម",
    host: "Dara Sok",
    cat: "Data",
    level: "Beginner",
    timeTextEn: "In 3 days 8:00 PM · 60 min",
    timeTextKm: "ក្នុង 3 ថ្ងៃ 8:00 យប់ · 60 នាទី",
    countdownEn: "In 3 days",
    countdownKm: "ក្នុង 3 ថ្ងៃ",
    registered: 14,
    capacity: 40,
    isOpen: false,
  },
];

const CAREER_PATHS_DATA = [
  {
    id: "web",
    titleEn: "Web Developer",
    titleKm: "អ្នកបង្កើតគេហទំព័រ",
    stepsEn: [
      "Learn HTML & CSS fundamentals",
      "Master modern JavaScript (ES6+)",
      "Build 3 responsive portfolio projects",
      "Learn React & State Management",
      "Practice mock technical interviews",
      "Apply for verified internships",
    ],
    stepsKm: [
      "រៀនមូលដ្ឋានគ្រឹះ HTML & CSS",
      "ស្ទាត់ជំនាញ JavaScript ទំនើប (ES6+)",
      "បង្កើត 3 គម្រោងស្នាដៃក្នុង Portfolio",
      "រៀន React & ការគ្រប់គ្រង State",
      "អនុវត្តការសម្ភាសន៍បច្ចេកទេសសាកល្បង",
      "ដាក់ពាក្យចូលកម្មសិក្សាដែលបានផ្ទៀងផ្ទាត់",
    ],
  },
  {
    id: "design",
    titleEn: "UX/UI Designer",
    titleKm: "អ្នករចនា UX/UI",
    stepsEn: [
      "Learn design thinking & user empathy",
      "Wireframing & prototyping in Figma",
      "Build an end-to-end UX case study",
      "Get feedback from a design mentor",
      "Publish your portfolio on the web",
      "Apply for UI/UX internships",
    ],
    stepsKm: [
      "រៀនវិធីសាស្ត្រ Design Thinking & User Empathy",
      "គូរប្លង់ Wireframe & Prototype ក្នុង Figma",
      "បង្កើតគម្រោង Case Study UX ពេញលេញ",
      "ទទួលមតិកែលម្អពីអ្នកណែនាំផ្នែករចនា",
      "ផ្សព្វផ្សាយ Portfolio លើគេហទំព័រ",
      "ដាក់ពាក្យចូលកម្មសិក្សា UI/UX",
    ],
  },
  {
    id: "data",
    titleEn: "Data Analyst",
    titleKm: "អ្នកវិភាគទិន្នន័យ",
    stepsEn: [
      "Master advanced spreadsheets & formulas",
      "Write SQL queries: SELECT, JOIN, GROUP BY",
      "Learn Python for data analysis (Pandas)",
      "Build interactive dashboard in Power BI / Tableau",
      "Write a data storytelling project report",
      "Apply for data analyst internships",
    ],
    stepsKm: [
      "ស្ទាត់ជំនាញប្រើប្រាស់ Spreadsheet កម្រិតខ្ពស់",
      "សរសេរសំណួរ SQL: SELECT, JOIN, GROUP BY",
      "រៀន Python សម្រាប់ការវិភាគទិន្នន័យ (Pandas)",
      "បង្កើត Dashboard ក្នុង Power BI / Tableau",
      "សរសេររបាយការណ៍បកស្រាយទិន្នន័យ Storytelling",
      "ដាក់ពាក្យចូលកម្មសិក្សាផ្នែកវិភាគទិន្នន័យ",
    ],
  },
];

const INTERNSHIPS_DATA = [
  {
    id: "j1",
    titleEn: "Frontend Intern",
    titleKm: "កម្មសិក្សាផ្នែក Frontend",
    type: "Hybrid",
    company: "Angkor Tech",
    verified: true,
    locationEn: "Phnom Penh",
    locationKm: "ភ្នំពេញ",
    stipend: "$150/mo",
    openings: 2,
    deadlineEn: "In 20 days",
    deadlineKm: "ក្នុង 20 ថ្ងៃ",
  },
  {
    id: "j2",
    titleEn: "UX Design Intern",
    titleKm: "កម្មសិក្សាផ្នែក UX Design",
    type: "On-site",
    company: "Khmer Studio",
    verified: false,
    locationEn: "Siem Reap",
    locationKm: "សៀមរាប",
    stipend: "$120/mo",
    openings: 1,
    deadlineEn: "In 14 days",
    deadlineKm: "ក្នុង 14 ថ្ងៃ",
  },
  {
    id: "j3",
    titleEn: "Data Intern",
    titleKm: "កម្មសិក្សាផ្នែក Data",
    type: "Remote",
    company: "Angkor Tech",
    verified: true,
    locationEn: "Remote (Cambodia)",
    locationKm: "ពីចម្ងាយ (កម្ពុជា)",
    stipend: "$140/mo",
    openings: 3,
    deadlineEn: "In 30 days",
    deadlineKm: "ក្នុង 30 ថ្ងៃ",
  },
];

const FORUM_POSTS_DATA = [
  {
    id: "f1",
    titleEn: "How do I start learning React?",
    titleKm: "តើខ្ញុំគួរចាប់ផ្តើមរៀន React យ៉ាងដូចម្តេច?",
    bodyEn: "I know basic HTML, CSS and JavaScript. What concepts should I master before diving into React?",
    bodyKm: "ខ្ញុំចេះ HTML, CSS និង JavaScript មូលដ្ឋាន។ តើគំនិតអ្វីខ្លះដែលខ្ញុំគួរយល់ច្បាស់មុននឹងរៀន React?",
    cat: "Programming",
    author: "Vanna",
    answers: 4,
    likes: 12,
    isAnswered: true,
  },
  {
    id: "f2",
    titleEn: "Tips for my first IT CV with no work experience?",
    titleKm: "គន្លឹះរៀបចំ CV ដំបូងដោយគ្មានបទពិសោធន៍ការងារ?",
    bodyEn: "Should I highlight personal portfolio projects at the top? How long should the resume be?",
    bodyKm: "តើខ្ញុំគួរដាក់គម្រោងស្នាដៃផ្ទាល់ខ្លួននៅផ្នែកខាងលើដែរឬទេ? តើ CV គួរមានប្រវែងប៉ុន្មានទំព័រ?",
    cat: "Career",
    author: "Rina",
    answers: 6,
    likes: 8,
    isAnswered: false,
  },
  {
    id: "f3",
    titleEn: "Figma or Photoshop for modern UI Design?",
    titleKm: "Figma ឬ Photoshop សម្រាប់ការរចនា UI ទំនើប?",
    bodyEn: "Which tool is standard across tech companies and design agencies in Cambodia today?",
    bodyKm: "តើឧបករណ៍មួយណាដែលក្រុមហ៊ុនបច្ចេកវិទ្យានៅកម្ពុជាប្រើប្រាស់ច្រើនជាងគេ?",
    cat: "Design",
    author: "Sokha",
    answers: 5,
    likes: 15,
    isAnswered: true,
  },
];

export default function Home() {
  const { user } = useGlobleContext();
  const { language } = useLanguage();

  const [searchQuery, setSearchQuery] = useState("");
  const [platformStats, setPlatformStats] = useState(null);

  // Filters state
  const [courseCat, setCourseCat] = useState("All");
  const [courseLvl, setCourseLvl] = useState("All");
  const [coursePrice, setCoursePrice] = useState("All");
  const [courseSearch, setCourseSearch] = useState("");

  const [mentorSearch, setMentorSearch] = useState("");
  const [jobType, setJobType] = useState("All");
  const [jobSearch, setJobSearch] = useState("");
  const [forumCat, setForumCat] = useState("All");
  const [forumSearch, setForumSearch] = useState("");

  // Career roadmap state
  const [activePathId, setActivePathId] = useState("web");
  const [checkedSteps, setCheckedSteps] = useState({
    web: { 0: true, 1: true, 2: true, 3: true },
    design: { 0: true, 1: true },
    data: { 0: true, 1: true, 2: true },
  });

  const heroRef = useRef(null);
  const searchInputRef = useRef(null);
  const isKm = language === "km";

  const [isMobileScreen, setIsMobileScreen] = useState(
    typeof window !== "undefined" ? window.innerWidth < 640 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 640);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const heroPlaceholder = isKm
    ? isMobileScreen
      ? "ស្វែងរកជំនាញ ឬវគ្គសិក្សា..."
      : "ស្វែងរកជំនាញ, វគ្គសិក្សា, ការងារ..."
    : isMobileScreen
      ? "Search skills, courses..."
      : "Search skills, courses, mentors, jobs...";

  // Selected YouTube video for interactive modal preview
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    const handleModalEsc = (e) => {
      if (e.key === "Escape") setSelectedVideo(null);
    };
    if (selectedVideo) {
      window.addEventListener("keydown", handleModalEsc);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      window.removeEventListener("keydown", handleModalEsc);
      document.body.style.overflow = "";
    };
  }, [selectedVideo]);

  // ⌘K or Ctrl+K shortcut to focus hero search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch real platform stats
  useEffect(() => {
    let active = true;
    fetchStats()
      .then((stats) => {
        if (active) setPlatformStats(stats);
      })
      .catch(() => {
        if (active) setPlatformStats(null);
      });
    return () => {
      active = false;
    };
  }, []);



  // Scroll reveal observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("show");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );

    document.querySelectorAll(".reveal:not(.show)").forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [language, courseCat, courseLvl, coursePrice, jobType, forumCat]);

  // Search handler
  const handleHeroSearch = (e) => {
    e?.preventDefault();
    const q = searchQuery.trim();
    if (!q) {
      const el = document.getElementById("courses");
      el?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    setCourseSearch(q);
    const el = document.getElementById("courses");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  const handleChipClick = (chip) => {
    setCourseSearch(chip);
    const el = document.getElementById("courses");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  // Filtered courses
  const filteredCourses = useMemo(() => {
    return COURSES_DATA.filter((c) => {
      const matchCat = courseCat === "All" || c.cat === courseCat;
      const matchLvl = courseLvl === "All" || c.level === courseLvl;
      const matchPrice =
        coursePrice === "All" ||
        (coursePrice === "Free" ? c.price === 0 : c.price > 0);
      const q = courseSearch.trim().toLowerCase();
      const matchSearch =
        !q ||
        c.titleEn.toLowerCase().includes(q) ||
        c.titleKm.toLowerCase().includes(q) ||
        c.cat.toLowerCase().includes(q) ||
        (c.catKm && c.catKm.toLowerCase().includes(q)) ||
        c.by.toLowerCase().includes(q);
      return matchCat && matchLvl && matchPrice && matchSearch;
    });
  }, [courseCat, courseLvl, coursePrice, courseSearch]);

  // Filtered mentors
  const filteredMentors = useMemo(() => {
    if (!mentorSearch) return FEATURED_MENTORS;
    const q = mentorSearch.toLowerCase();
    return FEATURED_MENTORS.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.roleEn.toLowerCase().includes(q) ||
        m.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [mentorSearch]);

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    return INTERNSHIPS_DATA.filter((j) => {
      const matchType = jobType === "All" || j.type === jobType;
      const matchSearch =
        !jobSearch ||
        j.titleEn.toLowerCase().includes(jobSearch.toLowerCase()) ||
        j.company.toLowerCase().includes(jobSearch.toLowerCase());
      return matchType && matchSearch;
    });
  }, [jobType, jobSearch]);

  // Filtered forum
  const filteredForum = useMemo(() => {
    return FORUM_POSTS_DATA.filter((f) => {
      const matchCat = forumCat === "All" || f.cat === forumCat;
      const matchSearch =
        !forumSearch ||
        f.titleEn.toLowerCase().includes(forumSearch.toLowerCase()) ||
        f.bodyEn.toLowerCase().includes(forumSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [forumCat, forumSearch]);

  // Career steps toggle
  const currentPath =
    CAREER_PATHS_DATA.find((p) => p.id === activePathId) ||
    CAREER_PATHS_DATA[0];
  const pathDone = checkedSteps[activePathId] || {};
  const completedCount = currentPath.stepsEn.filter(
    (_, i) => pathDone[i]
  ).length;
  const currentPathPct = Math.round(
    (completedCount / currentPath.stepsEn.length) * 100
  );

  const toggleStep = (stepIndex) => {
    setCheckedSteps((prev) => {
      const existing = prev[activePathId] || {};
      return {
        ...prev,
        [activePathId]: {
          ...existing,
          [stepIndex]: !existing[stepIndex],
        },
      };
    });
  };

  // Radar SVG rendering
  const radarLabels = ["Technical", "Problem Solving", "Projects", "Readiness"];
  const radarVals = [85, 70, 75, 90];
  const radarPoints = useMemo(() => {
    const c = 120;
    const R = 85;
    const n = radarLabels.length;
    return radarVals.map((v, i) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      const r = (R * v) / 100;
      return [c + r * Math.cos(a), c + r * Math.sin(a)];
    });
  }, []);
  const renderRadarPolygon = () => {
    return radarPoints.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  };

  return (
    <main className="home-page" id="home">
      {/* ====================================================================
          1. CENTERED HERO (ANTIGRAVITY + APPLE GLASS DESIGN)
          ==================================================================== */}
      <section className="home-hero-centered" id="top" ref={heroRef}>
        <DotField />

        <div className="container hero-inner">
          <div className="hero-eyebrow-pill">
            <span className="live-dot" />
            <span>
              {isKm
                ? "Smart Community • វេទិកាអភិវឌ្ឍន៍ជំនាញ & អាជីព"
                : "Smart Community • Skill & Career Platform"}
            </span>
            <span className="eyebrow-divider">•</span>
            <span className="eyebrow-highlight">CMU Exit Exam</span>
          </div>

          <h1 className="hero-title">
            {isKm ? (
              <>
                កសាងជំនាញពិតប្រាកដ<br />
                <span className="hero-gradient-text">ពង្រីកឱកាសការងារក្នុងក្តីស្រមៃ</span>
              </>
            ) : (
              <>
                Build real-world skills.<br />
                <span className="hero-gradient-text">Launch your dream career.</span>
              </>
            )}
          </h1>

          <p className="hero-lead">
            {isKm
              ? "វេទិកាតែមួយគត់សម្រាប់រៀន ជួបអ្នកណែនាំផ្ទាល់ និងដាក់ពាក្យចូលកម្មសិក្សាដែលបានផ្ទៀងផ្ទាត់នៅកម្ពុជា។"
              : "One place to learn in-demand tech skills, meet trusted mentors, and apply directly for verified internships."}
          </p>

          <form className="hero-search-glass glass" onSubmit={handleHeroSearch}>
            <FiSearch className="search-icon-symbol" />
            <input
              ref={searchInputRef}
              type="search"
              aria-label={heroPlaceholder}
              placeholder={heroPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="button"
              className="search-kbd-hint"
              onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
              title={isKm ? "បើកផ្ទាំងស្វែងរក Spotlight (⌘K)" : "Open Spotlight (⌘K)"}
            >
              ⌘K
            </button>
            <button type="submit" className="btn btn-primary btn-sm search-submit-btn">
              {isKm ? "ស្វែងរក" : "Search"}
            </button>
          </form>

          <div className="hero-chips-wrap">
            <button type="button" className="hero-chip-pill chip-web" onClick={() => handleChipClick("Web")}>
              <FiCode className="chip-icon" /> <span>Web</span>
            </button>
            <button type="button" className="hero-chip-pill chip-design" onClick={() => handleChipClick("Design")}>
              <FiLayout className="chip-icon" /> <span>UI/UX</span>
            </button>
            <button type="button" className="hero-chip-pill chip-python" onClick={() => handleChipClick("Python")}>
              <FiTerminal className="chip-icon" /> <span>Python &amp; AI</span>
            </button>
            <button type="button" className="hero-chip-pill chip-data" onClick={() => handleChipClick("Data")}>
              <FiBarChart2 className="chip-icon" /> <span>Data</span>
            </button>
            <button type="button" className="hero-chip-pill chip-bakong" onClick={() => handleChipClick("Bakong")}>
              <FiCreditCard className="chip-icon" /> <span>Bakong KHQR</span>
            </button>
          </div>

          <div className="hero-actions">
            <Link to="/courses" className="btn btn-primary hero-main-btn">
              <span>{isKm ? "ចាប់ផ្តើមរៀនឥឡូវនេះ" : "Start learning"}</span>
              <FiArrowRight className="btn-arrow-icon" />
            </Link>
            <a href="#showcase" className="btn btn-soft hero-second-btn">
              {isKm ? "ស្វែងយល់បន្ថែម" : "Explore ecosystem"}
            </a>
          </div>

          {/* Hero Trust Bar */}
          <div className="hero-trust-bar">
            <span><FiCheckCircle className="trust-icon" /> {isKm ? "បង់ប្រាក់ភ្លាមៗតាម Bakong KHQR" : "Instant Bakong KHQR"}</span>
            <span className="trust-dot">•</span>
            <span><FiCheckCircle className="trust-icon" /> {isKm ? "ការណែនាំ 1:1 ផ្ទាល់" : "1:1 Mentorship"}</span>
            <span className="trust-dot">•</span>
            <span><FiCheckCircle className="trust-icon" /> {isKm ? "កម្មសិក្សាពិតប្រាកដ" : "Verified Internships"}</span>
          </div>
        </div>
      </section>

      {/* ====================================================================
          2. SHOWCASE (3 PREMIUM GLASS FEATURE CARDS)
          ==================================================================== */}
      <section id="showcase" className="showcase-section">
        <div className="container">
          <div className="grid g3 showcase reveal">
            {/* Card 1: Academy & Practical Courses */}
            <div className="show-card show-card-academy">
              <div className="show-card-top">
                <div className="card-icon-box icon-blue">
                  <FiBookOpen className="card-icon-glyph" />
                </div>
                <div className="card-top-badges">
                  <span className="badge b-bakong">🇰🇭 Bakong KHQR $15</span>
                  <span className="badge b-blue-soft">{isKm ? "៤៨ វគ្គសិក្សា" : "48 Courses"}</span>
                </div>
              </div>

              <div className="show-card-body">
                <h3>{isKm ? "វគ្គសិក្សាអនុវត្តជាក់ស្តែង" : "Practical Courses"}</h3>
                <p>
                  {isKm
                    ? "រៀនជំនាញ IT តាមតម្រូវការទីផ្សារ ជាមួយគម្រោងពិតប្រាកដ និងទូទាត់ភ្លាមៗតាម Bakong KHQR $15 ក្នុងមួយវគ្គ។"
                    : "Master in-demand tech skills with hands-on projects and instant Bakong KHQR payment at $15/course."}
                </p>

                <ul className="show-card-features">
                  <li>
                    <span className="feat-check check-blue"><FiCheck /></span>
                    <span>{isKm ? "៤៨ វគ្គសិក្សាក្នុងវិស័យ Full-Stack & AI" : "48 industry-ready courses"}</span>
                  </li>
                  <li>
                    <span className="feat-check check-blue"><FiCheck /></span>
                    <span>{isKm ? "ទូទាត់ដោយសុវត្ថិភាពតាម Bakong KHQR $15" : "Instant $15 Bakong KHQR payments"}</span>
                  </li>
                  <li>
                    <span className="feat-check check-blue"><FiCheck /></span>
                    <span>{isKm ? "អនុវត្តគម្រោងពិត និងវិញ្ញាបនបត្របញ្ជាក់" : "Hands-on projects & certificates"}</span>
                  </li>
                </ul>
              </div>

              <div className="show-card-footer">
                <Link to="/courses" className="btn btn-primary show-card-btn">
                  <span>{isKm ? "រុករកវគ្គសិក្សា" : "Explore Courses"}</span>
                  <FiArrowRight className="btn-arrow-icon" />
                </Link>
              </div>
            </div>

            {/* Card 2: 1:1 Mentorship & Trusted Mentors */}
            <div className="show-card show-card-mentors">
              <div className="show-card-top">
                <div className="card-icon-box icon-gold">
                  <FiUsers className="card-icon-glyph" />
                </div>
                <div className="card-top-badges">
                  <span className="badge b-approved">{isKm ? "៥ នាក់បានផ្ទៀងផ្ទាត់" : "5 Verified"}</span>
                  <span className="badge b-gold-soft">Jitsi Meet 1:1</span>
                </div>
              </div>

              <div className="show-card-body">
                <h3>{isKm ? "អ្នកណែនាំជំនាញ 1:1" : "1:1 Trusted Mentors"}</h3>
                <p>
                  {isKm
                    ? "កក់ម៉ោងពិភាក្សាផ្ទាល់តាម Jitsi Meet ជាមួយក្រុមការងារនិស្សិត និងអ្នកជំនាញមកពីវិស័យការងារពិត។"
                    : "Book direct video sessions with university researchers and verified Cambodian tech practitioners."}
                </p>

                <ul className="show-card-features">
                  <li>
                    <span className="feat-check check-gold"><FiCheck /></span>
                    <span>{isKm ? "ប្រឹក្សាផ្ទាល់ 1:1 តាម Jitsi Meet Video" : "Direct 1:1 sessions via Jitsi Meet"}</span>
                  </li>
                  <li>
                    <span className="feat-check check-gold"><FiCheck /></span>
                    <span>{isKm ? "ក្រុមនិស្សិតស្រាវជ្រាវ ៥ រូប (CMU Team)" : "CMU research team of 5 members"}</span>
                  </li>
                  <li>
                    <span className="feat-check check-gold"><FiCheck /></span>
                    <span>{isKm ? "ពិនិត្យគម្រោងកូដ និងណែនាំផ្លូវអាជីព" : "Code reviews & personalized guidance"}</span>
                  </li>
                </ul>
              </div>

              <div className="show-card-footer">
                <Link to="/mentorship" className="btn btn-gold show-card-btn">
                  <span>{isKm ? "កក់ការណែនាំ 1:1" : "Book Mentorship"}</span>
                  <FiArrowRight className="btn-arrow-icon" />
                </Link>
              </div>
            </div>

            {/* Card 3: Career Ready & Verified Internships */}
            <div className="show-card show-card-career">
              <div className="show-card-top">
                <div className="card-icon-box icon-teal">
                  <FiBriefcase className="card-icon-glyph" />
                </div>
                <div className="card-top-badges">
                  <span className="badge b-teal">{isKm ? "ដាក់ពាក្យផ្ទាល់" : "Direct Apply"}</span>
                  <span className="badge b-teal-soft">{isKm ? "២៦ ឱកាសការងារ" : "26 Open"}</span>
                </div>
              </div>

              <div className="show-card-body">
                <h3>{isKm ? "កម្មសិក្សាពិតប្រាកដ" : "Verified Internships"}</h3>
                <p>
                  {isKm
                    ? "ដាក់ពាក្យជាមួយ CV (PDF) ផ្ទាល់ទៅក្រុមហ៊ុនដៃគូ និងតាមដានដំណាក់កាលពី Pending ដល់ Approved។"
                    : "Direct application with PDF CV to verified local companies and live status tracking from start to finish."}
                </p>

                <ul className="show-card-features">
                  <li>
                    <span className="feat-check check-teal"><FiCheck /></span>
                    <span>{isKm ? "ដាក់ពាក្យដោយផ្ទាល់ជាមួយ PDF CV" : "Instant application with PDF CV"}</span>
                  </li>
                  <li>
                    <span className="feat-check check-teal"><FiCheck /></span>
                    <span>{isKm ? "២៦ ឱកាសកម្មសិក្សាកំពុងបើកទទួល" : "26 verified internships open now"}</span>
                  </li>
                  <li>
                    <span className="feat-check check-teal"><FiCheck /></span>
                    <span>{isKm ? "តាមដានស្ថានភាពពី Pending ដល់ Approved" : "Live stage tracking to hiring"}</span>
                  </li>
                </ul>
              </div>

              <div className="show-card-footer">
                <Link to="/jobs" className="btn btn-teal show-card-btn">
                  <span>{isKm ? "ស្វែងរកឱកាសការងារ" : "Browse Internships"}</span>
                  <FiArrowRight className="btn-arrow-icon" />
                </Link>
              </div>
            </div>
          </div>

          {/* Enhanced Glass Metric Dashboard */}
          <div className="stats-dashboard glass reveal" id="stats">
            <div className="stat-card-item">
              <div className="stat-icon-wrap stat-icon-blue">
                <FiUsers />
              </div>
              <div className="stat-content">
                <div className="stat-number-row">
                  <b>
                    <AnimatedCounter
                      target={platformStats?.users ?? 1280}
                      suffix="+"
                    />
                  </b>
                  <span className="stat-trend-tag tag-green">↑ 18%</span>
                </div>
                <span className="stat-label">{isKm ? "អ្នកសិក្សាសកម្ម" : "Active Learners"}</span>
              </div>
            </div>

            <div className="stat-divider" />

            <div className="stat-card-item">
              <div className="stat-icon-wrap stat-icon-gold">
                <FiBookOpen />
              </div>
              <div className="stat-content">
                <div className="stat-number-row">
                  <b>
                    <AnimatedCounter
                      target={platformStats?.courses ?? 48}
                    />
                  </b>
                  <span className="stat-trend-tag tag-blue">{isKm ? "កម្រិតខ្ពស់" : "Industry"}</span>
                </div>
                <span className="stat-label">{isKm ? "វគ្គសិក្សាអនុវត្ត" : "Practical Courses"}</span>
              </div>
            </div>

            <div className="stat-divider" />

            <div className="stat-card-item">
              <div className="stat-icon-wrap stat-icon-teal">
                <FiRepeat />
              </div>
              <div className="stat-content">
                <div className="stat-number-row">
                  <b>
                    <AnimatedCounter
                      target={platformStats?.mentors ?? 34}
                    />
                  </b>
                  <span className="stat-trend-tag tag-gold">5 CMU Team</span>
                </div>
                <span className="stat-label">{isKm ? "អ្នកណែនាំជំនាញ" : "Verified Mentors"}</span>
              </div>
            </div>

            <div className="stat-divider" />

            <div className="stat-card-item">
              <div className="stat-icon-wrap stat-icon-purple">
                <FiBriefcase />
              </div>
              <div className="stat-content">
                <div className="stat-number-row">
                  <b>
                    <AnimatedCounter
                      target={platformStats?.jobs ?? 26}
                    />
                  </b>
                  <span className="stat-trend-tag tag-green">{isKm ? "កំពុងបើក" : "Open"}</span>
                </div>
                <span className="stat-label">{isKm ? "ឱកាសកម្មសិក្សា" : "Open Internships"}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          3. LEARNING JOURNEY (5 APPLE-STYLE STEPPER CARDS)
          ==================================================================== */}
      <section id="journey" style={{ paddingTop: "10px" }}>
        <div className="container">
          <div className="sec-title reveal">
            <div className="ios-section-eyebrow eyebrow-indigo">
              <span className="ios-eyebrow-dot" />
              <span>{isKm ? "ដំណើរសិក្សាជាក់ស្តែង" : "LEARNING ROADMAP"}</span>
            </div>
            <h2>{isKm ? "ដំណើរសិក្សារបស់អ្នក" : "Your learning journey"}</h2>
            <p>{isKm ? "៥ជំហានពីអ្នកចាប់ផ្តើម ដល់ការងារ" : "5 steps from beginner to job-ready"}</p>
          </div>

          <div className="journey-stepper-wrap reveal">
            <div className="journey-step-card glass">
              <span className="step-num-pill">01</span>
              <div className="step-ico-box"><FiUserCheck /></div>
              <b>{isKm ? "ប្រវត្តិរូប" : "Profile"}</b>
              <small className="muted">{isKm ? "បង្កើតគណនី និងរៀបចំជំនាញ" : "Create account & setup skills"}</small>
            </div>

            <div className="journey-step-card glass">
              <span className="step-num-pill">02</span>
              <div className="step-ico-box"><FiBookOpen /></div>
              <b>{isKm ? "រៀនជំនាញ" : "Learn Skills"}</b>
              <small className="muted">{isKm ? "វគ្គសិក្សាជាក់ស្តែង ៤៨ វគ្គ" : "48 real-world courses"}</small>
            </div>

            <div className="journey-step-card glass">
              <span className="step-num-pill">03</span>
              <div className="step-ico-box"><FiRepeat /></div>
              <b>{isKm ? "ប្តូរជំនាញ" : "Collaborate"}</b>
              <small className="muted">{isKm ? "ផ្គូផ្គង និងរៀនពីមិត្តភក្តិ" : "Peer skill exchange"}</small>
            </div>

            <div className="journey-step-card glass">
              <span className="step-num-pill">04</span>
              <div className="step-ico-box"><FiCompass /></div>
              <b>{isKm ? "ផែនទីអាជីព" : "Career Roadmap"}</b>
              <small className="muted">{isKm ? "វាយតម្លៃសមត្ថភាពជាក់លាក់" : "Radar assessment & track"}</small>
            </div>

            <div className="journey-step-card glass">
              <span className="step-num-pill">05</span>
              <div className="step-ico-box"><FiBriefcase /></div>
              <b>{isKm ? "ការងារពិត" : "Get Hired"}</b>
              <small className="muted">{isKm ? "កម្មសិក្សាដែលបានផ្ទៀងផ្ទាត់" : "Verified internships"}</small>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          4. COURSES CATALOG (FILTERS & BAKONG KHQR BADGES)
          ==================================================================== */}
      <section id="courses">
        <div className="container">
          <div className="sec-title reveal">
            <div className="ios-section-eyebrow">
              <span className="ios-eyebrow-dot" />
              <span>{isKm ? "វគ្គសិក្សាជំនាញអនាគត" : "FUTURE-READY ACADEMY"}</span>
            </div>
            <h2>{isKm ? "វគ្គសិក្សាជាក់ស្តែង" : "Explore Courses"}</h2>
            <p>{isKm ? "បង់ប្រាក់ដោយ Bakong KHQR ឬចូលរៀនឥតគិតថ្លៃភ្លាមៗ" : "Pay with Bakong KHQR or enroll for free"}</p>
          </div>

          <div className="courses-search-capsule glass reveal">
            <FiSearch className="courses-search-icon" />
            <input
              type="search"
              placeholder={isKm ? "ស្វែងរកវគ្គសិក្សា ឬគ្រូបង្រៀន..." : "Search courses or instructors..."}
              value={courseSearch}
              onChange={(e) => setCourseSearch(e.target.value)}
            />
            {courseSearch && (
              <button
                type="button"
                className="courses-search-clear"
                onClick={() => setCourseSearch("")}
                aria-label={isKm ? "សម្អាត" : "Clear search"}
              >
                <FiX />
              </button>
            )}
          </div>

          <div className="bar-filters reveal">
            <div className="seg glass">
              {COURSE_CAT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={courseCat === opt.id ? "on" : ""}
                  onClick={() => setCourseCat(opt.id)}
                >
                  {isKm ? opt.km : opt.en}
                </button>
              ))}
            </div>

            <div className="seg glass">
              {COURSE_LVL_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={courseLvl === opt.id ? "on" : ""}
                  onClick={() => setCourseLvl(opt.id)}
                >
                  {isKm ? opt.km : opt.en}
                </button>
              ))}
            </div>

            <div className="seg glass">
              {COURSE_PRICE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={coursePrice === opt.id ? "on" : ""}
                  onClick={() => setCoursePrice(opt.id)}
                >
                  {isKm ? opt.km : opt.en}
                </button>
              ))}
            </div>
          </div>

          <div className="grid g3 reveal">
            {filteredCourses.length === 0 ? (
              <div
                className="card glass"
                style={{
                  gridColumn: "1 / -1",
                  textAlign: "center",
                  padding: "48px 24px",
                }}
              >
                <p className="muted" style={{ fontSize: "1.05rem", margin: "0 0 14px" }}>
                  {isKm
                    ? "រកមិនឃើញវគ្គសិក្សាដែលត្រូវនឹងការស្វែងរករបស់អ្នកទេ។"
                    : "No courses match your search or filter criteria."}
                </p>
                <button
                  type="button"
                  className="btn btn-soft btn-sm"
                  onClick={() => {
                    setCourseCat("All");
                    setCourseLvl("All");
                    setCoursePrice("All");
                    setCourseSearch("");
                  }}
                >
                  {isKm ? "កំណត់តម្រងឡើងវិញ" : "Reset filters"}
                </button>
              </div>
            ) : (
              filteredCourses.map((c) => (
                <TiltCard key={c.id} className="card glass tilt course-video-card">
                  <div
                    className="thumb-img video-thumb-card"
                    onClick={() => setSelectedVideo(c)}
                    role="button"
                    tabIndex={0}
                    title={isKm ? "ចុចដើម្បីមើលវីដេអូ YouTube សង្ខេប" : "Click to watch YouTube preview"}
                    onKeyDown={(e) => e.key === "Enter" && setSelectedVideo(c)}
                  >
                    <img
                      src={`https://img.youtube.com/vi/${c.youtubeId}/maxresdefault.jpg`}
                      onError={(e) => {
                        e.currentTarget.src = `https://img.youtube.com/vi/${c.youtubeId}/mqdefault.jpg`;
                      }}
                      alt={isKm ? c.titleKm : c.titleEn}
                      className="video-thumb-img"
                      loading="lazy"
                    />
                    <div className="video-thumb-play-overlay">
                      <div className="video-thumb-play-btn" aria-hidden="true">
                        <FaPlay style={{ marginLeft: "3px" }} />
                      </div>
                    </div>
                  </div>

                  <div className="course-card-meta-top">
                    <span className={`badge b-level b-level-${c.level.toLowerCase()}`}>
                      {isKm ? c.levelKm : c.level}
                    </span>
                    <span className="course-duration-tag">
                      <FiClock className="tag-clock-icon" /> {c.duration} · {c.lessons} {isKm ? "មេរៀន" : "lessons"}
                    </span>
                  </div>

                  <h3 className="course-card-title">{isKm ? c.titleKm : c.titleEn}</h3>
                  <div className="course-instructor-byline">
                    <span className="instructor-dot" /> {c.by} · <span className="cat-pill">{isKm ? c.catKm : c.cat}</span>
                  </div>

                  <div className="course-price-row">
                    {c.price > 0 ? (
                      <>
                        <span className="price">${c.price}</span>
                        <span className="badge b-bakong">
                          <span className="bakong-dot" /> Bakong KHQR
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="price free-price">{isKm ? "ឥតគិតថ្លៃ" : "Free"}</span>
                        <span className="badge b-free">
                          <span className="free-dot" /> {isKm ? "១០០% ឥតគិតថ្លៃ" : "100% Free"}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="course-actions-row">
                    <button
                      type="button"
                      onClick={() => setSelectedVideo(c)}
                      className="btn btn-soft btn-sm btn-preview-video"
                      title={isKm ? "មើលវីដេអូ YouTube សង្ខេប" : "Watch YouTube Preview"}
                    >
                      <FaPlay className="btn-play-mini" /> {isKm ? "មើលវីដេអូ" : "Preview"}
                    </button>
                    <Link to={`/courses/${c.slug || c.id}`} className="btn btn-primary btn-sm btn-enroll-action">
                      {c.price > 0
                        ? isKm
                          ? "បង់ប្រាក់"
                          : "Pay now"
                        : isKm
                          ? "ចូលរៀន"
                          : "Enroll"}
                    </Link>
                  </div>
                </TiltCard>
              ))
            )}
          </div>

          <div style={{ textAlign: "center" }}>
            <Link to="/courses" className="section-more-link">
              <span>{isKm ? "មើលវគ្គសិក្សាទាំងអស់ក្នុងកាតាឡុក" : "View all courses in catalog"}</span>
              <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* ====================================================================
          5. SKILL EXCHANGE WITH PEERS
          ==================================================================== */}
      <section id="exchange">
        <div className="container">
          <div className="sec-title reveal">
            <div className="ios-section-eyebrow eyebrow-emerald">
              <span className="ios-eyebrow-dot" />
              <span>{isKm ? "ការប្តូរជំនាញគ្នាទៅវិញទៅមក" : "PEER-TO-PEER BARTER"}</span>
            </div>
            <h2>{isKm ? "ប្តូរជំនាញជាមួយមិត្តភក្តិ" : "Skill exchange with peers"}</h2>
            <p>
              {isKm
                ? "ផ្គូផ្គងតាមជំនាញដែលអ្នកអាចបង្រៀន និងចង់រៀន"
                : "Matched by skills you can teach and want to learn"}
            </p>
          </div>

          <div className="grid g3 reveal">
            {PEER_MATCHES.map((peer) => (
              <TiltCard key={peer.id} className="card glass tilt peer-exchange-card">
                <div className="row peer-header-row" style={{ margin: 0 }}>
                  <div className="flex">
                    <div
                      className="peer-avatar-squircle"
                      style={{
                        background: `linear-gradient(135deg, ${peer.color}, #3b82f6)`,
                      }}
                    >
                      {peer.avatar}
                      <span className="peer-online-dot" />
                    </div>
                    <div>
                      <b className="peer-name">{peer.name}</b>
                      <div className="peer-verified-tag">
                        <FiCheckCircle className="verified-check-inline" /> {isKm ? "សមាជិកផ្ទៀងផ្ទាត់" : "Verified peer"}
                      </div>
                    </div>
                  </div>
                  <span className="badge b-approved peer-match-badge">{peer.match}% match</span>
                </div>

                <div className="peer-skills-details" style={{ marginTop: "14px", lineHeight: 1.7 }}>
                  <div className="peer-skills-row">
                    <span className="peer-skill-label label-teach">
                      <FiBookOpen className="skill-direction-icon" /> {isKm ? "អាចបង្រៀន" : "Teaches"}:
                    </span>
                    <div className="peer-skills-pills">
                      {peer.teach.map((s) => (
                        <span key={s} className="badge b-skill-teach">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="peer-skills-row" style={{ marginTop: "10px" }}>
                    <span className="peer-skill-label label-want">
                      <FiCompass className="skill-direction-icon" /> {isKm ? "ចង់រៀន" : "Wants"}:
                    </span>
                    <div className="peer-skills-pills">
                      {peer.want.map((s) => (
                        <span key={s} className="badge b-skill-want">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="row peer-card-actions" style={{ marginTop: "auto", display: "grid", gridTemplateColumns: "auto 1fr", gap: "10px" }}>
                  <Link to="/messages" className="btn btn-soft btn-sm peer-chat-btn" aria-label={isKm ? "ផ្ញើសារ" : "Message"}>
                    <FiMessageCircle />
                  </Link>
                  <Link to="/discover" className="btn btn-primary btn-sm" style={{ width: "100%", justifyContent: "center" }}>
                    {isKm ? "ផ្ញើសំណើ" : "Send request"}
                  </Link>
                </div>
              </TiltCard>
            ))}
          </div>

          <div style={{ textAlign: "center" }}>
            <Link to="/discover" className="section-more-link">
              <span>{isKm ? "ស្វែងរកមិត្តភក្តិប្តូរជំនាញបន្ថែមទៀត" : "Find more peer exchanges"}</span>
              <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* ====================================================================
          6. VERIFIED MENTORS (HONORING GRADUATION PROJECT TEAM)
          ==================================================================== */}
      <section id="mentors">
        <div className="container">
          <div className="sec-title reveal">
            <div className="ios-section-eyebrow eyebrow-gold">
              <span className="ios-eyebrow-dot" />
              <span>{isKm ? "ក្រុមស្រាវជ្រាវ & អ្នកជំនាញ CMU" : "VERIFIED MENTOR NETWORK"}</span>
            </div>
            <h2>{isKm ? "អ្នកណែនាំដែលបានផ្ទៀងផ្ទាត់" : "Verified mentors"}</h2>
            <p>
              {isKm
                ? "ផ្ញើសំណើ រង់ចាំការយល់ព្រម បន្ទាប់មកទទួលតំណ Jitsi ចូលជួបពិភាក្សា"
                : "Send a request, wait for approval, then get the Jitsi link"}
            </p>
          </div>


          <div className="mentors-filter-bar reveal">
            <div className="courses-search-capsule glass" style={{ maxWidth: "480px", margin: 0 }}>
              <FiSearch className="courses-search-icon" />
              <input
                type="search"
                placeholder={isKm ? "ស្វែងរកអ្នកណែនាំតាមឈ្មោះ ឬជំនាញ..." : "Search mentors by name or skill..."}
                value={mentorSearch}
                onChange={(e) => setMentorSearch(e.target.value)}
              />
              {mentorSearch && (
                <button
                  type="button"
                  className="courses-search-clear"
                  onClick={() => setMentorSearch("")}
                  aria-label={isKm ? "សម្អាត" : "Clear search"}
                >
                  <FiX />
                </button>
              )}
            </div>
            <Link to="/mentorship" className="btn-become-mentor">
              <FiPlus />
              <span>{isKm ? "ក្លាយជាអ្នកណែនាំ" : "Become a mentor"}</span>
            </Link>
          </div>

          <div className="mentors-grid reveal">
            {filteredMentors.map((m) => (
              <TiltCard key={m.id} className="card glass tilt mentor-profile-card">
                <div className="mentor-card-top-row">
                  <div className="mentor-avatar-wrap">
                    <img
                      src={m.avatar}
                      alt={m.name}
                      className="mentor-avatar-img"
                    />
                    <span className="mentor-online-badge" title={isKm ? "អាចកក់បាន" : "Available"} />
                  </div>
                  <div className="mentor-details">
                    <div className="mentor-name-row">
                      <h3 className="mentor-name">{m.name}</h3>
                      <MdVerified className="mentor-verified-icon" title={isKm ? "អ្នកណែនាំបានផ្ទៀងផ្ទាត់" : "Verified Researcher & Mentor"} />
                    </div>
                    <div className="mentor-role">{isKm ? m.roleKm : m.roleEn}</div>
                    <div className="mentor-company">
                      <span className="company-icon"><FiBriefcase /></span> {m.company}
                    </div>
                  </div>
                </div>

                <div className="mentor-skills-wrap">
                  {m.tags.map((tag) => (
                    <span key={tag} className="mentor-skill-tag">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mentor-meta-row">
                  <div className="mentor-rating">
                    <span className="stars-glow">
                      <FaStar className="star-icon" />
                      <FaStar className="star-icon" />
                      <FaStar className="star-icon" />
                      <FaStar className="star-icon" />
                      <FaStar className="star-icon" />
                    </span>
                    <strong className="rating-score">{m.rating}</strong>
                    <span className="rating-count">({m.reviewsCount} {isKm ? "មតិ" : "reviews"})</span>
                  </div>
                  <span className="mentor-jitsi-tag">Jitsi 1:1</span>
                </div>

                <div className="mentor-card-footer">
                  <span className="mentor-approval-hint">
                    <span className="hint-dot" /> {isKm ? "ត្រូវការអនុម័ត" : "Approval needed"}
                  </span>
                  <Link to={`/mentorship/${m.id}`} className="btn mentor-request-btn">
                    <span>{isKm ? "ស្នើសុំម៉ោង" : "Request session"}</span>
                    <FiArrowRight className="btn-arrow-icon" />
                  </Link>
                </div>
              </TiltCard>
            ))}
          </div>

          <div style={{ textAlign: "center" }}>
            <Link to="/mentorship" className="section-more-link">
              <span>{isKm ? "មើលអ្នកណែនាំទាំងអស់" : "Browse all mentors"}</span>
              <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* ====================================================================
          7. LIVE LEARNING SESSIONS
          ==================================================================== */}
      <section id="sessions">
        <div className="container">
          <div className="sec-title reveal">
            <div className="ios-section-eyebrow eyebrow-red">
              <span className="ios-eyebrow-dot" />
              <span>{isKm ? "បន្ទប់សិក្សាផ្ទាល់ WEBRTC" : "INTERACTIVE LIVE ROOMS"}</span>
            </div>
            <h2>{isKm ? "វគ្គសិក្សាផ្ទាល់ (Live)" : "Live learning sessions"}</h2>
            <p>{isKm ? "ចុះឈ្មោះចូលរួមតាមអនឡាញ" : "Register to join online"}</p>
          </div>

          <div className="row l" style={{ justifyContent: "center", margin: "0 0 24px" }}>
            <Link to="/sessions" className="btn btn-primary">
              <FiPlus /> {isKm ? "រៀបចំវគ្គ Live" : "Host a session"}
            </Link>
          </div>

          <div className="grid g3 reveal">
            {LIVE_SESSIONS_DATA.map((s) => (
              <TiltCard key={s.id} className="card glass tilt live-session-card">
                <div className="flex" style={{ justifyContent: "space-between", marginBottom: "8px" }}>
                  <span className="badge b-scheduled">{isKm ? "បានកំណត់ពេល" : "Scheduled"}</span>
                  {s.isOpen ? (
                    <span className="badge b-open b-live-active">
                      <span className="live-dot-pulse" /> {isKm ? "កំពុងផ្សាយផ្ទាល់" : "Live now"}
                    </span>
                  ) : (
                    <span className="badge b-level">{s.cat}</span>
                  )}
                </div>

                <h3 className="live-session-title">{isKm ? s.titleKm : s.titleEn}</h3>

                <div className="live-meta-box">
                  <div className="live-host-line">
                    <span className="host-avatar-mini">{s.host.charAt(0)}</span>
                    <span>{s.host}</span> · <span className="cat-pill">{s.level}</span>
                  </div>
                  <div className="live-time-line">
                    <FiClock className="meta-inline-icon" /> {isKm ? s.timeTextKm : s.timeTextEn}
                  </div>
                  <div className="live-countdown-line">
                    <FaHourglassHalf className="meta-inline-icon" />{" "}
                    <span className="countdown-glow">
                      {isKm ? s.countdownKm : s.countdownEn}
                    </span>
                  </div>
                </div>

                <div className="live-capacity-wrap">
                  <div className="progress live-progress-bar">
                    <i style={{ width: `${Math.min(100, (s.registered / s.capacity) * 100)}%` }} />
                  </div>
                  <div className="live-capacity-text">
                    <span>{isKm ? "អ្នកចុះឈ្មោះ" : "Registered"}</span>
                    <strong>{s.registered} / {s.capacity}</strong>
                  </div>
                </div>

                <div className="row live-actions-row" style={{ marginTop: "auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <Link to={`/sessions/${s.id}`} className="btn btn-soft btn-sm" style={{ width: "100%", justifyContent: "center" }}>
                    {isKm ? "ព័ត៌មានលម្អិត" : "Details"}
                  </Link>
                  {s.isOpen ? (
                    <Link to={`/sessions/${s.id}/room`} className="btn btn-gold btn-sm btn-join-live" style={{ width: "100%", justifyContent: "center" }}>
                      <span className="live-dot-pulse" style={{ background: "#ffffff" }} /> {isKm ? "ចូលបន្ទប់" : "Join room"}
                    </Link>
                  ) : s.isFull ? (
                    <button type="button" className="btn btn-soft btn-sm" disabled style={{ width: "100%", justifyContent: "center" }}>
                      {isKm ? "ពេញ" : "Full"}
                    </button>
                  ) : (
                    <Link to={`/sessions/${s.id}`} className="btn btn-primary btn-sm" style={{ width: "100%", justifyContent: "center" }}>
                      {isKm ? "ចុះឈ្មោះ" : "Register"}
                    </Link>
                  )}
                </div>
              </TiltCard>
            ))}
          </div>

          <div style={{ textAlign: "center" }}>
            <Link to="/sessions" className="section-more-link">
              <span>{isKm ? "មើលវគ្គ Live ទាំងអស់" : "See all upcoming live sessions"}</span>
              <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* ====================================================================
          8. CAREER ROADMAP & SELF-ASSESSMENT
          ==================================================================== */}
      <section id="career">
        <div className="container">
          <div className="sec-title reveal">
            <div className="ios-section-eyebrow eyebrow-violet">
              <span className="ios-eyebrow-dot" />
              <span>{isKm ? "ផែនទីអាជីព & ការវាយតម្លៃ RADAR" : "CAREER ROADMAP & RADAR"}</span>
            </div>
            <h2>{isKm ? "ផែនទីអាជីព & ការវាយតម្លៃ" : "Career roadmap & self-assessment"}</h2>
            <p>{isKm ? "ធីកជំហាននីមួយៗ ដើម្បីមើលវឌ្ឍនភាព" : "Tick each step to see your progress"}</p>
          </div>

          <div className="bar-filters reveal">
            <div className="seg glass">
              {CAREER_PATHS_DATA.map((path) => (
                <button
                  key={path.id}
                  type="button"
                  className={activePathId === path.id ? "on" : ""}
                  onClick={() => setActivePathId(path.id)}
                >
                  {isKm ? path.titleKm : path.titleEn}
                </button>
              ))}
            </div>
          </div>

          <div className="grid g2 reveal">
            {/* Left Column: Interactive Milestone Timeline */}
            <div className="card glass">
              <div className="ring" style={{ "--p": currentPathPct }}>
                <span>{currentPathPct}%</span>
              </div>
              <h3 style={{ textAlign: "center", marginBottom: "6px" }}>
                {isKm ? currentPath.titleKm : currentPath.titleEn}
              </h3>
              <p className="muted" style={{ textAlign: "center", fontSize: "0.88rem" }}>
                <FiAward className="meta-inline-icon" /> {isKm ? "បានណែនាំសម្រាប់ប្រវត្តិរូបរបស់អ្នក" : "Recommended for your profile"}
              </p>

              <ul className="timeline" style={{ marginTop: "18px" }}>
                {(isKm ? currentPath.stepsKm : currentPath.stepsEn).map((step, idx) => {
                  const isChecked = Boolean(pathDone[idx]);
                  return (
                    <li key={idx} className={isChecked ? "done" : ""}>
                      <label>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleStep(idx)}
                        />
                        <span>{step}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>

              <p className="muted sm" style={{ marginTop: "10px" }}>
                {isKm ? "ប្រភពជំនួយ" : "Resources"}: MDN Web Docs · Practical Courses · GitHub
              </p>
            </div>

            {/* Right Column: Radar Assessment Chart */}
            <div className="card glass">
              <h3>{isKm ? "ការវាយតម្លៃការត្រៀមខ្លួនសម្រាប់អាជីព" : "Career-readiness self-assessment"}</h3>
              <div style={{ padding: "14px 0" }}>
                <svg viewBox="0 0 240 240" style={{ width: "100%", maxWidth: "280px", display: "block", margin: "auto" }}>
                  {/* Concentric Polygons */}
                  {[0.25, 0.5, 0.75, 1.0].map((scale) => {
                    const c = 120;
                    const R = 85 * scale;
                    const pts = radarLabels.map((_, i) => {
                      const a = -Math.PI / 2 + (i * 2 * Math.PI) / radarLabels.length;
                      return `${(c + R * Math.cos(a)).toFixed(1)},${(c + R * Math.sin(a)).toFixed(1)}`;
                    });
                    return (
                      <polygon
                        key={scale}
                        fill="none"
                        stroke="currentColor"
                        strokeOpacity="0.15"
                        points={pts.join(" ")}
                      />
                    );
                  })}

                  {/* Axes & Axis Labels */}
                  {radarLabels.map((lbl, i) => {
                    const c = 120;
                    const a = -Math.PI / 2 + (i * 2 * Math.PI) / radarLabels.length;
                    const ex = c + 85 * Math.cos(a);
                    const ey = c + 85 * Math.sin(a);
                    const lx = c + 102 * Math.cos(a);
                    const ly = c + 102 * Math.sin(a);
                    return (
                      <g key={lbl}>
                        <line
                          x1={c}
                          y1={c}
                          x2={ex}
                          y2={ey}
                          stroke="currentColor"
                          strokeOpacity="0.15"
                        />
                        <text
                          x={lx}
                          y={ly}
                          fontSize="9"
                          textAnchor="middle"
                          fill="currentColor"
                          opacity="0.8"
                        >
                          {lbl}
                        </text>
                      </g>
                    );
                  })}

                  <defs>
                    <linearGradient id="careerRadarGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#3B6BFF" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#14B8A6" stopOpacity="0.35" />
                    </linearGradient>
                  </defs>

                  {/* Data Polygon */}
                  <polygon
                    fill="url(#careerRadarGrad)"
                    stroke="#3B6BFF"
                    strokeWidth="2.5"
                    points={renderRadarPolygon()}
                  />

                  {/* Glowing Vertex Nodes */}
                  {radarPoints.map(([px, py], i) => (
                    <g key={i}>
                      <circle cx={px} cy={py} r="6" fill="rgba(59, 107, 255, 0.35)" />
                      <circle cx={px} cy={py} r="3.5" fill="#3B6BFF" stroke="#ffffff" strokeWidth="1.5" />
                    </g>
                  ))}
                </svg>
              </div>

              <div className="row">
                <Link to="/career" className="btn btn-primary">
                  {isKm ? "ធ្វើការវាយតម្លៃ" : "Take the assessment"}
                </Link>
                <span className="muted sm">3 attempts · Average 80%</span>
              </div>
            </div>
          </div>

          <div style={{ textAlign: "center" }}>
            <Link to="/career" className="section-more-link">
              <span>{isKm ? "បើកផ្ទាំងគ្រប់គ្រងអាជីពពេញលេញ" : "Open full career dashboard"}</span>
              <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* ====================================================================
          9. INTERNSHIPS (APPLY WITH PDF CV)
          ==================================================================== */}
      <section id="jobs">
        <div className="container">
          <div className="sec-title reveal">
            <div className="ios-section-eyebrow eyebrow-teal">
              <span className="ios-eyebrow-dot" />
              <span>{isKm ? "ឱកាសការងារ & កម្មសិក្សាពិត" : "VERIFIED INTERNSHIPS"}</span>
            </div>
            <h2>{isKm ? "កម្មសិក្សា" : "Internships"}</h2>
            <p>
              {isKm
                ? "ដាក់ពាក្យជាមួយ CV ជា PDF និងតាមដានស្ថានភាព"
                : "Apply with a PDF CV and track the status"}
            </p>
          </div>

          <div className="courses-search-capsule glass reveal" style={{ maxWidth: "480px" }}>
            <FiSearch className="courses-search-icon" />
            <input
              type="search"
              placeholder={isKm ? "ស្វែងរកកម្មសិក្សា ឬក្រុមហ៊ុន..." : "Search internships or companies..."}
              value={jobSearch}
              onChange={(e) => setJobSearch(e.target.value)}
            />
            {jobSearch && (
              <button
                type="button"
                className="courses-search-clear"
                onClick={() => setJobSearch("")}
                aria-label={isKm ? "សម្អាត" : "Clear search"}
              >
                <FiX />
              </button>
            )}
          </div>

          <div className="bar-filters reveal">
            <div className="seg glass">
              {["All", "Remote", "Hybrid", "On-site"].map((type) => (
                <button
                  key={type}
                  type="button"
                  className={jobType === type ? "on" : ""}
                  onClick={() => setJobType(type)}
                >
                  {type === "All" ? (isKm ? "ទាំងអស់" : "All Types") : type}
                </button>
              ))}
            </div>
          </div>

          <div className="grid g3 reveal">
            {filteredJobs.map((j) => (
              <TiltCard key={j.id} className="card glass tilt internship-card">
                <div className="flex" style={{ justifyContent: "space-between", marginBottom: "8px" }}>
                  <span className="badge b-level b-level-intermediate">{j.type}</span>
                  <span className="badge b-open">
                    <span className="free-dot" /> {isKm ? "បើកទទួល" : "Open"}
                  </span>
                </div>

                <h3 className="internship-title">{isKm ? j.titleKm : j.titleEn}</h3>

                <div className="internship-meta-box">
                  <div className="company-line">
                    <span className="company-icon"><FiBriefcase /></span>
                    <strong>{j.company}</strong>
                    {j.verified && <FiCheckCircle className="verified-check-inline" title={isKm ? "ក្រុមហ៊ុនបានផ្ទៀងផ្ទាត់" : "Verified partner"} />}
                    <span className="location-tag">· {isKm ? j.locationKm : j.locationEn}</span>
                  </div>
                  <div className="internship-perks-row">
                    <span className="stipend-pill">
                      <FiDollarSign className="stipend-icon" /> {j.stipend}
                    </span>
                    <span className="openings-pill">
                      <FiUsers className="meta-inline-icon" /> {j.openings} {isKm ? "កន្លែង" : "openings"}
                    </span>
                  </div>
                  <div className="deadline-line">
                    <FiClock className="meta-inline-icon" /> {isKm ? "ផុតកំណត់" : "Deadline"}: <strong>{isKm ? j.deadlineKm : j.deadlineEn}</strong>
                  </div>
                </div>

                <div className="row internship-actions-row" style={{ marginTop: "auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <Link to="/jobs" className="btn btn-soft btn-sm" style={{ width: "100%", justifyContent: "center" }}>
                    {isKm ? "ព័ត៌មានលម្អិត" : "Details"}
                  </Link>
                  <Link to="/jobs" className="btn btn-primary btn-sm" style={{ width: "100%", justifyContent: "center" }}>
                    {isKm ? "ដាក់ពាក្យ (PDF)" : "Apply with CV"}
                  </Link>
                </div>
              </TiltCard>
            ))}
          </div>

          <div style={{ textAlign: "center" }}>
            <Link to="/jobs" className="section-more-link">
              <span>{isKm ? "មើលកម្មសិក្សាទាំងអស់ & កន្លែងជ្រើសរើសបុគ្គលិក" : "View all internships & recruiter workspace"}</span>
              <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* ====================================================================
          10. COMMUNITY FORUM
          ==================================================================== */}
      <section id="forum">
        <div className="container" style={{ maxWidth: "860px" }}>
          <div className="sec-title reveal">
            <div className="ios-section-eyebrow eyebrow-cyan">
              <span className="ios-eyebrow-dot" />
              <span>{isKm ? "សហគមន៍ចែករំលែកចំណេះដឹង" : "COMMUNITY FORUM"}</span>
            </div>
            <h2>{isKm ? "ហ្វូរ៉ុមសហគមន៍" : "Community forum"}</h2>
            <p>{isKm ? "សួរ ឆ្លើយ និងចែករំលែកចំណេះដឹង" : "Ask, answer and share knowledge"}</p>
          </div>

          <div className="bar-filters reveal">
            <div className="seg glass">
              {["All", "Programming", "Design", "Career"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={forumCat === cat ? "on" : ""}
                  onClick={() => setForumCat(cat)}
                >
                  {cat === "All" ? (isKm ? "ទាំងអស់" : "All") : cat}
                </button>
              ))}
            </div>
          </div>

          <div className="forum-controls-row reveal">
            <div className="courses-search-capsule glass" style={{ maxWidth: "520px", margin: 0, flex: 1 }}>
              <FiSearch className="courses-search-icon" />
              <input
                type="search"
                placeholder={isKm ? "ស្វែងរកសំណួរ ឬប្រធានបទ..." : "Search questions or topics..."}
                value={forumSearch}
                onChange={(e) => setForumSearch(e.target.value)}
              />
              {forumSearch && (
                <button
                  type="button"
                  className="courses-search-clear"
                  onClick={() => setForumSearch("")}
                  aria-label={isKm ? "សម្អាត" : "Clear search"}
                >
                  <FiX />
                </button>
              )}
            </div>
            <Link to="/forum" className="btn btn-primary forum-ask-btn">
              <FiPlus />
              <span>{isKm ? "សួរសំណួរថ្មី" : "Ask question"}</span>
            </Link>
          </div>

          <div className="grid reveal">
            {filteredForum.map((post) => (
              <TiltCard key={post.id} className="card glass tilt forum-post-card">
                <div className="flex" style={{ justifyContent: "space-between", marginBottom: "8px" }}>
                  <span className="badge b-level b-level-beginner">{post.cat}</span>
                  {post.isAnswered ? (
                    <span className="badge b-approved">
                      <FiCheckCircle /> {isKm ? "បានឆ្លើយរួច" : "Solved"}
                    </span>
                  ) : (
                    <span className="badge b-open">
                      {isKm ? "កំពុងបើកពិភាក្សា" : "Open discussion"}
                    </span>
                  )}
                </div>

                <h3 className="forum-card-title">{isKm ? post.titleKm : post.titleEn}</h3>
                <p className="muted forum-card-body" style={{ margin: "6px 0 14px", lineHeight: 1.6 }}>
                  {isKm ? post.bodyKm : post.bodyEn}
                </p>

                <div className="row forum-card-footer" style={{ marginTop: "auto" }}>
                  <div className="forum-author-meta">
                    <span className="forum-author-avatar">{post.author.charAt(0)}</span>
                    <span className="forum-author-name">{post.author}</span>
                    <span className="meta-bullet">·</span>
                    <span className="forum-metric"><FiMessageSquare className="meta-inline-icon" /> {post.answers} {isKm ? "ចម្លើយ" : "answers"}</span>
                    <span className="meta-bullet">·</span>
                    <span className="forum-metric"><FiThumbsUp className="meta-inline-icon" /> {post.likes}</span>
                  </div>
                  <Link to={`/forum/${post.id}`} className="btn btn-soft btn-sm forum-read-btn">
                    <span>{isKm ? "បើកពិភាក្សា" : "Join discussion"}</span>
                    <FiArrowRight className="btn-arrow-icon" />
                  </Link>
                </div>
              </TiltCard>
            ))}
          </div>

          <div style={{ textAlign: "center" }}>
            <Link to="/forum" className="section-more-link">
              <span>{isKm ? "ស្វែងយល់ហ្វូរ៉ុមសហគមន៍ទាំងមូល" : "Explore full community forum"}</span>
              <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* ====================================================================
          11. COMMUNITY HUB (MESSAGES, NOTIFICATIONS, PLATFORM SNAPSHOT)
          ==================================================================== */}
      <section id="community">
        <div className="container">
          <div className="sec-title reveal">
            <div className="ios-section-eyebrow eyebrow-blue">
              <span className="ios-eyebrow-dot" />
              <span>{isKm ? "មជ្ឈមណ្ឌលសហគមន៍ & ស្ថិតិ" : "COMMUNITY HUB"}</span>
            </div>
            <h2>{isKm ? "មជ្ឈមណ្ឌលសហគមន៍" : "Community hub"}</h2>
            <p>
              {isKm
                ? "សារ ការជូនដំណឹង និងរបាយការណ៍វេទិកា"
                : "Messages, notifications and platform reports"}
            </p>
          </div>

          <div className="grid g3 reveal">
            {/* Card 1: Messages */}
            <div className="card glass">
              <h3 className="hub-card-title"><FiMessageCircle className="card-title-icon" /> {isKm ? "សារ" : "Messages"}</h3>
              <p className="muted">
                {user
                  ? isKm
                    ? "ចូលទៅកាន់ប្រអប់សារ និងក្រុមសិក្សា"
                    : "Access study groups and direct chats"
                  : isKm
                    ? "ចូលគណនីដើម្បីជជែក"
                    : "Sign in to chat"}
              </p>
              <div className="row">
                <span />
                <Link to={user ? "/messages" : "/login"} className="btn btn-primary btn-sm">
                  {isKm ? "បើក" : "Open"}
                </Link>
              </div>
            </div>

            {/* Card 2: Notifications */}
            <div className="card glass">
              <h3 className="hub-card-title"><FiBell className="card-title-icon" /> {isKm ? "ការជូនដំណឹង" : "Notifications"}</h3>
              <div className="muted sm" style={{ margin: "10px 0" }}>
                <div>● {isKm ? "សូមស្វាគមន៍មកកាន់ Smart Community!" : "Welcome to Smart Community!"}</div>
                <div style={{ marginTop: "4px" }}>
                  ● {isKm ? "វគ្គសិក្សា Web Development មានការអាប់ដេតថ្មី" : "Web Development curriculum updated"}
                </div>
              </div>
              <div className="row">
                <span />
                <Link to={user ? "/notifications" : "/login"} className="btn btn-primary btn-sm">
                  {isKm ? "បើក" : "Open"}
                </Link>
              </div>
            </div>

            {/* Card 3: Platform Snapshot */}
            <div className="card glass">
              <h3 className="hub-card-title"><FiBarChart2 className="card-title-icon" /> {isKm ? "ស្ថិតិវេទិកា" : "Platform snapshot"}</h3>
              <div className="bars">
                <div className="b">
                  <span style={{ width: "96px" }}>{isKm ? "អ្នកសិក្សា" : "Students"}</span>
                  <i style={{ width: "65%", background: "var(--blue)" }} />
                  <b>1,280</b>
                </div>
                <div className="b">
                  <span style={{ width: "96px" }}>{isKm ? "អ្នកណែនាំ" : "Mentors"}</span>
                  <i style={{ width: "25%", background: "var(--gold)" }} />
                  <b>34</b>
                </div>
                <div className="b">
                  <span style={{ width: "96px" }}>{isKm ? "អ្នកជ្រើសរើស" : "Recruiters"}</span>
                  <i style={{ width: "18%", background: "var(--teal)" }} />
                  <b>18</b>
                </div>
                <div className="b">
                  <span style={{ width: "96px" }}>{isKm ? "ពាក្យសុំ" : "Applications"}</span>
                  <i style={{ width: "42%", background: "#8b5cf6" }} />
                  <b>94</b>
                </div>
              </div>
              {user?.role === "admin" && (
                <div className="row">
                  <span />
                  <Link to="/admin" className="btn btn-primary btn-sm">
                    {isKm ? "ផ្ទាំងអ្នកគ្រប់គ្រង" : "Admin panel"}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          12. FAQ ACCORDION
          ==================================================================== */}
      <section id="faq">
        <div className="container" style={{ maxWidth: "760px" }}>
          <div className="sec-title reveal">
            <div className="ios-section-eyebrow eyebrow-sky">
              <span className="ios-eyebrow-dot" />
              <span>{isKm ? "សំណួរ & ចម្លើយទូទៅ" : "HELP & FAQ"}</span>
            </div>
            <h2>FAQ</h2>
            <p>{isKm ? "សំណួរដែលសួរញឹកញាប់" : "Frequently asked questions"}</p>
          </div>

          <details className="glass">
            <summary>{isKm ? "តើវាឥតគិតថ្លៃទេ?" : "Is it free?"}</summary>
            <p className="muted">
              {isKm
                ? "មានវគ្គឥតគិតថ្លៃ និងវគ្គបង់ប្រាក់តាម Bakong KHQR។ អ្នកអាចមើលមេរៀនសាកល្បងដោយសេរីមុននឹងសម្រេចចិត្តចូលរៀន។"
                : "There are free courses and paid courses via Bakong KHQR. You can preview free sample lessons before enrolling."}
            </p>
          </details>

          <details className="glass">
            <summary>{isKm ? "តើខ្ញុំអាចក្លាយជាអ្នកណែនាំបានទេ?" : "Can I become a mentor?"}</summary>
            <p className="muted">
              {isKm
                ? "អ្នកអាចដាក់ពាក្យតាមទម្រង់ Become a mentor ហើយរង់ចាំអ្នកគ្រប់គ្រងប្រព័ន្ធពិនិត្យ និងអនុម័តគណនីរបស់អ្នក។"
                : "You can submit an application via the Become a Mentor form. An administrator will review your background and activate your mentor credentials."}
            </p>
          </details>

          <details className="glass">
            <summary>{isKm ? "តើការបង់ប្រាក់ Bakong KHQR ដំណើរការយ៉ាងដូចម្តេច?" : "How does Bakong KHQR payment work?"}</summary>
            <p className="muted">
              {isKm
                ? "ស្កេនកូដ Bakong KHQR ពីកម្មវិធីធនាគារណាមួយនៅកម្ពុជា (ដូចជា ABA, Wing, ឬ ACLEDA) រួចប្រព័ន្ធនឹងផ្ទៀងផ្ទាត់ដោយស្វ័យប្រវត្តិក្នុងរយៈពេលប៉ុន្មានវិនាទី។"
                : "Scan the dynamic Bakong KHQR with any Cambodian banking app (ABA, Wing, ACLEDA, etc.), and your course unlocks automatically within seconds."}
            </p>
          </details>

          <details className="glass">
            <summary>{isKm ? "តើមានការធានាការងារទេ?" : "Does it guarantee a job?"}</summary>
            <p className="muted">
              {isKm
                ? "មិនមានការធានាការងារដោយស្វ័យប្រវត្តិនោះទេ។ វេទិកានេះគាំទ្រការរៀន ជួបអ្នកណែនាំ និងភ្ជាប់អ្នកដោយផ្ទាល់ជាមួយឱកាសកម្មសិក្សារបស់ក្រុមហ៊ុនដៃគូ។"
                : "No. The platform supports structured learning, mentorship, and directs you to verified internship opportunities, but hiring decisions remain with the companies."}
            </p>
          </details>
        </div>
      </section>

      {/* ====================================================================
          13. CONCENTRIC BLUE DASHES CTA BANNER
          ==================================================================== */}
      <DashBanner />

      {/* ====================================================================
          14. INTERACTIVE YOUTUBE VIDEO PREVIEW MODAL
          ==================================================================== */}
      {selectedVideo && (
        <div
          className="course-video-modal-backdrop"
          onClick={() => setSelectedVideo(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="course-video-modal-card glass"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="course-video-modal-header">
              <div className="course-video-modal-titles">
                <span className="course-video-yt-badge">
                  <FaYoutube /> {isKm ? "វីដេអូសង្ខេប YouTube" : "YouTube Video Preview"}
                </span>
                <h3>{isKm ? selectedVideo.titleKm : selectedVideo.titleEn}</h3>
              </div>
              <button
                type="button"
                className="course-video-modal-close-btn"
                onClick={() => setSelectedVideo(null)}
                aria-label={isKm ? "បិទ" : "Close"}
              >
                <FiX />
              </button>
            </div>

            <div className="course-video-iframe-wrap">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${selectedVideo.youtubeId}?autoplay=1&rel=0`}
                title={isKm ? selectedVideo.titleKm : selectedVideo.titleEn}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="course-video-modal-footer">
              <div className="course-video-meta-summary">
                <span>{selectedVideo.by}</span> · <span>{selectedVideo.lessons} {isKm ? "មេរៀន" : "lessons"}</span> · <span>{selectedVideo.duration}</span>
              </div>
              <div className="course-video-modal-actions">
                <button
                  type="button"
                  className="btn btn-soft"
                  onClick={() => setSelectedVideo(null)}
                >
                  {isKm ? "បិទ" : "Close"}
                </button>
                <Link
                  to={`/courses/${selectedVideo.slug || selectedVideo.id}`}
                  className="btn btn-primary"
                  onClick={() => setSelectedVideo(null)}
                >
                  {selectedVideo.price > 0
                    ? isKm
                      ? `ចូលរៀន ($${selectedVideo.price} Bakong KHQR)`
                      : `Enroll ($${selectedVideo.price} Bakong KHQR)`
                    : isKm
                      ? "ចូលរៀនដោយឥតគិតថ្លៃ"
                      : "Enroll for Free"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
