import {
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
} from "react-icons/fi";

export const getNavPillars = (user) => {
  const role = user?.role || "guest";

  // 1. RECRUITER PILLARS (Tailored to talent acquisition & postings)
  if (role === "recruiter") {
    return [
      {
        id: "recruiting",
        labelEn: "Talent & ATS",
        labelKm: "ជ្រើសរើសបុគ្គលិក",
        pillarNumber: "01",
        items: [
          {
            path: "/recruiter/candidates",
            labelEn: "Candidate ATS Pipeline",
            labelKm: "បំពង់គ្រប់គ្រងបេក្ខជន (ATS)",
            descEn: "Review applications, move stages, and schedule interviews",
            descKm: "គ្រប់គ្រងបេក្ខជន ពិនិត្យពាក្យសុំ និងណាត់សម្ភាសន៍",
            icon: FiUsers,
            color: "blue",
          },
          {
            path: "/post-job",
            labelEn: "Post an Opportunity",
            labelKm: "បង្ហោះការងារ / កម្មសិក្សា",
            descEn: "Publish new internships or job listings to the student community",
            descKm: "ផ្សព្វផ្សាយឱកាសកម្មសិក្សាទៅកាន់សិស្សនិស្សិត",
            icon: FiPlusCircle,
            color: "emerald",
          },
          {
            path: "/my-posts",
            labelEn: "Manage My Postings",
            labelKm: "ការងារដែលបានបង្ហោះ",
            descEn: "View active postings, edit details, and track applicant counts",
            descKm: "ពិនិត្យការងារសកម្ម និងចំនួនអ្នកដាក់ពាក្យ",
            icon: FiBriefcase,
            color: "indigo",
          },
        ],
      },
      {
        id: "community",
        labelEn: "Community & Inbox",
        labelKm: "សហគមន៍ និងសារ",
        pillarNumber: "02",
        items: [
          {
            path: "/messages",
            labelEn: "Candidate Messages",
            labelKm: "ប្រអប់សារបេក្ខជន",
            descEn: "Chat with applicants, send interview links, and communicate directly",
            descKm: "ជជែកជាមួយបេក្ខជន និងផ្ញើព័ត៌មានសម្ភាសន៍",
            icon: FiMail,
            color: "blue",
          },
          {
            path: "/forum",
            labelEn: "Community Forum",
            labelKm: "វេទិកាសហគមន៍",
            descEn: "Engage in developer discussions and answer hiring questions",
            descKm: "ចូលរួមសួរសំណួរ និងស្វែងយល់ពីបច្ចេកវិទ្យា",
            icon: FiMessageSquare,
            color: "purple",
          },
        ],
      },
    ];
  }

  // 2. MENTOR PILLARS (Tailored to coaching, live classes & courses)
  if (role === "mentor") {
    return [
      {
        id: "mentorship",
        labelEn: "Mentorship & Live",
        labelKm: "ការណែនាំ និង Live",
        pillarNumber: "01",
        items: [
          {
            path: "/mentorship",
            labelEn: "1:1 Mentorship Hub",
            labelKm: "មជ្ឈមណ្ឌលការណែនាំ 1:1",
            descEn: "Manage mentee sessions, booking requests, and reviews",
            descKm: "គ្រប់គ្រងការកក់ម៉ោង និងសំណើសុំការណែនាំ",
            icon: FiAward,
            color: "emerald",
          },
          {
            path: "/sessions",
            labelEn: "Live Classrooms",
            labelKm: "ថ្នាក់បង្រៀនផ្ទាល់ (Live)",
            descEn: "Host or join real-time interactive technical workshops",
            descKm: "បង្កើត ឬចូលរួមសិក្ខាសាលាផ្ទាល់តាមអនឡាញ",
            icon: FiVideo,
            color: "rose",
          },
          {
            path: "/courses",
            labelEn: "Academy Courses",
            labelKm: "វគ្គសិក្សាអនឡាញ",
            descEn: "Explore video courses, curricula, and study materials",
            descKm: "ចូលមើលមេរៀន និងឯកសារសិក្សាគំរូ",
            icon: FiBookOpen,
            color: "blue",
          },
        ],
      },
      {
        id: "community",
        labelEn: "Community",
        labelKm: "សហគមន៍",
        pillarNumber: "02",
        items: [
          {
            path: "/forum",
            labelEn: "Q&A Forum",
            labelKm: "វេទិកាសួរសំណួរ",
            descEn: "Answer student questions and share industry expertise",
            descKm: "ជួយឆ្លើយសំណួរសិស្ស និងចែករំលែកបទពិសោធន៍",
            icon: FiMessageSquare,
            color: "purple",
          },
          {
            path: "/messages",
            labelEn: "Mentee Messages",
            labelKm: "សារសន្ទនា",
            descEn: "Stay connected with your active mentees and study groups",
            descKm: "ទាក់ទងជាមួយសិស្ស និងក្រុមសិក្សា",
            icon: FiMail,
            color: "blue",
          },
        ],
      },
    ];
  }

  // 3. ADMIN PILLARS (Tailored to administrative oversight & analytics)
  if (role === "admin") {
    return [
      {
        id: "management",
        labelEn: "Administration",
        labelKm: "ការគ្រប់គ្រងប្រព័ន្ធ",
        pillarNumber: "01",
        items: [
          {
            path: "/admin",
            labelEn: "Admin Control Panel",
            labelKm: "ផ្ទាំងបញ្ជា Admin",
            descEn: "Manage users, recruiter approvals, and platform moderation",
            descKm: "គ្រប់គ្រងអ្នកប្រើប្រាស់ ផ្ទៀងផ្ទាត់ក្រុមហ៊ុន និងបញ្ជាប្រព័ន្ធ",
            icon: FiShield,
            color: "rose",
          },
          {
            path: "/analytics",
            labelEn: "Analytics & Reports",
            labelKm: "ស្ថិតិទូទៅ និងរបាយការណ៍",
            descEn: "Track user growth, course enrollments, and platform health",
            descKm: "តាមដានទិន្នន័យកំណើន និងការប្រើប្រាស់វេទិកា",
            icon: FiBarChart2,
            color: "indigo",
          },
        ],
      },
      {
        id: "content",
        labelEn: "Platform Content",
        labelKm: "ខ្លឹមសារវេទិកា",
        pillarNumber: "02",
        items: [
          {
            path: "/courses",
            labelEn: "Courses Library",
            labelKm: "បណ្ណាល័យវគ្គសិក្សា",
            descEn: "Review published courses, pricing, and curriculum",
            descKm: "ពិនិត្យវគ្គសិក្សា និងតម្លៃ",
            icon: FiBookOpen,
            color: "blue",
          },
          {
            path: "/jobs",
            labelEn: "Job & Internship Board",
            labelKm: "ផ្សារការងារ និងកម្មសិក្សា",
            descEn: "Audit active company postings and student applications",
            descKm: "ពិនិត្យការងាររបស់ក្រុមហ៊ុន និងការដាក់ពាក្យ",
            icon: FiBriefcase,
            color: "emerald",
          },
          {
            path: "/forum",
            labelEn: "Community Forum",
            labelKm: "វេទិកាសហគមន៍",
            descEn: "Moderate topics, discussions, and flagged responses",
            descKm: "គ្រប់គ្រងការពិភាក្សា និងមាតិកាសហគមន៍",
            icon: FiMessageSquare,
            color: "purple",
          },
        ],
      },
    ];
  }

  // 4. STUDENT / GUEST (MEMBER) - THE CORE 3-PILLAR FOUNDATION
  return [
    {
      id: "learning",
      labelEn: "Learning",
      labelKm: "រៀនសូត្រ",
      pillarNumber: "01",
      taglineEn: "Master in-demand skills",
      taglineKm: "ពង្រឹងចំណេះដឹង និងជំនាញបច្ចេកវិទ្យា",
      items: [
        {
          path: "/courses",
          labelEn: "Academy Courses",
          labelKm: "វគ្គសិក្សាអនឡាញ",
          descEn: "Self-paced interactive video lessons with KHQR certification",
          descKm: "មេរៀនវីដេអូរៀនដោយខ្លួនឯង និងវិញ្ញាបនបត្រ",
          icon: FiBookOpen,
          color: "blue",
        },
        {
          path: "/sessions",
          labelEn: "Live Classrooms",
          labelKm: "ថ្នាក់បង្រៀនផ្ទាល់ (Live)",
          descEn: "Mentor-led real-time workshops and code-along sessions",
          descKm: "សិក្ខាសាលាផ្ទាល់ជាមួយគ្រូជំនាញតាមអនឡាញ",
          icon: FiVideo,
          color: "rose",
        },
        {
          path: "/mentorship",
          labelEn: "Expert Mentorship",
          labelKm: "ការណែនាំផ្ទាល់ខ្លួន 1:1",
          descEn: "Connect 1:1 with verified senior engineers and leaders",
          descKm: "ជួបផ្ទាល់ជាមួយអ្នកជំនាញជាន់ខ្ពស់ដើម្បីសុំយោបល់",
          icon: FiAward,
          color: "emerald",
        },
        {
          path: "/skill-exchange",
          labelEn: "Peer Skill Swap",
          labelKm: "ដោះដូរជំនាញរវាងមិត្តភក្តិ",
          descEn: "Trade your knowledge with peers for free cooperative learning",
          descKm: "បង្រៀនជំនាញដែលចេះ និងរៀនជំនាញថ្មីដោយឥតគិតថ្លៃ",
          icon: FiRepeat,
          color: "purple",
        },
      ],
    },
    {
      id: "career",
      labelEn: "Career",
      labelKm: "អាជីព",
      pillarNumber: "02",
      taglineEn: "Bridge to your dream job",
      taglineKm: "កសាងអាជីព និងស្វែងរកឱកាសការងារ",
      items: [
        {
          path: "/career",
          labelEn: "Career Roadmap & Readiness",
          labelKm: "ផែនទីបង្ហាញផ្លូវអាជីព",
          descEn: "Step-by-step competency milestones and skill bridge recommendations",
          descKm: "ដំណើរឆ្ពោះទៅកាន់ការងារគោលដៅ មួយជំហានម្តងៗ",
          icon: FiCompass,
          color: "purple",
        },
        {
          path: "/jobs",
          labelEn: "Internships & Job Board",
          labelKm: "កម្មសិក្សា និងការងារ (Jobs)",
          descEn: "Live openings from verified employers with instant Skill Match %",
          descKm: "ស្វែងរកការងារជាក់ស្តែង ជាមួយពិន្ទុភាពស័ក្តិសម (Match %)",
          icon: FiBriefcase,
          color: "emerald",
        },
        {
          path: "/my-applications",
          labelEn: "My Application Tracker",
          labelKm: "តាមដានពាក្យសុំការងារ",
          descEn: "Monitor recruitment stages, interview links, and recruiter notes",
          descKm: "តាមដានដំណាក់កាលសម្ភាសន៍ និងព័ត៌មានពីក្រុមហ៊ុន",
          icon: FiCheckCircle,
          color: "blue",
        },
        {
          path: "/profile",
          labelEn: "Portfolio & 1-Click CV",
          labelKm: "ប្រវត្តិរូបសង្ខេប & Interactive CV",
          descEn: "Showcase verified skills and generate professional PDF resumes",
          descKm: "បង្ហាញជំនាញ និងបង្កើត CV ស្អាតដោយចុចតែម្តង",
          icon: FiFileText,
          color: "indigo",
        },
      ],
    },
    {
      id: "community",
      labelEn: "Community",
      labelKm: "សហគមន៍",
      pillarNumber: "03",
      taglineEn: "Grow together as tech builders",
      taglineKm: "ភ្ជាប់ទំនាក់ទំនង និងចែករំលែកចំណេះដឹង",
      items: [
        {
          path: "/forum",
          labelEn: "Developer Forum",
          labelKm: "វេទិកាពិភាក្សា Q&A",
          descEn: "Ask questions, share code snippets, and solve bugs together",
          descKm: "សួរសំណួរដោះស្រាយកំហុសកូដ និងចែករំលែកគំនិត",
          icon: FiMessageSquare,
          color: "purple",
        },
        {
          path: "/community",
          labelEn: "Discover Members",
          labelKm: "ស្វែងរកសមាជិក និងដៃគូ",
          descEn: "Find tech learners and collaborators matching your interests",
          descKm: "ស្វែងរកមិត្តភក្តិរៀនកូដ និងដៃគូសហការបង្កើត Project",
          icon: FiUsers,
          color: "indigo",
        },
        {
          path: "/messages",
          labelEn: "Contextual Inbox",
          labelKm: "ប្រអប់សារសន្ទនា",
          descEn: "Direct messaging organized by Jobs, Swaps, and Mentorships",
          descKm: "ផ្ញើសារបែងចែកតាមប្រភេទការងារ ដោះដូរជំនាញ និងការណែនាំ",
          icon: FiMail,
          color: "blue",
        },
      ],
    },
  ];
};

export const getWorkspaceInfo = (user) => {
  const role = user?.role || "guest";

  if (role === "recruiter") {
    return {
      path: "/dashboard",
      labelEn: "Company Workspace",
      labelKm: "ផ្ទាំងការងារក្រុមហ៊ុន",
      badgeEn: "Recruiter",
      badgeKm: "អ្នកជ្រើសរើស",
    };
  }

  if (role === "mentor") {
    return {
      path: "/dashboard",
      labelEn: "Mentor Workspace",
      labelKm: "ផ្ទាំងការងារ Mentor",
      badgeEn: "Mentor",
      badgeKm: "គ្រូណែនាំ",
    };
  }

  if (role === "admin") {
    return {
      path: "/dashboard",
      labelEn: "Admin Workspace",
      labelKm: "ផ្ទាំងការងារ Admin",
      badgeEn: "Admin",
      badgeKm: "អ្នកគ្រប់គ្រង",
    };
  }

  return {
    path: user ? "/dashboard" : "/login",
    labelEn: user ? "My Workspace" : "Get Started",
    labelKm: user ? "ផ្ទាំងការងាររបស់ខ្ញុំ" : "ចាប់ផ្តើម",
    badgeEn: user ? "Student" : "Free",
    badgeKm: user ? "សិស្ស" : "ឥតគិតថ្លៃ",
  };
};
