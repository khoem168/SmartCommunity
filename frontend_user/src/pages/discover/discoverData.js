import { createUserId, loadRegisteredUsers } from "../../utils/userStorage";

export const demoDiscoverMembers = [
  {
    id: "alice-brown",
    name: "Alice Brown",
    role: "Student",
    title: "Computer Science Student",
    location: "Online",
    availability: "Weekdays evening",
    bio: "Building frontend projects and looking for more confidence with UI systems.",
    teachSkills: ["React", "JavaScript", "HTML/CSS"],
    learnSkills: ["UI/UX Design", "Portfolio Review"],
    matchScore: 94,
  },
  {
    id: "bob-wilson",
    name: "Bob Wilson",
    role: "Student",
    title: "Marketing Student",
    location: "Remote",
    availability: "Weekends",
    bio: "Can help with campaign planning and wants to learn technical data skills.",
    teachSkills: ["Digital Marketing", "Content Strategy", "SEO"],
    learnSkills: ["Python", "Data Analysis"],
    matchScore: 88,
  },
  {
    id: "sofia-lee",
    name: "Sofia Lee",
    role: "Student",
    title: "Junior Backend Developer",
    location: "Hybrid",
    availability: "Flexible schedule",
    bio: "Enjoys backend APIs and wants to exchange knowledge with design-focused learners.",
    teachSkills: ["Node.js", "SQL", "API Development"],
    learnSkills: ["Figma", "UI/UX Design"],
    matchScore: 86,
  },
  {
    id: "daniel-kim",
    name: "Daniel Kim",
    role: "Student",
    title: "Cyber Security Learner",
    location: "Online",
    availability: "By appointment",
    bio: "Practicing security basics and happy to help beginners understand safe web habits.",
    teachSkills: ["Cyber Security", "Linux Basics"],
    learnSkills: ["React", "Cloud Computing"],
    matchScore: 81,
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
