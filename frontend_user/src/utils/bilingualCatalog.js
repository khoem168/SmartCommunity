import heangChhengKhoemPhoto from "../assets/team/heang-chheng-khoem.jpg";
import hornPiseyPhoto from "../assets/team/horn-pisey.jpg";
import krySoranuthPhoto from "../assets/team/kry-soranuth.jpg";
import muyKalinPhoto from "../assets/team/muy-kalin.jpg";
import samrithRatanaPhoto from "../assets/team/samrith-ratana.jpg";

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
    youtubeId: "bMknfKXIFA8",
    thumbnailUrl: "https://i.ytimg.com/vi/bMknfKXIFA8/hqdefault.jpg",
    fallbackThumbnailUrl: "https://i.ytimg.com/vi/bMknfKXIFA8/hqdefault.jpg",
    gradient: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 55%, #0ea5e9 100%)",
    topics: ["React Hooks", "Component UI", "REST API"],
    outcomesKm: [
      "បង្កើត Reusable Components និងរចនាប្លង់ទំនើប",
      "គ្រប់គ្រង State និងប្រើប្រាស់ React Hooks",
      "រៀបចំទំព័រជាមួយ React Router",
      "ភ្ជាប់ទិន្នន័យជាមួយ REST API ជាក់ស្តែង",
    ],
    duration: "6 ម៉ោង",
    durationEn: "6h 15m",
    lessons: 12,
    price: 12,
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
    youtubeId: "Oe421EPjeBE",
    thumbnailUrl: "https://i.ytimg.com/vi/Oe421EPjeBE/hqdefault.jpg",
    fallbackThumbnailUrl: "https://i.ytimg.com/vi/Oe421EPjeBE/hqdefault.jpg",
    gradient: "linear-gradient(135deg, #064e3b 0%, #059669 55%, #10b981 100%)",
    topics: ["Node & Express", "JWT Auth", "MySQL API"],
    outcomesKm: [
      "រចនារចនាសម្ព័ន្ធ RESTful API ស្តង់ដារ",
      "ការពារសុវត្ថិភាពគណនីជាមួយ JWT Authentication",
      "ភ្ជាប់ និងគ្រប់គ្រងទិន្នន័យជាមួយ MySQL",
      "ត្រួតពិនិត្យទិន្នន័យ និងដោះស្រាយ Error ក្នុង Server",
    ],
    duration: "7 ម៉ោង",
    durationEn: "7h 30m",
    lessons: 14,
    price: 12,
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
    youtubeId: "c9Wg6Cb_YlU",
    thumbnailUrl: "https://i.ytimg.com/vi/c9Wg6Cb_YlU/hqdefault.jpg",
    fallbackThumbnailUrl: "https://i.ytimg.com/vi/c9Wg6Cb_YlU/hqdefault.jpg",
    gradient: "linear-gradient(135deg, #701a75 0%, #db2777 55%, #f43f5e 100%)",
    topics: ["Wireframing", "Design System", "Figma Prototype"],
    outcomesKm: [
      "វិភាគតម្រូវការអ្នកប្រើប្រាស់ និងគូស User Flow",
      "រៀបចំ Wireframe និង Layout Grid ស្តង់ដារ",
      "បង្កើត Design System (ពណ៌ អក្សរ និង Components)",
      "ធ្វើ Interactive Prototype ក្នុងកម្មវិធី Figma",
    ],
    duration: "5 ម៉ោង",
    durationEn: "5h 20m",
    lessons: 10,
    price: 12,
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
    youtubeId: "rfscVS0vtbw",
    thumbnailUrl: "https://i.ytimg.com/vi/rfscVS0vtbw/hqdefault.jpg",
    fallbackThumbnailUrl: "https://i.ytimg.com/vi/rfscVS0vtbw/hqdefault.jpg",
    gradient: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 52%, #eab308 100%)",
    topics: ["Python 3", "Pandas Data", "Visual Charts"],
    outcomesKm: [
      "ស្ទាត់ជំនាញមូលដ្ឋានគ្រឹះកូដ Python 3",
      "សម្អាត និងរៀបចំទិន្នន័យជាមួយ Pandas",
      "វិភាគទិន្នន័យចេញពីឯកសារ CSV និង Excel",
      "បង្កើតក្រាហ្វបង្ហាញទិន្នន័យ (Data Visualization)",
    ],
    duration: "6 ម៉ោង",
    durationEn: "6h 10m",
    lessons: 11,
    price: 12,
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
    youtubeId: "HXV3zeQKqGY",
    thumbnailUrl: "https://i.ytimg.com/vi/HXV3zeQKqGY/hqdefault.jpg",
    fallbackThumbnailUrl: "https://i.ytimg.com/vi/HXV3zeQKqGY/hqdefault.jpg",
    gradient: "linear-gradient(135deg, #312e81 0%, #4f46e5 55%, #818cf8 100%)",
    topics: ["MySQL Schema", "SQL Joins", "Query Tuning"],
    outcomesKm: [
      "រចនា Relational Database Schema ត្រឹមត្រូវ",
      "សរសេរសំណួរ SQL SELECT, WHERE និង GROUP BY",
      "ភ្ជាប់តារាងទិន្នន័យច្រើនជាមួយ SQL Joins",
      "បង្កើនល្បឿនការទាញទិន្នន័យ (Query Optimization)",
    ],
    duration: "5 ម៉ោង",
    durationEn: "5h 00m",
    lessons: 9,
    price: 12,
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
    youtubeId: "RGOj5yH7evk",
    thumbnailUrl: "https://i.ytimg.com/vi/RGOj5yH7evk/hqdefault.jpg",
    fallbackThumbnailUrl: "https://i.ytimg.com/vi/RGOj5yH7evk/hqdefault.jpg",
    gradient: "linear-gradient(135deg, #0f172a 0%, #334155 55%, #ea580c 100%)",
    topics: ["Git Branching", "GitHub PRs", "Tech Portfolio"],
    outcomesKm: [
      "គ្រប់គ្រងកំណែប្រែកូដជាមួយ Git Commits & Branches",
      "សហការជាក្រុមតាមរយៈ Pull Requests លើ GitHub",
      "ដោះស្រាយបញ្ហា Merge Conflicts ដោយទំនុកចិត្ត",
      "រៀបចំ GitHub Profile សម្រាប់ដាក់ពាក្យការងារ",
    ],
    duration: "4 ម៉ោង",
    durationEn: "4h 00m",
    lessons: 8,
    price: 12,
  },
  "nextjs-fullstack-mastery": {
    slug: "nextjs-fullstack-mastery",
    titleKm: "ការអភិវឌ្ឍគេហទំព័រ Full-Stack ជាមួយ Next.js 14 & Server Actions",
    titleEn: "Next.js 14 Full-Stack Architecture & Server Actions",
    descKm:
      "ស្ទាត់ជំនាញ App Router, React Server Components (RSC), Server Actions, និងការបង្កើតគេហទំព័រពេញលេញជាមួយ Next.js 14។",
    descEn:
      "Master Next.js App Router, React Server Components, Server Actions, SSR/SSG, and full-stack production deployments.",
    category: "Frontend",
    catKm: "Frontend Web",
    catEn: "Frontend Web",
    level: "Intermediate",
    levelKm: "កម្រិតមធ្យម",
    levelEn: "Intermediate",
    bannerTitle: "Next.js 14 Full-Stack",
    bannerSub: "App Router · Server Actions · RSC",
    iconKey: "nextjs",
    youtubeId: "wm5gMKuwSYk",
    thumbnailUrl: "https://i.ytimg.com/vi/wm5gMKuwSYk/hqdefault.jpg",
    fallbackThumbnailUrl: "https://i.ytimg.com/vi/wm5gMKuwSYk/hqdefault.jpg",
    gradient: "linear-gradient(135deg, #09090b 0%, #27272a 55%, #0284c7 100%)",
    topics: ["Next.js 14", "Server Actions", "Full-Stack Web"],
    outcomesKm: [
      "ស្វែងយល់ស៊ីជម្រៅពី Next.js 14 App Router & Nested Layouts",
      "ប្រើប្រាស់ React Server Components និង Server Actions",
      "អនុវត្ត Route Handlers និង Middlewares ការពារសុវត្ថិភាព",
      "ដាក់ដំណើរការគេហទំព័រលើ Vercel Production",
    ],
    duration: "7 ម៉ោង",
    durationEn: "7h 20m",
    lessons: 10,
    price: 12,
  },
  "typescript-production-pro": {
    slug: "typescript-production-pro",
    titleKm: "ការសរសេរកូដ TypeScript កម្រិតអាជីពសម្រាប់គម្រោងធំៗ",
    titleEn: "TypeScript for Production Enterprise Applications",
    descKm:
      "សរសេរកូដប្រកបដោយទំនុកចិត្តជាមួយ Type Safety, Advanced Generics, Zod Validation និង Design Patterns ក្នុង TypeScript។",
    descEn:
      "Write robust, type-safe JavaScript with advanced generics, utility types, interfaces, Zod schema validation, and clean architecture.",
    category: "Frontend",
    catKm: "Frontend Web",
    catEn: "Frontend Web",
    level: "Intermediate",
    levelKm: "កម្រិតមធ្យម",
    levelEn: "Intermediate",
    bannerTitle: "TypeScript Enterprise",
    bannerSub: "Generics · Type Safety · Zod",
    iconKey: "typescript",
    youtubeId: "BwuLxPH8IDs",
    thumbnailUrl: "https://i.ytimg.com/vi/BwuLxPH8IDs/hqdefault.jpg",
    fallbackThumbnailUrl: "https://i.ytimg.com/vi/BwuLxPH8IDs/hqdefault.jpg",
    gradient: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 55%, #60a5fa 100%)",
    topics: ["TypeScript Types", "Generics", "Zod Validation"],
    outcomesKm: [
      "យល់ដឹងច្បាស់ពី Type Inference, Interfaces & Types",
      "បង្កើត Reusable Functions ជាមួយ Advanced Generics",
      "ការពារ API Data ជាមួយ Zod Runtime Validation",
      "បំប្លែង JavaScript Project ទៅជា TypeScript ប្រកបដោយសុវត្ថិភាព",
    ],
    duration: "5 ម៉ោង",
    durationEn: "5h 15m",
    lessons: 8,
    price: 12,
  },
  "tailwind-responsive-ui": {
    slug: "tailwind-responsive-ui",
    titleKm: "ការរចនាគេហទំព័រ Responsive ទំនើបជាមួយ Tailwind CSS",
    titleEn: "Modern Responsive UI & Landing Pages with Tailwind CSS",
    descKm:
      "រៀនរចនាផ្ទាំងទំព័រ Landing Page ទំនើប ស្រស់ស្អាត ដំណើរការបានល្អលើគ្រប់ទំហំអេក្រង់ (Responsive) និង Dark Mode។",
    descEn:
      "Build sleek, responsive user interfaces, fluid mobile layouts, animations, and dark mode themes using Tailwind CSS.",
    category: "Frontend",
    catKm: "Frontend Web",
    catEn: "Frontend Web",
    level: "Beginner",
    levelKm: "កម្រិតដំបូង",
    levelEn: "Beginner",
    bannerTitle: "Tailwind CSS Design",
    bannerSub: "Responsive · Flex/Grid · Dark Mode",
    iconKey: "tailwind",
    youtubeId: "ft30zcMlFao",
    thumbnailUrl: "https://i.ytimg.com/vi/ft30zcMlFao/hqdefault.jpg",
    fallbackThumbnailUrl: "https://i.ytimg.com/vi/ft30zcMlFao/hqdefault.jpg",
    gradient: "linear-gradient(135deg, #0e7490 0%, #06b6d4 55%, #38bdf8 100%)",
    topics: ["Tailwind Utility", "Responsive Layouts", "Dark Mode Theme"],
    outcomesKm: [
      "រចនាគេហទំព័ររហ័សទាន់ចិត្តជាមួយ Utility-first CSS",
      "កសាង Mobile-first Grid និង Flexbox Layouts",
      "កំណត់ Custom Themes, ពណ៌ និងពុម្ពអក្សរផ្ទាល់ខ្លួន",
      "បង្កើតមុខងារប្តូរ Dark Mode & Light Mode រលូន",
    ],
    duration: "4 ម៉ោង",
    durationEn: "4h 30m",
    lessons: 8,
    price: 12,
  },
  "nestjs-enterprise-backend": {
    slug: "nestjs-enterprise-backend",
    titleKm: "ការកសាងប្រព័ន្ធ Microservices ខ្នាតធំជាមួយ NestJS & TypeScript",
    titleEn: "NestJS Enterprise Microservices & Architecture",
    descKm:
      "ស្វែងយល់ពីរចនាសម្ព័ន្ធស្ថាបត្យកម្ម Backend ស្តង់ដារសហគ្រាសជាមួយ Dependency Injection, Prisma ORM, និង Microservices។",
    descEn:
      "Build enterprise-grade, maintainable backends with NestJS, TypeScript, Dependency Injection, Prisma ORM, and Microservices.",
    category: "Backend",
    catKm: "Backend & API",
    catEn: "Backend & API",
    level: "Advanced",
    levelKm: "កម្រិតខ្ពស់",
    levelEn: "Advanced",
    bannerTitle: "NestJS Microservices",
    bannerSub: "Enterprise Arch · Prisma · Queues",
    iconKey: "nestjs",
    youtubeId: "0M8AYU_hPas",
    thumbnailUrl: "https://i.ytimg.com/vi/0M8AYU_hPas/hqdefault.jpg",
    fallbackThumbnailUrl: "https://i.ytimg.com/vi/0M8AYU_hPas/hqdefault.jpg",
    gradient: "linear-gradient(135deg, #881337 0%, #e11d48 55%, #f43f5e 100%)",
    topics: ["NestJS Modular", "Prisma Database", "Microservices"],
    outcomesKm: [
      "រៀបចំស្ថាបត្យកម្ម Modular Enterprise Backend",
      "តភ្ជាប់ Database ប្រកបដោយ Type-safety ជាមួយ Prisma ORM",
      "បង្កើតប្រព័ន្ធផ្ទៀងផ្ទាត់ Authentication & Role Guards",
      "អភិវឌ្ឍ Event-driven Microservices ជាមួយ Message Queues",
    ],
    duration: "8 ម៉ោង",
    durationEn: "8h 45m",
    lessons: 12,
    price: 12,
  },
  "docker-devops-foundations": {
    slug: "docker-devops-foundations",
    titleKm: "មូលដ្ឋានគ្រឹះ Docker និងការគ្រប់គ្រង Containers សម្រាប់ Developer",
    titleEn: "Docker & Containerization Fundamentals for Developers",
    descKm:
      "វេចខ្ចប់កម្មវិធី (Containerize) ជាមួយ Dockerfile, Docker Compose, និងរៀបចំដំណើរការ CI/CD ស្វ័យប្រវត្តិកម្រិតអាជីព។",
    descEn:
      "Package, distribute, and orchestrate web applications using Docker, Dockerfiles, Docker Compose, and CI/CD pipelines.",
    category: "Cloud",
    catKm: "Cloud & DevOps",
    catEn: "Cloud & DevOps",
    level: "Intermediate",
    levelKm: "កម្រិតមធ្យម",
    levelEn: "Intermediate",
    bannerTitle: "Docker & DevOps",
    bannerSub: "Containers · Compose · CI/CD",
    iconKey: "docker",
    youtubeId: "fqMOX6JJhGo",
    thumbnailUrl: "https://i.ytimg.com/vi/fqMOX6JJhGo/hqdefault.jpg",
    fallbackThumbnailUrl: "https://i.ytimg.com/vi/fqMOX6JJhGo/hqdefault.jpg",
    gradient: "linear-gradient(135deg, #0369a1 0%, #0284c7 55%, #38bdf8 100%)",
    topics: ["Docker Containers", "Docker Compose", "CI/CD Pipeline"],
    outcomesKm: [
      "យល់ដឹងពីបច្ចេកវិទ្យា Containers និងប្រព័ន្ធឯករាជ្យ",
      "សរសេរ Dockerfile ខ្នាតស្រាល និងមានសុវត្ថិភាពខ្ពស់",
      "ដំណើរការប្រព័ន្ធពហុសេវាកម្មជាមួយ Docker Compose",
      "ស្ទាត់ជំនាញ Deploy កូដទៅ Cloud ដោយស្វ័យប្រវត្តិ",
    ],
    duration: "5 ម៉ោង",
    durationEn: "5h 10m",
    lessons: 8,
    price: 12,
  },
  "aws-cloud-deployment": {
    slug: "aws-cloud-deployment",
    titleKm: "ការដាក់ដំណើរការប្រព័ន្ធលើ Cloud AWS & Serverless Architecture",
    titleEn: "AWS Cloud Practitioner & Serverless Web Deployment",
    descKm:
      "ដាក់ឱ្យដំណើរការគេហទំព័រលើ Amazon Web Services (AWS) ជាមួយ S3, CloudFront CDN, EC2 Virtual Servers និង Serverless Lambda។",
    descEn:
      "Deploy and manage reliable cloud infrastructure using AWS S3, CloudFront, EC2, Lambda Serverless, and RDS databases.",
    category: "Cloud",
    catKm: "Cloud & DevOps",
    catEn: "Cloud & DevOps",
    level: "Intermediate",
    levelKm: "កម្រិតមធ្យម",
    levelEn: "Intermediate",
    bannerTitle: "AWS Cloud Deployment",
    bannerSub: "EC2 · S3 CDN · Lambda Serverless",
    iconKey: "aws",
    youtubeId: "k1RI5locZE4",
    thumbnailUrl: "https://i.ytimg.com/vi/k1RI5locZE4/hqdefault.jpg",
    fallbackThumbnailUrl: "https://i.ytimg.com/vi/k1RI5locZE4/hqdefault.jpg",
    gradient: "linear-gradient(135deg, #1e293b 0%, #f59e0b 55%, #d97706 100%)",
    topics: ["AWS Core", "Serverless Lambda", "Cloud Security"],
    outcomesKm: [
      "រៀបចំប្រព័ន្ធសុវត្ថិភាព IAM និង AWS Account",
      "ដាក់ឱ្យដំណើរការ Static Web លើ S3 & CloudFront",
      "គ្រប់គ្រង Virtual Server ជាមួយ EC2 & Reverse Proxy",
      "បង្កើត Serverless APIs ជាមួយ AWS Lambda",
    ],
    duration: "6 ម៉ោង",
    durationEn: "6h 30m",
    lessons: 10,
    price: 12,
  },
  "flutter-cross-platform": {
    slug: "flutter-cross-platform",
    titleKm: "ការបង្កើតកម្មវិធីទូរស័ព្ទ iOS & Android ជាមួយ Flutter & Dart",
    titleEn: "Flutter & Dart Mobile App Development for iOS & Android",
    descKm:
      "សរសេរកូដម្តង ដំណើរការបានទាំងលើ iPhone និង Android ជាមួយ Flutter SDK, State Management, និងការភ្ជាប់ REST API។",
    descEn:
      "Build high-performance, beautiful native mobile applications for iOS and Android from a single codebase with Flutter and Dart.",
    category: "Mobile",
    catKm: "កម្មវិធីទូរស័ព្ទ (Mobile)",
    catEn: "Mobile Development",
    level: "Beginner",
    levelKm: "កម្រិតដំបូង",
    levelEn: "Beginner",
    bannerTitle: "Flutter Mobile Dev",
    bannerSub: "iOS & Android · Dart · State Mgmt",
    iconKey: "flutter",
    youtubeId: "VPvVD8t02U8",
    thumbnailUrl: "https://i.ytimg.com/vi/VPvVD8t02U8/hqdefault.jpg",
    fallbackThumbnailUrl: "https://i.ytimg.com/vi/VPvVD8t02U8/hqdefault.jpg",
    gradient: "linear-gradient(135deg, #0284c7 0%, #06b6d4 55%, #38bdf8 100%)",
    topics: ["Flutter SDK", "Dart Syntax", "Cross-Platform Mobile"],
    outcomesKm: [
      "ចេះសរសេរភាសា Dart និងរៀបចំ Flutter Environment",
      "រចនាទម្រង់កម្មវិធីទូរស័ព្ទទំនើបជាមួយ Flutter Widgets",
      "គ្រប់គ្រង State កម្មវិធីប្រកបដោយប្រសិទ្ធភាព",
      "ទាញយកទិន្នន័យពី Internet និង Build APK ចែកចាយ",
    ],
    duration: "8 ម៉ោង",
    durationEn: "8h 15m",
    lessons: 14,
    price: 12,
  },
  "react-native-expo": {
    slug: "react-native-expo",
    titleKm: "ការបង្កើត Mobile App ជាមួយ React Native & Expo ស្តង់ដារ",
    titleEn: "React Native & Expo: Native Mobile Development",
    descKm:
      "ទាញយកប្រយោជន៍ពីចំណេះដឹង React មកបង្កើត Mobile Apps សម្រាប់ iOS & Android ជាមួយ Expo និង React Navigation។",
    descEn:
      "Leverage your React skills to build production-ready iOS and Android mobile apps with Expo, React Navigation, and gesture animations.",
    category: "Mobile",
    catKm: "កម្មវិធីទូរស័ព្ទ (Mobile)",
    catEn: "Mobile Development",
    level: "Intermediate",
    levelKm: "កម្រិតមធ្យម",
    levelEn: "Intermediate",
    bannerTitle: "React Native & Expo",
    bannerSub: "Cross Platform · Navigation · Device APIs",
    iconKey: "react-native",
    youtubeId: "0-S5a0eXPoc",
    thumbnailUrl: "https://i.ytimg.com/vi/0-S5a0eXPoc/hqdefault.jpg",
    fallbackThumbnailUrl: "https://i.ytimg.com/vi/0-S5a0eXPoc/hqdefault.jpg",
    gradient: "linear-gradient(135deg, #1e1b4b 0%, #4338ca 55%, #6366f1 100%)",
    topics: ["React Native", "Expo Tools", "Mobile Navigation"],
    outcomesKm: [
      "ប្រើប្រាស់ Expo CLI បង្កើតកម្មវិធីទូរស័ព្ទយ៉ាងលឿន",
      "រៀបចំប្រព័ន្ធ Navigation (Tabs, Stacks & Drawers)",
      "ប្រើប្រាស់ Hardware Device ដូចជា Camera & Storage",
      "Build និងត្រៀម Publish ទៅកាន់ App Store & Google Play",
    ],
    duration: "7 ម៉ោង",
    durationEn: "7h 00m",
    lessons: 11,
    price: 12,
  },
  "ai-prompt-engineering-copilot": {
    slug: "ai-prompt-engineering-copilot",
    titleKm: "ការប្រើប្រាស់ Generative AI, Prompt Engineering & បង្កើត AI Apps",
    titleEn: "Generative AI, Prompt Engineering & LLM Application Building",
    descKm:
      "ស្ទាត់ជំនាញប្រើប្រាស់បច្ចេកវិទ្យា AI ជំនាន់ថ្មី, Prompt Engineering កម្រិតខ្ពស់, និងការភ្ជាប់ Gemini/OpenAI API ក្នុងគេហទំព័រ។",
    descEn:
      "Harness generative AI, structured prompt engineering, OpenAI/Gemini APIs, and build intelligent AI assistants and chatbots.",
    category: "AI & Data",
    catKm: "បញ្ញាសិប្បនិម្មិត & ទិន្នន័យ",
    catEn: "AI & Data",
    level: "Beginner",
    levelKm: "កម្រិតដំបូង",
    levelEn: "Beginner",
    bannerTitle: "Generative AI & LLMs",
    bannerSub: "Prompt Engineering · Gemini API · RAG",
    iconKey: "ai",
    youtubeId: "jC4v5AS4RIM",
    thumbnailUrl: "https://i.ytimg.com/vi/jC4v5AS4RIM/hqdefault.jpg",
    fallbackThumbnailUrl: "https://i.ytimg.com/vi/jC4v5AS4RIM/hqdefault.jpg",
    gradient: "linear-gradient(135deg, #581c87 0%, #7e22ce 55%, #a855f7 100%)",
    topics: ["Prompt Engineering", "Gemini & OpenAI API", "AI Chatbot Apps"],
    outcomesKm: [
      "សរសេរ Prompt ប្រកបដោយប្រសិទ្ធភាពខ្ពស់ គ្មានភាពច្រឡំ",
      "ភ្ជាប់ Google Gemini និង OpenAI APIs ទៅក្នុង Web App",
      "យល់ដឹងពីគោលការណ៍ RAG និង Vector Embeddings",
      "កសាង AI Chatbot និងជំនួយការឆ្លាតវៃសម្រាប់អាជីវកម្ម",
    ],
    duration: "4 ម៉ោង",
    durationEn: "4h 45m",
    lessons: 7,
    price: 12,
  },
  "machine-learning-python": {
    slug: "machine-learning-python",
    titleKm: "មូលដ្ឋានគ្រឹះ Machine Learning ជាមួយ Python & Scikit-Learn",
    titleEn: "Machine Learning with Python & Scikit-Learn",
    descKm:
      "រៀនក្បួនដោះស្រាយ Supervised & Unsupervised Learning, ការបង្វឹក Model (Training), និងការវាស់ស្ទង់ភាពត្រឹមត្រូវនៃទិន្នន័យ។",
    descEn:
      "Learn core supervised and unsupervised machine learning algorithms, model training, feature engineering, and evaluation.",
    category: "AI & Data",
    catKm: "បញ្ញាសិប្បនិម្មិត & ទិន្នន័យ",
    catEn: "AI & Data",
    level: "Intermediate",
    levelKm: "កម្រិតមធ្យម",
    levelEn: "Intermediate",
    bannerTitle: "Machine Learning Python",
    bannerSub: "Scikit-Learn · Model Training · FastAPI",
    iconKey: "ml",
    youtubeId: "7eh4d6sabA0",
    thumbnailUrl: "https://i.ytimg.com/vi/7eh4d6sabA0/hqdefault.jpg",
    fallbackThumbnailUrl: "https://i.ytimg.com/vi/7eh4d6sabA0/hqdefault.jpg",
    gradient: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 55%, #10b981 100%)",
    topics: ["Machine Learning", "Scikit-Learn", "Model Deployment"],
    outcomesKm: [
      "យល់ដឹងពី Workflow នៃ Machine Learning ទាំងមូល",
      "បង្វឹក Regression និង Classification Models",
      "រៀបចំទិន្នន័យ និងកាត់បន្ថយបញ្ហា Overfitting",
      "ដាក់ដំណើរការ Model តាមរយៈ FastAPI Endpoints",
    ],
    duration: "7 ម៉ោង",
    durationEn: "7h 30m",
    lessons: 12,
    price: 12,
  },
  "cybersecurity-network-defense": {
    slug: "cybersecurity-network-defense",
    titleKm: "មូលដ្ឋានគ្រឹះសន្តិសុខសាយប័រ និងការការពារបណ្តាញ Network",
    titleEn: "Cybersecurity Fundamentals & Practical Network Defense",
    descKm:
      "ស្វែងយល់ពីរបៀបវាយប្រហាររបស់ Hacker, ការវិភាគកញ្ចប់ទិន្នន័យ Wireshark, ប្រព័ន្ធកូដនីយកម្ម (Cryptography) និងការការពារ Server។",
    descEn:
      "Understand network security architecture, vulnerability assessment, cryptography fundamentals, and defending enterprise systems.",
    category: "Security",
    catKm: "សន្តិសុខសាយប័រ",
    catEn: "Cybersecurity",
    level: "Beginner",
    levelKm: "កម្រិតដំបូង",
    levelEn: "Beginner",
    bannerTitle: "Cybersecurity Defense",
    bannerSub: "Network Security · Wireshark · Firewalls",
    iconKey: "security",
    youtubeId: "inWWhr5tnEA",
    thumbnailUrl: "https://i.ytimg.com/vi/inWWhr5tnEA/hqdefault.jpg",
    fallbackThumbnailUrl: "https://i.ytimg.com/vi/inWWhr5tnEA/hqdefault.jpg",
    gradient: "linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #ef4444 100%)",
    topics: ["Cyber Threats", "Network Traffic", "Server Hardening"],
    outcomesKm: [
      "ស្គាល់ច្បាស់ពីទម្រង់វាយប្រហារ (Malware, Phishing, DDoS)",
      "វិភាគចរាចរណ៍បណ្តាញ Network ជាមួយ Wireshark",
      "យល់ដឹងពី SSL/TLS Certificates និង Encryption",
      "ពង្រឹងសុវត្ថិភាព Linux Server និងកំណត់ Firewall",
    ],
    duration: "6 ម៉ោង",
    durationEn: "6h 00m",
    lessons: 9,
    price: 12,
  },
  "web-penetration-testing": {
    slug: "web-penetration-testing",
    titleKm: "ការធ្វើតេស្តសុវត្ថិភាពគេហទំព័រ (Penetration Testing) & OWASP",
    titleEn: "Web Application Penetration Testing & OWASP Top 10",
    descKm:
      "អនុវត្តស្វែងរកចន្លោះប្រហោងសុវត្ថិភាព (Pen-testing) ដូចជា SQL Injection, XSS, CSRF ដោយប្រើ Burp Suite និងរបៀបការពារ។",
    descEn:
      "Identify, exploit, and remediate critical web application vulnerabilities including SQL injection, XSS, CSRF, and broken access controls.",
    category: "Security",
    catKm: "សន្តិសុខសាយប័រ",
    catEn: "Cybersecurity",
    level: "Advanced",
    levelKm: "កម្រិតខ្ពស់",
    levelEn: "Advanced",
    bannerTitle: "Web Pentesting & OWASP",
    bannerSub: "Burp Suite · SQLi · Secure Coding",
    iconKey: "security",
    youtubeId: "2_lswM1S264",
    thumbnailUrl: "https://i.ytimg.com/vi/2_lswM1S264/hqdefault.jpg",
    fallbackThumbnailUrl: "https://i.ytimg.com/vi/2_lswM1S264/hqdefault.jpg",
    gradient: "linear-gradient(135deg, #18181b 0%, #27272a 55%, #dc2626 100%)",
    topics: ["OWASP Top 10", "Burp Suite", "Ethical Hacking"],
    outcomesKm: [
      "ស្ទាត់ជំនាញប្រើប្រាស់កម្មវិធី Burp Suite Interceptor",
      "ស្វែងរក និងទប់ស្កាត់ចន្លោះប្រហោង SQL Injection & XSS",
      "វាយតម្លៃសន្តិសុខប្រព័ន្ធ Authentication & Session Management",
      "សរសេររបាយការណ៍សវនកម្មសុវត្ថិភាពស្តង់ដារវិជ្ជាជីវៈ",
    ],
    duration: "8 ម៉ោង",
    durationEn: "8h 30m",
    lessons: 12,
    price: 12,
  },
  "advanced-figma-design-systems": {
    slug: "advanced-figma-design-systems",
    titleKm: "ការកសាង Design Systems ខ្នាតធំ & Auto Layout កម្រិតខ្ពស់ក្នុង Figma",
    titleEn: "Advanced Design Systems & Auto Layout in Figma",
    descKm:
      "រៀបចំ Design Tokens, Variables, Component Variants, និងការប្រគល់ឯកសាររចនាទៅកាន់ Developer ប្រកបដោយភាពរលូន។",
    descEn:
      "Create scalable, token-based design systems with Figma variables, component variants, smart animations, and developer handoff.",
    category: "Design",
    catKm: "ការរចនា UX/UI",
    catEn: "UX/UI Design",
    level: "Intermediate",
    levelKm: "កម្រិតមធ្យម",
    levelEn: "Intermediate",
    bannerTitle: "Advanced Figma Systems",
    bannerSub: "Design Tokens · Auto Layout 5.0 · Dev Mode",
    iconKey: "figma",
    youtubeId: "FTFaQWZBqQ8",
    thumbnailUrl: "https://i.ytimg.com/vi/FTFaQWZBqQ8/hqdefault.jpg",
    fallbackThumbnailUrl: "https://i.ytimg.com/vi/FTFaQWZBqQ8/hqdefault.jpg",
    gradient: "linear-gradient(135deg, #4c0519 0%, #be123c 55%, #fb7185 100%)",
    topics: ["Figma Variables", "Auto Layout 5.0", "Design Systems"],
    outcomesKm: [
      "កសាង Architecture Design Tokens កម្រិតខ្ពស់",
      "ប្រើប្រាស់ Auto Layout គ្រប់គ្រង Responsive UI ស្មុគស្មាញ",
      "រៀបចំ Interactive Variants និង Component Properties",
      "ប្រគល់ឯកសាររចនាទៅឱ្យ Developer តាមរយៈ Figma Dev Mode",
    ],
    duration: "5 ម៉ោង",
    durationEn: "5h 20m",
    lessons: 9,
    price: 12,
  },
  "tech-career-interview-prep": {
    slug: "tech-career-interview-prep",
    titleKm: "ការត្រៀមខ្លួនសម្ភាសន៍ការងារ IT, Coding Tests & ការកសាងអាជីព",
    titleEn: "Software Engineer Technical Interview & Career Mastery",
    descKm:
      "រៀបចំយុទ្ធសាស្ត្រឆ្លើយសម្ភាសន៍បច្ចេកទេស ដោះស្រាយលំហាត់ Algorithms, System Design និងការចរចាប្រាក់បៀវត្សរ៍ទទួលបានជោគជ័យ។",
    descEn:
      "Prepare for coding interviews, algorithm challenges, system design discussions, resume optimization, and salary negotiations.",
    category: "Career",
    catKm: "ត្រៀមអាជីព IT",
    catEn: "Career Prep",
    level: "All",
    levelKm: "គ្រប់កម្រិត",
    levelEn: "All Levels",
    bannerTitle: "Tech Interview Mastery",
    bannerSub: "Live Coding · System Design · Negotiation",
    iconKey: "career",
    youtubeId: "1qw5ITr3k9E",
    thumbnailUrl: "https://i.ytimg.com/vi/1qw5ITr3k9E/hqdefault.jpg",
    fallbackThumbnailUrl: "https://i.ytimg.com/vi/1qw5ITr3k9E/hqdefault.jpg",
    gradient: "linear-gradient(135deg, #111827 0%, #1f2937 55%, #3b82f6 100%)",
    topics: ["Technical Interviews", "System Design", "Salary Negotiation"],
    outcomesKm: [
      "ស្វែងយល់ពីរបៀបដែលក្រុមហ៊ុនបច្ចេកវិទ្យាវាយតម្លៃបេក្ខជន",
      "ពូកែដោះស្រាយបញ្ហាកូដ និងពន្យល់ Logic បានក្បោះក្បាយ",
      "ឆ្លើយសំនួរ Behavioral Interviews តាមទម្រង់ STAR",
      "មានទំនុកចិត្តក្នុងការចរចាប្រាក់បៀវត្សរ៍ និងឱកាសការងារល្អៗ",
    ],
    duration: "4 ម៉ោង",
    durationEn: "4h 15m",
    lessons: 8,
    price: 12,
  },
};

const LEVEL_KM_MAP = {
  beginner: "កម្រិតដំបូង",
  intermediate: "កម្រិតមធ្យម",
  advanced: "កម្រិតខ្ពស់",
  all: "គ្រប់កម្រិត",
};

const CATEGORY_KM_MAP = {
  frontend: "Frontend Web",
  backend: "Backend & API",
  design: "ការរចនា UX/UI",
  data: "ទិន្នន័យ & Python",
  cloud: "Cloud & DevOps",
  mobile: "កម្មវិធីទូរស័ព្ទ (Mobile)",
  "ai & data": "បញ្ញាសិប្បនិម្មិត & ទិន្នន័យ",
  ai: "បញ្ញាសិប្បនិម្មិត (AI)",
  security: "សន្តិសុខសាយប័រ",
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
  const normalizedCat = String(mapped.category || rawCourse?.category || "Frontend");

  return {
    ...rawCourse,
    id: rawCourse?.id || mapped.slug,
    slug: slug || mapped.slug,
    titleKm: rawCourse?.titleKm || mapped.titleKm,
    titleEn: rawCourse?.title || mapped.titleEn,
    descKm: rawCourse?.descriptionKm || mapped.descKm,
    descEn: rawCourse?.description || mapped.descEn,
    category: normalizedCat,
    catKm: mapped.catKm || CATEGORY_KM_MAP[normalizedCat.toLowerCase()] || normalizedCat,
    catEn: mapped.catEn || normalizedCat,
    level: rawLevel.charAt(0).toUpperCase() + rawLevel.slice(1),
    levelKm: LEVEL_KM_MAP[rawLevel] || mapped.levelKm,
    levelEn: mapped.levelEn,
    price: 12,
    currency: "USD",
    youtubeId: mapped.youtubeId,
    thumbnailUrl: mapped.thumbnailUrl || rawCourse?.thumbnailUrl || mapped.fallbackThumbnailUrl,
    fallbackThumbnailUrl: mapped.fallbackThumbnailUrl || rawCourse?.thumbnailUrl,
    lessons: Number(rawCourse?.lessonCount || rawCourse?.lessons?.length || mapped.lessons),
    durationKm: mapped.duration,
    durationEn: rawCourse?.duration || mapped.durationEn,
    topics:
      Array.isArray(rawCourse?.topics) && rawCourse.topics.length > 0
        ? rawCourse.topics.slice(0, 3)
        : mapped.topics,
    outcomesKm: mapped.outcomesKm || [],
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
  "ui/ux review: make your final project feel professional": {
    titleKm: "វគ្គពិនិត្យកែលម្អ UX/UI៖ រៀបចំគម្រោងបញ្ចប់ការសិក្សាឱ្យមានស្តង់ដារអាជីព",
    descKm: "សិក្សាផ្ទាល់ពីរបៀបរៀបចំគម្លាត អក្សរ ពណ៌ និង User Flow ក្នុង Figma ដើម្បីឱ្យគម្រោងរបស់អ្នកមើលទៅស្អាតដូចផលិតផលពិត។",
    catKm: "ការរចនា UX/UI",
  },
};

export function localizeSessionRecord(session, isKm = false) {
  if (!session) return session;
  const hostInfo = localizeMentorRecord(
    {
      name: session.hostName,
      avatar_url: session.hostAvatarUrl,
      title: session.hostTitle,
    },
    isKm,
  );
  if (!isKm) {
    return {
      ...session,
      hostAvatarUrl: hostInfo.avatarUrl || session.hostAvatarUrl,
      hostTitle: hostInfo.displayTitle || session.hostTitle,
    };
  }
  const key = String(session.title || "").trim().toLowerCase();
  const mapped = SESSION_KM_MAP[key];
  return {
    ...session,
    hostAvatarUrl: hostInfo.avatarUrl || session.hostAvatarUrl,
    hostTitle: hostInfo.displayTitle || session.hostTitle,
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


export const FEATURED_MENTORS_ROSTER = [
  {
    id: 101,
    name: "MUY KALIN",
    title: "Lead Frontend Engineer",
    company: "Smart Community",
    avatar: muyKalinPhoto,
    avatar_url: muyKalinPhoto,
    bioKm: "អ្នកជំនាញបង្កើតគេហទំព័រទំនើបជាមួយ React.js, Tailwind CSS និងជួយរៀបចំគម្រោង Portfolio ដាក់ពាក្យការងារ។",
    bioEn: "Lead Frontend Engineer specializing in React.js, modern UI/UX architecture, and portfolio review.",
    skills: ["React.js", "Tailwind CSS", "JavaScript"],
    rating: 5.0,
    reviewCount: 18,
    sessions: 24,
    location: "Phnom Penh, Cambodia",
  },
  {
    id: 102,
    name: "Vannak Seng",
    title: "Senior Cloud Architect",
    company: "CloudScale Asia",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
    bioKm: "អ្នកជំនាញរៀបចំ Cloud Infrastructure (AWS, Docker, CI/CD) និងជួយណែនាំការបង្កើតប្រព័ន្ធស្វ័យប្រវត្តិកម្ម។",
    bioEn: "Senior Cloud Architect focusing on AWS, Docker, Kubernetes, and automated deployment pipelines.",
    skills: ["Cloud & AWS", "Docker", "Linux"],
    rating: 4.9,
    reviewCount: 14,
    sessions: 19,
    location: "Phnom Penh, Cambodia",
  },
  {
    id: 103,
    name: "KRY SORANUTH",
    title: "Senior Backend Engineer",
    company: "Angkor Tech",
    avatar: krySoranuthPhoto,
    avatar_url: krySoranuthPhoto,
    bioKm: "អ្នកជំនាញស្ថាបត្យកម្ម Node.js & Express API, ប្រព័ន្ធសុវត្ថិភាព JWT និងការគ្រប់គ្រង MySQL Database។",
    bioEn: "Backend specialist with deep experience in Node.js, RESTful APIs, JWT security, and MySQL optimization.",
    skills: ["Node.js", "MySQL", "Express API"],
    rating: 4.9,
    reviewCount: 12,
    sessions: 16,
    location: "Phnom Penh, Cambodia",
  },
  {
    id: 104,
    name: "HORN PISEY",
    title: "Lead UX/UI Designer",
    company: "Creative Studio",
    avatar: hornPiseyPhoto,
    avatar_url: hornPiseyPhoto,
    bioKm: "អ្នករចនាបទពិសោធន៍អ្នកប្រើប្រាស់ក្នុង Figma ជួយពិនិត្យកែលម្អ Design System, User Flow និង Portfolio។",
    bioEn: "Lead product designer helping students master Figma, user flows, interactive prototypes, and design systems.",
    skills: ["UX/UI Design", "Figma", "Design System"],
    rating: 5.0,
    reviewCount: 15,
    sessions: 21,
    location: "Phnom Penh, Cambodia",
  },
  {
    id: 105,
    name: "SAMRITH RATANA",
    title: "Senior Data Analyst",
    company: "DataKhmer Labs",
    avatar: samrithRatanaPhoto,
    avatar_url: samrithRatanaPhoto,
    bioKm: "អ្នកឯកទេសវិភាគទិន្នន័យដោយប្រើ Python, SQL និង Machine Learning ជាក់ស្តែងសម្រាប់អាជីវកម្ម។",
    bioEn: "Data Analytics specialist teaching practical Python, SQL queries, dashboarding, and business intelligence.",
    skills: ["Python", "SQL", "Data Analysis"],
    rating: 4.8,
    reviewCount: 10,
    sessions: 15,
    location: "Phnom Penh, Cambodia",
  },
  {
    id: 106,
    name: "HEANG CHHENG KHOEM",
    title: "Community Tech Mentor",
    company: "CMU Research Lab",
    avatar: heangChhengKhoemPhoto,
    avatar_url: heangChhengKhoemPhoto,
    bioKm: "អ្នកស្រាវជ្រាវ និងណែនាំបច្ចេកវិទ្យាសហគមន៍ ជួយណែនាំពីមូលដ្ឋានគ្រឹះកូដរហូតដល់ត្រៀមខ្លួនសម្ភាសន៍។",
    bioEn: "Community Tech Mentor guiding students from zero fundamentals to job-ready portfolio projects.",
    skills: ["Full-Stack", "Git & GitHub", "Mentorship"],
    rating: 5.0,
    reviewCount: 22,
    sessions: 30,
    location: "Phnom Penh, Cambodia",
  },
];

export function localizeMentorRecord(mentor, isKm = false) {
  if (!mentor) return {};
  const nameUpper = String(mentor.name || mentor.full_name || "").toUpperCase();
  const nameClean = nameUpper.replace(/[^A-Z]/g, "");

  let avatar = mentor.avatar_url || mentor.avatar;
  if (nameUpper.includes("KALIN")) avatar = muyKalinPhoto;
  else if (nameUpper.includes("SORANUTH")) avatar = krySoranuthPhoto;
  else if (nameUpper.includes("PISEY")) avatar = hornPiseyPhoto;
  else if (nameUpper.includes("RATANA")) avatar = samrithRatanaPhoto;
  else if (nameUpper.includes("HEANG") || nameUpper.includes("KHOEM")) avatar = heangChhengKhoemPhoto;
  else if (nameUpper.includes("VANNAK") || nameUpper.includes("SENG")) {
    avatar = avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80";
  }

  // Match by name first, NEVER fall back to arbitrary database ID mismatch
  const foundRoster = FEATURED_MENTORS_ROSTER.find((m) => {
    const rClean = m.name.toUpperCase().replace(/[^A-Z]/g, "");
    return rClean === nameClean || (nameClean.length > 3 && (rClean.includes(nameClean) || nameClean.includes(rClean)));
  }) || FEATURED_MENTORS_ROSTER.find((m) => String(m.id) === String(mentor.id));

  if (!isKm) {
    return {
      ...mentor,
      avatar,
      avatar_url: avatar,
      avatarUrl: avatar,
      skills: mentor.skills?.length ? mentor.skills : foundRoster?.skills || ["React.js", "Node.js", "Mentorship"],
      displayTitle: foundRoster?.title || (mentor.title
        ? mentor.title + (mentor.company ? " at " + mentor.company : "")
        : mentor.company || "Senior Mentor"),
      displayBio:
        foundRoster?.bioEn ||
        mentor.bio ||
        "Experienced industry professional helping students master practical engineering skills and career readiness.",
      displayLocation: mentor.location || "Phnom Penh, Cambodia",
      displaySessions: (mentor.sessions || foundRoster?.sessions || 12) + " sessions",
      rating: mentor.rating || foundRoster?.rating || 4.9,
      reviewCount: mentor.reviewCount || foundRoster?.reviewCount || 10,
    };
  }

  const titleKm = foundRoster?.title === "Lead Frontend Engineer" ? "វិស្វករ Frontend ជាន់ខ្ពស់"
    : foundRoster?.title === "Senior Cloud Architect" ? "ស្ថាបត្យករ Cloud ជាន់ខ្ពស់"
    : foundRoster?.title === "Senior Backend Engineer" ? "វិស្វករ Backend ជាន់ខ្ពស់"
    : foundRoster?.title === "Lead UX/UI Designer" ? "ប្រធានផ្នែករចនា UX/UI"
    : foundRoster?.title === "Senior Data Analyst" ? "អ្នកវិភាគទិន្នន័យជាន់ខ្ពស់"
    : "អ្នកណែនាំបច្ចេកវិទ្យាសហគមន៍";

  return {
    ...mentor,
    avatar,
    avatar_url: avatar,
    avatarUrl: avatar,
    skills: mentor.skills?.length ? mentor.skills : foundRoster?.skills || ["React.js", "Node.js", "Mentorship"],
    displayTitle: mentor.company || foundRoster?.company ? (titleKm + " · " + (mentor.company || foundRoster?.company)) : titleKm,
    displayBio:
      foundRoster?.bioKm ||
      mentor.bioKm ||
      mentor.bio ||
      "អ្នកជំនាញបច្ចេកវិទ្យាដែលមានបទពិសោធន៍ជាក់ស្តែងក្នុងការណែនាំនិស្សិតឱ្យចេះសរសេរកូដ រៀបចំគម្រោង Portfolio និងត្រៀមខ្លួនសម្ភាសន៍ការងារ។",
    displayLocation:
      String(mentor.location || "").toLowerCase().includes("siem reap")
        ? "សៀមរាប, កម្ពុជា"
        : "ភ្នំពេញ, កម្ពុជា",
    displaySessions: (mentor.sessions || foundRoster?.sessions || 12) + " វគ្គណែនាំ",
    rating: mentor.rating || foundRoster?.rating || 4.9,
    reviewCount: mentor.reviewCount || foundRoster?.reviewCount || 10,
  };
}

export function localizePeerHeadline(rawHeadline = "", isKm = false) {
  const key = String(rawHeadline || "").trim().toLowerCase();
  if (!isKm) {
    if (!key || key === "student" || key === "beginner") return "Tech Learner";
    if (key === "mentor") return "Senior Tech Mentor";
    if (key === "recruiter") return "Technical Talent Partner";
    return rawHeadline;
  }
  if (!key || key === "student" || key === "beginner" || key.includes("tech learner")) {
    return "និស្សិតបច្ចេកវិទ្យា (Tech Learner)";
  }
  if (key === "mentor" || key.includes("mentor")) {
    return "អ្នកណែនាំបច្ចេកវិទ្យា (Tech Mentor)";
  }
  if (key.includes("project builder") || key.includes("full-stack")) {
    return "អ្នកអភិវឌ្ឍន៍គម្រោង Full-Stack";
  }
  if (key.includes("design") || key.includes("content")) {
    return "អ្នកសិក្សាផ្នែករចនា UX/UI និងមាតិកា";
  }
  if (key.includes("backend") || key.includes("api")) {
    return "អ្នកសិក្សាប្រព័ន្ធ Backend & API";
  }
  if (key.includes("computer science")) {
    return "និស្សិតវិទ្យាសាស្ត្រកុំព្យូទ័រ (CS Student)";
  }
  if (key.includes("cyber") || key.includes("security")) {
    return "អ្នកសិក្សាសន្តិសុខសាយប័រ និងអាជីព IT";
  }
  if (key.includes("frontend")) {
    return "ដៃគូសិក្សាផ្នែកអភិវឌ្ឍន៍ Frontend";
  }
  if (key.includes("data")) {
    return "អ្នកសិក្សាវិភាគទិន្នន័យ (Data Learner)";
  }
  if (key.includes("mobile")) {
    return "អ្នកសិក្សាបង្កើតកម្មវិធីទូរស័ព្ទ";
  }
  if (key.includes("cloud") || key.includes("devops")) {
    return "អ្នកសិក្សាប្រព័ន្ធ Cloud & DevOps";
  }
  if (key.includes("talent") || key.includes("recruiter") || key.includes("hr")) {
    return "ប្រធានជ្រើសរើសបុគ្គលិកបច្ចេកទេស (Technical Talent Lead)";
  }
  return rawHeadline;
}

export function localizeNotificationRecord(notif, isKm = false) {
  if (!notif || !isKm) return notif;
  let title = String(notif.title || "");
  let message = String(notif.message || "");

  const titleLower = title.toLowerCase().trim();

  // 1. Precise Title Mappings (Khmer)
  if (titleLower === "new message" || titleLower.includes("new message")) {
    title = "សារសន្ទនាថ្មី";
  } else if (titleLower === "completion confirmation requested") {
    title = "ស្នើសុំបញ្ជាក់ការបញ្ចប់ការផ្លាស់ប្តូរជំនាញ";
  } else if (titleLower === "skill exchange completed") {
    title = "ការផ្លាស់ប្តូរជំនាញត្រូវបានបញ្ចប់";
  } else if (titleLower === "skill exchange accepted") {
    title = "សំណើផ្លាស់ប្តូរជំនាញត្រូវបានយល់ព្រម";
  } else if (titleLower === "skill exchange declined") {
    title = "សំណើផ្លាស់ប្តូរជំនាញត្រូវបានបដិសេធ";
  } else if (titleLower === "new skill exchange request") {
    title = "សំណើសុំផ្លាស់ប្តូរជំនាញថ្មី";
  } else if (titleLower === "new session participant") {
    title = "មានសិស្សចុះឈ្មោះចូលរៀនថ្មី";
  } else if (titleLower === "new internship application") {
    title = "មានការដាក់ពាក្យសុំការងារថ្មី";
  } else if (titleLower === "new mentorship request") {
    title = "សំណើសុំការណែនាំថ្មី (Mentorship)";
  } else if (titleLower === "mentor application received") {
    title = "ទទួលបានពាក្យស្នើសុំធ្វើជា Mentor";
  } else if (titleLower === "mentor application approved") {
    title = "ពាក្យស្នើសុំធ្វើជា Mentor ត្រូវបានអនុម័ត";
  } else if (titleLower === "mentor application update") {
    title = "បច្ចុប្បន្នភាពពាក្យស្នើសុំ Mentor";
  } else if (titleLower === "new mentor review") {
    title = "ការវាយតម្លៃថ្មីពីសិស្ស (Mentor Review)";
  } else if (titleLower === "answer accepted") {
    title = "ចម្លើយរបស់អ្នកត្រូវបានទទួលស្គាល់";
  } else if (titleLower === "new internship available") {
    title = "ឱកាសការងារកម្មសិក្សាថ្មី";
  } else if (titleLower.includes("mentorship")) {
    title = "បច្ចុប្បន្នភាពការណែនាំពី Mentor";
  } else if (titleLower.includes("skill exchange") || titleLower.includes("skill swap")) {
    title = "សំណើផ្លាស់ប្តូរជំនាញ";
  } else if (titleLower.includes("application")) {
    title = "ស្ថានភាពពាក្យស្នើសុំការងារ";
  } else if (titleLower.includes("session") || titleLower.includes("workshop")) {
    title = "ថ្នាក់រៀនផ្ទាល់ (Live Session)";
  } else if (titleLower.includes("welcome")) {
    title = "ស្វាគមន៍មកកាន់ Smart Community";
  }

  // 2. Message Pattern Mappings
  const pubMatch = message.match(/^(.+?)\s+published\s+(.+?)\.?$/i);
  const regSessionMatch = message.match(/^(.+?)\s+registered for your learning session\.?$/i);
  const appMatch = message.match(/^(.+?)\s+applied for\s+(.+?)\.?$/i);
  const offerMatch = message.match(/^(.+?)\s+offered\s+(.+?)\s+to learn\s+(.+?)\.?$/i);
  const mentorActiveMatch = message.match(/^Your verified mentor profile is now active\.?$/i);

  // Skill Exchange completion & confirmation
  const completionReqMatch = message.match(/^(.+?)\s+completed the exchange\.\s*Confirm when you are finished too\.?$/i);
  const completedMatch = message.match(/^(.+?)\s+confirmed the exchange was completed\.\s*Both parties have verified\.?$/i);

  // Skill Exchange accept & decline
  const acceptedChatMatch = message.match(/^(.+?)\s+accepted your\s+(.+?)\s+exchange request\.\s*Chat and meeting are ready\.?$/i);
  const acceptedSimpleMatch = message.match(/^(.+?)\s+accepted your\s+(.+?)\s+exchange request\.?$/i);
  const declinedMatch = message.match(/^(.+?)\s+declined your request:\s*(.+)$/i);

  // Mentorship & forum
  const mentorReqMatch = message.match(/^(.+?)\s+requested mentorship for\s+(.+?)\.?$/i);
  const mentorAppMatch = message.match(/^(.+?)\s+submitted a mentor application\.?$/i);
  const mentorReviewMatch = message.match(/^(.+?)\s+left a\s+(\d+)-star review\.?$/i);
  const forumAnswerMatch = message.match(/^Your answer to\s+"(.+?)"\s+was accepted\.?$/i);

  if (offerMatch) {
    message = `${offerMatch[1]} បានស្នើសុំប្តូរជំនាញ ${offerMatch[2]} ដើម្បីរៀន ${offerMatch[3]}។`;
  } else if (mentorActiveMatch) {
    message = "គណនី Mentor ដែលបានផ្ទៀងផ្ទាត់របស់អ្នកឥឡូវនេះដំណើរការហើយ។";
  } else if (completionReqMatch) {
    message = `${completionReqMatch[1]} បានបញ្ចប់ការផ្លាស់ប្តូរជំនាញហើយ។ សូមចុចបញ្ជាក់នៅពេលដែលអ្នកបានបញ្ចប់ដូចគ្នា។`;
  } else if (completedMatch) {
    message = `${completedMatch[1]} បានបញ្ជាក់ថាការផ្លាស់ប្តូរជំនាញត្រូវបានបញ្ចប់។ ភាគីទាំងពីរបានផ្ទៀងផ្ទាត់រួចរាល់។`;
  } else if (acceptedChatMatch) {
    message = `${acceptedChatMatch[1]} បានយល់ព្រមលើសំណើផ្លាស់ប្តូរជំនាញ ${acceptedChatMatch[2]} របស់អ្នកហើយ។ បន្ទប់ជជែក និងការជួបបានរួចរាល់។`;
  } else if (acceptedSimpleMatch) {
    message = `${acceptedSimpleMatch[1]} បានយល់ព្រមលើសំណើផ្លាស់ប្តូរជំនាញ ${acceptedSimpleMatch[2]} របស់អ្នកហើយ។`;
  } else if (declinedMatch) {
    message = `${declinedMatch[1]} បានបដិសេធសំណើរបស់អ្នក៖ ${declinedMatch[2]}`;
  } else if (mentorReqMatch) {
    message = `${mentorReqMatch[1]} បានស្នើសុំការណែនាំលើប្រធានបទ ${mentorReqMatch[2]}។`;
  } else if (mentorAppMatch) {
    message = `${mentorAppMatch[1]} បានដាក់ពាក្យស្នើសុំធ្វើជា Mentor។`;
  } else if (mentorReviewMatch) {
    message = `${mentorReviewMatch[1]} បានផ្តល់ការវាយតម្លៃផ្កាយ ${mentorReviewMatch[2]}។`;
  } else if (forumAnswerMatch) {
    message = `ចម្លើយរបស់អ្នកលើប្រធានបទ "${forumAnswerMatch[1]}" ត្រូវបានជ្រើសរើសជាចម្លើយត្រឹមត្រូវ។`;
  } else if (pubMatch) {
    const company = pubMatch[1];
    const jobTitle = pubMatch[2];
    const enrichedJob = enrichInternshipRecord({ title: jobTitle, company });
    message = `ក្រុមហ៊ុន ${company} បានប្រកាសជ្រើសរើស "${enrichedJob.titleKm}"។`;
  } else if (regSessionMatch) {
    message = `${regSessionMatch[1]} បានចុះឈ្មោះចូលរួមក្នុងថ្នាក់រៀនផ្ទាល់របស់អ្នក។`;
  } else if (appMatch) {
    const applicant = appMatch[1];
    const jobTitle = appMatch[2];
    const enrichedJob = enrichInternshipRecord({ title: jobTitle });
    message = `${applicant} បានដាក់ពាក្យស្នើសុំការងារ "${enrichedJob.titleKm}"។`;
  } else if (message.toLowerCase().includes("requested a mentorship")) {
    message = "មានសំណើសុំការណែនាំថ្មីមួយកំពុងរង់ចាំការពិនិត្យពីអ្នក។";
  } else if (message.toLowerCase().includes("skill exchange request")) {
    message = "អ្នកទទួលបានសំណើសុំផ្លាស់ប្តូរជំនាញថ្មីពីសមាជិកសហគមន៍។";
  }

  return {
    ...notif,
    title,
    message,
  };
}

export function localizeForumCategory(name = "", isKm = false) {
  if (!isKm) return name;
  const key = String(name).trim().toLowerCase();
  const map = {
    career: "អាជីព & ការងារ",
    design: "ការរចនា UX/UI",
    internship: "កម្មសិក្សា",
    programming: "ការសរសេរកូដ",
    general: "ពិភាក្សាទូទៅ",
  };
  return map[key] || name;
}

export function localizeForumPost(post, isKm = false) {
  if (!post || !isKm) return post;
  const titleLower = String(post.title || "").toLowerCase();
  let titleKm = post.title;
  let bodyKm = post.body;

  if (titleLower.includes("react portfolio")) {
    titleKm = "តើខ្ញុំគួររៀបចំគម្រោង React Portfolio បែបណាដើម្បីដាក់ពាក្យកម្មសិក្សាឱ្យទទួលបានជោគជ័យ?";
    bodyKm =
      "ខ្ញុំបានបង្កើតគម្រោង React ចំនួន ៣ ហើយចង់រៀបចំដាក់បង្ហាញឱ្យមានលក្ខណៈអាជីព។ តើខ្ញុំគួរបញ្ចូលផ្នែកណាខ្លះ រូបភាព Screenshot ការពន្យល់បច្ចេកទេស និងតំណភ្ជាប់ Demo បែបណា ដើម្បីឱ្យអ្នកជ្រើសរើសបុគ្គលិកងាយស្រួលពិនិត្យស្នាដៃរបស់ខ្ញុំ?";
  } else if (titleLower.includes("four-week plan") || titleLower.includes("junior developer interview")) {
    titleKm = "ផែនការអនុវត្តរយៈពេល ៤ សប្តាហ៍សម្រាប់ត្រៀមសម្ភាសន៍ការងារ Junior Developer";
    bodyKm =
      "ការពិភាក្សានេះចែករំលែកផែនការប្រចាំសប្តាហ៍ជាក់ស្តែង រួមមានការរៀបចំ Portfolio ការរំលឹកមូលដ្ឋានគ្រឹះ JavaScript ការដោះស្រាយលំហាត់កូដ និងការហាត់សមសម្ភាសន៍ផ្ទាល់។";
  } else if (titleLower.includes("student dashboard")) {
    titleKm = "តើផ្ទាំងគ្រប់គ្រងសិក្សា (Student Dashboard) បែបណាដែលមើលទៅស្រឡះ និងងាយស្រួលប្រើ?";
    bodyKm =
      "ខ្ញុំកំពុងកែលម្អផ្ទាំង Dashboard សម្រាប់គម្រោងសិក្សារបស់ខ្ញុំ។ តើអ្នករចនា UX/UI រៀបចំลำดับអាទិភាពនៃកាត ពណ៌ និងគម្លាតបែបណា ដើម្បីឱ្យអ្នកប្រើប្រាស់មើលយល់ភ្លាមៗដោយមិនមានអារម្មណ៍ថាស្មុគស្មាញ?";
  } else if (titleLower.includes("internship application checklist")) {
    titleKm = "បញ្ជីត្រួតពិនិត្យមុនដាក់ពាក្យកម្មសិក្សា៖ CV, Portfolio និងការតាមដានលទ្ធផល";
    bodyKm =
      "មុនពេលផ្ញើពាក្យស្នើសុំកម្មសិក្សា សូមពិនិត្យមើលចំណុចសំខាន់ៗទាំងនេះ៖ ទម្រង់ PDF CV មួយទំព័រច្បាស់លាស់ តំណភ្ជាប់ GitHub/Demo ដែលដំណើរការល្អ និងការសរសេរសារណែនាំខ្លួនខ្លីៗដែលបង្ហាញពីជំនាញជាក់ស្តែងរបស់អ្នក។";
  } else if (titleLower.includes("ux") || titleLower.includes("figma")) {
    titleKm = "គន្លឹះរៀបចំ Design System និង Prototype នៅក្នុង Figma សម្រាប់អ្នកចាប់ផ្តើមដំបូង";
    bodyKm =
      "ចែករំលែកបទពិសោធន៍ក្នុងការរៀបចំ Components, Auto Layout និងការធ្វើ User Flow ឱ្យមានរបៀបរៀបរយមុនពេលប្រគល់ឱ្យក្រុមវិស្វករសរសេរកូដ។";
  }

  return {
    ...post,
    title: titleKm,
    body: bodyKm,
    categoryName: localizeForumCategory(post.categoryName || post.category?.name, true),
    category: post.category
      ? { ...post.category, name: localizeForumCategory(post.category.name, true) }
      : post.category,
  };
}

export function localizeForumAnswer(answer, isKm = false) {
  if (!answer || !isKm) return answer;
  const bodyLower = String(answer.body || "").toLowerCase();
  let bodyKm = answer.body;
  if (bodyLower.includes("short introduction") && bodyLower.includes("featured projects")) {
    bodyKm =
      "សូមរៀបចំជាផ្នែកខ្លីៗរួមមាន៖ ការណែនាំខ្លួនសង្ខេប គម្រោងស្នាដៃសំខាន់ៗ ជំនាញបច្ចេកទេស បទពិសោធន៍ និងព័ត៌មានទំនាក់ទំនង។ សម្រាប់គម្រោងនីមួយៗ គួរបង្ហាញពីបញ្ហាដែលបានដោះស្រាយ តួនាទីរបស់អ្នក បច្ចេកវិទ្យាដែលបានប្រើ លទ្ធផលជាក់ស្តែង តំណភ្ជាប់ Live Demo និងកូដនៅលើ GitHub ដោយដាក់គម្រោងដែលល្អបំផុតនៅខាងលើគេ។";
  }
  return {
    ...answer,
    body: bodyKm,
  };
}



