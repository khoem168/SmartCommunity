import {
  FiHome,
  FiBookOpen,
  FiVideo,
  FiAward,
  FiRepeat,
  FiCompass,
  FiBriefcase,
  FiCheckCircle,
  FiFileText,
  FiMessageSquare,
  FiUsers,
  FiMail,
  FiPlusCircle,
  FiShield,
  FiBarChart2,
  FiCalendar,
} from "react-icons/fi";

export const getHybridNav = (user) => {
  const role = user?.role || "guest";

  // 1. RECRUITER HYBRID NAVIGATION
  if (role === "recruiter") {
    return {
      directLinks: [
        { path: "/", labelEn: "Home", labelKm: "ទំព័រដើម", icon: FiHome },
        { path: "/my-posts", labelEn: "My Jobs", labelKm: "ការងារដែលបានបង្ហោះ", icon: FiBriefcase },
        { path: "/recruiter/candidates", labelEn: "Candidates", labelKm: "បេក្ខជន ATS", icon: FiUsers },
        { path: "/profile", labelEn: "Company", labelKm: "ក្រុមហ៊ុន", icon: FiCheckCircle },
      ],
      moreItems: [
        {
          path: "/dashboard",
          labelEn: "My Workspace",
          labelKm: "ផ្ទាំងការងាររបស់ខ្ញុំ",
          descEn: "Overview of your recruiting pipeline and activity",
          descKm: "ទិដ្ឋភាពទូទៅនៃការងារ និងបេក្ខជនដែលបានដាក់ពាក្យ",
          icon: FiCompass,
          color: "indigo",
        },
        {
          path: "/calendar",
          labelEn: "Activity Calendar",
          labelKm: "កាលវិភាគសកម្មភាព",
          descEn: "View candidate interviews and hiring meetings",
          descKm: "មើលកាលវិភាគសម្ភាសន៍បេក្ខជន និងការណាត់ជួប",
          icon: FiCalendar,
          color: "blue",
        },
        {
          path: "/post-job",
          labelEn: "Post an Opportunity",
          labelKm: "បង្ហោះការងារថ្មី",
          descEn: "Publish new verified internships and jobs",
          descKm: "ផ្សព្វផ្សាយឱកាសការងារទៅកាន់សិស្ស",
          icon: FiPlusCircle,
          color: "emerald",
        },
        {
          path: "/messages",
          labelEn: "Candidate Messages",
          labelKm: "ប្រអប់សារបេក្ខជន",
          descEn: "Chat directly with applicants and candidates",
          descKm: "ជជែកផ្ទាល់ជាមួយបេក្ខជនដាក់ពាក្យ",
          icon: FiMail,
          color: "blue",
        },
        {
          path: "/jobs",
          labelEn: "Public Job Board",
          labelKm: "ផ្សារការងារសាធារណៈ",
          descEn: "View active candidate job listings",
          descKm: "មើលការងារតាមទស្សនៈរបស់បេក្ខជន",
          icon: FiBriefcase,
          color: "emerald",
        },
        {
          path: "/forum",
          labelEn: "Community Forum",
          labelKm: "វេទិកាសហគមន៍",
          descEn: "Engage in developer discussions and answers",
          descKm: "ចូលរួមសួរសំណួរ និងស្វែងយល់ពីបច្ចេកវិទ្យា",
          icon: FiMessageSquare,
          color: "purple",
        },
      ],
      workspace: {
        path: "/dashboard",
        labelEn: "My Workspace",
        labelKm: "ផ្ទាំងការងារ",
      },
      drawerSections: [
        {
          id: "recruiting",
          labelEn: "Talent & ATS",
          labelKm: "ជ្រើសរើសបុគ្គលិក",
          pillarNumber: "01",
          items: [
            { path: "/my-posts", labelEn: "My Job Postings", labelKm: "ការងារដែលបានបង្ហោះ", descEn: "Manage posted roles", descKm: "គ្រប់គ្រងការងារ", icon: FiBriefcase, color: "indigo" },
            { path: "/recruiter/candidates", labelEn: "Candidate ATS Pipeline", labelKm: "បំពង់បេក្ខជន (ATS)", descEn: "Screen and advance candidates", descKm: "ពិនិត្យពាក្យសុំបេក្ខជន", icon: FiUsers, color: "blue" },
            { path: "/post-job", labelEn: "Post an Opportunity", labelKm: "បង្ហោះការងារថ្មី", descEn: "Create new job listing", descKm: "ផ្សព្វផ្សាយការងារ", icon: FiPlusCircle, color: "emerald" },
          ],
        },
        {
          id: "community",
          labelEn: "Communication & Forum",
          labelKm: "ការប្រាស្រ័យទាក់ទង",
          pillarNumber: "02",
          items: [
            { path: "/messages", labelEn: "Candidate Messages", labelKm: "ប្រអប់សារបេក្ខជន", descEn: "Chat with applicants", descKm: "ជជែកជាមួយបេក្ខជន", icon: FiMail, color: "blue" },
            { path: "/forum", labelEn: "Community Forum", labelKm: "វេទិកាសហគមន៍", descEn: "Join tech conversations", descKm: "ចូលរួមសួរសំណួរ", icon: FiMessageSquare, color: "purple" },
            { path: "/jobs", labelEn: "Public Job Board", labelKm: "ផ្សារការងារ", descEn: "Browse all openings", descKm: "ស្វែងរកការងារ", icon: FiBriefcase, color: "emerald" },
          ],
        },
      ],
    };
  }

  // 2. MENTOR HYBRID NAVIGATION
  if (role === "mentor") {
    return {
      directLinks: [
        { path: "/", labelEn: "Home", labelKm: "ទំព័រដើម", icon: FiHome },
        { path: "/sessions", labelEn: "My Sessions", labelKm: "ថ្នាក់បង្រៀន Live", icon: FiVideo },
        { path: "/mentorship", labelEn: "Bookings", labelKm: "ការកក់ម៉ោង", icon: FiAward },
        { path: "/community", labelEn: "Mentees", labelKm: "សិស្ស/Mentees", icon: FiUsers },
        { path: "/forum", labelEn: "Community", labelKm: "សហគមន៍", icon: FiMessageSquare },
      ],
      moreItems: [
        {
          path: "/dashboard",
          labelEn: "My Workspace",
          labelKm: "ផ្ទាំងការងាររបស់ខ្ញុំ",
          descEn: "Overview of your mentorship sessions and mentees",
          descKm: "ទិដ្ឋភាពទូទៅនៃការណែនាំ 1:1 និងសកម្មភាពសិស្ស",
          icon: FiCompass,
          color: "indigo",
        },
        {
          path: "/calendar",
          labelEn: "Activity Calendar",
          labelKm: "កាលវិភាគសកម្មភាព",
          descEn: "Mentorship sessions and live workshops",
          descKm: "កាលវិភាគ Session 1:1 និងថ្នាក់បង្រៀនផ្ទាល់",
          icon: FiCalendar,
          color: "emerald",
        },
        {
          path: "/courses",
          labelEn: "Courses Library",
          labelKm: "វគ្គសិក្សា",
          descEn: "Explore video courses and curriculum",
          descKm: "ចូលមើលមេរៀន និងវគ្គសិក្សា",
          icon: FiBookOpen,
          color: "blue",
        },
        {
          path: "/messages",
          labelEn: "Mentee Messages",
          labelKm: "សារសន្ទនា",
          descEn: "Stay connected with your active mentees",
          descKm: "ទាក់ទងជាមួយសិស្ស និងក្រុមសិក្សា",
          icon: FiMail,
          color: "blue",
        },
      ],
      workspace: {
        path: "/dashboard",
        labelEn: "My Workspace",
        labelKm: "ផ្ទាំងការងារ",
      },
      drawerSections: [
        {
          id: "mentoring",
          labelEn: "Mentoring & Teaching",
          labelKm: "ការបង្រៀន និងណែនាំ",
          pillarNumber: "01",
          items: [
            { path: "/sessions", labelEn: "Live Sessions", labelKm: "ថ្នាក់បង្រៀន Live", descEn: "Host interactive workshops", descKm: "បង្កើតសិក្ខាសាលាផ្ទាល់", icon: FiVideo, color: "rose" },
            { path: "/mentorship", labelEn: "1:1 Mentorship Hub", labelKm: "មជ្ឈមណ្ឌល 1:1", descEn: "Manage mentee bookings", descKm: "គ្រប់គ្រងការកក់ម៉ោង", icon: FiAward, color: "emerald" },
            { path: "/courses", labelEn: "Courses Library", labelKm: "វគ្គសិក្សា", descEn: "Explore video courses", descKm: "ចូលមើលមេរៀន", icon: FiBookOpen, color: "blue" },
          ],
        },
        {
          id: "community",
          labelEn: "Community & Inbox",
          labelKm: "សហគមន៍ និងសារ",
          pillarNumber: "02",
          items: [
            { path: "/forum", labelEn: "Q&A Forum", labelKm: "វេទិកាសួរសំណួរ", descEn: "Share expertise with students", descKm: "ជួយឆ្លើយសំណួរសិស្ស", icon: FiMessageSquare, color: "purple" },
            { path: "/messages", labelEn: "Mentee Messages", labelKm: "សារសន្ទនា", descEn: "Direct messaging", descKm: "ផ្ញើសារទាក់ទង", icon: FiMail, color: "blue" },
          ],
        },
      ],
    };
  }

  // 3. ADMIN HYBRID NAVIGATION
  if (role === "admin") {
    return {
      directLinks: [
        { path: "/", labelEn: "Home", labelKm: "ទំព័រដើម", icon: FiHome },
        { path: "/admin", labelEn: "Admin Panel", labelKm: "គ្រប់គ្រងប្រព័ន្ធ", icon: FiShield },
        { path: "/forum", labelEn: "Moderation", labelKm: "គ្រប់គ្រង Forum", icon: FiMessageSquare },
        { path: "/analytics", labelEn: "Analytics", labelKm: "ស្ថិតិទូទៅ", icon: FiBarChart2 },
      ],
      moreItems: [
        {
          path: "/courses",
          labelEn: "Courses Library",
          labelKm: "បណ្ណាល័យវគ្គសិក្សា",
          descEn: "Audit course curriculum and materials",
          descKm: "ពិនិត្យវគ្គសិក្សា និងឯកសារ",
          icon: FiBookOpen,
          color: "blue",
        },
        {
          path: "/jobs",
          labelEn: "Job Board Audit",
          labelKm: "ផ្សារការងារ",
          descEn: "Audit company postings and compliance",
          descKm: "ពិនិត្យការងារក្រុមហ៊ុន",
          icon: FiBriefcase,
          color: "emerald",
        },
      ],
      workspace: {
        path: "/admin",
        labelEn: "Admin Workspace",
        labelKm: "ផ្ទាំងបញ្ជា Admin",
      },
      drawerSections: [
        {
          id: "administration",
          labelEn: "Platform Administration",
          labelKm: "ការគ្រប់គ្រងប្រព័ន្ធ",
          pillarNumber: "01",
          items: [
            { path: "/admin", labelEn: "Admin Control Panel", labelKm: "ផ្ទាំងបញ្ជា Admin", descEn: "Manage users and approvals", descKm: "គ្រប់គ្រងអ្នកប្រើប្រាស់", icon: FiShield, color: "rose" },
            { path: "/analytics", labelEn: "Analytics & Reports", labelKm: "ស្ថិតិទូទៅ", descEn: "Track user growth and platform health", descKm: "តាមដានទិន្នន័យ", icon: FiBarChart2, color: "indigo" },
          ],
        },
        {
          id: "content",
          labelEn: "Content & Community",
          labelKm: "ខ្លឹមសារ និងសហគមន៍",
          pillarNumber: "02",
          items: [
            { path: "/courses", labelEn: "Courses Library", labelKm: "បណ្ណាល័យវគ្គសិក្សា", descEn: "Audit course curriculum", descKm: "ពិនិត្យវគ្គសិក្សា", icon: FiBookOpen, color: "blue" },
            { path: "/jobs", labelEn: "Job Board Audit", labelKm: "ផ្សារការងារ", descEn: "Audit company postings", descKm: "ពិនិត្យការងារក្រុមហ៊ុន", icon: FiBriefcase, color: "emerald" },
            { path: "/forum", labelEn: "Community Forum", labelKm: "វេទិកាសហគមន៍", descEn: "Moderate user discussions", descKm: "គ្រប់គ្រងការពិភាក្សា", icon: FiMessageSquare, color: "purple" },
          ],
        },
      ],
    };
  }

  // 4. STUDENT / GUEST HYBRID NAVIGATION (1-CLICK CORE LINKS + MORE MENU)
  return {
    directLinks: [
      { path: "/", labelEn: "Home", labelKm: "ទំព័រដើម", icon: FiHome },
      { path: "/courses", labelEn: "Courses", labelKm: "វគ្គសិក្សា", icon: FiVideo },
      { path: "/skill-exchange", labelEn: "Skill Swap", labelKm: "ប្តូរជំនាញ", icon: FiRepeat },
      { path: "/mentorship", labelEn: "Mentors", labelKm: "អ្នកណែនាំ", icon: FiAward },
      { path: "/jobs", labelEn: "Jobs", labelKm: "ការងារ", icon: FiBriefcase },
      { path: "/forum", labelEn: "Community", labelKm: "សហគមន៍", icon: FiMessageSquare },
    ],
    moreItems: [
      {
        path: "/dashboard",
        labelEn: "My Workspace",
        labelKm: "ផ្ទាំងការងាររបស់ខ្ញុំ",
        descEn: "Your learning progress, sessions, and career overview",
        descKm: "តាមដានវឌ្ឍនភាពសិក្សា ការប្តូរជំនាញ និងអាជីពរបស់អ្នក",
        icon: FiCompass,
        color: "indigo",
      },
      {
        path: "/calendar",
        labelEn: "Activity Calendar",
        labelKm: "កាលវិភាគសកម្មភាព",
        descEn: "Your mentorships, live classes and interviews",
        descKm: "កាលវិភាគរៀន សម្ភាសន៍ និងជួប Mentor ក្នុងកន្លែងតែមួយ",
        icon: FiCalendar,
        color: "blue",
      },
      {
        path: "/career",
        labelEn: "Career Roadmap",
        labelKm: "ផែនទីបង្ហាញផ្លូវអាជីព",
        descEn: "Step-by-step milestones & skill recommendations",
        descKm: "ដំណើរឆ្ពោះទៅកាន់ការងារគោលដៅ មួយជំហានម្តងៗ",
        icon: FiCompass,
        color: "purple",
      },
      {
        path: "/my-applications",
        labelEn: "My Applications",
        labelKm: "តាមដានពាក្យសុំការងារ",
        descEn: "Track interview schedules and application status",
        descKm: "តាមដានដំណាក់កាលសម្ភាសន៍ និងព័ត៌មានពីក្រុមហ៊ុន",
        icon: FiCheckCircle,
        color: "blue",
      },
      {
        path: "/sessions",
        labelEn: "Live Classrooms",
        labelKm: "ថ្នាក់បង្រៀនផ្ទាល់ (Live)",
        descEn: "Mentor-led real-time workshops and code-alongs",
        descKm: "សិក្ខាសាលាផ្ទាល់ជាមួយគ្រូជំនាញតាមអនឡាញ",
        icon: FiVideo,
        color: "rose",
      },
      {
        path: "/cv-studio",
        labelEn: "Free CV Builder (PDF)",
        labelKm: "បង្កើត CV ឥតគិតថ្លៃ (PDF)",
        descEn: "Choose templates, preview & download PDF CV for free",
        descKm: "ជ្រើសរើសគំរូ CV ស្អាតៗ មើលផ្ទាល់ និងទាញយកជា PDF ដោយឥតគិតថ្លៃ",
        icon: FiFileText,
        color: "indigo",
      },
      {
        path: "/profile",
        labelEn: "My Profile & Portfolio",
        labelKm: "ប្រវត្តិរូប និងស្នាដៃរបស់ខ្ញុំ",
        descEn: "Manage your personal profile, skills, and projects",
        descKm: "គ្រប់គ្រងប្រវត្តិរូប ជំនាញ និងគម្រោងស្នាដៃរបស់អ្នក",
        icon: FiUsers,
        color: "emerald",
      },
      {
        path: "/messages",
        labelEn: "Messages",
        labelKm: "ប្រអប់សារ",
        descEn: "Direct messaging for Jobs, Swaps, and Mentorship",
        descKm: "ផ្ញើសារទាក់ទងគ្នាទៅវិញទៅមកតាមប្រភេទ",
        icon: FiMail,
        color: "blue",
      },
    ],
    workspace: {
      path: user ? "/dashboard" : "/register",
      labelEn: user ? "My Workspace" : "Get Started",
      labelKm: user ? "ផ្ទាំងការងារ" : "ចាប់ផ្តើម",
    },
    drawerSections: [
      {
        id: "learning",
        labelEn: "Learning",
        labelKm: "រៀនសូត្រ",
        pillarNumber: "01",
        items: [
          { path: "/courses", labelEn: "Academy Courses", labelKm: "វគ្គសិក្សាអនឡាញ", descEn: "Self-paced video lessons", descKm: "មេរៀនវីដេអូរៀនដោយខ្លួនឯង", icon: FiBookOpen, color: "blue" },
          { path: "/sessions", labelEn: "Live Classrooms", labelKm: "ថ្នាក់បង្រៀនផ្ទាល់ (Live)", descEn: "Interactive live technical sessions", descKm: "សិក្ខាសាលាផ្ទាល់តាមអនឡាញ", icon: FiVideo, color: "rose" },
          { path: "/mentorship", labelEn: "Expert Mentorship", labelKm: "ការណែនាំ 1:1", descEn: "Connect with senior engineers", descKm: "ជួបផ្ទាល់ជាមួយអ្នកជំនាញ", icon: FiAward, color: "emerald" },
          { path: "/skill-exchange", labelEn: "Peer Skill Swap", labelKm: "ដោះដូរជំនាញរវាងមិត្តភក្តិ", descEn: "Free collaborative knowledge swap", descKm: "បង្រៀន និងរៀនជំនាញថ្មី", icon: FiRepeat, color: "purple" },
        ],
      },
      {
        id: "career",
        labelEn: "Career & Free CV",
        labelKm: "អាជីព & បង្កើត CV",
        pillarNumber: "02",
        items: [
          { path: "/cv-studio", labelEn: "Free CV Builder (PDF)", labelKm: "បង្កើត CV ឥតគិតថ្លៃ (PDF)", descEn: "Multi-template PDF resume builder", descKm: "ជ្រើសរើសគំរូ CV និងទាញយក PDF ឥតគិតថ្លៃ", icon: FiFileText, color: "indigo" },
          { path: "/jobs", labelEn: "Internships & Job Board", labelKm: "កម្មសិក្សា និងការងារ", descEn: "Find matching openings", descKm: "ស្វែងរកការងារជាក់ស្តែង", icon: FiBriefcase, color: "emerald" },
          { path: "/career", labelEn: "Career Roadmap", labelKm: "ផែនទីបង្ហាញផ្លូវអាជីព", descEn: "Step-by-step competencies", descKm: "ដំណើរឆ្ពោះទៅកាន់ការងារ", icon: FiCompass, color: "purple" },
          { path: "/my-applications", labelEn: "My Application Tracker", labelKm: "តាមដានពាក្យសុំការងារ", descEn: "Monitor recruitment stages", descKm: "តាមដានដំណាក់កាលសម្ភាសន៍", icon: FiCheckCircle, color: "blue" },
          { path: "/profile", labelEn: "My Profile & Portfolio", labelKm: "ប្រវត្តិរូបរបស់ខ្ញុំ", descEn: "Personal portfolio & records", descKm: "គ្រប់គ្រងប្រវត្តិរូបផ្ទាល់ខ្លួន", icon: FiUsers, color: "blue" },
        ],
      },
      {
        id: "community",
        labelEn: "Community Social",
        labelKm: "បណ្តាញសង្គមសហគមន៍",
        pillarNumber: "03",
        items: [
          { path: "/forum", labelEn: "Community Social Feed", labelKm: "បណ្តាញសង្គមសហគមន៍ (Social)", descEn: "Posts, tech tips & discussions", descKm: "ចែករំលែកចំណេះដឹង និងពិភាក្សាកូដ", icon: FiMessageSquare, color: "purple" },
          { path: "/skill-exchange", labelEn: "Discover Skill Partners", labelKm: "ស្វែងរកដៃគូប្តូរជំនាញ", descEn: "Find tech collaborators", descKm: "ស្វែងរកមិត្តភក្តិរៀនកូដ", icon: FiRepeat, color: "indigo" },
          { path: "/messages", labelEn: "Contextual Inbox", labelKm: "ប្រអប់សារសន្ទនា", descEn: "Organized direct chat", descKm: "ផ្ញើសារបែងចែកតាមប្រភេទ", icon: FiMail, color: "blue" },
        ],
      },
    ],
  };
};

// Backwards-compatible aliases
export const getNavPillars = (user) => {
  const hybrid = getHybridNav(user);
  return hybrid.drawerSections;
};

export const getWorkspaceInfo = (user) => {
  const hybrid = getHybridNav(user);
  return hybrid.workspace;
};
