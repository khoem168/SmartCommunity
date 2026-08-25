import heangChhengKhoemPhoto from "../../assets/team/heang-chheng-khoem.jpg";
import hornPiseyPhoto from "../../assets/team/horn-pisey.jpg";
import krySoranuthPhoto from "../../assets/team/kry-soranuth.jpg";
import muyKalinPhoto from "../../assets/team/muy-kalin.jpg";
import samrithRatanaPhoto from "../../assets/team/samrith-ratana.jpg";

// Static profiles used only where a local preview is needed. The live mentorship
// directory continues to load verified mentors from the API and database.
export const mentors = [
  {
    id: "muy-kalin",
    name: "MUY KALIN",
    title: "Full-stack and frontend development",
    skills: ["React.js", "Node.js", "PHP", "MySQL"],
    location: "Cambodia",
    bio: "Builds responsive interfaces and full-stack web applications with API and database integration.",
    avatarUrl: muyKalinPhoto,
  },
  {
    id: "horn-pisey",
    name: "HORN PISEY",
    title: "IT audit and cyber risk",
    skills: ["ITGC", "Cyber Risk", "Network Security", "Power BI"],
    location: "Cambodia",
    bio: "Works with IT controls, access management, network security, audit evidence, and compliance.",
    avatarUrl: hornPiseyPhoto,
  },
  {
    id: "kry-soranuth",
    name: "KRY SORANUTH",
    title: "Cybersecurity and network foundations",
    skills: ["Cybersecurity", "Linux", "Python", "Networking"],
    location: "Cambodia",
    bio: "Focuses on network security, risk assessment, Linux administration, and information security.",
    avatarUrl: krySoranuthPhoto,
  },
  {
    id: "samrith-ratana",
    name: "SAMRITH RATANA",
    title: "B2B account and technical support",
    skills: ["B2B", "Client Support", "IT Setup", "MS Office"],
    location: "Cambodia",
    bio: "Supports enterprise clients through account coordination, service proposals, and technical setup.",
    avatarUrl: samrithRatanaPhoto,
  },
  {
    id: "heang-chheng-khoem",
    name: "HEANG CHHENGKHOEM",
    title: "Digital marketing and IT support",
    skills: ["Digital Marketing", "SEO", "IT Support", "Automation"],
    location: "Cambodia",
    bio: "Works across campaign analytics, content operations, technical support, and software automation.",
    avatarUrl: heangChhengKhoemPhoto,
  },
];
