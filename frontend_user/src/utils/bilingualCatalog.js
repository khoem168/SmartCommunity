// Shared Bilingual (Khmer / English) Catalog & Visual Cover Metadata
// Ensures live MySQL backend records render with 100% natural Khmer copy and crisp CodeKhmerLearning-style covers.

export const COURSE_BILINGUAL_MAP = {
  "react-modern-web": {
    slug: "react-modern-web",
    titleKm: "ការអភិវឌ្ឍគេហទំព័រទំនើបជាមួយ React.js",
    titleEn: "Modern Web Development with React.js",
    descKm:
      "រៀនបង្កើតគេហទំព័រទំនើប ប្រើប្រាស់ Components, React Hooks និងភ្ជាប់ REST API ដោយអនុវត្តផ្ទាល់លើគម្រោងពិត។",
    descEn:
      "Build responsive modern web applications using React components, hooks, state management, and REST APIs.",
    category: "Frontend",
    catKm: "Frontend Web",
    catEn: "Frontend Web",
    level: "Beginner",
    levelKm: "កម្រិតដំបូង",
    levelEn: "Beginner",
    bannerTitle: "React.js & Modern UI",
    bannerSub: "Components · Hooks · REST API",
    iconKey: "react",
    gradient: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 55%, #0ea5e9 100%)",
    topics: ["React Hooks", "Component UI", "REST API"],
    duration: "6 ម៉ោង",
    durationEn: "6h 15m",
    lessons: 12,
  },
  "node-api-development": {
    slug: "node-api-development",
    titleKm: "ការបង្កើតប្រព័ន្ធ Backend API ជាមួយ Node.js & Express",
    titleEn: "Node.js & Express REST API Development",
    descKm:
      "ស្ទាត់ជំនាញបង្កើត RESTful API, ប្រព័ន្ធសុវត្ថិភាព JWT Authentication និងការភ្ជាប់ MySQL Database សម្រាប់គេហទំព័រខ្នាតពិត។",
    descEn:
      "Design scalable REST APIs with Node.js, Express middlewares, JWT authentication, and MySQL database integration.",
    category: "Backend",
    catKm: "Backend & API",
    catEn: "Backend & API",
    level: "Intermediate",
    levelKm: "កម្រិតមធ្យម",
    levelEn: "Intermediate",
    bannerTitle: "Node.js & Express API",
    bannerSub: "RESTful Architecture · JWT · MySQL",
    iconKey: "node",
    gradient: "linear-gradient(135deg, #064e3b 0%, #059669 55%, #10b981 100%)",
    topics: ["Node & Express", "JWT Auth", "MySQL API"],
    duration: "7 ម៉ោង",
    durationEn: "7h 30m",
    lessons: 14,
  },
  "ui-ux-design-essentials": {
    slug: "ui-ux-design-essentials",
    titleKm: "មូលដ្ឋានគ្រឹះការរចនា UX/UI និង Prototype ក្នុង Figma",
    titleEn: "UI/UX Design Essentials with Figma",
    descKm:
      "ស្វែងយល់ពីការរៀបចំ User Flow, Wireframe, Design System និង Interactive Prototype សម្រាប់ដាក់ក្នុង Portfolio។",
    descEn:
      "Master user flows, wireframing, clean design systems, and interactive Figma prototypes for your portfolio.",
    category: "Design",
    catKm: "ការរចនា UX/UI",
    catEn: "UX/UI Design",
    level: "Beginner",
    levelKm: "កម្រិតដំបូង",
    levelEn: "Beginner",
    bannerTitle: "UX/UI Design in Figma",
    bannerSub: "Wireframe · Design System · Prototype",
    iconKey: "figma",
    gradient: "linear-gradient(135deg, #701a75 0%, #db2777 55%, #f43f5e 100%)",
    topics: ["Wireframing", "Design System", "Figma Prototype"],
    duration: "5 ម៉ោង",
    durationEn: "5h 20m",
    lessons: 10,
  },
  "python-data-foundations": {
    slug: "python-data-foundations",
    titleKm: "មូលដ្ឋានគ្រឹះភាសា Python និងការវិភាគទិន្នន័យ",
    titleEn: "Python Programming & Data Foundations",
    descKm:
      "ចាប់ផ្តើមពីមូលដ្ឋានគ្រឹះកូដ Python រហូតដល់ការសម្អាត និងវិភាគទិន្នន័យជាក់ស្តែងជាមួយ Pandas និង Data Charts។",
    descEn:
      "Progress from Python syntax fundamentals to practical data cleaning, analysis, and visualization workflows.",
    category: "Data",
    catKm: "ទិន្នន័យ & Python",
    catEn: "Data & Python",
    level: "Beginner",
    levelKm: "កម្រិតដំបូង",
    levelEn: "Beginner",
    bannerTitle: "Python & Data Analytics",
    bannerSub: "Python 3 · Pandas · Data Charts",
    iconKey: "python",
    gradient: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 52%, #eab308 100%)",
    topics: ["Python 3", "Pandas Data", "Visual Charts"],
    duration: "6 ម៉ោង",
    durationEn: "6h 10m",
    lessons: 11,
  },
  "sql-database-essentials": {
    slug: "sql-database-essentials",
    titleKm: "ការគ្រប់គ្រង និងវិភាគទិន្នន័យជាមួយ SQL & MySQL",
    titleEn: "SQL & Relational Database Essentials",
    descKm:
      "រៀនរចនាตารางទិន្នន័យ (Schema) សរសេរសំណួរ SQL Joins កម្រិតខ្ពស់ និងទាញរបាយការណ៍សម្រាប់អាជីវកម្ម។",
    descEn:
      "Write clean SQL queries, complex joins, and design normalized relational database schemas in MySQL.",
    category: "Backend",
    catKm: "ទិន្នន័យ & SQL",
    catEn: "SQL & Database",
    level: "Beginner",
    levelKm: "កម្រិតដំបូង",
    levelEn: "Beginner",
    bannerTitle: "SQL & MySQL Database",
    bannerSub: "Schema Design · Joins · Analytics",
    iconKey: "sql",
    gradient: "linear-gradient(135deg, #312e81 0%, #4f46e5 55%, #818cf8 100%)",
    topics: ["MySQL Schema", "SQL Joins", "Query Tuning"],
    duration: "5 ម៉ោង",
    durationEn: "5h 00m",
    lessons: 9,
  },
  "git-github-collaboration": {
    slug: "git-github-collaboration",
    titleKm: "Git, GitHub និងការធ្វើការងារជាក្រុមសម្រាប់អ្នកអភិវឌ្ឍកូដ",
    titleEn: "Git, GitHub & Team Collaboration Workflow",
    descKm:
      "ស្ទាត់ជំនាញគ្រប់គ្រងកូដជាមួយ Git Branches, Pull Requests លើ GitHub និងការរៀបចំ Portfolio សម្រាប់សម្ភាសន៍ការងារ។",
    descEn:
      "Collaborate cleanly with Git branches, pull requests, code reviews, and polish your GitHub developer profile.",
    category: "Career",
    catKm: "ត្រៀមអាជីព IT",
    catEn: "Career Prep",
    level: "Beginner",
    levelKm: "កម្រិតដំបូង",
    levelEn: "Beginner",
    bannerTitle: "Git & GitHub Workflow",
    bannerSub: "Branches · Pull Requests · Portfolio",
    iconKey: "git",
    gradient: "linear-gradient(135deg, #0f172a 0%, #334155 55%, #ea580c 100%)",
    topics: ["Git Branching", "GitHub PRs", "Tech Portfolio"],
    duration: "4 ម៉ោង",
    durationEn: "4h 00m",
    lessons: 8,
  },
};

const LEVEL_KM_MAP = {
  beginner: "កម្រិតដំបូង",
  intermediate: "កម្រិតមធ្យម",
  advanced: "កម្រិតខ្ពស់",
};

const CATEGORY_KM_MAP = {
  frontend: "Frontend Web",
  backend: "Backend & API",
  design: "ការរចនា UX/UI",
  data: "ទិន្នន័យ & Python",
  career: "ត្រៀមអាជីព IT",
  technology: "បច្ចេកវិទ្យា",
  business: "ពាណិជ្ជកម្ម",
};

export function enrichCourseRecord(rawCourse, idx = 0) {
  const keys = Object.keys(COURSE_BILINGUAL_MAP);
  const fallbackEntry = COURSE_BILINGUAL_MAP[keys[idx % keys.length]];
  const slug = String(rawCourse?.slug || "").trim();
  const mapped = COURSE_BILINGUAL_MAP[slug] || fallbackEntry;

  const rawLevel = String(rawCourse?.level || mapped.level || "Beginner").toLowerCase();
  const rawCat = String(rawCourse?.category || mapped.category || "Frontend");

  return {
    ...rawCourse,
    id: rawCourse?.id || mapped.slug,
    slug: slug || mapped.slug,
    titleKm: rawCourse?.titleKm || mapped.titleKm,
    titleEn: rawCourse?.title || mapped.titleEn,
    descKm: rawCourse?.descriptionKm || mapped.descKm,
    descEn: rawCourse?.description || mapped.descEn,
    category: rawCat,
    catKm: CATEGORY_KM_MAP[rawCat.toLowerCase()] || mapped.catKm,
    catEn: mapped.catEn || rawCat,
    level: rawLevel.charAt(0).toUpperCase() + rawLevel.slice(1),
    levelKm: LEVEL_KM_MAP[rawLevel] || mapped.levelKm,
    levelEn: mapped.levelEn,
    price: Number(rawCourse?.price ?? 0),
    lessons: Number(rawCourse?.lessonCount || rawCourse?.lessons?.length || mapped.lessons),
    durationKm: mapped.duration,
    durationEn: rawCourse?.duration || mapped.durationEn,
    topics:
      Array.isArray(rawCourse?.topics) && rawCourse.topics.length > 0
        ? rawCourse.topics.slice(0, 3)
        : mapped.topics,
    bannerTitle: mapped.bannerTitle,
    bannerSub: mapped.bannerSub,
    iconKey: mapped.iconKey,
    gradient: mapped.gradient,
  };
}

const INTERNSHIP_KM_MAP = {
  "full-stack developer intern": {
    titleKm: "កម្មសិក្សាផ្នែកអភិវឌ្ឍន៍វេបសាយ Full-Stack",
    descKm: "ចូលរួមអភិវឌ្ឍប្រព័ន្ធគេហទំព័រទំនើបជាមួយ React.js, Node.js និង MySQL ក្រោមការណែនាំផ្ទាល់ពីវិស្វករជំនាញ។",
    locationKm: "ភ្នំពេញ · Hybrid",
    skills: ["React.js", "Node.js", "MySQL"],
    stipend: "$200/ខែ",
    stipendEn: "$200/mo",
  },
  "junior security analyst": {
    titleKm: "អ្នកវិភាគសន្តិសុខសាយប័រ និងប្រព័ន្ធ IT (Junior)",
    descKm: "ត្រួតពិនិត្យសុវត្ថិភាពបណ្តាញ វិភាគហានិភ័យប្រព័ន្ធឌីជីថល និងអនុវត្តស្តង់ដារសុវត្ថិភាពព័ត៌មាន។",
    locationKm: "ភ្នំពេញ · ពេញម៉ោង",
    skills: ["Cybersecurity", "Network", "IT Audit"],
    stipend: "$250/ខែ",
    stipendEn: "$250/mo",
  },
  "frontend developer intern": {
    titleKm: "កម្មសិក្សាផ្នែកអភិវឌ្ឍន៍គេហទំព័រ Frontend",
    descKm: "បង្កើតផ្ទៃគេហទំព័រ Responsive ស្អាត និងរហ័ស ដោយប្រើប្រាស់ HTML, CSS, JavaScript និង React.js។",
    locationKm: "ភ្នំពេញ · Hybrid",
    skills: ["React.js", "JavaScript", "CSS UI"],
    stipend: "$180/ខែ",
    stipendEn: "$180/mo",
  },
  "data science intern": {
    titleKm: "កម្មសិក្សាផ្នែកវិភាគទិន្នន័យ Data & BI",
    descKm: "សម្អាត និងវិភាគទិន្នន័យអាជីវកម្មដោយប្រើ SQL, Python និងរៀបចំរបាយការណ៍ Dashboard។",
    locationKm: "ភ្នំពេញ · Remote",
    skills: ["Python", "SQL", "Power BI"],
    stipend: "$190/ខែ",
    stipendEn: "$190/mo",
  },
  "digital marketing intern": {
    titleKm: "កម្មសិក្សាផ្នែកទីផ្សារឌីជីថល និងមាតិកា",
    descKm: "រៀបចំយុទ្ធនាការផ្សព្វផ្សាយឌីជីថល គ្រប់គ្រងមាតិកាបណ្តាញសង្គម និងវាស់វែងលទ្ធផល SEO។",
    locationKm: "ពីចម្ងាយ · Remote",
    skills: ["Digital Marketing", "SEO", "Content"],
    stipend: "$160/ខែ",
    stipendEn: "$160/mo",
  },
};

export function enrichInternshipRecord(job, idx = 0) {
  const titleKey = String(job?.title || "").trim().toLowerCase();
  const mapped = INTERNSHIP_KM_MAP[titleKey];
  const rawSkills = Array.isArray(job?.skills)
    ? job.skills
    : typeof job?.skills === "string"
      ? job.skills.split(",").map((s) => s.trim()).filter(Boolean)
      : mapped?.skills || ["React.js", "Git", "Teamwork"];

  const rawLoc = String(job?.location || "Phnom Penh");
  const locKm =
    mapped?.locationKm ||
    (rawLoc.toLowerCase().includes("phnom penh")
      ? "ភ្នំពេញ · Hybrid"
      : rawLoc.toLowerCase().includes("remote")
        ? "ពីចម្ងាយ · Remote"
        : "ភ្នំពេញ · កម្ពុជា");

  return {
    id: job?.id || `job-${idx}`,
    titleKm: job?.titleKm || mapped?.titleKm || "កម្មសិក្សាផ្នែកបច្ចេកវិទ្យា និងឌីជីថល",
    titleEn: job?.title || "Software & Digital Tech Intern",
    descKm: job?.descriptionKm || mapped?.descKm || "ឱកាសហាត់ការអនុវត្តផ្ទាល់លើគម្រោងជាក់ស្តែងជាមួយក្រុមការងារជំនាញ។",
    descEn: job?.description || "Hands-on internship opportunity working on real projects.",
    company: job?.companyName || job?.company || "Angkor Tech Ventures",
    locationKm: locKm,
    locationEn: rawLoc.includes("New York") || rawLoc.includes("San Francisco") ? "Phnom Penh · Hybrid" : rawLoc,
    stipendKm: mapped?.stipend || "$180/ខែ",
    stipendEn: job?.stipend || job?.salaryRange || mapped?.stipendEn || "$180/mo",
    verified: job?.isVerified !== undefined ? Boolean(job.isVerified) : true,
    skills: rawSkills.slice(0, 3),
  };
}

export const SESSION_KM_MAP = {
  "build a job-ready react portfolio": {
    titleKm: "សិក្ខាសាលាផ្ទាល់៖ បង្កើតគម្រោង React.js សម្រាប់ដាក់ក្នុង Portfolio",
    descKm: "វគ្គអនុវត្តផ្ទាល់ដើម្បីប្រែក្លាយគម្រោងសិក្សារបស់និស្សិត ទៅជាស្នាដៃ Portfolio អាជីពសម្រាប់ដាក់ពាក្យការងារ។",
    catKm: "ការសរសេរកូដ",
  },
  "building resilient node.js apis": {
    titleKm: "ការបង្កើតប្រព័ន្ធ Node.js & Express API ឱ្យមានសុវត្ថិភាពខ្ពស់",
    descKm: "សិក្សាផ្ទាល់អំពីការភ្ជាប់ Database Pooling, ការគ្រប់គ្រងកំហុស (Error Handling) និងការការពារសុវត្ថិភាព API។",
    catKm: "Backend & API",
  },
  "cv and interview clinic for internships": {
    titleKm: "វគ្គពិនិត្យកែលម្អ PDF CV និងតិចនិកសម្ភាសន៍ការងារកម្មសិក្សា",
    descKm: "ពិនិត្យទម្រង់ CV ឱ្យត្រូវស្តង់ដារ ATS រៀបចំការបង្ហាញគម្រោងស្នាដៃ និងហាត់ឆ្លើយសំណួរសម្ភាសន៍ផ្ទាល់។",
    catKm: "ត្រៀមអាជីព",
  },
};

export function localizeSessionRecord(session, isKm = false) {
  if (!isKm || !session) return session;
  const key = String(session.title || "").trim().toLowerCase();
  const mapped = SESSION_KM_MAP[key];
  return {
    ...session,
    displayTitle: mapped?.titleKm || session.titleKm || session.title,
    displayDesc:
      mapped?.descKm ||
      session.descriptionKm ||
      "ចូលរួមសិក្ខាសាលាផ្ទាល់តាមរយៈ Jitsi Meet ដើម្បីរៀនអនុវត្ត និងសួរ-ឆ្លើយផ្ទាល់ជាមួយអ្នកណែនាំជំនាញ។",
    displayCategory: mapped?.catKm || session.category,
  };
}

export const CAREER_PATH_KM_MAP = {
  "frontend developer": {
    titleKm: "អ្នកអភិវឌ្ឍគេហទំព័រ Frontend (Frontend Developer)",
    descKm:
      "រៀនបង្កើតផ្ទៃគេហទំព័រទំនើប រហ័ស និងងាយស្រួលប្រើប្រាស់ ដោយប្រើ HTML, CSS, JavaScript និង React.js។",
    categoryKm: "ការអភិវឌ្ឍវេបសាយ",
  },
  "backend developer": {
    titleKm: "វិស្វករប្រព័ន្ធ Backend & API (Backend Developer)",
    descKm:
      "រចនាប្រព័ន្ធម៉ាស៊ីនមេ API ប្រកបដោយសុវត្ថិភាព និងគ្រប់គ្រងទិន្នន័យ MySQL សម្រាប់កម្មវិធីខ្នាតធំ។",
    categoryKm: "វិស្វកម្មកម្មវិធី",
  },
  "data analyst": {
    titleKm: "អ្នកវិភាគទិន្នន័យអាជីវកម្ម (Data Analyst)",
    descKm:
      "ប្រែក្លាយទិន្នន័យឆៅទៅជារបាយការណ៍វិភាគ និងផ្ទាំង Dashboard សម្រាប់ជួយសម្រេចចិត្តក្នុងអាជីវកម្ម។",
    categoryKm: "វិទ្យាសាស្ត្រទិន្នន័យ",
  },
  "ui/ux designer": {
    titleKm: "អ្នករចនាបទពិសោធន៍អ្នកប្រើប្រាស់ (UX/UI Designer)",
    descKm:
      "សិក្សាពីតម្រូវការអ្នកប្រើប្រាស់ រៀបចំ Wireframe និងរចនាកម្មវិធីឌីជីថលដ៏ទាក់ទាញនៅក្នុង Figma។",
    categoryKm: "ការរចនាផលិតផល",
  },
};

