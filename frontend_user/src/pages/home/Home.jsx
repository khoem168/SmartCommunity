import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaChartBar,
  FaDatabase,
  FaFigma,
  FaGitAlt,
  FaHtml5,
  FaJs,
  FaNodeJs,
  FaPlay,
  FaPython,
  FaReact,
  FaShieldAlt,
  FaStar,
} from "react-icons/fa";
import {
  FiArrowRight,
  FiBookOpen,
  FiBriefcase,
  FiCalendar,
  FiCheck,
  FiClock,
  FiFileText,
  FiMapPin,
  FiPlus,
  FiRepeat,
  FiSearch,
  FiUserCheck,
  FiUsers,
  FiVideo,
} from "react-icons/fi";
import { MdVerified } from "react-icons/md";

import DashBanner from "../../components/ui/DashBanner";
import { useGlobleContext } from "../../context/GlobleContext";
import { useLanguage } from "../../context/LanguageContext";
import { fetchCourses } from "../../services/courseService";
import {
  fetchInternships,
  fetchMentors,
} from "../../services/platformService";

import heangChhengKhoemPhoto from "../../assets/team/heang-chheng-khoem.jpg";
import hornPiseyPhoto from "../../assets/team/horn-pisey.jpg";
import krySoranuthPhoto from "../../assets/team/kry-soranuth.jpg";
import muyKalinPhoto from "../../assets/team/muy-kalin.jpg";
import samrithRatanaPhoto from "../../assets/team/samrith-ratana.jpg";
import "./Home.css";

const TECH_SKILLS = [
  { id: "react", label: "React.js", query: "React", icon: FaReact, color: "#0ea5e9", bg: "rgba(14, 165, 233, 0.12)" },
  { id: "js", label: "JavaScript", query: "JavaScript", icon: FaJs, color: "#eab308", bg: "rgba(234, 179, 8, 0.14)" },
  { id: "html", label: "HTML & CSS", query: "HTML", icon: FaHtml5, color: "#f97316", bg: "rgba(249, 115, 22, 0.12)" },
  { id: "figma", label: "UX/UI Figma", query: "Figma", icon: FaFigma, color: "#ec4899", bg: "rgba(236, 72, 153, 0.12)" },
  { id: "python", label: "Python", query: "Python", icon: FaPython, color: "#2563eb", bg: "rgba(37, 99, 235, 0.12)" },
  { id: "node", label: "Node.js & API", query: "Node", icon: FaNodeJs, color: "#16a34a", bg: "rgba(22, 163, 74, 0.12)" },
  { id: "sql", label: "SQL & MySQL", query: "SQL", icon: FaDatabase, color: "#6366f1", bg: "rgba(99, 102, 241, 0.12)" },
  { id: "cyber", label: "Cybersecurity", query: "Cybersecurity", icon: FaShieldAlt, color: "#0d9488", bg: "rgba(13, 148, 136, 0.12)" },
  { id: "git", label: "Git & GitHub", query: "Git", icon: FaGitAlt, color: "#ea580c", bg: "rgba(234, 88, 12, 0.12)" },
  { id: "data", label: "Data & BI", query: "Data", icon: FaChartBar, color: "#7c3aed", bg: "rgba(124, 58, 237, 0.12)" },
];

const COURSE_CATEGORIES = [
  { id: "All", km: "ទាំងអស់", en: "All Courses" },
  { id: "Technology", km: "បច្ចេកវិទ្យា", en: "Technology" },
  { id: "Design", km: "ការរចនា UX/UI", en: "Design" },
  { id: "Business", km: "ពាណិជ្ជកម្ម", en: "Business" },
  { id: "Career", km: "ត្រៀមអាជីព", en: "Career" },
];

const FALLBACK_COURSES = [
  {
    id: "c1",
    slug: "react-modern-web",
    titleKm: "ការអភិវឌ្ឍគេហទំព័រទំនើបជាមួយ React.js",
    titleEn: "Modern Web Development with React.js",
    descKm: "រៀនបង្កើតគេហទំព័រទំនើប ប្រើប្រាស់ Components, Hooks និងភ្ជាប់ REST API ដោយអនុវត្តផ្ទាល់។",
    descEn: "Build responsive modern web apps using React components, hooks, and real REST APIs.",
    category: "Technology",
    catKm: "បច្ចេកវិទ្យា",
    level: "Beginner",
    levelKm: "កម្រិតដំបូង",
    price: 0,
    lessons: 12,
    duration: "4h 15m",
    topics: ["HTML/CSS", "React Hooks", "REST API"],
    thumbnailUrl: "https://img.youtube.com/vi/mU6anWqZJcc/hqdefault.jpg",
    gradient: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 55%, #38bdf8 100%)",
  },
  {
    id: "c2",
    slug: "ui-ux-design-essentials",
    titleKm: "មូលដ្ឋានគ្រឹះការរចនា UX/UI ក្នុង Figma",
    titleEn: "UX/UI Design Essentials with Figma",
    descKm: "ស្វែងយល់ពីការរៀបចំ Wireframe, Design System និង Interactive Prototype សម្រាប់ Portfolio។",
    descEn: "Master wireframing, clean design systems, and interactive Figma prototypes for your portfolio.",
    category: "Design",
    catKm: "ការរចនា",
    level: "Beginner",
    levelKm: "កម្រិតដំបូង",
    price: 0,
    lessons: 10,
    duration: "3h 45m",
    topics: ["Wireframe", "Figma UI", "Prototype"],
    thumbnailUrl: "https://img.youtube.com/vi/FTFaQWZBqQ8/hqdefault.jpg",
    gradient: "linear-gradient(135deg, #831843 0%, #db2777 55%, #f472b6 100%)",
  },
  {
    id: "c3",
    slug: "python-data-foundations",
    titleKm: "ការសរសេរកូដ Python និងវិភាគទិន្នន័យ",
    titleEn: "Python Programming & Data Foundations",
    descKm: "ចាប់ផ្តើមពីមូលដ្ឋានគ្រឹះ Python រហូតដល់ការរៀបចំ និងវិភាគទិន្នន័យជាមួយ Pandas និង SQL។",
    descEn: "Progress from Python syntax fundamentals to practical data cleaning and analysis workflows.",
    category: "Technology",
    catKm: "បច្ចេកវិទ្យា",
    level: "Intermediate",
    levelKm: "កម្រិតមធ្យម",
    price: 15,
    lessons: 14,
    duration: "5h 20m",
    topics: ["Python 3", "Pandas", "Data Charts"],
    thumbnailUrl: "https://img.youtube.com/vi/_uQrJ0TkZlc/hqdefault.jpg",
    gradient: "linear-gradient(135deg, #064e3b 0%, #059669 55%, #34d399 100%)",
  },
  {
    id: "c4",
    slug: "sql-database-analysis",
    titleKm: "ការគ្រប់គ្រងទិន្នន័យជាមួយ SQL & Power BI",
    titleEn: "Data Querying with SQL & BI Dashboards",
    descKm: "រៀនសរសេរសំណួរ SQL សំខាន់ៗ និងបង្កើតរបាយការណ៍ទិន្នន័យសម្រាប់ការសម្រេចចិត្តអាជីវកម្ម។",
    descEn: "Write clean SQL queries, joins, and build executive visual dashboards from real datasets.",
    category: "Technology",
    catKm: "បច្ចេកវិទ្យា",
    level: "Intermediate",
    levelKm: "កម្រិតមធ្យម",
    price: 18,
    lessons: 9,
    duration: "4h 10m",
    topics: ["MySQL", "SQL Joins", "Power BI"],
    thumbnailUrl: "https://img.youtube.com/vi/r-uOLxNrNk8/hqdefault.jpg",
    gradient: "linear-gradient(135deg, #312e81 0%, #4f46e5 55%, #818cf8 100%)",
  },
  {
    id: "c5",
    slug: "digital-marketing-growth",
    titleKm: "យុទ្ធសាស្ត្រទីផ្សារឌីជីថល និងមាតិកាអាជីវកម្ម",
    titleEn: "Digital Marketing & Content Strategy",
    descKm: "រៀនរៀបចំយុទ្ធនាការផ្សព្វផ្សាយ SEO និងវាស់វែងលទ្ធផលអាជីវកម្មលើប្រព័ន្ធឌីជីថល។",
    descEn: "Plan high-converting social campaigns, SEO fundamentals, and practical analytics tracking.",
    category: "Business",
    catKm: "ពាណិជ្ជកម្ម",
    level: "Beginner",
    levelKm: "កម្រិតដំបូង",
    price: 0,
    lessons: 8,
    duration: "3h 30m",
    topics: ["SEO Basics", "Content Plan", "Analytics"],
    thumbnailUrl: "https://img.youtube.com/vi/bixR-KIJKYM/hqdefault.jpg",
    gradient: "linear-gradient(135deg, #7c2d12 0%, #ea580c 55%, #fb923c 100%)",
  },
  {
    id: "c6",
    slug: "git-github-collaboration",
    titleKm: "Git, GitHub និងការត្រៀមសម្ភាសន៍ការងារ IT",
    titleEn: "Git, GitHub & Technical Interview Prep",
    descKm: "ស្ទាត់ជំនាញធ្វើការងារជាក្រុមលើ GitHub រៀបចំ CV បច្ចេកទេស និងត្រៀមឆ្លើយសំណួរសម្ភាសន៍។",
    descEn: "Collaborate cleanly with Git branches, polish your GitHub profile, and ace tech interviews.",
    category: "Career",
    catKm: "ត្រៀមអាជីព",
    level: "Beginner",
    levelKm: "កម្រិតដំបូង",
    price: 0,
    lessons: 8,
    duration: "2h 50m",
    topics: ["Git Flow", "GitHub PR", "Mock Interview"],
    thumbnailUrl: "https://img.youtube.com/vi/1qw5ITr3k9E/hqdefault.jpg",
    gradient: "linear-gradient(135deg, #0f172a 0%, #334155 55%, #64748b 100%)",
  },
];

const ROADMAP_TRACKS = [
  {
    id: "web",
    labelKm: "អ្នកអភិវឌ្ឍគេហទំព័រ",
    labelEn: "Web Developer",
    stages: [
      {
        step: "01",
        titleKm: "រៀនមូលដ្ឋានគ្រឹះកូដ និងបង្កើតគម្រោង Web",
        titleEn: "Master Core Web Skills & Projects",
        descKm: "ចាប់ផ្តើមពី HTML, CSS, JavaScript (ES6+) និងបង្កើតគេហទំព័រ React.js ពេញលេញ។",
        descEn: "Learn responsive HTML/CSS, modern JavaScript, and build real React.js applications.",
        tags: ["HTML & CSS", "JavaScript ES6+", "React.js", "Git & GitHub"],
        ctaKm: "មើលមេរៀន Web",
        ctaEn: "Explore Web Courses",
        to: "/courses",
      },
      {
        step: "02",
        titleKm: "អនុវត្តប្តូរជំនាញ និងពិនិត្យកូដជាមួយអ្នកណែនាំ 1:1",
        titleEn: "Practice via Skill Swap & 1:1 Code Review",
        descKm: "ផ្លាស់ប្តូរចំណេះដឹងជាមួយមិត្តរួមជំនាញ និងស្នើសុំមតិកែលម្អលើស្នាដៃពីរៀមច្បងជំនាញ។",
        descEn: "Pair up with peers to exchange skills and book 1:1 mentor reviews on your portfolio code.",
        tags: ["Peer Skill Swap", "1:1 Code Review", "Live Q&A Session"],
        ctaKm: "ជួបអ្នកណែនាំជំនាញ",
        ctaEn: "Connect with Mentors",
        to: "/mentorship",
      },
      {
        step: "03",
        titleKm: "បង្កើត PDF CV ក្នុង CV Studio និងដាក់ពាក្យការងារ",
        titleEn: "Export PDF in CV Studio & Apply for Internships",
        descKm: "ទាញយកព័ត៌មានជំនាញបង្កើតជា PDF CV ស្តង់ដារ ហើយដាក់ពាក្យចូលក្រុមហ៊ុនដែលបានផ្ទៀងផ្ទាត់។",
        descEn: "Generate a clean ATS-friendly PDF resume in CV Studio and apply directly to verified jobs.",
        tags: ["Minimal CV Studio", "Portfolio Link", "Verified Internships"],
        ctaKm: "បើក CV Studio",
        ctaEn: "Open CV Studio",
        to: "/cv-studio",
      },
    ],
  },
  {
    id: "uiux",
    labelKm: "អ្នករចនា UX/UI",
    labelEn: "UX/UI Designer",
    stages: [
      {
        step: "01",
        titleKm: "រៀន Design Thinking និងការរចនាក្នុង Figma",
        titleEn: "Learn Design Thinking & Figma Prototyping",
        descKm: "យល់ច្បាស់ពី User Flow, Typography, Color Hierarchy និងការរៀបចំ Component System។",
        descEn: "Build strong foundations in user flows, visual hierarchy, and reusable Figma components.",
        tags: ["User Research", "Wireframing", "Figma Components", "Prototyping"],
        ctaKm: "មើលមេរៀន UX/UI",
        ctaEn: "Explore Design Courses",
        to: "/courses",
      },
      {
        step: "02",
        titleKm: "បង្កើត Case Study និងទទួលមតិកែលម្អពីអ្នកណែនាំ",
        titleEn: "Critique Case Studies with Design Mentors",
        descKm: "ចូលរួមសិក្ខាសាលាពិនិត្យ Portfolio និងប្តូរជំនាញរចនាជាមួយនិស្សិតផ្នែកកូដ។",
        descEn: "Swap UI design help for coding help and polish 2 end-to-end UX case studies with mentors.",
        tags: ["UX Case Study", "Design Critique", "Design-Dev Swap"],
        ctaKm: "ចូលរួមសិក្ខាសាលា",
        ctaEn: "Join Live Workshops",
        to: "/sessions",
      },
      {
        step: "03",
        titleKm: "រៀបចំ CV & Portfolio ដាក់ពាក្យកម្មសិក្សា Design",
        titleEn: "Publish Design CV & Apply to Studios",
        descKm: "ភ្ជាប់តំណភ្ជាប់ Figma Portfolio ទៅក្នុង PDF CV និងតាមដានស្ថានភាពដាក់ពាក្យការងារ។",
        descEn: "Attach your Figma case studies in CV Studio and apply to verified UX/UI internships.",
        tags: ["PDF CV Export", "Case Study Links", "Application Tracker"],
        ctaKm: "មើលឱកាសការងារ",
        ctaEn: "Browse Design Jobs",
        to: "/jobs",
      },
    ],
  },
  {
    id: "backend",
    labelKm: "Backend & API",
    labelEn: "Backend & API",
    stages: [
      {
        step: "01",
        titleKm: "ស្ទាត់ជំនាញ Node.js, Express និង MySQL Database",
        titleEn: "Build Secure REST APIs & Relational Schemas",
        descKm: "រៀនរចនា Database Schema, JWT Authentication និងការបង្កើត API ដែលមានសុវត្ថិភាព។",
        descEn: "Design normalized MySQL schemas, JWT auth middlewares, and clean RESTful endpoints.",
        tags: ["Node.js & Express", "MySQL Schema", "JWT Security", "API Testing"],
        ctaKm: "រៀនជំនាញ Backend",
        ctaEn: "Start Backend Path",
        to: "/courses",
      },
      {
        step: "02",
        titleKm: "សហការបង្កើតគម្រោង Full-Stack ជាមួយមិត្តរួមក្រុម",
        titleEn: "Pair with Frontend Peers on Full-Stack Apps",
        descKm: "សហការជាមួយអ្នករៀន Frontend ក្នុងប្រព័ន្ធ Skill Swap ដើម្បីភ្ជាប់ API ទៅកាន់ UI ពិត។",
        descEn: "Match with frontend learners via Skill Exchange to ship complete full-stack portfolio apps.",
        tags: ["API Integration", "GitHub PRs", "Mentor Architecture Review"],
        ctaKm: "ស្វែងរកដៃគូសហការ",
        ctaEn: "Find Skill Partners",
        to: "/skill-exchange",
      },
      {
        step: "03",
        titleKm: "ដាក់ពាក្យកម្មសិក្សាផ្នែក Software Engineering",
        titleEn: "Apply for Junior Backend & Full-Stack Roles",
        descKm: "បង្ហាញគម្រោង API និង GitHub នៅក្នុង CV Studio ដើម្បីដាក់ពាក្យទៅកាន់ក្រុមហ៊ុនបច្ចេកវិទ្យា។",
        descEn: "Showcase your GitHub repositories in CV Studio and apply to software engineering openings.",
        tags: ["Technical CV", "GitHub Showcase", "Direct ATS Apply"],
        ctaKm: "ដាក់ពាក្យការងារ",
        ctaEn: "View Tech Openings",
        to: "/jobs",
      },
    ],
  },
  {
    id: "cyber",
    labelKm: "សន្តិសុខសាយប័រ & IT Audit",
    labelEn: "Cybersecurity & IT Audit",
    stages: [
      {
        step: "01",
        titleKm: "មូលដ្ឋានគ្រឹះ Network, Linux និងសុវត្ថិភាពប្រព័ន្ធ",
        titleEn: "Learn Networking, Linux & Security Controls",
        descKm: "សិក្សាពីដំណើរការ TCP/IP, ការគ្រប់គ្រងសិទ្ធិប្រព័ន្ធ Linux និងគោលការណ៍ IT Governance (ITGC)។",
        descEn: "Understand network protocols, Linux administration, OWASP basics, and ITGC audit controls.",
        tags: ["Computer Networks", "Linux CLI", "OWASP Top 10", "ITGC Controls"],
        ctaKm: "ស្វែងរកមេរៀន",
        ctaEn: "Search Security Topics",
        to: "/search?q=Cybersecurity",
      },
      {
        step: "02",
        titleKm: "ពិភាក្សាផ្ទាល់ជាមួយអ្នកជំនាញ IT Audit & Cyber Risk",
        titleEn: "1:1 Guidance from IT Audit & Security Mentors",
        descKm: "រៀនពីបទពិសោធន៍ការងារពិតក្នុងវិស័យធនាគារ និងហិរញ្ញវត្ថុពីអ្នកណែនាំជំនាញរបស់យើង។",
        descEn: "Get practical career advice from active IT Audit and Cyber Risk mentors in Cambodia.",
        tags: ["Risk Assessment", "Security Labs", "1:1 Career Advice"],
        ctaKm: "មើលអ្នកណែនាំ IT Audit",
        ctaEn: "Meet Security Mentors",
        to: "/mentorship",
      },
      {
        step: "03",
        titleKm: "ត្រៀម CV សម្រាប់ការងារ IT Support, Network & Audit",
        titleEn: "Launch Your IT Security & Audit Career",
        descKm: "រៀបចំប្រវត្តិរូបជំនាញបច្ចេកទេសច្បាស់លាស់ និងដាក់ពាក្យចូលស្ថាប័នហិរញ្ញវត្ថុ និងបច្ចេកវិទ្យា។",
        descEn: "Highlight security labs and certifications in CV Studio for bank and enterprise IT roles.",
        tags: ["CV Studio PDF", "Interview Readiness", "Enterprise IT Jobs"],
        ctaKm: "មើលផែនទីអាជីព",
        ctaEn: "Full Career Guide",
        to: "/career",
      },
    ],
  },
  {
    id: "data",
    labelKm: "ទិន្នន័យ & Python",
    labelEn: "Data & Python",
    stages: [
      {
        step: "01",
        titleKm: "រៀន Excel កម្រិតខ្ពស់, SQL និង Python Pandas",
        titleEn: "Master SQL Queries, Spreadsheets & Python",
        descKm: "ចេះទាញយក សម្អាត និងវិភាគទិន្នន័យចេញពី Database ដោយប្រើ SQL និង Python។",
        descEn: "Clean, join, and analyze structured datasets using SQL, Python Pandas, and spreadsheets.",
        tags: ["SQL Queries", "Python Pandas", "Data Cleaning", "Power BI"],
        ctaKm: "មើលមេរៀន Data",
        ctaEn: "Explore Data Courses",
        to: "/courses",
      },
      {
        step: "02",
        titleKm: "បង្កើតគម្រោង Dashboard និងពិភាក្សាក្នុងសហគមន៍",
        titleEn: "Build Storytelling Dashboards with Mentor Feedback",
        descKm: "បង្កើតរបាយការណ៍វិភាគទិន្នន័យជាក់ស្តែង និងចែករំលែកដើម្បីទទួលមតិកែលម្អក្នុងវេទិកាសហគមន៍។",
        descEn: "Publish interactive BI dashboards and refine your data storytelling with mentors.",
        tags: ["BI Dashboard", "Community Q&A", "Portfolio Report"],
        ctaKm: "ចូលវេទិកាសហគមន៍",
        ctaEn: "Visit Community Forum",
        to: "/forum",
      },
      {
        step: "03",
        titleKm: "ដាក់ពាក្យកម្មសិក្សាផ្នែក Data Analyst & BI",
        titleEn: "Apply for Data Analyst Internships",
        descKm: "បញ្ចូលស្នាដៃវិភាគទិន្នន័យទៅក្នុង PDF CV ហើយដាក់ពាក្យទៅកាន់ក្រុមហ៊ុនដៃគូដោយផ្ទាល់។",
        descEn: "Export your tailored Data Analyst CV and apply to verified local and remote openings.",
        tags: ["Data Portfolio CV", "Verified Employers", "1-Click Apply"],
        ctaKm: "មើលការងារ Data",
        ctaEn: "Browse Data Jobs",
        to: "/jobs",
      },
    ],
  },
];

const TEAM_MENTORS = [
  {
    slug: "muy-kalin",
    name: "MUY KALIN",
    roleKm: "អ្នកអភិវឌ្ឍ Full-Stack & Frontend",
    roleEn: "Full-Stack & Frontend Developer",
    org: "Cambodian Mekong University",
    avatar: muyKalinPhoto,
    rating: "4.9",
    skills: ["React.js", "Node.js", "MySQL"],
  },
  {
    slug: "horn-pisey",
    name: "HORN PISEY",
    roleKm: "សវនកម្ម IT និងហានិភ័យប្រព័ន្ធ",
    roleEn: "IT Audit & Cyber Risk Specialist",
    org: "Camma Microfinance Limited",
    avatar: hornPiseyPhoto,
    rating: "4.9",
    skills: ["IT Audit", "Cyber Risk", "Power BI"],
  },
  {
    slug: "kry-soranuth",
    name: "KRY SORANUTH",
    roleKm: "សន្តិសុខបណ្តាញ និងមូលដ្ឋាន Network",
    roleEn: "Cybersecurity & Network Specialist",
    org: "Cambodian Mekong University",
    avatar: krySoranuthPhoto,
    rating: "4.9",
    skills: ["Cybersecurity", "Linux", "Python"],
  },
  {
    slug: "samrith-ratana",
    name: "SAMRITH RATANA",
    roleKm: "គាំទ្របច្ចេកទេស និងគណនី B2B",
    roleEn: "B2B Account & Technical Support",
    org: "Viettel (Cambodia) PTE. LTD.",
    avatar: samrithRatanaPhoto,
    rating: "4.8",
    skills: ["B2B Support", "IT Setup", "Client Care"],
  },
  {
    slug: "heang-chheng-khoem",
    name: "HEANG CHHENGKHOEM",
    roleKm: "ទីផ្សារឌីជីថល និងគាំទ្រប្រព័ន្ធ IT",
    roleEn: "Digital Marketing & IT Support",
    org: "888 UP FAST CASH",
    avatar: heangChhengKhoemPhoto,
    rating: "4.9",
    skills: ["Digital Marketing", "SEO", "IT Support"],
  },
];

const PEER_SWAPS = [
  {
    id: "sw1",
    name: "Vanna Sok",
    roleKm: "និស្សិតឆ្នាំទី 3 ផ្នែក Computer Science",
    roleEn: "Year 3 CS Student",
    match: "94%",
    avatar: "VS",
    color: "#2563eb",
    teaches: ["JavaScript", "React.js"],
    wants: ["UX/UI Figma", "English"],
  },
  {
    id: "sw2",
    name: "Rina Chan",
    roleKm: "អ្នករចនាផលិតផលឌីជីថលវ័យក្មេង",
    roleEn: "Junior Product Designer",
    match: "91%",
    avatar: "RC",
    color: "#db2777",
    teaches: ["Figma UI", "Design System"],
    wants: ["HTML & CSS", "React Basics"],
  },
  {
    id: "sw3",
    name: "Dara Meas",
    roleKm: "និស្សិតផ្នែក Data & Business Analytics",
    roleEn: "Data Analytics Student",
    match: "89%",
    avatar: "DM",
    color: "#059669",
    teaches: ["SQL Queries", "Power BI"],
    wants: ["Python API", "GitHub"],
  },
];

const LIVE_SESSIONS = [
  {
    id: "ls1",
    titleKm: "វគ្គសំណួរ-ចម្លើយផ្ទាល់៖ ចាប់ផ្តើមបង្កើតគម្រោង React.js",
    titleEn: "Live Q&A: Building Your First React.js Project",
    host: "MUY KALIN",
    scheduleKm: "រៀងរាល់សប្តាហ៍ · 7:00 យប់ (60 នាទី)",
    scheduleEn: "Weekly · 7:00 PM (60 min)",
    levelKm: "កម្រិតដំបូង",
    levelEn: "Beginner",
    tags: ["React.js", "Live Coding", "Jitsi Meet"],
  },
  {
    id: "ls2",
    titleKm: "សិក្ខាសាលាពិនិត្យ CV និង UX/UI Portfolio សម្រាប់កម្មសិក្សា",
    titleEn: "CV & UX/UI Portfolio Critique for Internships",
    host: "HORN PISEY",
    scheduleKm: "ថ្ងៃសៅរ៍ · 6:30 ល្ងាច (90 នាទី)",
    scheduleEn: "Saturday · 6:30 PM (90 min)",
    levelKm: "គ្រប់កម្រិត",
    levelEn: "All Levels",
    tags: ["CV Review", "Portfolio", "Interview Tips"],
  },
  {
    id: "ls3",
    titleKm: "មូលដ្ឋានគ្រឹះ Cybersecurity និងសុវត្ថិភាពគណនីឌីជីថល",
    titleEn: "Cybersecurity Essentials & Linux Lab Walkthrough",
    host: "KRY SORANUTH",
    scheduleKm: "ថ្ងៃអាទិត្យ · 8:00 យប់ (60 នាទី)",
    scheduleEn: "Sunday · 8:00 PM (60 min)",
    levelKm: "កម្រិតដំបូង",
    levelEn: "Beginner",
    tags: ["Cybersecurity", "Linux", "Network"],
  },
];

const FALLBACK_INTERNSHIPS = [
  {
    id: "job1",
    titleKm: "កម្មសិក្សាផ្នែក Frontend Web Developer",
    titleEn: "Frontend Web Developer Intern",
    company: "Angkor Tech Solutions",
    locationKm: "ភ្នំពេញ · Hybrid",
    locationEn: "Phnom Penh · Hybrid",
    stipend: "$180/mo",
    type: "Internship",
    verified: true,
    skills: ["React.js", "JavaScript", "Tailwind/CSS"],
  },
  {
    id: "job2",
    titleKm: "កម្មសិក្សាផ្នែក UX/UI Product Design",
    titleEn: "UX/UI Product Design Intern",
    company: "Mekong Digital Studio",
    locationKm: "ភ្នំពេញ · On-site",
    locationEn: "Phnom Penh · On-site",
    stipend: "$150/mo",
    type: "Internship",
    verified: true,
    skills: ["Figma", "Wireframing", "Prototyping"],
  },
  {
    id: "job3",
    titleKm: "កម្មសិក្សាផ្នែក Data & IT Audit Support",
    titleEn: "Data & IT Audit Support Intern",
    company: "Phnom Penh FinTech Hub",
    locationKm: "ពីចម្ងាយ · Remote",
    locationEn: "Cambodia · Remote",
    stipend: "$200/mo",
    type: "Full-Time Intern",
    verified: true,
    skills: ["SQL", "Power BI", "IT Controls"],
  },
];

const FAQ_ITEMS = [
  {
    qKm: "តើខ្ញុំអាចចាប់ផ្តើមរៀននៅលើ Smart Community ដោយឥតគិតថ្លៃបានទេ?",
    qEn: "Can I start learning on Smart Community for free?",
    aKm: "បាទ/ចាស! វេទិកាមានមេរៀនឥតគិតថ្លៃជាច្រើន រួមទាំងប្រព័ន្ធប្តូរជំនាញ (Skill Swap) សិក្ខាសាលាផ្ទាល់ និង Minimal CV Studio។ សម្រាប់វគ្គសិក្សាពិសេស អ្នកអាចទូទាត់តាម Bakong KHQR បានយ៉ាងងាយស្រួល។",
    aEn: "Yes! Many courses, Peer Skill Swap, Live Sessions, Community Forum, and Minimal CV Studio are completely free. Premium courses support instant Bakong KHQR checkout.",
  },
  {
    qKm: "តើមុខងារប្តូរជំនាញ (Peer Skill Swap) ដំណើរការយ៉ាងដូចម្តេច?",
    qEn: "How does Peer Skill Swap work?",
    aKm: "អ្នកគ្រាន់តែកំណត់ជំនាញដែលអ្នកអាចចែករំលែក និងជំនាញដែលអ្នកចង់រៀន។ ប្រព័ន្ធនឹងផ្គូផ្គងដៃគូដែលស័ក្តិសម ដើម្បីឱ្យអ្នកអាចជជែក និងណាត់រៀនជាមួយគ្នាដោយមិនអស់ប្រាក់។",
    aEn: "List the skills you can teach and the skills you want to learn. Smart Community matches you with compatible peers so you can message and schedule study sessions together.",
  },
  {
    qKm: "តើ Minimal CV & Portfolio Studio ជួយអ្វីខ្លះពេលដាក់ពាក្យការងារ?",
    qEn: "How does Minimal CV & Portfolio Studio help with job applications?",
    aKm: "CV Studio ជួយទាញយកព័ត៌មានជំនាញ និងគម្រោងស្នាដៃពីគណនីរបស់អ្នក មករៀបចំជាទម្រង់ CV ស្អាតច្បាស់លាស់ និងអាចបោះពុម្ព ឬរក្សាទុកជា PDF ដើម្បីដាក់ពាក្យចូលកម្មសិក្សាបានភ្លាមៗ។",
    aEn: "CV Studio pulls your skills and projects into a clean, ATS-ready layout that exports directly to PDF so you can apply to verified internships in minutes.",
  },
  {
    qKm: "តើក្រុមហ៊ុនជ្រើសរើសបុគ្គលិក (Recruiters) ត្រូវបានផ្ទៀងផ្ទាត់ដោយរបៀបណា?",
    qEn: "How are companies and internship listings verified?",
    aKm: "គណនីក្រុមហ៊ុនទាំងអស់ត្រូវឆ្លងកាត់ការត្រួតពិនិត្យព័ត៌មានស្ថាប័នដោយអ្នកគ្រប់គ្រងប្រព័ន្ធ (Admin Verification) មុនពេលទទួលបានស្លាក Verified ដើម្បីធានាសុវត្ថិភាពជូននិស្សិត។",
    aEn: "Employer profiles undergo admin verification of company details before receiving a Verified badge, ensuring safe and legitimate opportunities for students.",
  },
];

export default function Home() {
  const { language } = useLanguage();
  const { user } = useGlobleContext();
  const navigate = useNavigate();
  const isKm = language === "km";

  const [heroQuery, setHeroQuery] = useState("");
  const [selectedCat, setSelectedCat] = useState("All");
  const [activeTrackId, setActiveTrackId] = useState("web");
  const [activeHubTab, setActiveHubTab] = useState("mentors");
  const [openFaq, setOpenFaq] = useState(0);
  const [brokenThumbs, setBrokenThumbs] = useState({});

  const [apiCourses, setApiCourses] = useState([]);
  const [apiMentors, setApiMentors] = useState([]);
  const [apiInternships, setApiInternships] = useState([]);

  useEffect(() => {
    let active = true;

    fetchCourses()
      .then((res) => {
        if (active && Array.isArray(res?.courses) && res.courses.length > 0) {
          setApiCourses(res.courses);
        }
      })
      .catch(() => {});

    fetchMentors()
      .then((list) => {
        if (active && Array.isArray(list) && list.length > 0) {
          setApiMentors(list);
        }
      })
      .catch(() => {});

    fetchInternships()
      .then((list) => {
        if (active && Array.isArray(list) && list.length > 0) {
          setApiInternships(list);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const displayCourses = useMemo(() => {
    if (apiCourses.length > 0) {
      return apiCourses.slice(0, 6).map((c, idx) => {
        const fb = FALLBACK_COURSES[idx % FALLBACK_COURSES.length];
        return {
          id: c.id || fb.id,
          slug: c.slug || fb.slug,
          titleKm: c.titleKm || c.title || fb.titleKm,
          titleEn: c.title || fb.titleEn,
          descKm: c.descriptionKm || c.description || fb.descKm,
          descEn: c.description || fb.descEn,
          category: c.category || fb.category,
          catKm: c.category || fb.catKm,
          level: c.level || fb.level,
          levelKm: c.level || fb.levelKm,
          price: Number(c.price ?? fb.price),
          lessons: c.lessonCount || fb.lessons,
          duration: c.duration || fb.duration,
          topics: Array.isArray(c.topics) && c.topics.length ? c.topics.slice(0, 3) : fb.topics,
          thumbnailUrl: c.thumbnailUrl || fb.thumbnailUrl,
          gradient: fb.gradient,
        };
      });
    }
    return FALLBACK_COURSES;
  }, [apiCourses]);

  const filteredCourses = useMemo(() => {
    if (selectedCat === "All") return displayCourses;
    const matches = displayCourses.filter(
      (item) => String(item.category).toLowerCase() === selectedCat.toLowerCase(),
    );
    return matches.length > 0 ? matches : displayCourses.slice(0, 3);
  }, [displayCourses, selectedCat]);

  const resolvedTeamMentors = useMemo(() => {
    return TEAM_MENTORS.map((member) => {
      const matched = apiMentors.find((m) =>
        String(m.name || "")
          .toLowerCase()
          .includes(member.name.toLowerCase().split(" ")[0]),
      );
      return {
        ...member,
        mentorLink: matched?.id ? `/mentorship/${matched.id}` : "/mentorship",
      };
    });
  }, [apiMentors]);

  const displayInternships = useMemo(() => {
    if (apiInternships.length > 0) {
      return apiInternships.slice(0, 3).map((job, idx) => {
        const fb = FALLBACK_INTERNSHIPS[idx % FALLBACK_INTERNSHIPS.length];
        const rawSkills = Array.isArray(job.skills)
          ? job.skills
          : typeof job.skills === "string"
            ? job.skills.split(",").map((s) => s.trim()).filter(Boolean)
            : fb.skills;
        return {
          id: job.id || fb.id,
          titleKm: job.title || fb.titleKm,
          titleEn: job.title || fb.titleEn,
          company: job.companyName || job.company || fb.company,
          locationKm: job.location || fb.locationKm,
          locationEn: job.location || fb.locationEn,
          stipend: job.stipend || job.salaryRange || fb.stipend,
          type: job.type || job.workMode || fb.type,
          verified: job.isVerified !== undefined ? Boolean(job.isVerified) : true,
          skills: rawSkills.slice(0, 3),
        };
      });
    }
    return FALLBACK_INTERNSHIPS;
  }, [apiInternships]);

  const activeTrack = useMemo(
    () => ROADMAP_TRACKS.find((t) => t.id === activeTrackId) || ROADMAP_TRACKS[0],
    [activeTrackId],
  );

  const handleHeroSearch = (event) => {
    event.preventDefault();
    const trimmed = heroQuery.trim();
    navigate(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search");
  };

  const cvStudioPath = user ? "/cv-studio" : "/register?redirect=%2Fcv-studio";

  return (
    <div className="ck-home">
      {/* 1. CLEAN HERO SECTION + GLOBAL SEARCH + 3 MINIMAL PILLARS */}
      <section className="ck-hero" id="top">
        <div className="ck-container ck-hero-inner">
          <div className="ck-hero-badge">
            <span className="ck-hero-dot" />
            <span>
              {isKm
                ? "វេទិកាសហគមន៍អភិវឌ្ឍន៍ជំនាញ និងអាជីពឌីជីថលនៅកម្ពុជា"
                : "Cambodia’s Smart Community for Practical Skills & Careers"}
            </span>
          </div>

          <h1 className="ck-hero-title">
            {isKm ? (
              <>
                រៀនជំនាញបច្ចេកវិទ្យាជាក់ស្តែង{" "}
                <span className="ck-text-gradient">
                  បង្កើត CV អាជីព និងឈានទៅរកការងារពិត
                </span>
              </>
            ) : (
              <>
                Master Practical Tech Skills,{" "}
                <span className="ck-text-gradient">
                  Craft Your CV & Launch Your Career
                </span>
              </>
            )}
          </h1>

          <p className="ck-hero-subtitle">
            {isKm
              ? "ប្រព័ន្ធតែមួយសម្រាប់សិស្ស និងនិស្សិត៖ សិក្សាមេរៀនវីដេអូ HD ប្តូរជំនាញជាមួយមិត្តរួមក្រុម ពិភាក្សា 1:1 ជាមួយអ្នកណែនាំ រៀបចំ PDF CV និងដាក់ពាក្យកម្មសិក្សាដែលបានផ្ទៀងផ្ទាត់។"
              : "One unified flow for students: learn hands-on video courses, swap skills with peers, get 1:1 mentor guidance, export a clean PDF CV, and apply to verified internships."}
          </p>

          <form className="ck-search-bar" onSubmit={handleHeroSearch} role="search">
            <FiSearch className="ck-search-icon" aria-hidden="true" />
            <input
              type="search"
              value={heroQuery}
              onChange={(e) => setHeroQuery(e.target.value)}
              placeholder={
                isKm
                  ? "ស្វែងរកវគ្គសិក្សា អ្នកណែនាំ ការងារ ឬជំនាញ (ឧ. React, UX/UI, Python)..."
                  : "Search courses, mentors, internships, or skills (e.g. React, Figma, SQL)..."
              }
              aria-label={isKm ? "ស្វែងរកទូទាំងប្រព័ន្ធ" : "Global platform search"}
            />
            <kbd className="ck-search-kbd">⌘K</kbd>
            <button type="submit" className="ck-search-submit">
              {isKm ? "ស្វែងរក" : "Search"}
            </button>
          </form>

          <div className="ck-hero-actions">
            <Link to="/courses" className="ck-btn ck-btn-primary">
              <FiBookOpen />
              <span>{isKm ? "ចាប់ផ្តើមរៀនឥឡូវនេះ" : "Start Learning Now"}</span>
              <FiArrowRight />
            </Link>
            <Link to={cvStudioPath} className="ck-btn ck-btn-outline">
              <FiFileText />
              <span>{isKm ? "បង្កើត CV & Portfolio" : "Build CV & Portfolio"}</span>
            </Link>
          </div>

          <div className="ck-pillars-grid">
            <div className="ck-pillar-card">
              <div className="ck-pillar-icon blue">
                <FiBookOpen />
              </div>
              <div>
                <h3>{isKm ? "មេរៀនអនុវត្តជាក់ស្តែង" : "Practical Video Courses"}</h3>
                <p>
                  {isKm
                    ? "មេរៀនរៀបចំតាមលំដាប់ច្បាស់លាស់ ងាយយល់ និងផ្តោតលើការបង្កើតស្នាដៃពិត។"
                    : "Structured step-by-step HD lessons focused on real portfolio projects."}
                </p>
              </div>
            </div>

            <div className="ck-pillar-card">
              <div className="ck-pillar-icon indigo">
                <FiUsers />
              </div>
              <div>
                <h3>{isKm ? "ប្តូរជំនាញ & អ្នកណែនាំ 1:1" : "Skill Swap & 1:1 Mentors"}</h3>
                <p>
                  {isKm
                    ? "ផ្លាស់ប្តូរចំណេះដឹងជាមួយមិត្តរួមជំនាញ និងទទួលការណែនាំផ្ទាល់ពីរៀមច្បង។"
                    : "Exchange skills free with peers and book 1:1 reviews with industry mentors."}
                </p>
              </div>
            </div>

            <div className="ck-pillar-card">
              <div className="ck-pillar-icon emerald">
                <FiBriefcase />
              </div>
              <div>
                <h3>{isKm ? "CV Studio & កម្មសិក្សាពិត" : "CV Studio & Verified Jobs"}</h3>
                <p>
                  {isKm
                    ? "បោះពុម្ព PDF CV ស្តង់ដារ និងដាក់ពាក្យចូលក្រុមហ៊ុនដៃគូដែលបានផ្ទៀងផ្ទាត់។"
                    : "Export an ATS-ready PDF CV and apply directly to admin-verified employers."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. POPULAR TECH & CAREER SKILLS SQUIRCLE GRID */}
      <section className="ck-section ck-skills-section" id="skills">
        <div className="ck-container">
          <header className="ck-section-header">
            <span className="ck-eyebrow">
              {isKm ? "ជំនាញពេញនិយម" : "IN-DEMAND SKILLS"}
            </span>
            <h2>
              {isKm
                ? "ជ្រើសរើសជំនាញបច្ចេកវិទ្យាដែលទីផ្សារការងារត្រូវការ"
                : "Explore High-Demand Tech & Career Skills"}
            </h2>
            <p>
              {isKm
                ? "ចុចលើជំនាញណាមួយដើម្បីស្វែងរកវគ្គសិក្សា អ្នកណែនាំ និងឱកាសកម្មសិក្សាពាក់ព័ន្ធភ្លាមៗ"
                : "Select any skill to instantly discover matching courses, mentors, and internships"}
            </p>
          </header>

          <div className="ck-tech-grid">
            {TECH_SKILLS.map((skill) => {
              const IconComp = skill.icon;
              return (
                <Link
                  key={skill.id}
                  to={`/search?q=${encodeURIComponent(skill.query)}`}
                  className="ck-tech-tile"
                >
                  <span
                    className="ck-tech-squircle"
                    style={{ color: skill.color, background: skill.bg }}
                  >
                    <IconComp />
                  </span>
                  <strong>{skill.label}</strong>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. FEATURED VISUAL COURSES (16:9 COVER + FLOATING PILLS + 3 TOPICS + SOLID CTA) */}
      <section className="ck-section" id="courses">
        <div className="ck-container">
          <header className="ck-section-header">
            <span className="ck-eyebrow">
              {isKm ? "វគ្គសិក្សាពិសេស" : "FEATURED ACADEMY"}
            </span>
            <h2>
              {isKm
                ? "វគ្គសិក្សាអនុវត្តជាក់ស្តែងសម្រាប់កសាងស្នាដៃ"
                : "Hands-On Courses Built for Real Portfolios"}
            </h2>
            <p>
              {isKm
                ? "មេរៀននីមួយៗមានរចនាសម្ព័ន្ធច្បាស់លាស់ ខ្លីងាយយល់ និងអាចរៀនបានគ្រប់ឧបករណ៍"
                : "Clean, project-focused lessons with free previews and lifetime progress tracking"}
            </p>
          </header>

          <div className="ck-filter-pills" role="tablist" aria-label="Course categories">
            {COURSE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={selectedCat === cat.id}
                className={`ck-pill-btn ${selectedCat === cat.id ? "active" : ""}`}
                onClick={() => setSelectedCat(cat.id)}
              >
                {isKm ? cat.km : cat.en}
              </button>
            ))}
          </div>

          <div className="ck-courses-grid">
            {filteredCourses.map((course) => {
              const isFree = Number(course.price || 0) <= 0;
              const courseTarget = `/courses/${course.slug}`;
              const linkTo = user
                ? courseTarget
                : `/register?redirect=${encodeURIComponent(courseTarget)}`;
              const thumbFailed = Boolean(brokenThumbs[course.id]);

              return (
                <article key={course.id} className="ck-course-card">
                  <Link
                    to={linkTo}
                    className="ck-course-media"
                    style={{ background: course.gradient }}
                  >
                    {!thumbFailed && course.thumbnailUrl && (
                      <img
                        src={course.thumbnailUrl}
                        alt={isKm ? course.titleKm : course.titleEn}
                        loading="lazy"
                        decoding="async"
                        onError={() =>
                          setBrokenThumbs((prev) => ({ ...prev, [course.id]: true }))
                        }
                      />
                    )}
                    <div className="ck-course-media-overlay" />
                    <span className="ck-badge-level">
                      {isKm ? course.levelKm : course.level}
                    </span>
                    <span className={`ck-badge-price ${isFree ? "free" : "paid"}`}>
                      {isFree ? (isKm ? "ឥតគិតថ្លៃ" : "Free") : `$${course.price}`}
                    </span>
                    <span className="ck-media-play" aria-hidden="true">
                      <FaPlay />
                    </span>
                  </Link>

                  <div className="ck-course-body">
                    <div className="ck-course-meta-top">
                      <span className="ck-cat-tag">
                        {isKm ? course.catKm : course.category}
                      </span>
                      <span className="ck-lesson-meta">
                        <FiClock /> {course.lessons} {isKm ? "មេរៀន" : "lessons"} ·{" "}
                        {course.duration}
                      </span>
                    </div>

                    <h3 className="ck-card-title">
                      <Link to={linkTo}>
                        {isKm ? course.titleKm : course.titleEn}
                      </Link>
                    </h3>

                    <p className="ck-card-desc">
                      {isKm ? course.descKm : course.descEn}
                    </p>

                    <div className="ck-topic-chips">
                      {course.topics.map((topic) => (
                        <span key={topic} className="ck-topic-chip">
                          <FiCheck /> {topic}
                        </span>
                      ))}
                    </div>

                    <Link to={linkTo} className="ck-card-cta">
                      <span>{isKm ? "ចូលរៀនឥឡូវនេះ" : "Start Learning"}</span>
                      <FiArrowRight />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="ck-section-footer">
            <Link to="/courses" className="ck-btn ck-btn-outline">
              <span>{isKm ? "មើលវគ្គសិក្សាទាំងអស់" : "Browse All Courses"}</span>
              <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE CAREER ROADMAP & CV STUDIO TIMELINE */}
      <section className="ck-section ck-section-alt" id="roadmap">
        <div className="ck-container">
          <header className="ck-section-header">
            <span className="ck-eyebrow">
              {isKm ? "ផែនទីបង្ហាញផ្លូវអាជីព" : "END-TO-END CAREER FLOW"}
            </span>
            <h2>
              {isKm
                ? "ផ្លូវដើរច្បាស់លាស់ពីការរៀន រហូតដល់មានការងារធ្វើ"
                : "Step-by-Step Roadmap from Learning to Hired"}
            </h2>
            <p>
              {isKm
                ? "ជ្រើសរើសជំនាញអាជីពដែលអ្នកចង់ក្លាយជា ដើម្បីមើលជំហានទាំង 3 នៅលើ Smart Community"
                : "Choose your target tech track to follow Smart Community’s 3-stage career pipeline"}
            </p>
          </header>

          <div className="ck-filter-pills" role="tablist" aria-label="Career tracks">
            {ROADMAP_TRACKS.map((track) => (
              <button
                key={track.id}
                type="button"
                role="tab"
                aria-selected={activeTrackId === track.id}
                className={`ck-pill-btn ${activeTrackId === track.id ? "active" : ""}`}
                onClick={() => setActiveTrackId(track.id)}
              >
                {isKm ? track.labelKm : track.labelEn}
              </button>
            ))}
          </div>

          <div className="ck-roadmap-timeline">
            {activeTrack.stages.map((stage) => {
              const targetUrl =
                stage.to === "/cv-studio"
                  ? cvStudioPath
                  : stage.to === "/skill-exchange" && !user
                    ? "/register?redirect=%2Fskill-exchange"
                    : stage.to;
              return (
                <div key={stage.step} className="ck-roadmap-step">
                  <div className="ck-roadmap-num">{stage.step}</div>
                  <div className="ck-roadmap-card">
                    <div className="ck-roadmap-card-head">
                      <div>
                        <h3>{isKm ? stage.titleKm : stage.titleEn}</h3>
                        <p>{isKm ? stage.descKm : stage.descEn}</p>
                      </div>
                      <Link to={targetUrl} className="ck-roadmap-link">
                        <span>{isKm ? stage.ctaKm : stage.ctaEn}</span>
                        <FiArrowRight />
                      </Link>
                    </div>
                    <div className="ck-roadmap-tags">
                      {stage.tags.map((tag) => (
                        <span key={tag} className="ck-roadmap-tag">
                          <FiCheck /> {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. INTERACTIVE COMMUNITY HUB: 1:1 MENTORS | PEER SKILL SWAP | LIVE SESSIONS */}
      <section className="ck-section" id="community-hub">
        <div className="ck-container">
          <header className="ck-section-header">
            <span className="ck-eyebrow">
              {isKm ? "សហគមន៍សិក្សាអន្តរកម្ម" : "COLLABORATIVE LEARNING"}
            </span>
            <h2>
              {isKm
                ? "រៀនលឿនជាងមុនជាមួយអ្នកណែនាំ និងដៃគូប្តូរជំនាញ"
                : "Grow Faster with 1:1 Mentors, Skill Swaps & Live Labs"}
            </h2>
            <p>
              {isKm
                ? "មិនរៀនតែម្នាក់ឯងទេ — ជ្រើសរើសមុខងារសហគមន៍ទាំង 3 របស់យើងទៅតាមតម្រូវការរបស់អ្នក"
                : "Never study alone — switch between 1:1 mentors, peer skill exchanges, and live workshops"}
            </p>
          </header>

          <div className="ck-segmented-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeHubTab === "mentors"}
              className={activeHubTab === "mentors" ? "active" : ""}
              onClick={() => setActiveHubTab("mentors")}
            >
              <FiUserCheck />
              <span>{isKm ? "អ្នកណែនាំ 1:1" : "1:1 Mentors"}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeHubTab === "swaps"}
              className={activeHubTab === "swaps" ? "active" : ""}
              onClick={() => setActiveHubTab("swaps")}
            >
              <FiRepeat />
              <span>{isKm ? "ប្តូរជំនាញ (Skill Swap)" : "Peer Skill Swap"}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeHubTab === "sessions"}
              className={activeHubTab === "sessions" ? "active" : ""}
              onClick={() => setActiveHubTab("sessions")}
            >
              <FiVideo />
              <span>{isKm ? "សិក្ខាសាលាផ្ទាល់ (Live)" : "Live Sessions"}</span>
            </button>
          </div>

          {activeHubTab === "mentors" && (
            <div className="ck-hub-grid">
              {resolvedTeamMentors.slice(0, 3).map((mentor) => (
                <article key={mentor.slug} className="ck-hub-card">
                  <div className="ck-mentor-top">
                    <div className="ck-avatar-ring">
                      <img src={mentor.avatar} alt={mentor.name} loading="lazy" />
                    </div>
                    <div className="ck-mentor-info">
                      <div className="ck-mentor-name-row">
                        <h3>{mentor.name}</h3>
                        <MdVerified className="ck-verified-icon" />
                      </div>
                      <p>{isKm ? mentor.roleKm : mentor.roleEn}</p>
                      <small>{mentor.org}</small>
                    </div>
                  </div>
                  <div className="ck-mentor-rating-bar">
                    <span className="ck-star-pill">
                      <FaStar /> {mentor.rating}
                    </span>
                    <span className="ck-avail-pill">
                      {isKm ? "ទទួលណាត់ជួប 1:1" : "Open for 1:1"}
                    </span>
                  </div>
                  <div className="ck-topic-chips">
                    {mentor.skills.map((sk) => (
                      <span key={sk} className="ck-topic-chip">
                        {sk}
                      </span>
                    ))}
                  </div>
                  <Link to={mentor.mentorLink} className="ck-card-cta">
                    <span>{isKm ? "មើលប្រវត្តិរូប & ណាត់ជួប" : "View Profile & Book"}</span>
                    <FiArrowRight />
                  </Link>
                </article>
              ))}
            </div>
          )}

          {activeHubTab === "swaps" && (
            <div className="ck-hub-grid">
              {PEER_SWAPS.map((peer) => {
                const swapUrl = user
                  ? "/skill-exchange"
                  : "/register?redirect=%2Fskill-exchange";
                return (
                  <article key={peer.id} className="ck-hub-card">
                    <div className="ck-swap-top">
                      <div
                        className="ck-monogram"
                        style={{ background: peer.color }}
                      >
                        {peer.avatar}
                      </div>
                      <div className="ck-mentor-info">
                        <h3>{peer.name}</h3>
                        <p>{isKm ? peer.roleKm : peer.roleEn}</p>
                      </div>
                      <span className="ck-match-badge">{peer.match} Match</span>
                    </div>

                    <div className="ck-swap-rows">
                      <div className="ck-swap-row">
                        <small>{isKm ? "អាចបង្រៀន៖" : "Can Teach:"}</small>
                        <div className="ck-swap-Chips">
                          {peer.teaches.map((item) => (
                            <span key={item} className="ck-swap-pill teach">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="ck-swap-row">
                        <small>{isKm ? "ចង់រៀន៖" : "Wants to Learn:"}</small>
                        <div className="ck-swap-Chips">
                          {peer.wants.map((item) => (
                            <span key={item} className="ck-swap-pill want">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Link to={swapUrl} className="ck-card-cta">
                      <span>{isKm ? "ស្នើសុំប្តូរជំនាញ" : "Request Skill Swap"}</span>
                      <FiArrowRight />
                    </Link>
                  </article>
                );
              })}
            </div>
          )}

          {activeHubTab === "sessions" && (
            <div className="ck-hub-grid">
              {LIVE_SESSIONS.map((session) => (
                <article key={session.id} className="ck-hub-card">
                  <div className="ck-session-badges">
                    <span className="ck-live-pill">
                      <span className="ck-live-dot" /> Jitsi Live
                    </span>
                    <span className="ck-cat-tag">
                      {isKm ? session.levelKm : session.levelEn}
                    </span>
                  </div>
                  <h3 className="ck-card-title">
                    {isKm ? session.titleKm : session.titleEn}
                  </h3>
                  <div className="ck-session-meta">
                    <span>
                      <FiUserCheck /> {session.host}
                    </span>
                    <span>
                      <FiCalendar /> {isKm ? session.scheduleKm : session.scheduleEn}
                    </span>
                  </div>
                  <div className="ck-topic-chips">
                    {session.tags.map((tg) => (
                      <span key={tg} className="ck-topic-chip">
                        {tg}
                      </span>
                    ))}
                  </div>
                  <Link to="/sessions" className="ck-card-cta">
                    <span>{isKm ? "ចូលរួមសិក្ខាសាលា" : "Join Live Session"}</span>
                    <FiArrowRight />
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 6. VERIFIED INTERNSHIPS & CAREER OPPORTUNITIES */}
      <section className="ck-section ck-section-alt" id="internships">
        <div className="ck-container">
          <header className="ck-section-header">
            <span className="ck-eyebrow">
              {isKm ? "ឱកាសកម្មសិក្សា និងការងារ" : "VERIFIED INTERNSHIPS"}
            </span>
            <h2>
              {isKm
                ? "ដាក់ពាក្យចូលក្រុមហ៊ុនដៃគូជាមួយ PDF CV របស់អ្នក"
                : "Apply to Verified Internships with Your PDF CV"}
            </h2>
            <p>
              {isKm
                ? "ឱកាសកម្មសិក្សាដែលបានត្រួតពិនិត្យត្រឹមត្រូវ សម្រាប់និស្សិតចាប់ផ្តើមអាជីពដំបូង"
                : "Admin-verified local and remote internships tailored for students and junior talent"}
            </p>
          </header>

          <div className="ck-hub-grid">
            {displayInternships.map((job) => (
              <article key={job.id} className="ck-job-card">
                <div className="ck-job-head">
                  <div className="ck-company-avatar">
                    {String(job.company || "S").charAt(0).toUpperCase()}
                  </div>
                  <div className="ck-job-company">
                    <div className="ck-mentor-name-row">
                      <strong>{job.company}</strong>
                      {job.verified && <MdVerified className="ck-verified-icon" />}
                    </div>
                    <span>
                      <FiMapPin /> {isKm ? job.locationKm : job.locationEn}
                    </span>
                  </div>
                  <span className="ck-stipend-pill">{job.stipend}</span>
                </div>

                <h3 className="ck-card-title">
                  <Link to="/jobs">{isKm ? job.titleKm : job.titleEn}</Link>
                </h3>

                <div className="ck-topic-chips">
                  {job.skills.map((skill) => (
                    <span key={skill} className="ck-topic-chip">
                      {skill}
                    </span>
                  ))}
                </div>

                <Link to="/jobs" className="ck-card-cta">
                  <span>{isKm ? "ដាក់ពាក្យជាមួយ PDF CV" : "Apply with PDF CV"}</span>
                  <FiArrowRight />
                </Link>
              </article>
            ))}
          </div>

          <div className="ck-section-footer">
            <Link to="/jobs" className="ck-btn ck-btn-outline">
              <span>{isKm ? "មើលឱកាសការងារទាំងអស់" : "Explore All Internships"}</span>
              <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* 7. 3-ROLE ECOSYSTEM PURPOSE CARDS & CMU RESEARCH TEAM SHOWCASE */}
      <section className="ck-section" id="ecosystem">
        <div className="ck-container">
          <header className="ck-section-header">
            <span className="ck-eyebrow">
              {isKm ? "ប្រព័ន្ធអេកូឡូស៊ី និងក្រុមស្ថាបនិក" : "ECOSYSTEM & RESEARCH TEAM"}
            </span>
            <h2>
              {isKm
                ? "បង្កើតឡើងសម្រាប់សិស្ស អ្នកណែនាំ និងក្រុមហ៊ុននៅកម្ពុជា"
                : "Designed for Students, Mentors & Employers"}
            </h2>
            <p>
              {isKm
                ? "ភ្ជាប់ទំនាក់ទំនងរវាងការសិក្សានៅសាកលវិទ្យាល័យ ជាមួយនឹងតម្រូវការទីផ្សារការងារពិតប្រាកដ"
                : "Bridging university learning and real workplace readiness in one trusted platform"}
            </p>
          </header>

          <div className="ck-role-grid">
            <div className="ck-role-card accent-blue">
              <div className="ck-pillar-icon blue">
                <FiBookOpen />
              </div>
              <h3>{isKm ? "សម្រាប់សិស្ស និងនិស្សិត" : "For Students & Learners"}</h3>
              <p>
                {isKm
                  ? "រៀនវគ្គជំនាញ ប្តូរចំណេះដឹងជាមួយមិត្តភក្តិ បង្កើត PDF CV និងដាក់ពាក្យកម្មសិក្សាដោយទំនុកចិត្ត។"
                  : "Take practical courses, swap skills free, export your PDF CV, and track job applications."}
              </p>
              <Link to={user ? "/dashboard" : "/register?role=student"} className="ck-role-link">
                <span>{isKm ? "ចូលរួមជាសិស្ស" : "Join as Student"}</span>
                <FiArrowRight />
              </Link>
            </div>

            <div className="ck-role-card accent-emerald">
              <div className="ck-pillar-icon emerald">
                <FiUserCheck />
              </div>
              <h3>{isKm ? "សម្រាប់អ្នកណែនាំជំនាញ" : "For Industry Mentors"}</h3>
              <p>
                {isKm
                  ? "ចែករំលែកបទពិសោធន៍ការងារពិត ដឹកនាំសិក្ខាសាលាផ្ទាល់ និងជួយតម្រង់ទិសនិស្សិតជំនាន់ក្រោយ។"
                  : "Host live Jitsi workshops, review student portfolios 1:1, and give back to the tech community."}
              </p>
              <Link to="/mentorship" className="ck-role-link">
                <span>{isKm ? "ក្លាយជាអ្នកណែនាំ" : "Explore Mentorship"}</span>
                <FiArrowRight />
              </Link>
            </div>

            <div className="ck-role-card accent-indigo">
              <div className="ck-pillar-icon indigo">
                <FiBriefcase />
              </div>
              <h3>{isKm ? "សម្រាប់ក្រុមហ៊ុន Recruiter" : "For Verified Employers"}</h3>
              <p>
                {isKm
                  ? "ផ្សព្វផ្សាយដំណឹងកម្មសិក្សា និងពិនិត្យបេក្ខជនដែលមានស្នាដៃ និង PDF CV រៀបរយក្នុងប្រព័ន្ធ ATS។"
                  : "Post verified internships and review portfolio-ready student candidates in a clean ATS pipeline."}
              </p>
              <Link to={user ? "/jobs" : "/register?role=recruiter"} className="ck-role-link">
                <span>{isKm ? "ចុះឈ្មោះក្រុមហ៊ុន" : "Hire Student Talent"}</span>
                <FiArrowRight />
              </Link>
            </div>
          </div>

          <div className="ck-team-block">
            <div className="ck-team-heading">
              <h3>
                {isKm
                  ? "ក្រុមស្រាវជ្រាវ និងអភិវឌ្ឍន៍ — សាកលវិទ្យាល័យមេគង្គកម្ពុជា (CMU)"
                  : "CMU Graduation Research & Mentor Team"}
              </h3>
              <p>
                {isKm
                  ? "អភិវឌ្ឍឡើងដោយក្រុមនិស្សិតស្រាវជ្រាវ ដើម្បីលើកកម្ពស់ការសិក្សាជំនាញឌីជីថល និងអាជីពនៅកម្ពុជា"
                  : "Built by Cambodian Mekong University researchers to empower digital skills and career growth"}
              </p>
            </div>

            <div className="ck-team-grid">
              {resolvedTeamMentors.map((member) => (
                <Link
                  to={member.mentorLink}
                  key={member.slug}
                  className="ck-team-card"
                >
                  <div className="ck-team-avatar">
                    <img src={member.avatar} alt={member.name} loading="lazy" />
                  </div>
                  <div className="ck-team-name">
                    <strong>{member.name}</strong>
                    <MdVerified className="ck-verified-icon" />
                  </div>
                  <span className="ck-team-role">
                    {isKm ? member.roleKm : member.roleEn}
                  </span>
                  <small className="ck-team-org">{member.org}</small>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 8. CLEAN SINGLE-COLUMN ACCORDION FAQ */}
      <section className="ck-section ck-section-alt" id="faq">
        <div className="ck-container ck-faq-container">
          <header className="ck-section-header">
            <span className="ck-eyebrow">
              {isKm ? "សំណួរញឹកញាប់" : "FREQUENTLY ASKED QUESTIONS"}
            </span>
            <h2>
              {isKm
                ? "ចម្លើយខ្លីៗ និងច្បាស់លាស់អំពីការប្រើប្រាស់ប្រព័ន្ធ"
                : "Clear Answers to Common Questions"}
            </h2>
          </header>

          <div className="ck-faq-list">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={item.qEn}
                  className={`ck-faq-item ${isOpen ? "open" : ""}`}
                >
                  <button
                    type="button"
                    className="ck-faq-trigger"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaq(isOpen ? -1 : index)}
                  >
                    <span>{isKm ? item.qKm : item.qEn}</span>
                    <span className="ck-faq-icon" aria-hidden="true">
                      <FiPlus />
                    </span>
                  </button>
                  {isOpen && (
                    <div className="ck-faq-answer">
                      <p>{isKm ? item.aKm : item.aEn}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <DashBanner />
    </div>
  );
}
