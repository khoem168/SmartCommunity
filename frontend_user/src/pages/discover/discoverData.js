import { createUserId, loadRegisteredUsers } from "../../utils/userStorage";

export const demoDiscoverMembers = [
  {
    id: "muy-kalin",
    name: "MUY KALIN",
    role: "Student",
    title: "Frontend Learning Partner",
    location: "Online",
    availability: "Weekday evenings",
    bio: "A friendly community member focused on building practical web projects and sharing frontend basics.",
    teachSkills: ["HTML/CSS", "JavaScript", "React"],
    learnSkills: ["UI/UX Design", "Portfolio Review", "Backend"],
    matchScore: 96,
  },
  {
    id: "horn-pisey",
    name: "HORN PISEY",
    role: "Student",
    title: "Design & Content Learner",
    location: "Remote",
    availability: "Weekends",
    bio: "Interested in design, presentation, and content planning for student projects.",
    teachSkills: ["Graphic Design", "Content Strategy", "Canva"],
    learnSkills: ["React", "JavaScript", "Career Portfolio"],
    matchScore: 91,
  },
  {
    id: "kry-soranuth",
    name: "KRY SORANUTH",
    role: "Student",
    title: "Backend API Learner",
    location: "Hybrid",
    availability: "Flexible schedule",
    bio: "Enjoys backend logic, APIs, and database practice for real project workflows.",
    teachSkills: ["Node.js", "SQL", "API Development"],
    learnSkills: ["React", "UI/UX Design", "Cloud Deployment"],
    matchScore: 89,
  },
  {
    id: "samrith-ratana",
    name: "SAMRITH RATANA",
    role: "Student",
    title: "Career & Cyber Security Learner",
    location: "Online",
    availability: "By appointment",
    bio: "Practicing safe web habits, communication skills, and career preparation.",
    teachSkills: ["Cyber Security", "Linux Basics", "Career Preparation"],
    learnSkills: ["Backend", "Database", "Internship Preparation"],
    matchScore: 86,
  },
  {
    id: "heang-chhengkhoem",
    name: "HEANG CHHENGKHOEM",
    role: "Student",
    title: "Full-stack Project Builder",
    location: "Cambodia",
    availability: "Flexible schedule",
    bio: "Building the Smart Community Skill & Career Development Platform and connecting learners through skills.",
    teachSkills: ["React", "Node.js", "Database", "Project Management"],
    learnSkills: ["Advanced UI/UX", "Deployment", "System Design"],
    matchScore: 98,
  },
];

const normalizeRegisteredUser = (user) => {
  const teachSkills = user.skillsToTeach || [];
  const learnSkills = user.skillsToLearn || [];

  return {
    id: user.id || createUserId(user.email || user.fullName),
    name: user.fullName || user.email,
    role: user.role || "Student",
    title:
      user.jobTitle ||
      user.profession ||
      (user.role === "mentor" ? "Community mentor" : "Skill exchange learner"),
    location: user.location || "Online",
    availability: user.availability || "Flexible schedule",
    bio:
      user.bio ||
      user.jobDescription ||
      "Ready to exchange skills and learn with the community.",
    teachSkills: teachSkills.length ? teachSkills : user.candidateSkills || [],
    learnSkills,
    matchScore: Math.min(98, 72 + teachSkills.length * 4 + learnSkills.length * 3),
    source: "registered",
  };
};

export const getDiscoverMembers = () => {
  const registeredMembers = loadRegisteredUsers()
    .filter((user) => user.role !== "recruiter")
    .map(normalizeRegisteredUser);
  const registeredIds = new Set(registeredMembers.map((member) => member.id));

  return [
    ...registeredMembers,
    ...demoDiscoverMembers.filter((member) => !registeredIds.has(member.id)),
  ];
};

export const discoverMembers = getDiscoverMembers();

export const getDiscoverMember = (memberId) =>
  getDiscoverMembers().find((member) => member.id === memberId);
