import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaChartBar,
  FaCode,
  FaCss3Alt,
  FaDatabase,
  FaDocker,
  FaFigma,
  FaGitAlt,
  FaGithub,
  FaHtml5,
  FaJs,
  FaLinux,
  FaNodeJs,
  FaPhp,
  FaPython,
  FaReact,
  FaServer,
  FaShieldAlt,
  FaStar,
} from "react-icons/fa";
import {
  SiLaravel,
  SiMongodb,
  SiTailwindcss,
  SiTypescript,
} from "react-icons/si";
import {
  FiArrowRight,
  FiBookOpen,
  FiBriefcase,
  FiCalendar,
  FiClock,
  FiCode,
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
import { IoRocketOutline, IoSchoolOutline } from "react-icons/io5";
import { MdVerified } from "react-icons/md";

import CourseArtworkBanner from "../../components/ui/CourseArtworkBanner";
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

/* Popular Skills & Technologies — Dual-Track Infinite Marquee (Matches CodeKhmerLearning Animation) */
const TECH_TRACK_1 = [
  { id: "html", label: "HTML5", to: "/courses", icon: FaHtml5, color: "#ea580c", bg: "#ffedd5" },
  { id: "css", label: "CSS3", to: "/courses", icon: FaCss3Alt, color: "#2563eb", bg: "#dbeafe" },
  { id: "js", label: "JavaScript", to: "/courses", icon: FaJs, color: "#eab308", bg: "#fef9c3" },
  { id: "ts", label: "TypeScript", to: "/courses", icon: SiTypescript, color: "#3178c6", bg: "#e0f2fe" },
  { id: "react", label: "React.js", to: "/courses/react-modern-web", icon: FaReact, color: "#0284c7", bg: "#e0f2fe" },
  { id: "node", label: "Node.js", to: "/courses/node-api-development", icon: FaNodeJs, color: "#16a34a", bg: "#dcfce7" },
  { id: "python", label: "Python", to: "/courses/python-data-foundations", icon: FaPython, color: "#2563eb", bg: "#dbeafe" },
  { id: "php", label: "PHP", to: "/skill-exchange", icon: FaPhp, color: "#4f46e5", bg: "#e0e7ff" },
  { id: "tailwind", label: "Tailwind CSS", to: "/courses", icon: SiTailwindcss, color: "#06b6d4", bg: "#cffafe" },
  { id: "figma", label: "Figma UI/UX", to: "/courses/ui-ux-design-essentials", icon: FaFigma, color: "#9333ea", bg: "#f3e8ff" },
];

const TECH_TRACK_2 = [
  { id: "sql", label: "MySQL & SQL", to: "/courses/sql-database-essentials", icon: FaDatabase, color: "#4f46e5", bg: "#e0e7ff" },
  { id: "git", label: "Git", to: "/courses/git-github-collaboration", icon: FaGitAlt, color: "#ea580c", bg: "#ffedd5" },
  { id: "github", label: "GitHub", to: "/courses/git-github-collaboration", icon: FaGithub, color: "#0f172a", bg: "#f1f5f9" },
  { id: "cyber", label: "Cybersecurity", to: "/mentorship", icon: FaShieldAlt, color: "#059669", bg: "#d1fae5" },
  { id: "linux", label: "Linux CLI", to: "/mentorship", icon: FaLinux, color: "#334155", bg: "#f1f5f9" },
  { id: "docker", label: "Cloud & DevOps", to: "/mentorship", icon: FaDocker, color: "#0284c7", bg: "#e0f2fe" },
  { id: "api", label: "REST API", to: "/courses/node-api-development", icon: FaServer, color: "#2563eb", bg: "#dbeafe" },
  { id: "data", label: "Data & BI", to: "/courses/python-data-foundations", icon: FaChartBar, color: "#7c3aed", bg: "#ede9fe" },
  { id: "laravel", label: "Laravel", to: "/courses", icon: SiLaravel, color: "#ef4444", bg: "#fee2e2" },
  { id: "mongo", label: "MongoDB", to: "/courses", icon: SiMongodb, color: "#10b981", bg: "#d1fae5" },
];

const COURSE_CATEGORIES = [
  { id: "All", km: "ទាំងអស់", en: "All" },
  { id: "Frontend", km: "Frontend Web", en: "Frontend Web" },
  { id: "Backend", km: "Backend & SQL", en: "Backend & SQL" },
  { id: "Design", km: "ការរចនា UX/UI", en: "UX/UI Design" },
  { id: "Data", km: "ទិន្នន័យ & Python", en: "Data & Python" },
  { id: "Career", km: "ត្រៀមអាជីព & Git", en: "Career & Git" },
];

const ROADMAP_TRACKS = [
  {
    id: "web",
    icon: FaCode,
    labelKm: "អ្នកអភិវឌ្ឍន៍វេបសាយ (Web Developer)",
    labelEn: "Web Developer",
    stages: [
      {
        step: "1",
        titleKm: "រៀន HTML, CSS, JavaScript និងមូលដ្ឋានគ្រឹះវេបសាយ",
        titleEn: "Learn HTML, CSS, JavaScript & Web Foundations",
        descKm:
          "យល់ពីមូលដ្ឋាននៃការបង្កើតវេបសាយ ស្វែងយល់ពីរចនាសម្ព័ន្ធ HTML5, ការតុបតែង Responsive CSS និងកម្មវិធីថាមវន្តជាមួយ JavaScript។",
        descEn:
          "Build semantic layouts with HTML5, responsive styling with CSS Flexbox/Grid, and interactive logic with modern JavaScript.",
        links: [
          { labelKm: "វគ្គសិក្សា React & Web", labelEn: "React & Web Courses", to: "/courses" },
          { labelKm: "ប្តូរជំនាញ HTML/CSS", labelEn: "Swap HTML/CSS", to: "/skill-exchange" },
          { labelKm: "វេទិកាសំណួរ-ចម្លើយ", labelEn: "Community Q&A", to: "/forum" },
        ],
      },
      {
        step: "2",
        titleKm: "អនុវត្តគម្រោង React.js និងផ្លាស់ប្តូរជំនាញជាមួយមិត្តរួមថ្នាក់",
        titleEn: "Build React.js Projects & Practice with Mentors",
        descKm:
          "បង្កើតគេហទំព័រពេញលេញជាមួយ React Components, Hooks និងភ្ជាប់ API ព្រមទាំងផ្លាស់ប្តូរចំណេះដឹងជាមួយដៃគូសិក្សា និងអ្នកណែនាំ 1:1។",
        descEn:
          "Create full React applications, exchange skills free with peers, and book 1:1 code reviews with industry mentors.",
        links: [
          { labelKm: "ដោះដូរជំនាញ Skill Swap", labelEn: "Peer Skill Swap", to: "/skill-exchange" },
          { labelKm: "ណាត់ជួបអ្នកណែនាំ 1:1", labelEn: "Book 1:1 Mentor", to: "/mentorship" },
          { labelKm: "ថ្នាក់រៀនផ្ទាល់ (Live)", labelEn: "Live Workshops", to: "/sessions" },
        ],
      },
      {
        step: "3",
        titleKm: "បង្កើត PDF CV ក្នុង CV Studio និងដាក់ពាក្យកម្មសិក្សា",
        titleEn: "Export PDF in CV Studio & Apply for Verified Internships",
        descKm:
          "ទាញយកជំនាញ និងគម្រោងស្នាដៃរបស់អ្នកមកបង្កើតជា PDF CV ស្តង់ដារក្នុង CV Studio ហើយដាក់ពាក្យចូលក្រុមហ៊ុនបច្ចេកវិទ្យាដែលបានផ្ទៀងផ្ទាត់។",
        descEn:
          "Generate an ATS-ready PDF resume in CV Studio and apply directly to admin-verified tech internships.",
        links: [
          { labelKm: "បើកស្ទូឌីយោ CV Studio", labelEn: "Open CV Studio", to: "/cv-studio" },
          { labelKm: "ដាក់ពាក្យកម្មសិក្សា", labelEn: "Browse Internships", to: "/jobs" },
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
        titleKm: "សិក្សា Design Thinking, Wireframe និង Figma UI",
        titleEn: "Design Thinking, Wireframing & Figma UI",
        descKm:
          "ស្វែងយល់ពីតម្រូវការអ្នកប្រើប្រាស់ (User Flow) ការរៀបចំ Typography, Color System និងការបង្កើត Component ស្អាតៗនៅក្នុងកម្មវិធី Figma។",
        descEn:
          "Master user flows, visual hierarchy, color systems, and reusable component libraries in Figma.",
        links: [
          { labelKm: "វគ្គសិក្សា UX/UI Figma", labelEn: "UX/UI Design Course", to: "/courses/ui-ux-design-essentials" },
          { labelKm: "ប្តូរជំនាញ Design", labelEn: "Swap Design Skills", to: "/skill-exchange" },
        ],
      },
      {
        step: "2",
        titleKm: "បង្កើត Interactive Prototype និងពិនិត្យស្នាដៃជាមួយអ្នកណែនាំ",
        titleEn: "Interactive Prototypes & Mentor Portfolio Critique",
        descKm:
          "រៀបចំ UX Case Study ចំនួន 2 គម្រោង ហើយចូលរួមសិក្ខាសាលាពិនិត្យស្នាដៃ ឬប្តូរជំនាញរចនាជាមួយនិស្សិតផ្នែកសរសេរកូដ។",
        descEn:
          "Build 2 complete UX case studies, swap design help for coding help, and refine your work with mentors.",
        links: [
          { labelKm: "ចូលរួមសិក្ខាសាលាផ្ទាល់", labelEn: "Join Design Workshops", to: "/sessions" },
          { labelKm: "ជួបអ្នកណែនាំ UX/UI", labelEn: "Meet UX/UI Mentors", to: "/mentorship" },
        ],
      },
      {
        step: "3",
        titleKm: "ភ្ជាប់ Portfolio ទៅក្នុង PDF CV និងដាក់ពាក្យការងារ Design",
        titleEn: "Attach Portfolio to PDF CV & Apply to Design Studios",
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
    labelKm: "វិស្វករសូហ្វវែរ Backend & API",
    labelEn: "Backend & API Engineer",
    stages: [
      {
        step: "1",
        titleKm: "ស្ទាត់ជំនាញ Node.js, Express និងការរចនា MySQL Database",
        titleEn: "Node.js, Express & Relational MySQL Schemas",
        descKm:
          "រៀនសាងសង់ RESTful API, ការរចនាตารางទិន្នន័យ (Relational Schema) និងប្រព័ន្ធផ្ទៀងផ្ទាត់សុវត្ថិភាព JWT Authentication។",
        descEn:
          "Build clean REST endpoints, normalized MySQL schemas, and secure JWT authentication workflows.",
        links: [
          { labelKm: "វគ្គសិក្សា Node.js API", labelEn: "Node.js API Course", to: "/courses/node-api-development" },
          { labelKm: "វគ្គសិក្សា SQL & MySQL", labelEn: "SQL Database Course", to: "/courses/sql-database-essentials" },
        ],
      },
      {
        step: "2",
        titleKm: "សហការបង្កើតគម្រោង Full-Stack លើ GitHub",
        titleEn: "Collaborate on Full-Stack Projects via GitHub",
        descKm:
          "ប្រើប្រាស់ Git Branches និង Pull Requests ដើម្បីភ្ជាប់ប្រព័ន្ធ Backend API ជាមួយមិត្តរួមក្រុមផ្នែក Frontend។",
        descEn:
          "Use Git branches and pull requests to integrate your APIs with frontend peers in real team projects.",
        links: [
          { labelKm: "វគ្គសិក្សា Git & GitHub", labelEn: "Git & GitHub Course", to: "/courses/git-github-collaboration" },
          { labelKm: "ស្វែងរកដៃគូ Full-Stack", labelEn: "Find Project Partners", to: "/skill-exchange" },
        ],
      },
    ],
  },
  {
    id: "cyber",
    icon: FaShieldAlt,
    labelKm: "អ្នកជំនាញសន្តិសុខសាយប័រ (Cybersecurity)",
    labelEn: "Cybersecurity Specialist",
    stages: [
      {
        step: "1",
        titleKm: "មូលដ្ឋានគ្រឹះ Network, Linux និងគោលការណ៍សុវត្ថិភាពប្រព័ន្ធ",
        titleEn: "Networking, Linux CLI & Security Controls",
        descKm:
          "សិក្សាពីដំណើរការបណ្តាញ TCP/IP, ការគ្រប់គ្រងប្រព័ន្ធ Linux និងស្តង់ដារត្រួតពិនិត្យសុវត្ថិភាពប្រព័ន្ធ ITGC។",
        descEn:
          "Understand TCP/IP networking, Linux administration, OWASP fundamentals, and ITGC audit controls.",
        links: [
          { labelKm: "ជួបអ្នកណែនាំ Cybersecurity", labelEn: "Meet Security Mentors", to: "/mentorship" },
          { labelKm: "ពិភាក្សាក្នុងវេទិកា", labelEn: "Security Forum", to: "/forum" },
        ],
      },
    ],
  },
  {
    id: "data",
    icon: FaChartBar,
    labelKm: "អ្នកវិទ្យាសាស្ត្រទិន្នន័យ (Data Analyst)",
    labelEn: "Data Analyst",
    stages: [
      {
        step: "1",
        titleKm: "ស្ទាត់ជំនាញ SQL Queries, Python Pandas និងការវិភាគទិន្នន័យ",
        titleEn: "SQL Queries, Python Pandas & Data Cleaning",
        descKm:
          "រៀនទាញយក និងរៀបចំទិន្នន័យចេញពី Database ដោយប្រើប្រាស់សំណួរ SQL និងបណ្ណាល័យវិភាគទិន្នន័យ Python។",
        descEn:
          "Query relational databases with SQL and clean structured datasets using Python Pandas.",
        links: [
          { labelKm: "វគ្គសិក្សា Python & Data", labelEn: "Python Data Course", to: "/courses/python-data-foundations" },
          { labelKm: "វគ្គសិក្សា SQL Database", labelEn: "SQL Essentials Course", to: "/courses/sql-database-essentials" },
        ],
      },
    ],
  },
];

const TEAM_MENTORS = [
  {
    slug: "muy-kalin",
    name: "MUY KALIN",
    badgeKm: "ស្ថាបនិក & ក្រុមស្រាវជ្រាវ CMU",
    badgeEn: "CMU Research Team",
    roleKm: "អ្នកអភិវឌ្ឍ Full-Stack & Frontend · សាកលវិទ្យាល័យមេគង្គកម្ពុជា",
    roleEn: "Full-Stack & Frontend Developer · Cambodian Mekong University",
    bioKm:
      "ដឹកនាំការរចនាស្ថាបត្យកម្មប្រព័ន្ធ Smart Community ផ្នែក Frontend និង Backend API ដើម្បីជួយនិស្សិតរៀនជំនាញកូដ និងបង្កើត Portfolio ស្តង់ដារការងារ។",
    bioEn:
      "Leads full-stack engineering and UI architecture for Smart Community, mentoring students in React.js, Node.js, and portfolio development.",
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
    roleKm: "សវនកម្ម IT និងហានិភ័យប្រព័ន្ធ · Camma Microfinance Limited",
    roleEn: "IT Audit & Cyber Risk Specialist · Camma Microfinance Limited",
    bioKm:
      "ចែករំលែកបទពិសោធន៍ជាក់ស្តែងផ្នែកសវនកម្មប្រព័ន្ធបច្ចេកវិទ្យា (IT Audit) ការគ្រប់គ្រងហានិភ័យទិន្នន័យ និងការរៀបចំប្រវត្តិរូបសង្ខេបសម្រាប់វិស័យធនាគារ។",
    bioEn:
      "Shares practical expertise in enterprise IT audit, cyber risk governance, and career preparation for financial-sector technology roles.",
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
    roleKm: "សន្តិសុខបណ្តាញ និងមូលដ្ឋាន Network · សាកលវិទ្យាល័យមេគង្គកម្ពុជា",
    roleEn: "Cybersecurity & Network Specialist · Cambodian Mekong University",
    bioKm:
      "ផ្តោតលើការបណ្តុះបណ្តាលមូលដ្ឋានគ្រឹះសន្តិសុខសាយប័រ ការគ្រប់គ្រងបណ្តាញ Linux និងការការពារសុវត្ថិភាពប្រព័ន្ធគេហទំព័រសម្រាប់និស្សិតព័ត៌មានវិទ្យា។",
    bioEn:
      "Guides students through networking fundamentals, Linux system administration, and hands-on cybersecurity defense practices.",
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
    roleKm: "គាំទ្របច្ចេកទេស និងគណនី B2B · Viettel (Cambodia) PTE. LTD.",
    roleEn: "B2B Account & Technical Support · Viettel (Cambodia) PTE. LTD.",
    bioKm:
      "ជួយតម្រង់ទិសនិស្សិតលើជំនាញទំនាក់ទំនងអាជីព ការដោះស្រាយបញ្ហាបច្ចេកទេសជូនអតិថិជនស្ថាប័ន និងការត្រៀមខ្លួនសម្ភាសន៍ការងារក្នុងក្រុមហ៊ុនទូរគមនាគមន៍។",
    bioEn:
      "Mentors learners on enterprise technical support, B2B client communication, and workplace readiness in telecom environments.",
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
    roleKm: "ទីផ្សារឌីជីថល និងគាំទ្រប្រព័ន្ធ IT · 888 UP FAST CASH",
    roleEn: "Digital Marketing & IT Support · 888 UP FAST CASH",
    bioKm:
      "ចូលរួមអភិវឌ្ឍមាតិកាសិក្សា ការផ្សព្វផ្សាយឌីជីថល និងការគាំទ្រប្រព័ន្ធបច្ចេកទេស ដើម្បីឱ្យសហគមន៍សិក្សាមានភាពងាយស្រួល និងទាក់ទាញ។",
    bioEn:
      "Focuses on digital growth, learner onboarding, and practical IT support workflows for community members.",
    org: "888 UP FAST CASH",
    avatar: heangChhengKhoemPhoto,
    rating: "4.9",
    skills: ["Digital Marketing", "SEO", "IT Support"],
  },
];

const PEER_SWAPS = [
  {
    id: "sw1",
    name: "Bopha Pich",
    roleKm: "និស្សិតបច្ចេកវិទ្យា (Tech Learner)",
    roleEn: "Frontend Tech Learner",
    match: "94% ត្រូវគ្នា",
    avatar: "BP",
    color: "#2563eb",
    descKm: "អាចបង្រៀន React.js, JavaScript និង Tailwind CSS ហើយចង់រៀនបន្ថែមពីការរចនា UX/UI ក្នុង Figma។",
    descEn: "Can teach React.js, JavaScript & Tailwind CSS; looking to practice UX/UI Figma.",
  },
  {
    id: "sw2",
    name: "Vanna Sok",
    roleKm: "និស្សិតឆ្នាំទី 3 ផ្នែក Computer Science",
    roleEn: "Year 3 CS Student",
    match: "91% ត្រូវគ្នា",
    avatar: "VS",
    color: "#1d4ed8",
    descKm: "អាចចែករំលែកមូលដ្ឋានគ្រឹះ Python និង SQL Queries ហើយចង់ផ្លាស់ប្តូរចំណេះដឹងផ្នែក Node.js REST API។",
    descEn: "Can teach Python & SQL queries; looking to collaborate on Node.js REST APIs.",
  },
  {
    id: "sw3",
    name: "Rina Chan",
    roleKm: "អ្នករចនាផលិតផលឌីជីថល (UI/UX)",
    roleEn: "Junior Product Designer",
    match: "89% ត្រូវគ្នា",
    avatar: "RC",
    color: "#4f46e5",
    descKm: "អាចជួយពិនិត្យ Figma Prototype និង Design System ហើយចង់រៀនមូលដ្ឋាន HTML5 & CSS3។",
    descEn: "Can teach Figma prototyping & Design Systems; wants to learn HTML5 & CSS3.",
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
    company: "Tech Corp Cambodia",
    location: "Phnom Penh (Hybrid)",
  },
];

const FAQ_ITEMS = [
  {
    qKm: "តើ Smart Community ជាអ្វី?",
    qEn: "What is Smart Community?",
    aKm: "Smart Community គឺជាវេទិកាសហគមន៍អភិវឌ្ឍន៍ជំនាញ និងអាជីពឌីជីថល ដែលរួមបញ្ចូលវគ្គសិក្សាអនុវត្តជាក់ស្តែង ការដោះដូរជំនាញរវាងនិស្សិត (Skill Swap) ការណែនាំ 1:1 ពីរៀមច្បង ការបង្កើត PDF CV និងឱកាសកម្មសិក្សាពិតប្រាកដនៅកន្លែងតែមួយ។",
    aEn: "Smart Community is an all-in-one skill and career platform combining practical courses, free peer skill exchange, 1:1 mentorship, a PDF CV Studio, and verified internships.",
  },
  {
    qKm: "តើខ្ញុំអាចសិក្សាកម្រិតណាមួយនៅទីនេះ?",
    qEn: "What skill levels can I study here?",
    aKm: "យើងមានមេរៀន និងផែនទីបង្ហាញផ្លូវសិក្សាចាប់ពីកម្រិតដំបូង (Zero/Beginner) រហូតដល់ការអនុវត្តគម្រោងជាក់ស្តែង និងការត្រៀមខ្លួនចូលធ្វើការងារកម្មសិក្សា។",
    aEn: "We offer structured courses and career roadmaps starting from complete beginner fundamentals up to portfolio projects and internship readiness.",
  },
  {
    qKm: "តើមុខងារប្តូរជំនាញ (Skill Swap) ឯកសារ PDF និងវីដេអូមេរៀនគិតថ្លៃដូចម្តេច?",
    qEn: "How do Peer Skill Swap, Free PDFs, and $12 Video Courses work?",
    aKm: "មុខងារផ្លាស់ប្តូរជំនាញគ្នាទៅវិញទៅមក (Skill Swap) វេទិកាសហគមន៍ និងការបង្កើត PDF CV គឺឥតគិតថ្លៃទាំងស្រុង។ សម្រាប់វគ្គសិក្សា គ្រាន់តែចុះឈ្មោះគណនី (Register) អ្នកអាចបើកអានឯកសារមេរៀន PDF ទាំងអស់ដោយឥតគិតថ្លៃ ចំណែកការទស្សនាវីដេអូបង្រៀនពេញលេញគឺតម្លៃថេរ $12.00 USD ក្នុងមួយវគ្គសិក្សា (ទូទាត់តាម Bakong KHQR)។",
    aEn: "Peer Skill Swap, Community Forum, and PDF CV Studio are 100% free. Once you register an account, you can open and read all course PDF study guides for free, while full HD video courses are a flat $12.00 USD per course via Bakong KHQR.",
  },
  {
    qKm: "តើខ្ញុំត្រូវការកម្មវិធី ឬឧបករណ៍អ្វីខ្លះដើម្បីចាប់ផ្តើមសិក្សា?",
    qEn: "What tools do I need to start learning?",
    aKm: "អ្នកគ្រាន់តែមានកុំព្យូទ័រ ឬទូរស័ព្ទដែលភ្ជាប់អ៊ីនធឺណិត កម្មវិធីសរសេរកូដដូចជា VS Code និងគណនី Smart Community មួយ គឺអាចចាប់ផ្តើមរៀន និងអនុវត្តបានភ្លាមៗ។",
    aEn: "All you need is a computer or phone with internet access, a free code editor like VS Code, and your Smart Community account.",
  },
];

export default function Home() {
  const { language } = useLanguage();
  const { user } = useGlobleContext();
  const isKm = language === "km";

  const [courseSearch, setCourseSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("All");
  const [activeTrackId, setActiveTrackId] = useState("web");
  const [activeHubTab, setActiveHubTab] = useState("mentors");
  const [openFaq, setOpenFaq] = useState(-1);

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
      const hay = `${item.titleKm} ${item.titleEn} ${item.descKm} ${item.descEn}`.toLowerCase();
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

  const cvStudioPath = "/cv-studio";

  const trustMetrics = useMemo(() => {
    const coursesCount = Math.max(20, apiCourses.length);
    const mentorsCount = Math.max(5, apiMentors.length);
    const internshipsCount = Math.max(10, apiInternships.length);
    return [
      {
        id: "courses",
        value: `${coursesCount}+`,
        label: isKm ? "វគ្គសិក្សាបច្ចេកវិទ្យា" : "Tech Courses & Guides",
        icon: FiBookOpen,
        accent: "blue",
        to: "/courses",
      },
      {
        id: "cv",
        value: "100%",
        label: isKm ? "PDF CV ឥតគិតថ្លៃ" : "Free ATS PDF CV",
        icon: FiFileText,
        accent: "indigo",
        to: "/cv-studio",
      },
      {
        id: "mentors",
        value: `${mentorsCount}+`,
        label: isKm ? "អ្នកណែនាំ 1:1 ផ្ទៀងផ្ទាត់" : "Verified 1:1 Mentors",
        icon: FiUserCheck,
        accent: "emerald",
        to: "/mentorship",
      },
      {
        id: "jobs",
        value: `${internshipsCount}+`,
        label: isKm ? "ឱកាសកម្មសិក្សាពិត" : "Active Internships",
        icon: FiBriefcase,
        accent: "amber",
        to: "/jobs",
      },
    ];
  }, [apiCourses.length, apiMentors.length, apiInternships.length, isKm]);

  return (
    <div className="ck-home">
      {/* 1. CLEAN CENTERED HERO + 3 CORE PILLAR CARDS */}
      <section className="ck-hero" id="top">
        <div className="ck-container ck-hero-inner">
          <div className="ck-hero-badge">
            <IoRocketOutline className="ck-hero-rocket" />
            <span>
              {isKm
                ? "វេទិកាផ្លាស់ប្តូរជំនាញ សិក្សាបច្ចេកវិទ្យា និងអភិវឌ្ឍអាជីព"
                : "Peer Skill Exchange · Tech Academy · Career Ecosystem"}
            </span>
          </div>

          <h1 className="ck-hero-title">
            {isKm ? (
              <>
                ផ្លាស់ប្តូរជំនាញ និងសិក្សាបច្ចេកវិទ្យា
                <br />
                ជាមួយ <span className="ck-text-gradient">Smart Community</span>
              </>
            ) : (
              <>
                Exchange Skills &amp; Master Tech
                <br />
                with <span className="ck-text-gradient">Smart Community</span>
              </>
            )}
          </h1>

          <p className="ck-hero-subtitle">
            {isKm
              ? "វេទិកាសហគមន៍ដែលសិស្ស-និស្សិត និងអ្នកជំនាញអាចផ្លាស់ប្តូរជំនាញគ្នាទៅវិញទៅមកដោយឥតគិតថ្លៃ (Peer Skill Swap) សិក្សាមេរៀនបច្ចេកវិទ្យា និងឯកសារជំនួយ PDF ជួបអ្នកណែនាំ 1:1 និងបង្កើត PDF CV ដាក់ពាក្យការងារ!"
              : "The community platform where students and peers exchange skills for free, study practical tech courses and PDF guides, book 1:1 mentors, and build ATS-ready PDF CVs!"}
          </p>

          <div className="ck-hero-actions">
            <Link to="/skill-exchange" className="ck-btn ck-btn-primary">
              <FiRepeat />
              <span>{isKm ? "ផ្លាស់ប្តូរជំនាញគ្នា (Skill Swap)" : "Start Peer Skill Swap"}</span>
              <FiArrowRight />
            </Link>
            <Link to="/courses" className="ck-btn ck-btn-outline">
              <FiBookOpen />
              <span>{isKm ? "ស្វែងរកវគ្គសិក្សា" : "Explore Courses"}</span>
            </Link>
            <Link to={cvStudioPath} className="ck-btn ck-btn-outline">
              <IoSchoolOutline />
              <span>{isKm ? "បង្កើត PDF CV & រកការងារ" : "Build PDF CV & Find Jobs"}</span>
            </Link>
          </div>

          {/* Live Platform Trust & Metrics Strip */}
          <div
            className="ck-trust-metrics"
            aria-label={isKm ? "សូចនាករវេទិកាសំខាន់ៗ" : "Platform highlights"}
          >
            {trustMetrics.map((metric) => {
              const MetricIcon = metric.icon;
              return (
                <Link
                  key={metric.id}
                  to={metric.to}
                  className="ck-trust-metric-item"
                >
                  <span className={`ck-trust-metric-icon ${metric.accent}`}>
                    <MetricIcon aria-hidden="true" />
                  </span>
                  <div className="ck-trust-metric-copy">
                    <strong className="ck-trust-metric-value">{metric.value}</strong>
                    <span className="ck-trust-metric-label">{metric.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* 3 Core Pillar Cards */}
          <div className="ck-pillars-grid">
            <Link to="/skill-exchange" className="ck-pillar-card">
              <div className="ck-pillar-icon blue">
                <FiRepeat />
              </div>
              <h3>{isKm ? "ផ្លាស់ប្តូរជំនាញគ្នាទៅវិញទៅមក" : "Peer-to-Peer Skill Exchange"}</h3>
              <p>
                {isKm
                  ? "សិស្ស-និស្សិតអាចចែករំលែកចំណេះដឹង និងបង្រៀនជំនាញគ្នាទៅវិញទៅមកដោយឥតគិតថ្លៃ តាមរយៈប្រព័ន្ធផ្គូផ្គងឆ្លាតវៃ។"
                  : "Students and peers teach what they know and learn what they need for free through smart skill matching."}
              </p>
            </Link>

            <Link to="/courses" className="ck-pillar-card">
              <div className="ck-pillar-icon indigo">
                <FiBookOpen />
              </div>
              <h3>{isKm ? "មេរៀន និងឯកសារសិក្សាគុណភាព" : "Quality Courses & Study Guides"}</h3>
              <p>
                {isKm
                  ? "សិក្សាមេរៀនបច្ចេកវិទ្យាពីមូលដ្ឋានរហូតដល់កម្រិតខ្ពស់ ជាមួយឯកសារមេរៀន PDF ឥតគិតថ្លៃ និងការអនុវត្តគម្រោងជាក់ស្តែង។"
                  : "Master practical tech skills from fundamentals to advanced topics with free PDF study guides and structured video lessons."}
              </p>
            </Link>

            <Link to="/cv-studio" className="ck-pillar-card">
              <div className="ck-pillar-icon emerald">
                <FiUsers />
              </div>
              <h3>{isKm ? "អ្នកណែនាំ 1:1, PDF CV & ការងារ" : "1:1 Mentors, PDF CV & Jobs"}</h3>
              <p>
                {isKm
                  ? "ទទួលបានការតម្រង់ទិសពីអ្នកណែនាំ 1:1 បង្កើត PDF CV ស្តង់ដារក្នុង CV Studio និងដាក់ពាក្យកម្មសិក្សាពិតប្រាកដ។"
                  : "Get guidance from 1:1 mentors, export resumes in CV Studio, and apply to verified internships."}
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. POPULAR SKILLS & TECHNOLOGIES ICON GRID (Matches ckl_clean_2_logos.png 100%) */}
      <section className="ck-section" id="skills">
        <div className="ck-container">
          <header className="ck-section-header">
            <h2>
              {isKm
                ? "ភាសាកម្មវិធី និងជំនាញពេញនិយម"
                : "Popular Programming Languages & Tech Skills"}
            </h2>
            <p>
              {isKm
                ? "ស្វែងយល់ពីភាសាកម្មវិធី និងឧបករណ៍បច្ចេកវិទ្យាដែលពេញនិយមបំផុតនៅលើពិភពលោក"
                : "Explore the most widely used programming languages and digital tools in the industry"}
            </p>
          </header>

          {/* Dual-Track Smooth Infinite Marquee Animation (Matches CodeKhmerLearning) */}
          <div className="ck-marquee-section-wrap">
            {/* Row 1: Forward Marquee */}
            <div className="ck-marquee-container" aria-label="Popular Skills Row 1">
              <div className="ck-marquee-track">
                {[...TECH_TRACK_1, ...TECH_TRACK_1].map((skill, index) => {
                  const IconComp = skill.icon;
                  return (
                    <Link
                      key={`t1-${skill.id}-${index}`}
                      to={skill.to}
                      className="ck-marquee-item"
                    >
                      <div className="ck-marquee-icon-box">
                        <span
                          className="ck-marquee-icon-inner"
                          style={{ color: skill.color, background: skill.bg }}
                        >
                          <IconComp />
                        </span>
                      </div>
                      <span className="ck-marquee-label">{skill.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Row 2: Reverse Marquee */}
            <div className="ck-marquee-container" aria-label="Popular Skills Row 2">
              <div className="ck-marquee-track reverse">
                {[...TECH_TRACK_2, ...TECH_TRACK_2].map((skill, index) => {
                  const IconComp = skill.icon;
                  return (
                    <Link
                      key={`t2-${skill.id}-${index}`}
                      to={skill.to}
                      className="ck-marquee-item"
                    >
                      <div className="ck-marquee-icon-box">
                        <span
                          className="ck-marquee-icon-inner"
                          style={{ color: skill.color, background: skill.bg }}
                        >
                          <IconComp />
                        </span>
                      </div>
                      <span className="ck-marquee-label">{skill.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. OUR COURSES SECTION (Standardized Course Catalog Cards) */}
      <section className="ck-section" id="courses">
        <div className="ck-container">
          <header className="ck-section-header">
            <span className="ck-eyebrow">
              {isKm ? "បណ្ណាល័យវគ្គសិក្សា" : "Smart Community Academy"}
            </span>
            <h2>{isKm ? "ថ្នាក់រៀន និងវគ្គសិក្សាពេញនិយម" : "Featured Classes & Courses"}</h2>
            <p>
              {isKm
                ? "សិក្សាជំនាញបច្ចេកវិទ្យាជាមួយឯកសារមេរៀន PDF ឥតគិតថ្លៃសម្រាប់សមាជិក និងវីដេអូបង្រៀនពេញលេញតម្លៃ $12.00 ក្នុងមួយវគ្គសិក្សា។"
                : "Study practical tech courses with free PDF lesson guides for registered members and full HD video courses at $12.00 per course."}
            </p>
          </header>

          <div className="ck-courses-toolbar">
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

            <div className="ck-inline-search">
              <FiSearch className="ck-inline-search-icon" />
              <input
                type="search"
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                placeholder={isKm ? "ស្វែងរកវគ្គសិក្សា..." : "Search courses..."}
                aria-label={isKm ? "ស្វែងរកវគ្គសិក្សា" : "Search courses"}
              />
            </div>
          </div>

          <div className="ck-courses-grid">
            {(filteredCourses.length > 0 ? filteredCourses : displayCourses.slice(0, 6)).map(
              (course) => {
                const courseTarget = `/courses/${course.slug}`;
                const displayLevel = isKm ? course.levelKm : course.levelEn;
                const displayDuration = isKm
                  ? course.durationKm || course.duration || "6 ម៉ោង"
                  : course.durationEn || "6h 15m";

                return (
                  <article key={course.id} className="ck-course-card">
                    <Link to={courseTarget} className="ck-course-media-link">
                      <CourseArtworkBanner course={course} />
                    </Link>

                    <div className="ck-course-body">
                      <div className="ck-card-access-row">
                        <div className="ck-card-access-pills">
                          <span className="ck-free-pill free">
                            <FiFileText />
                            <span>{isKm ? "PDF ឥតគិតថ្លៃ" : "Free PDF"}</span>
                          </span>
                          <span className="ck-free-pill paid">
                            <FiVideo />
                            <span>{isKm ? "វីដេអូ $12.00" : "Video $12.00"}</span>
                          </span>
                        </div>
                        <span className="ck-card-level-tag">{displayLevel}</span>
                      </div>

                      <h3 className="ck-card-title">
                        <Link to={courseTarget}>
                          {isKm ? course.titleKm : course.titleEn}
                        </Link>
                      </h3>

                      <p className="ck-card-desc">
                        {isKm ? course.descKm : course.descEn}
                      </p>

                      <div className="ck-card-meta-row">
                        <span>
                          <FiBookOpen />
                          {course.lessons || 12} {isKm ? "មេរៀន" : "Lessons"}
                        </span>
                        <span>
                          <FiClock />
                          {displayDuration}
                        </span>
                      </div>

                      <Link to={courseTarget} className="ck-card-cta-full">
                        <span>
                          {isKm ? "មើលមេរៀន & អាន PDF" : "View Course & Free PDF"}
                        </span>
                        <FiArrowRight />
                      </Link>
                    </div>
                  </article>
                );
              },
            )}
          </div>

          <div className="ck-section-footer">
            <Link to="/courses" className="ck-btn ck-btn-outline">
              <FiBookOpen />
              <span>
                {isKm ? "មើលវគ្គសិក្សាទាំងអស់ក្នុងបណ្ណាល័យ" : "Browse All Courses in Library"}
              </span>
              <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. UNIFIED COMMUNITY & CAREER SHOWCASE (Mentors | Skill Swap | Internships — Clean 4-Element Cards) */}
      <section className="ck-section" id="community-hub">
        <div className="ck-container">
          <header className="ck-section-header">
            <h2>
              {isKm
                ? "សហគមន៍ដោះដូរជំនាញ និងឱកាសអាជីព"
                : "Community Skill Exchange & Career Opportunities"}
            </h2>
            <p>
              {isKm
                ? "ភ្ជាប់ទំនាក់ទំនងជាមួយអ្នកណែនាំ 1:1 ផ្លាស់ប្តូរជំនាញជាមួយមិត្តរួមថ្នាក់ និងដាក់ពាក្យកម្មសិក្សាដែលបានផ្ទៀងផ្ទាត់"
                : "Connect with 1:1 mentors, exchange skills with peers, and apply to verified internships"}
            </p>
          </header>

          <div className="ck-roadmap-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeHubTab === "mentors"}
              className={`ck-roadmap-tab ${activeHubTab === "mentors" ? "active" : ""}`}
              onClick={() => setActiveHubTab("mentors")}
            >
              <FiUserCheck />
              <span>{isKm ? "អ្នកណែនាំ 1:1 (Mentors)" : "1:1 Mentors"}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeHubTab === "swaps"}
              className={`ck-roadmap-tab ${activeHubTab === "swaps" ? "active" : ""}`}
              onClick={() => setActiveHubTab("swaps")}
            >
              <FiRepeat />
              <span>{isKm ? "ដោះដូរជំនាញ (Skill Swap)" : "Peer Skill Swap"}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeHubTab === "jobs"}
              className={`ck-roadmap-tab ${activeHubTab === "jobs" ? "active" : ""}`}
              onClick={() => setActiveHubTab("jobs")}
            >
              <FiBriefcase />
              <span>{isKm ? "ឱកាសកម្មសិក្សា (Internships)" : "Verified Internships"}</span>
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
                      <span className="ck-free-pill">
                        ★ {mentor.rating} · {isKm ? "អ្នកណែនាំ 1:1" : "1:1 Mentor"}
                      </span>
                      <div className="ck-mentor-name-row">
                        <h3>{mentor.name}</h3>
                        <MdVerified className="ck-verified-icon" />
                      </div>
                      <p>{isKm ? mentor.roleKm : mentor.roleEn}</p>
                    </div>
                  </div>

                  <p className="ck-card-desc">
                    {isKm ? mentor.bioKm : mentor.bioEn}
                  </p>

                  <Link to={mentor.mentorLink} className="ck-card-cta-full">
                    <span>{isKm ? "ណាត់ជួបអ្នកណែនាំ" : "Book 1:1 Session"}</span>
                    <FiArrowRight />
                  </Link>
                </article>
              ))}
            </div>
          )}

          {activeHubTab === "swaps" && (
            <div className="ck-hub-grid">
              {PEER_SWAPS.map((peer) => (
                <article key={peer.id} className="ck-hub-card">
                  <div className="ck-swap-top">
                    <div className="ck-monogram" style={{ background: peer.color }}>
                      {peer.avatar}
                    </div>
                    <div className="ck-mentor-info">
                      <span className="ck-free-pill">{peer.match}</span>
                      <h3>{peer.name}</h3>
                      <p>{isKm ? peer.roleKm : peer.roleEn}</p>
                    </div>
                  </div>

                  <p className="ck-card-desc">
                    {isKm ? peer.descKm : peer.descEn}
                  </p>

                  <Link to="/skill-exchange" className="ck-card-cta-full">
                    <span>{isKm ? "ស្នើសុំប្តូរជំនាញ" : "Request Skill Swap"}</span>
                    <FiArrowRight />
                  </Link>
                </article>
              ))}
            </div>
          )}

          {activeHubTab === "jobs" && (
            <div className="ck-hub-grid">
              {displayInternships.map((job) => (
                <article key={job.id} className="ck-hub-card">
                  <div className="ck-job-head">
                    <div className="ck-company-avatar">
                      {String(job.company || "S").charAt(0).toUpperCase()}
                    </div>
                    <div className="ck-job-company">
                      <span className="ck-free-pill">
                        {isKm ? job.stipendKm : job.stipendEn}
                      </span>
                      <div className="ck-mentor-name-row">
                        <strong>{job.company}</strong>
                        {job.verified && <MdVerified className="ck-verified-icon" />}
                      </div>
                      <span>
                        <FiMapPin /> {isKm ? job.locationKm : job.locationEn}
                      </span>
                    </div>
                  </div>

                  <h4 className="ck-card-title">
                    <Link to="/jobs">{isKm ? job.titleKm : job.titleEn}</Link>
                  </h4>

                  <p className="ck-card-desc">
                    {isKm
                      ? `ឱកាសហាត់ការផ្នែក ${job.skills.join(", ")} សម្រាប់និស្សិតដែលមាន PDF CV និងស្នាដៃជាក់ស្តែង។`
                      : `Verified internship focusing on ${job.skills.join(", ")} for portfolio-ready students.`}
                  </p>

                  <Link to="/jobs" className="ck-card-cta-full">
                    <span>{isKm ? "ដាក់ពាក្យជាមួយ PDF CV" : "Apply with PDF CV"}</span>
                    <FiArrowRight />
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 5. TECH CAREER ROADMAP (Matches ckl_clean_4_roadmap.png 100%) */}
      <section className="ck-section" id="roadmap">
        <div className="ck-container">
          <header className="ck-section-header">
            <h2>
              {isKm ? "ផែនទីផ្លូវអាជីពបច្ចេកវិទ្យា" : "Technology Career Roadmaps"}
            </h2>
            <p>
              {isKm
                ? "ស្វែងរកជំហានដើម្បីក្លាយជាអ្នកជំនាញក្នុងវិស័យបច្ចេកវិទ្យាផ្សេងៗ! ចុចលើតំណភ្ជាប់ខាងក្រោមដើម្បីចាប់ផ្តើមរៀន"
                : "Discover step-by-step paths to become a tech specialist. Click the learning links below to begin."}
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
                      <FiCode />
                    </div>
                    <h3>{isKm ? stage.titleKm : stage.titleEn}</h3>
                  </div>

                  <p className="ck-timeline-desc">
                    {isKm ? stage.descKm : stage.descEn}
                  </p>

                  <div className="ck-timeline-divider" />

                  <div className="ck-timeline-links-label" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <FiExternalLink />
                    <span>{isKm ? "តំណភ្ជាប់សិក្សា" : "Learning Links"}</span>
                  </div>

                  <div className="ck-timeline-pills">
                    {stage.links.map((lk) => {
                      const dest = lk.to === "/cv-studio" ? cvStudioPath : lk.to;
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

      {/* 6. PURPOSE OF THIS PLATFORM (Matches ckl_clean_5_purpose.png 100%) */}
      <section className="ck-section" id="ecosystem">
        <div className="ck-container">
          <header className="ck-section-header">
            <h2>
              {isKm
                ? "គោលបំណងនៃការបង្កើតវេបសាយនេះ"
                : "Purpose of Creating This Platform"}
            </h2>
            <p>
              {isKm
                ? "វេបសាយនេះត្រូវបានបង្កើតឡើងដើម្បីផ្តល់ឱកាសសម្រាប់ការរៀនជំនាញកូដ ផ្លាស់ប្តូរចំណេះដឹង និងភ្ជាប់និស្សិតទៅកាន់ឱកាសការងារពិតប្រាកដ។"
                : "Created to provide accessible tech learning, peer knowledge sharing, and direct pathways to real internships."}
            </p>
          </header>

          <div className="ck-role-grid">
            <div className="ck-role-card accent-blue">
              <div className="ck-pillar-icon blue">
                <FiCode />
              </div>
              <h3>{isKm ? "ការអភិវឌ្ឍជំនាញកូដ និងឌីជីថល" : "Practical Skill Development"}</h3>
              <p>
                {isKm
                  ? "យើងបង្កើតវេបសាយនេះដើម្បីជួយអ្នករៀនបង្កើតកម្មវិធី និងគម្រោងផ្ទាល់ខ្លួនឱ្យមានការយល់ដឹង និងជំនាញច្បាស់លាស់សម្រាប់ទីផ្សារការងារ។"
                  : "Helping learners build real software and digital projects with structured, easy-to-follow Khmer and English lessons."}
              </p>
            </div>

            <div className="ck-role-card accent-purple">
              <div className="ck-pillar-icon purple">
                <FiUsers />
              </div>
              <h3>{isKm ? "ការបង្កើតសហគមន៍អ្នកសិក្សា" : "Collaborative Learner Community"}</h3>
              <p>
                {isKm
                  ? "យើងចង់បង្កើតសហគមន៍មួយសម្រាប់អ្នកសិក្សា ដើម្បីអាចចែករំលែកគ្នាូវបទពិសោធន៍ ដោះដូរជំនាញ និងទទួលការណែនាំពីរៀមច្បង។"
                  : "Building an active community where students exchange skills free, ask questions, and learn directly from industry mentors."}
              </p>
            </div>

            <div className="ck-role-card accent-indigo">
              <div className="ck-pillar-icon indigo">
                <IoRocketOutline />
              </div>
              <h3>{isKm ? "ការលើកស្ទួយកម្រិតជំនាញ និងអាជីព" : "Career & Internship Readiness"}</h3>
              <p>
                {isKm
                  ? "វេបសាយនេះក៏មានគោលបំណងលើកស្ទួយកម្រិតជំនាញរបស់អ្នក ដោយផ្តល់ឧបករណ៍បង្កើត PDF CV ស្តង់ដារ និងភ្ជាប់ទៅកាន់ក្រុមហ៊ុនកម្មសិក្សាផ្ទាល់។"
                  : "Elevating student careers with a built-in PDF CV Studio and verified internship opportunities from partner companies."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FAQ ACCORDION (Matches ckl_clean_6_faq.png 100%) */}
      <section className="ck-section" id="faq">
        <div className="ck-container ck-faq-container">
          <header className="ck-section-header">
            <h2>
              {isKm
                ? "សំណួរ និងចម្លើយញឹកញាប់ (FAQ)"
                : "Frequently Asked Questions (FAQ)"}
            </h2>
            <p>
              {isKm
                ? "សួស្តី! បើអ្នកមានសំណួរអំពី Smart Community សូមមើលខាងក្រោម។ បើមិនទាន់មាន សូមទាក់ទងយើង។"
                : "Have questions about Smart Community? Browse the answers below or reach out to our team."}
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

      {/* 8. SPACIOUS HORIZONTAL SUPPORTER / RESEARCH TEAM CARDS (Matches ckl_clean_7_supporter.png 100%) */}
      <section className="ck-section" id="team">
        <div className="ck-container">
          <header className="ck-section-header">
            <h2>
              {isKm
                ? "ក្រុមស្រាវជ្រាវ និងអ្នកដឹកនាំគម្រោង"
                : "Project Leaders & Research Team"}
            </h2>
            <p>
              {isKm
                ? "Smart Community ត្រូវបានបង្កើតឡើងដោយក្រុមស្រាវជ្រាវនៃសាកលវិទ្យាល័យមេគង្គកម្ពុជា (CMU) ដែលចង់ជួយសហគមន៍រៀនជំនាញបច្ចេកវិទ្យា និងអភិវឌ្ឍអាជីព។"
                : "Smart Community is built by Cambodian Mekong University (CMU) researchers dedicated to advancing tech skills and student careers."}
            </p>
          </header>

          {/* Featured Project Leader (Matches CodeKhmerLearning "អ្នកដឹកនាំ" Lead Hero Card) */}
          {resolvedTeamMentors.length > 0 && (
            <Link
              to={resolvedTeamMentors[0].mentorLink}
              className="ck-supporter-hero-card"
            >
              <div className="ck-supporter-hero-avatar-ring">
                <img
                  src={resolvedTeamMentors[0].avatar}
                  alt={resolvedTeamMentors[0].name}
                />
              </div>

              <div className="ck-supporter-body">
                <span className="ck-supporter-badge">
                  {isKm ? resolvedTeamMentors[0].badgeKm : resolvedTeamMentors[0].badgeEn}
                </span>

                <div className="ck-supporter-name">
                  <h3>{resolvedTeamMentors[0].name}</h3>
                  <MdVerified className="ck-verified-icon" />
                </div>

                <p className="ck-supporter-role">
                  {isKm ? resolvedTeamMentors[0].roleKm : resolvedTeamMentors[0].roleEn}
                </p>

                <span className="ck-supporter-bar" aria-hidden="true" />

                <p className="ck-supporter-bio">
                  {isKm ? resolvedTeamMentors[0].bioKm : resolvedTeamMentors[0].bioEn}
                </p>
              </div>
            </Link>
          )}

          {/* 4 Core Researchers in Perfect 2x2 Symmetric Grid */}
          <div className="ck-supporter-grid">
            {resolvedTeamMentors.slice(1).map((member) => (
              <Link
                to={member.mentorLink}
                key={member.slug}
                className="ck-supporter-card"
              >
                <div className="ck-supporter-avatar-ring">
                  <img src={member.avatar} alt={member.name} />
                </div>

                <div className="ck-supporter-body">
                  <span className="ck-supporter-badge">
                    {isKm ? member.badgeKm : member.badgeEn}
                  </span>

                  <div className="ck-supporter-name">
                    <h3>{member.name}</h3>
                    <MdVerified className="ck-verified-icon" />
                  </div>

                  <p className="ck-supporter-role">
                    {isKm ? member.roleKm : member.roleEn}
                  </p>

                  <span className="ck-supporter-bar" aria-hidden="true" />

                  <p className="ck-supporter-bio">
                    {isKm ? member.bioKm : member.bioEn}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
