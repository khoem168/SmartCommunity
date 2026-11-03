import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaChartBar,
  FaCode,
  FaDatabase,
  FaFigma,
  FaGitAlt,
  FaHtml5,
  FaJs,
  FaNodeJs,
  FaPython,
  FaReact,
  FaServer,
  FaShieldAlt,
  FaStar,
} from "react-icons/fa";
import {
  FiArrowRight,
  FiBookOpen,
  FiBriefcase,
  FiCalendar,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiExternalLink,
  FiFileText,
  FiLayers,
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
import {
  COURSE_BILINGUAL_MAP,
  enrichCourseRecord,
  enrichInternshipRecord,
} from "../../utils/bilingualCatalog";

import heangChhengKhoemPhoto from "../../assets/team/heang-chheng-khoem.jpg";
import hornPiseyPhoto from "../../assets/team/horn-pisey.jpg";
import krySoranuthPhoto from "../../assets/team/kry-soranuth.jpg";
import muyKalinPhoto from "../../assets/team/muy-kalin.jpg";
import samrithRatanaPhoto from "../../assets/team/samrith-ratana.jpg";
import "./Home.css";

const TOP_TOPIC_PILLS = [
  { label: "HTML & CSS", query: "HTML" },
  { label: "JavaScript", query: "JavaScript" },
  { label: "React.js", query: "React" },
  { label: "Node.js & API", query: "Node" },
  { label: "UX/UI Figma", query: "Figma" },
  { label: "Python", query: "Python" },
  { label: "SQL & MySQL", query: "SQL" },
  { label: "Cybersecurity", query: "Cybersecurity" },
  { label: "Git & GitHub", query: "Git" },
  { label: "CV Studio", to: "/cv-studio" },
  { label: "Skill Swap", to: "/skill-exchange" },
  { label: "Internships", to: "/jobs" },
];

const TECH_SKILLS = [
  { id: "html", label: "HTML & CSS", query: "HTML", icon: FaHtml5, color: "#f97316" },
  { id: "js", label: "JavaScript", query: "JavaScript", icon: FaJs, color: "#eab308" },
  { id: "react", label: "React.js", query: "React", icon: FaReact, color: "#0ea5e9" },
  { id: "node", label: "Node.js & API", query: "Node", icon: FaNodeJs, color: "#16a34a" },
  { id: "figma", label: "UX/UI Figma", query: "Figma", icon: FaFigma, color: "#ec4899" },
  { id: "python", label: "Python", query: "Python", icon: FaPython, color: "#2563eb" },
  { id: "sql", label: "SQL & MySQL", query: "SQL", icon: FaDatabase, color: "#4f46e5" },
  { id: "cyber", label: "Cybersecurity", query: "Cybersecurity", icon: FaShieldAlt, color: "#0d9488" },
  { id: "git", label: "Git & GitHub", query: "Git", icon: FaGitAlt, color: "#ea580c" },
  { id: "data", label: "Data & BI", query: "Data", icon: FaChartBar, color: "#7c3aed" },
];

const COURSE_CATEGORIES = [
  { id: "All", km: "ទាំងអស់", en: "All" },
  { id: "Frontend", km: "Frontend", en: "Frontend" },
  { id: "Backend", km: "Backend & SQL", en: "Backend & SQL" },
  { id: "Design", km: "ការរចនា UX/UI", en: "UX/UI Design" },
  { id: "Data", km: "ទិន្នន័យ & Python", en: "Data & Python" },
  { id: "Career", km: "ត្រៀមអាជីព", en: "Career Prep" },
];

const COURSE_ICON_MAP = {
  react: FaReact,
  node: FaNodeJs,
  figma: FaFigma,
  python: FaPython,
  sql: FaDatabase,
  git: FaGitAlt,
};

const ROADMAP_TRACKS = [
  {
    id: "web",
    icon: FaCode,
    labelKm: "អ្នកអភិវឌ្ឍន៍វេបសាយ (Web Developer)",
    labelEn: "Web Developer",
    stages: [
      {
        step: "1",
        titleKm: "1. មូលដ្ឋានគ្រឹះកូដ និងការរចនាគេហទំព័រ (HTML, CSS & JS)",
        titleEn: "1. Core Web Foundations (HTML, CSS & Modern JS)",
        descKm:
          "ចាប់ផ្តើមពីការរៀបចំរចនាសម្ព័ន្ធគេហទំព័រជាមួយ HTML5, រចនាផ្ទៃ Responsive ជាមួយ CSS Flexbox/Grid និងសរសេរកូដអន្តរកម្មជាមួយ JavaScript ES6+។",
        descEn:
          "Build semantic layouts with HTML5, responsive styling with CSS Flexbox/Grid, and interactive logic with modern JavaScript.",
        links: [
          { labelKm: "មេរៀន React & Web", labelEn: "React & Web Courses", to: "/courses" },
          { labelKm: "ស្វែងរកមេរៀន HTML/CSS", labelEn: "Search HTML/CSS", to: "/search?q=HTML" },
          { labelKm: "វេទិកាសំណួរ-ចម្លើយ", labelEn: "Community Q&A", to: "/forum" },
        ],
      },
      {
        step: "2",
        titleKm: "2. បង្កើតគម្រោង React.js និងអនុវត្តប្តូរជំនាញ (Skill Swap & Mentor)",
        titleEn: "2. Build React.js Projects & Practice with Mentors",
        descKm:
          "អនុវត្តបង្កើតគេហទំព័រពេញលេញជាមួយ React Components, Hooks និងភ្ជាប់ API ព្រមទាំងផ្លាស់ប្តូរចំណេះដឹងជាមួយមិត្តរួមជំនាញ និងសុំមតិកែលម្អពីអ្នកណែនាំ 1:1។",
        descEn:
          "Create full React applications, exchange skills free with peers, and book 1:1 code reviews with industry mentors.",
        links: [
          { labelKm: "ប្តូរជំនាញ Skill Swap", labelEn: "Peer Skill Swap", to: "/skill-exchange" },
          { labelKm: "ណាត់ជួបអ្នកណែនាំ 1:1", labelEn: "Book 1:1 Mentor", to: "/mentorship" },
          { labelKm: "សិក្ខាសាលាផ្ទាល់ (Live)", labelEn: "Live Workshops", to: "/sessions" },
        ],
      },
      {
        step: "3",
        titleKm: "3. បោះពុម្ព PDF CV ក្នុង CV Studio និងដាក់ពាក្យកម្មសិក្សា",
        titleEn: "3. Export PDF in CV Studio & Apply for Verified Internships",
        descKm:
          "ទាញយកជំនាញ និងគម្រោងស្នាដៃរបស់អ្នកមកបង្កើតជា PDF CV ស្តង់ដារក្នុង Minimal CV Studio ហើយដាក់ពាក្យចូលក្រុមហ៊ុនបច្ចេកវិទ្យាដែលបានផ្ទៀងផ្ទាត់។",
        descEn:
          "Generate an ATS-ready PDF resume in Minimal CV Studio and apply directly to admin-verified tech internships.",
        links: [
          { labelKm: "បង្កើត PDF CV ឥឡូវនេះ", labelEn: "Open Minimal CV Studio", to: "/cv-studio" },
          { labelKm: "ដាក់ពាក្យកម្មសិក្សា", labelEn: "Browse Internships", to: "/jobs" },
          { labelKm: "ផែនទីអាជីពលម្អិត", labelEn: "Full Career Guide", to: "/career" },
        ],
      },
    ],
  },
  {
    id: "uiux",
    icon: FaFigma,
    labelKm: "អ្នករចនា UX/UI (UI/UX Designer)",
    labelEn: "UX/UI Designer",
    stages: [
      {
        step: "1",
        titleKm: "1. សិក្សា Design Thinking, Wireframe និង Figma UI",
        titleEn: "1. Design Thinking, Wireframing & Figma UI",
        descKm:
          "ស្វែងយល់ពីតម្រូវការអ្នកប្រើប្រាស់ (User Flow) ការរៀបចំ Typography, Color System និងការបង្កើត Component ស្អាតៗនៅក្នុងកម្មវិធី Figma។",
        descEn:
          "Master user flows, visual hierarchy, color systems, and reusable component libraries in Figma.",
        links: [
          { labelKm: "មេរៀនរចនា UX/UI", labelEn: "UX/UI Design Course", to: "/courses/ui-ux-design-essentials" },
          { labelKm: "ស្វែងរកប្រធានបទ Figma", labelEn: "Search Figma Topics", to: "/search?q=Figma" },
        ],
      },
      {
        step: "2",
        titleKm: "2. បង្កើត Interactive Prototype និងពិនិត្យស្នាដៃជាមួយអ្នកណែនាំ",
        titleEn: "2. Interactive Prototypes & Mentor Portfolio Critique",
        descKm:
          "រៀបចំ UX Case Study ចំនួន 2 គម្រោង ហើយចូលរួមសិក្ខាសាលាពិនិត្យស្នាដៃ ឬប្តូរជំនាញរចនាជាមួយនិស្សិតផ្នែកសរសេរកូដ។",
        descEn:
          "Build 2 complete UX case studies, swap design help for coding help, and refine your work with mentors.",
        links: [
          { labelKm: "ចូលរួមសិក្ខាសាលាផ្ទាល់", labelEn: "Join Design Workshops", to: "/sessions" },
          { labelKm: "ប្តូរជំនាញជាមួយអ្នកកូដ", labelEn: "Swap Design & Code", to: "/skill-exchange" },
        ],
      },
      {
        step: "3",
        titleKm: "3. ភ្ជាប់ Portfolio ទៅក្នុង PDF CV និងដាក់ពាក្យការងារ Design",
        titleEn: "3. Attach Portfolio to PDF CV & Apply to Design Studios",
        descKm:
          "បញ្ចូលតំណភ្ជាប់ Figma Prototype ទៅក្នុង CV Studio និងដាក់ពាក្យចូលហាត់ការផ្នែក Product Design នៅតាមក្រុមហ៊ុនដៃគូ។",
        descEn:
          "Showcase your Figma prototypes in CV Studio and apply directly to UX/UI internship openings.",
        links: [
          { labelKm: "រៀបចំ Design CV", labelEn: "Build Design CV", to: "/cv-studio" },
          { labelKm: "មើលការងារ UX/UI", labelEn: "View UX/UI Jobs", to: "/jobs" },
        ],
      },
    ],
  },
  {
    id: "backend",
    icon: FaServer,
    labelKm: "វិស្វករ Backend & API",
    labelEn: "Backend & API Engineer",
    stages: [
      {
        step: "1",
        titleKm: "1. ស្ទាត់ជំនាញ Node.js, Express និងការរចនា MySQL Database",
        titleEn: "1. Node.js, Express & Relational MySQL Schemas",
        descKm:
          "រៀនសាងសង់ RESTful API, ការរចនាตารางទិន្នន័យ (Relational Schema) និងប្រព័ន្ធផ្ទៀងផ្ទាត់សុវត្ថិភាព JWT Authentication។",
        descEn:
          "Build clean REST endpoints, normalized MySQL schemas, and secure JWT authentication workflows.",
        links: [
          { labelKm: "មេរៀន Node.js API", labelEn: "Node.js API Course", to: "/courses/node-api-development" },
          { labelKm: "មេរៀន SQL & MySQL", labelEn: "SQL Database Course", to: "/courses/sql-database-essentials" },
        ],
      },
      {
        step: "2",
        titleKm: "2. សហការបង្កើតគម្រោង Full-Stack លើ GitHub",
        titleEn: "2. Collaborate on Full-Stack Projects via GitHub",
        descKm:
          "ប្រើប្រាស់ Git Branches និង Pull Requests ដើម្បីភ្ជាប់ប្រព័ន្ធ Backend API ជាមួយមិត្តរួមក្រុមផ្នែក Frontend។",
        descEn:
          "Use Git branches and pull requests to integrate your APIs with frontend peers in real team projects.",
        links: [
          { labelKm: "មេរៀន Git & GitHub", labelEn: "Git & GitHub Course", to: "/courses/git-github-collaboration" },
          { labelKm: "ស្វែងរកដៃគូ Full-Stack", labelEn: "Find Project Partners", to: "/skill-exchange" },
        ],
      },
      {
        step: "3",
        titleKm: "3. រៀបចំ Technical CV និងដាក់ពាក្យផ្នែក Software Engineering",
        titleEn: "3. Prepare Technical CV & Apply for Engineering Roles",
        descKm:
          "បង្ហាញគម្រោង API និងប្រវត្តិកូដ GitHub នៅក្នុង PDF CV ដើម្បីដាក់ពាក្យចូលក្រុមហ៊ុនអភិវឌ្ឍន៍កម្មវិធី។",
        descEn:
          "Highlight your GitHub repositories and API architecture in CV Studio for engineering internships.",
        links: [
          { labelKm: "បើក CV Studio", labelEn: "Open CV Studio", to: "/cv-studio" },
          { labelKm: "មើលការងារ Software", labelEn: "Software Internships", to: "/jobs" },
        ],
      },
    ],
  },
  {
    id: "cyber",
    icon: FaShieldAlt,
    labelKm: "សន្តិសុខសាយប័រ & IT Audit",
    labelEn: "Cybersecurity & IT Audit",
    stages: [
      {
        step: "1",
        titleKm: "1. មូលដ្ឋានគ្រឹះ Network, Linux និងគោលការណ៍សុវត្ថិភាពប្រព័ន្ធ",
        titleEn: "1. Networking, Linux CLI & Security Controls",
        descKm:
          "សិក្សាពីដំណើរការបណ្តាញ TCP/IP, ការគ្រប់គ្រងប្រព័ន្ធ Linux និងស្តង់ដារត្រួតពិនិត្យសុវត្ថិភាពប្រព័ន្ធ ITGC។",
        descEn:
          "Understand TCP/IP networking, Linux administration, OWASP fundamentals, and ITGC audit controls.",
        links: [
          { labelKm: "ស្វែងរកមេរៀនសន្តិសុខ", labelEn: "Search Security Courses", to: "/search?q=Cybersecurity" },
          { labelKm: "ពិភាក្សាក្នុងវេទិកា", labelEn: "Security Forum", to: "/forum" },
        ],
      },
      {
        step: "2",
        titleKm: "2. ទទួលការណែនាំ 1:1 ពីអ្នកជំនាញ IT Audit និង Cyber Risk",
        titleEn: "2. 1:1 Mentorship with IT Audit & Cyber Specialists",
        descKm:
          "ជួបពិភាក្សាផ្ទាល់ជាមួយអ្នកណែនាំជំនាញដែលកំពុងបម្រើការងារក្នុងវិស័យធនាគារ ហិរញ្ញវត្ថុ និងទូរគមនាគមន៍។",
        descEn:
          "Get practical career guidance from active IT Audit and Cybersecurity mentors in Cambodia.",
        links: [
          { labelKm: "ជួបអ្នកណែនាំជំនាញ", labelEn: "Meet Security Mentors", to: "/mentorship" },
          { labelKm: "សិក្ខាសាលា Cybersecurity", labelEn: "Live Security Labs", to: "/sessions" },
        ],
      },
      {
        step: "3",
        titleKm: "3. ដាក់ពាក្យការងារផ្នែក IT Support, Network & Security Analyst",
        titleEn: "3. Apply for IT Security & Audit Internships",
        descKm:
          "រៀបចំប្រវត្តិរូបជំនាញបច្ចេកទេសក្នុង CV Studio សម្រាប់ដាក់ពាក្យចូលស្ថាប័នហិរញ្ញវត្ថុ និងក្រុមហ៊ុនបច្ចេកវិទ្យា។",
        descEn:
          "Export your technical resume in CV Studio and apply to enterprise IT and security openings.",
        links: [
          { labelKm: "បង្កើត PDF CV", labelEn: "Create Technical CV", to: "/cv-studio" },
          { labelKm: "មើលឱកាសការងារ IT", labelEn: "Browse IT Openings", to: "/jobs" },
        ],
      },
    ],
  },
  {
    id: "data",
    icon: FaChartBar,
    labelKm: "អ្នកវិភាគទិន្នន័យ (Data Analyst)",
    labelEn: "Data Analyst",
    stages: [
      {
        step: "1",
        titleKm: "1. ស្ទាត់ជំនាញ SQL Queries, Python Pandas និងការសម្អាតទិន្នន័យ",
        titleEn: "1. SQL Queries, Python Pandas & Data Cleaning",
        descKm:
          "រៀនទាញយក និងរៀបចំទិន្នន័យចេញពី Database ដោយប្រើប្រាស់សំណួរ SQL និងបណ្ណាល័យវិភាគទិន្នន័យ Python។",
        descEn:
          "Query relational databases with SQL and clean structured datasets using Python Pandas.",
        links: [
          { labelKm: "មេរៀន Python & Data", labelEn: "Python Data Course", to: "/courses/python-data-foundations" },
          { labelKm: "មេរៀន SQL Database", labelEn: "SQL Essentials Course", to: "/courses/sql-database-essentials" },
        ],
      },
      {
        step: "2",
        titleKm: "2. បង្កើតផ្ទាំងរបាយការណ៍ Dashboard សម្រាប់ការសម្រេចចិត្តអាជីវកម្ម",
        titleEn: "2. Build Executive BI Dashboards & Visual Reports",
        descKm:
          "ប្រែក្លាយតួលេខស្មុគស្មាញទៅជាក្រាហ្វិកងាយយល់ និងទទួលមតិកែលម្អលើរបាយការណ៍ពីអ្នកណែនាំជំនាញ។",
        descEn:
          "Transform raw numbers into clear visual dashboards and review your findings with mentors.",
        links: [
          { labelKm: "ពិភាក្សាជាមួយអ្នកណែនាំ", labelEn: "Book Data Mentor", to: "/mentorship" },
          { labelKm: "ប្តូរជំនាញទិន្នន័យ", labelEn: "Data Skill Swap", to: "/skill-exchange" },
        ],
      },
      {
        step: "3",
        titleKm: "3. ដាក់ពាក្យកម្មសិក្សាផ្នែក Data Analyst & Business Intelligence",
        titleEn: "3. Apply for Data Analyst & BI Internships",
        descKm:
          "បញ្ចូលគម្រោងវិភាគទិន្នន័យទៅក្នុង PDF CV ហើយដាក់ពាក្យទៅកាន់ក្រុមហ៊ុនដៃគូដោយផ្ទាល់។",
        descEn:
          "Include your analytics portfolio in CV Studio and apply directly to data internships.",
        links: [
          { labelKm: "រៀបចំ Data CV", labelEn: "Build Data Analyst CV", to: "/cv-studio" },
          { labelKm: "មើលការងារផ្នែក Data", labelEn: "Explore Data Jobs", to: "/jobs" },
        ],
      },
    ],
  },
];

const TEAM_MENTORS = [
  {
    slug: "muy-kalin",
    name: "MUY KALIN",
    badgeKm: "ក្រុមស្រាវជ្រាវ CMU",
    badgeEn: "CMU Research Team",
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
    badgeKm: "ក្រុមស្រាវជ្រាវ CMU",
    badgeEn: "CMU Research Team",
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
    badgeKm: "ក្រុមស្រាវជ្រាវ CMU",
    badgeEn: "CMU Research Team",
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
    badgeKm: "ក្រុមស្រាវជ្រាវ CMU",
    badgeEn: "CMU Research Team",
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
    badgeKm: "ក្រុមស្រាវជ្រាវ CMU",
    badgeEn: "CMU Research Team",
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
    title: "Full-Stack Developer Intern",
    company: "Angkor Tech Ventures",
    location: "Phnom Penh (Hybrid)",
  },
  {
    id: "job2",
    title: "Junior Security Analyst",
    company: "Acme Cybernetics",
    location: "Phnom Penh, Cambodia",
  },
  {
    id: "job3",
    title: "Frontend Developer Intern",
    company: "Mekong Digital Studio",
    location: "Phnom Penh (Hybrid)",
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
  const isKm = language === "km";
  const topicStripRef = useRef(null);

  const [courseSearch, setCourseSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("All");
  const [activeTrackId, setActiveTrackId] = useState("web");
  const [activeHubTab, setActiveHubTab] = useState("mentors");
  const [openFaq, setOpenFaq] = useState(0);

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
    const rawList =
      apiCourses.length > 0
        ? apiCourses.slice(0, 6)
        : Object.values(COURSE_BILINGUAL_MAP);
    return rawList.map((c, idx) => enrichCourseRecord(c, idx));
  }, [apiCourses]);

  const filteredCourses = useMemo(() => {
    return displayCourses.filter((item) => {
      const catMatch =
        selectedCat === "All" ||
        String(item.category).toLowerCase() === selectedCat.toLowerCase();
      const q = courseSearch.trim().toLowerCase();
      if (!q) return catMatch;
      const hay = `${item.titleKm} ${item.titleEn} ${item.descKm} ${item.descEn} ${item.topics.join(" ")}`.toLowerCase();
      return catMatch && hay.includes(q);
    });
  }, [displayCourses, selectedCat, courseSearch]);

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
    const source =
      apiInternships.length > 0 ? apiInternships.slice(0, 3) : FALLBACK_INTERNSHIPS;
    return source.map((job, idx) => enrichInternshipRecord(job, idx));
  }, [apiInternships]);

  const activeTrack = useMemo(
    () => ROADMAP_TRACKS.find((t) => t.id === activeTrackId) || ROADMAP_TRACKS[0],
    [activeTrackId],
  );

  const scrollTopicStrip = (dir) => {
    if (!topicStripRef.current) return;
    topicStripRef.current.scrollBy({ left: dir * 240, behavior: "smooth" });
  };

  const cvStudioPath = user ? "/cv-studio" : "/register?redirect=%2Fcv-studio";

  return (
    <div className="ck-home">
      {/* 0. TOP TECH TOPIC STRIP (CodeKhmerLearning Sub-Nav Style) */}
      <div className="ck-topic-bar">
        <div className="ck-container ck-topic-bar-inner">
          <button
            type="button"
            className="ck-topic-arrow"
            onClick={() => scrollTopicStrip(-1)}
            aria-label="Scroll topics left"
          >
            <FiChevronLeft />
          </button>
          <div className="ck-topic-scroll" ref={topicStripRef}>
            {TOP_TOPIC_PILLS.map((item) => {
              const target =
                item.to || `/search?q=${encodeURIComponent(item.query)}`;
              return (
                <Link key={item.label} to={target} className="ck-topic-pill">
                  <span className="ck-topic-dot" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
          <button
            type="button"
            className="ck-topic-arrow"
            onClick={() => scrollTopicStrip(1)}
            aria-label="Scroll topics right"
          >
            <FiChevronRight />
          </button>
        </div>
      </div>

      {/* 1. CLEAN HERO SECTION + 2 CTA BUTTONS + 3 VERTICAL STACKED FEATURE CARDS */}
      <section className="ck-hero" id="top">
        <div className="ck-container ck-hero-inner">
          <div className="ck-hero-badge">
            <span className="ck-hero-dot" />
            <span>
              {isKm
                ? "ស្វាគមន៍មកកាន់វេទិកាសហគមន៍អភិវឌ្ឍន៍ជំនាញ និងអាជីពឌីជីថល"
                : "Welcome to Cambodia’s Smart Skill & Career Community"}
            </span>
          </div>

          <h1 className="ck-hero-title">
            {isKm ? (
              <>
                សិក្សាជំនាញបច្ចេកវិទ្យា និងកសាងអាជីព
                <br />
                <span className="ck-text-gradient">
                  ជាមួយ Smart Community
                </span>
              </>
            ) : (
              <>
                Master Practical Tech Skills & Launch
                <br />
                <span className="ck-text-gradient">
                  Your Career with Smart Community
                </span>
              </>
            )}
          </h1>

          <p className="ck-hero-subtitle">
            {isKm
              ? "វេទិកាសិក្សាជំនាញឌីជីថលជាភាសាខ្មែរ និងអង់គ្លេស — រៀនមេរៀនអនុវត្តជាក់ស្តែង ប្តូរជំនាញជាមួយមិត្តរួមក្រុម ពិភាក្សា 1:1 ជាមួយអ្នកណែនាំ រៀបចំ PDF CV និងដាក់ពាក្យកម្មសិក្សាពិតប្រាកដ។"
              : "Learn project-based courses, swap skills free with peers, get 1:1 mentor guidance, export a clean PDF CV, and apply to verified internships in one place."}
          </p>

          <div className="ck-hero-actions">
            <Link to="/courses" className="ck-btn ck-btn-primary">
              <span>{isKm ? "ចាប់ផ្តើមរៀនឥឡូវនេះ" : "Start Learning Now"}</span>
              <FiArrowRight />
            </Link>
            <Link to={cvStudioPath} className="ck-btn ck-btn-outline">
              <FiFileText />
              <span>{isKm ? "បង្កើត CV & រកការងារ" : "Build CV & Find Jobs"}</span>
            </Link>
          </div>

          {/* 3 Vertical Feature Cards (CodeKhmerLearning Exact Proportions) */}
          <div className="ck-pillars-grid">
            <div className="ck-pillar-card">
              <div className="ck-pillar-icon blue">
                <FiBookOpen />
              </div>
              <h3>{isKm ? "មេរៀនអនុវត្តជាក់ស្តែង" : "Practical Video Courses"}</h3>
              <p>
                {isKm
                  ? "មេរៀនរៀបចំតាមលំដាប់ច្បាស់លាស់ ងាយស្រួលយល់ និងផ្តោតលើការបង្កើតគម្រោងស្នាដៃពិតៗ។"
                  : "Structured step-by-step lessons designed to help you build real portfolio projects."}
              </p>
            </div>

            <div className="ck-pillar-card">
              <div className="ck-pillar-icon indigo">
                <FiUsers />
              </div>
              <h3>{isKm ? "ប្តូរជំនាញ & អ្នកណែនាំ 1:1" : "Skill Swap & 1:1 Mentors"}</h3>
              <p>
                {isKm
                  ? "ផ្លាស់ប្តូរចំណេះដឹងជាមួយមិត្តរួមជំនាញដោយឥតគិតថ្លៃ និងទទួលការណែនាំផ្ទាល់ពីរៀមច្បង។"
                  : "Exchange skills free with peers and book 1:1 code and portfolio reviews with mentors."}
              </p>
            </div>

            <div className="ck-pillar-card">
              <div className="ck-pillar-icon emerald">
                <FiBriefcase />
              </div>
              <h3>{isKm ? "CV Studio & កម្មសិក្សាពិត" : "CV Studio & Verified Jobs"}</h3>
              <p>
                {isKm
                  ? "បោះពុម្ព PDF CV ស្តង់ដារក្នុង Minimal CV Studio និងដាក់ពាក្យចូលក្រុមហ៊ុនដែលបានផ្ទៀងផ្ទាត់។"
                  : "Export an ATS-ready PDF CV and apply directly to admin-verified employer internships."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FLOATING SQUARE TECH LOGO GRID (CodeKhmerLearning Logo Showcase Style) */}
      <section className="ck-section ck-skills-section" id="skills">
        <div className="ck-container">
          <header className="ck-section-header">
            <span className="ck-eyebrow">
              {isKm ? "ជំនាញបច្ចេកវិទ្យាពេញនិយម" : "IN-DEMAND TECH STACK"}
            </span>
            <h2>
              {isKm
                ? "បច្ចេកវិទ្យាពេញនិយមដែលអ្នកនឹងសិក្សា"
                : "Popular Technologies You Will Master"}
            </h2>
            <p>
              {isKm
                ? "យើងផ្តោតលើជំនាញបច្ចេកវិទ្យា និងឌីជីថលដែលក្រុមហ៊ុននៅកម្ពុជា និងអន្តរជាតិកំពុងត្រូវការខ្លាំងបំផុត"
                : "Focused on the modern tools and frameworks most requested by employers today"}
            </p>
          </header>

          <div className="ck-tech-grid">
            {TECH_SKILLS.map((skill) => {
              const IconComp = skill.icon;
              return (
                <Link
                  key={skill.id}
                  to={`/search?q=${encodeURIComponent(skill.query)}`}
                  className="ck-tech-item"
                >
                  <div className="ck-tech-square" style={{ color: skill.color }}>
                    <IconComp />
                  </div>
                  <span className="ck-tech-label">{skill.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. FEATURED VISUAL COURSES (INLINE SEARCH + PILLS + GRAPHIC COVERS) */}
      <section className="ck-section ck-section-alt" id="courses">
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
                ? "មេរៀននីមួយៗមានរចនាសម្ព័ន្ធច្បាស់លាស់ ខ្លីងាយយល់ និងអាចរៀនបានគ្រប់ពេលវេលា"
                : "Structured, project-focused courses with practical lessons and progress tracking"}
            </p>
          </header>

          {/* Inline Search + Category Pills Toolbar (CodeKhmerLearning Exact Pattern) */}
          <div className="ck-courses-toolbar">
            <div className="ck-inline-search">
              <FiSearch className="ck-inline-search-icon" />
              <input
                type="search"
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                placeholder={
                  isKm ? "ស្វែងរកវគ្គសិក្សា..." : "Search courses..."
                }
                aria-label={isKm ? "ស្វែងរកវគ្គសិក្សា" : "Search courses"}
              />
            </div>

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
          </div>

          <div className="ck-courses-grid">
            {(filteredCourses.length > 0 ? filteredCourses : displayCourses.slice(0, 3)).map(
              (course) => {
                const isFree = Number(course.price || 0) <= 0;
                const courseTarget = `/courses/${course.slug}`;
                const linkTo = user
                  ? courseTarget
                  : `/register?redirect=${encodeURIComponent(courseTarget)}`;
                const CoverIcon = COURSE_ICON_MAP[course.iconKey] || FaCode;

                return (
                  <article key={course.id} className="ck-course-card">
                    <Link
                      to={linkTo}
                      className="ck-course-media"
                      style={{ background: course.gradient }}
                    >
                      <div className="ck-course-pattern" />
                      <span className="ck-badge-level">
                        {isKm ? course.levelKm : course.levelEn}
                      </span>
                      <span className={`ck-badge-price ${isFree ? "free" : "paid"}`}>
                        {isFree ? (isKm ? "ឥតគិតថ្លៃ" : "Free") : `$${course.price}`}
                      </span>

                      <div className="ck-cover-art">
                        <div className="ck-cover-emblem">
                          <CoverIcon />
                        </div>
                        <div className="ck-cover-titles">
                          <strong>{course.bannerTitle}</strong>
                          <span>{course.bannerSub}</span>
                        </div>
                      </div>
                    </Link>

                    <div className="ck-course-body">
                      <div className="ck-course-meta-top">
                        <span className="ck-cat-tag">
                          {isKm ? course.catKm : course.catEn}
                        </span>
                        <span className="ck-lesson-meta">
                          <FiClock /> {course.lessons} {isKm ? "មេរៀន" : "lessons"} ·{" "}
                          {isKm ? course.durationKm : course.durationEn}
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

                      <div className="ck-course-footer">
                        <Link to={linkTo} className="ck-card-cta">
                          <span>{isKm ? "👉 ចូលរៀនឥឡូវនេះ" : "👉 Start Learning"}</span>
                        </Link>
                        <span className="ck-level-foot-pill">
                          {isKm ? course.levelKm : course.levelEn}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              },
            )}
          </div>

          <div className="ck-section-footer">
            <Link to="/courses" className="ck-btn ck-btn-outline">
              <span>{isKm ? "មើលវគ្គសិក្សាទាំងអស់" : "Browse All Courses"}</span>
              <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. CONNECTED VERTICAL TIMELINE CAREER ROADMAP (CodeKhmerLearning Exact Style) */}
      <section className="ck-section" id="roadmap">
        <div className="ck-container">
          <header className="ck-section-header">
            <span className="ck-eyebrow">
              {isKm ? "ផែនទីបង្ហាញផ្លូវអាជីព" : "CAREER ROADMAP"}
            </span>
            <h2>
              {isKm
                ? "ផែនទីបង្ហាញផ្លូវសិក្សា (Learning Roadmap)"
                : "Step-by-Step Career Learning Roadmap"}
            </h2>
            <p>
              {isKm
                ? "មិនដឹងថាគួរចាប់ផ្តើមពីណាមែនទេ? ជ្រើសរើសជំនាញអាជីពដែលអ្នកចង់ក្លាយជា ដើម្បីមើលជំហានសិក្សា និងអនុវត្តតាមលំដាប់លំដោយ"
                : "Not sure where to start? Pick your target role to follow a clear, structured path from fundamentals to getting hired"}
            </p>
          </header>

          <div className="ck-roadmap-tabs" role="tablist" aria-label="Career tracks">
            {ROADMAP_TRACKS.map((track) => {
              const TrackIcon = track.icon;
              return (
                <button
                  key={track.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTrackId === track.id}
                  className={`ck-roadmap-tab ${activeTrackId === track.id ? "active" : ""}`}
                  onClick={() => setActiveTrackId(track.id)}
                >
                  <TrackIcon />
                  <span>{isKm ? track.labelKm : track.labelEn}</span>
                </button>
              );
            })}
          </div>

          <div className="ck-timeline-wrap">
            {activeTrack.stages.map((stage) => (
              <div key={stage.step} className="ck-timeline-item">
                <div className="ck-timeline-node">{stage.step}</div>
                <div className="ck-timeline-card">
                  <div className="ck-timeline-card-head">
                    <div className="ck-timeline-icon">
                      <FiLayers />
                    </div>
                    <h3>{isKm ? stage.titleKm : stage.titleEn}</h3>
                  </div>

                  <p className="ck-timeline-desc">
                    {isKm ? stage.descKm : stage.descEn}
                  </p>

                  <div className="ck-timeline-divider" />

                  <div className="ck-timeline-links-label">
                    {isKm
                      ? "🔗 តំណភ្ជាប់សិក្សា និងអនុវត្តនៅលើប្រព័ន្ធ៖"
                      : "🔗 Platform Learning & Practice Links:"}
                  </div>

                  <div className="ck-timeline-pills">
                    {stage.links.map((lk) => {
                      const dest =
                        lk.to === "/cv-studio"
                          ? cvStudioPath
                          : lk.to === "/skill-exchange" && !user
                            ? "/register?redirect=%2Fskill-exchange"
                            : lk.to;
                      return (
                        <Link key={lk.labelEn} to={dest} className="ck-timeline-pill">
                          <span>{isKm ? lk.labelKm : lk.labelEn}</span>
                          <FiExternalLink />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. INTERACTIVE COMMUNITY HUB: 1:1 MENTORS | PEER SKILL SWAP | LIVE SESSIONS */}
      <section className="ck-section ck-section-alt" id="community-hub">
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
                      <img src={mentor.avatar} alt={mentor.name} />
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
      <section className="ck-section" id="internships">
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
                  <span className="ck-stipend-pill">
                    {isKm ? job.stipendKm : job.stipendEn}
                  </span>
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
      <section className="ck-section ck-section-alt" id="ecosystem">
        <div className="ck-container">
          <header className="ck-section-header">
            <span className="ck-eyebrow">
              {isKm ? "គោលបំណង និងក្រុមស្ថាបនិក" : "PURPOSE & RESEARCH TEAM"}
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

          {/* CMU Research Team Showcase (CodeKhmerLearning Supporter Card Style) */}
          <div className="ck-team-block">
            <div className="ck-team-heading">
              <span className="ck-eyebrow">
                {isKm ? "ក្រុមស្រាវជ្រាវ និងអ្នកណែនាំ" : "RESEARCH & MENTOR TEAM"}
              </span>
              <h3>
                {isKm
                  ? "ក្រុមស្រាវជ្រាវបញ្ចប់ការសិក្សា — សាកលវិទ្យាល័យមេគង្គកម្ពុជា (CMU)"
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
                  <div className="ck-team-avatar-wrap">
                    <div className="ck-team-avatar">
                      <img src={member.avatar} alt={member.name} />
                    </div>
                    <span className="ck-team-status-dot" aria-hidden="true" />
                  </div>

                  <span className="ck-team-badge">
                    🎓 {isKm ? member.badgeKm : member.badgeEn}
                  </span>

                  <div className="ck-team-name">
                    <strong>{member.name}</strong>
                    <MdVerified className="ck-verified-icon" />
                  </div>

                  <span className="ck-team-role">
                    {isKm ? member.roleKm : member.roleEn}
                  </span>

                  <small className="ck-team-org">{member.org}</small>

                  <span className="ck-team-accent-bar" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 8. CLEAN SINGLE-COLUMN ACCORDION FAQ */}
      <section className="ck-section" id="faq">
        <div className="ck-container ck-faq-container">
          <header className="ck-section-header">
            <span className="ck-eyebrow">
              {isKm ? "សំណួរញឹកញាប់" : "FREQUENTLY ASKED QUESTIONS"}
            </span>
            <h2>
              {isKm
                ? "សំណួរដែលសួរញឹកញាប់ (FAQ)"
                : "Frequently Asked Questions (FAQ)"}
            </h2>
            <p>
              {isKm
                ? "ចម្លើយខ្លីៗ និងច្បាស់លាស់សម្រាប់សំណួរទូទៅរបស់សិស្ស និងអ្នកប្រើប្រាស់"
                : "Quick, clear answers to common questions about Smart Community"}
            </p>
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
