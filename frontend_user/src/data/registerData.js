export const roleOptions = [
  { label: "Student", value: "student" },
  { label: "Mentor", value: "mentor" },
  { label: "Recruiter", value: "recruiter" },
];

export const skillCategories = [
  {
    name: "Technology & Programming",
    skills: [
      "HTML",
      "CSS",
      "JavaScript",
      "Java",
      "React",
      "Node.js",
      "Python",
      "PHP",
      "SQL",
      "Git & GitHub",
    ],
  },
  {
    name: "Design & Creative",
    skills: [
      "UI/UX Design",
      "Figma",
      "Graphic Design",
      "Wireframing",
      "Prototyping",
      "Video Editing",
    ],
  },
  {
    name: "Data & Cloud",
    skills: [
      "Data Analysis",
      "Data Science",
      "Excel",
      "Power BI",
      "Cloud Computing",
      "AWS",
      "Cyber Security",
    ],
  },
  {
    name: "Business & Marketing",
    skills: [
      "Digital Marketing",
      "SEO",
      "Content Writing",
      "Social Media Marketing",
      "Project Management",
      "Entrepreneurship",
    ],
  },
  {
    name: "Career & Soft Skills",
    skills: [
      "Leadership",
      "Public Speaking",
      "Communication",
      "Interview Preparation",
      "Resume Building",
      "Teamwork",
    ],
  },
];

export const teachSkills = skillCategories.flatMap((category) => category.skills);

export const learnSkills = teachSkills;

export const availabilityOptions = [
  "Weekdays morning",
  "Weekdays evening",
  "Weekends",
  "Flexible schedule",
  "By appointment",
];

export const hiringTimelineOptions = [
  "ASAP",
  "Within 2 weeks",
  "Within 1 month",
  "Flexible",
  "Looking ahead",
];

export const jobTypes = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
  "Freelance",
];

export const experienceLevels = [
  { label: "Beginner", value: "beginner" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Advanced", value: "advanced" },
  { label: "Expert", value: "expert" },
];
