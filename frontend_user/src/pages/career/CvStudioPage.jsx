import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import {
  FiUser,
  FiBookOpen,
  FiCode,
  FiBriefcase,
  FiEye,
  FiPrinter,
  FiCheckCircle,
  FiPlus,
  FiTrash2,
  FiSave,
  FiArrowRight,
  FiArrowLeft,
  FiGlobe,
  FiGithub,
  FiLinkedin,
  FiMapPin,
  FiMail,
  FiAward,
  FiLayout,
  FiDownload,
  FiRefreshCw,
  FiExternalLink,
  FiCopy,
  FiCamera,
  FiPhone,
  FiStar,
  FiLayers,
} from "react-icons/fi";
import { useGlobleContext } from "../../context/GlobleContext";
import { useLanguage } from "../../context/LanguageContext";
import {
  fetchProfileRequest,
  createProfileItemRequest,
  deleteProfileItemRequest,
} from "../../services/profileService";
import "./CvStudioPage.css";

// Sanitize external user-provided URLs to block javascript:/data: XSS schemes
function safeExternalUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return "#";
  const trimmed = rawUrl.trim();
  if (!trimmed) return "#";
  if (/^(javascript|data|vbscript|file):/i.test(trimmed)) return "#";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

// Strip bilingual text like "Khmer (English)" or "English / Khmer" to ensure pure language output
function stripBilingual(text, isKm) {
  if (!text || typeof text !== "string") return text || "";
  const trimmed = text.trim();

  // Match pattern: "Khmer (English)"
  const parenMatch = trimmed.match(/^([^\(\)]+?)\s*\((.+?)\)$/);
  if (parenMatch) {
    const p1 = parenMatch[1].trim();
    const p2 = parenMatch[2].trim();
    const hasKhmerP1 = /[\u1780-\u17FF]/.test(p1);
    const hasKhmerP2 = /[\u1780-\u17FF]/.test(p2);
    if (hasKhmerP1 && !hasKhmerP2) return isKm ? p1 : p2;
    if (!hasKhmerP1 && hasKhmerP2) return isKm ? p2 : p1;
    return isKm ? p1 : p2;
  }
  
  // Match pattern: "Khmer / English" or "English / Khmer"
  // ONLY split if there is whitespace around the delimiter to avoid splitting terms like UI/UX
  const slashMatch = trimmed.split(/\s+[\/|•]\s+/);
  if (slashMatch.length === 2 && !/ui\/ux/i.test(trimmed)) {
    const hasKhmer0 = /[\u1780-\u17FF]/.test(slashMatch[0]);
    const hasKhmer1 = /[\u1780-\u17FF]/.test(slashMatch[1]);
    if (hasKhmer0 && !hasKhmer1) return isKm ? slashMatch[0].trim() : slashMatch[1].trim();
    if (!hasKhmer0 && hasKhmer1) return isKm ? slashMatch[1].trim() : slashMatch[0].trim();
  }
  
  return trimmed;
}

const KHMER_MONTHS = [
  "មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា",
  "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ"
];
const ENGLISH_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

function toKhmerDigits(numStr) {
  const kmDigits = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"];
  return String(numStr ?? "").replace(/[0-9]/g, (d) => kmDigits[Number(d)]);
}

function formatCvDate(dateStr, isKm = false, yearOnly = false) {
  if (!dateStr) return "";
  const str = String(dateStr).trim();
  const parts = str.split("-");
  const year = parts[0] || "";
  const month = parts[1] ? parseInt(parts[1], 10) : null;

  if (yearOnly || !month || month < 1 || month > 12) {
    return isKm ? toKhmerDigits(year) : year;
  }

  if (isKm) {
    return `${KHMER_MONTHS[month - 1]} ${toKhmerDigits(year)}`;
  } else {
    return `${ENGLISH_MONTHS[month - 1]} ${year}`;
  }
}

function formatCvDateRange(startDate, endDate, isCurrent, isKm = false, yearOnly = false) {
  const start = formatCvDate(startDate, isKm, yearOnly);
  const presentText = isKm ? "បច្ចុប្បន្ន" : "Present";
  const end = isCurrent || !endDate ? presentText : formatCvDate(endDate, isKm, yearOnly);
  if (!start && !end) return "";
  if (!start) return end;
  return `${start} — ${end}`;
}

function sanitizeJobTitle(rawTitle, isKm = false, defaultTitle = "") {
  const clean = String(rawTitle || "").trim();
  const lower = clean.toLowerCase();
  const dummyTitles = ["beginner", "junior", "student", "user", "member", "intermediate", "advanced", "null", "undefined"];
  if (!clean || dummyTitles.includes(lower)) {
    return defaultTitle || (isKm ? "អ្នកអភិវឌ្ឍន៍គេហទំព័រ Full-Stack" : "Full-Stack Web Developer");
  }
  return translateCvField(clean, isKm);
}

const CV_FIELD_TRANSLATIONS = {
  // Applicant Full Names (Khmer <-> English)
  "សុខា វណ្ណៈ": "Sokha Vannak",
  "Sokha Vannak": "សុខា វណ្ណៈ",
  "sokha vannak": "សុខា វណ្ណៈ",
  "ហៀង ឆេងឃឿម": "Heang Chheng Khoem",
  "Heang Chheng Khoem": "ហៀង ឆេងឃឿម",
  "heang chheng khoem": "ហៀង ឆេងឃឿម",

  // Common Tech Professions (English -> Khmer)
  "Full-Stack Web Developer & UI/UX Designer": "អ្នកអភិវឌ្ឍន៍គេហទំព័រ Full-Stack & រចនា UI/UX",
  "full-stack web developer & ui/ux designer": "អ្នកអភិវឌ្ឍន៍គេហទំព័រ Full-Stack & រចនា UI/UX",
  "អ្នកអភិវឌ្ឍន៍គេហទំព័រ Full-Stack & រចនា UI/UX": "Full-Stack Web Developer & UI/UX Designer",
  "អ្នកអភិវឌ្ឍន៍គេហទំព័រ full-stack & រចនា ui/ux": "Full-Stack Web Developer & UI/UX Designer",
  "Full-Stack Web Developer": "អ្នកអភិវឌ្ឍន៍គេហទំព័រ Full-Stack",
  "full-stack web developer": "អ្នកអភិវឌ្ឍន៍គេហទំព័រ Full-Stack",
  "full stack web developer": "អ្នកអភិវឌ្ឍន៍គេហទំព័រ Full-Stack",
  "full-stack developer": "អ្នកអភិវឌ្ឍន៍គេហទំព័រ Full-Stack",
  "full stack developer": "អ្នកអភិវឌ្ឍន៍គេហទំព័រ Full-Stack",
  "Frontend Web Developer": "អ្នកអភិវឌ្ឍន៍គេហទំព័រ Frontend",
  "frontend web developer": "អ្នកអភិវឌ្ឍន៍គេហទំព័រ Frontend",
  "Frontend Developer": "អ្នកអភិវឌ្ឍន៍គេហទំព័រ Frontend",
  "frontend developer": "អ្នកអភិវឌ្ឍន៍គេហទំព័រ Frontend",
  "Backend Web Developer": "អ្នកអភិវឌ្ឍន៍គេហទំព័រ Backend",
  "backend web developer": "អ្នកអភិវឌ្ឍន៍គេហទំព័រ Backend",
  "Backend Developer": "អ្នកអភិវឌ្ឍន៍គេហទំព័រ Backend",
  "backend developer": "អ្នកអភិវឌ្ឍន៍គេហទំព័រ Backend",
  "UI/UX Designer": "អ្នករចនា UI/UX",
  "ui/ux designer": "អ្នករចនា UI/UX",
  "ui designer": "អ្នករចនា UI",
  "ux designer": "អ្នករចនា UX",
  "product designer": "អ្នករចនាផលិតផល Product Designer",
  "Data Analyst": "អ្នកវិភាគទិន្នន័យ",
  "data analyst": "អ្នកវិភាគទិន្នន័យ",
  "Data Scientist": "អ្នកវិទ្យាសាស្ត្រទិន្នន័យ",
  "data scientist": "អ្នកវិទ្យាសាស្ត្រទិន្នន័យ",
  "Data Engineer": "វិស្វករទិន្នន័យ",
  "data engineer": "វិស្វករទិន្នន័យ",
  "Mobile App Developer": "អ្នកអភិវឌ្ឍន៍កម្មវិធីទូរស័ព្ទ",
  "mobile app developer": "អ្នកអភិវឌ្ឍន៍កម្មវិធីទូរស័ព្ទ",
  "mobile developer": "អ្នកអភិវឌ្ឍន៍កម្មវិធីទូរស័ព្ទ",
  "DevOps Engineer": "វិស្វករ DevOps",
  "devops engineer": "វិស្វករ DevOps",
  "Cloud Engineer": "វិស្វករ Cloud",
  "cloud engineer": "វិស្វករ Cloud",
  "Software Engineer": "វិស្វករកម្មវិធី",
  "software engineer": "វិស្វករកម្មវិធី",
  "Software Developer": "អ្នកអភិវឌ្ឍន៍កម្មវិធី",
  "software developer": "អ្នកអភិវឌ្ឍន៍កម្មវិធី",
  "Web Developer": "អ្នកអភិវឌ្ឍន៍គេហទំព័រ",
  "web developer": "អ្នកអភិវឌ្ឍន៍គេហទំព័រ",
  "Cybersecurity Specialist": "អ្នកជំនាញសន្តិសុខសាយប័រ",
  "cybersecurity specialist": "អ្នកជំនាញសន្តិសុខសាយប័រ",
  "IT Support Specialist": "ផ្នែកគាំទ្របច្ចេកវិទ្យា IT Support",
  "it support": "ផ្នែកគាំទ្របច្ចេកវិទ្យា IT Support",

  // Khmer -> English Job Titles
  "អ្នកអភិវឌ្ឍន៍គេហទំព័រ Full-Stack": "Full-Stack Web Developer",
  "អ្នកអភិវឌ្ឍន៍គេហទំព័រ full-stack": "Full-Stack Web Developer",
  "អ្នកអភិវឌ្ឍន៍គេហទំព័រ": "Web Developer",
  "អ្នកអភិវឌ្ឍន៍គេហទំព័រ Frontend": "Frontend Web Developer",
  "អ្នកអភិវឌ្ឍន៍គេហទំព័រ frontend": "Frontend Web Developer",
  "អ្នកអភិវឌ្ឍន៍គេហទំព័រ Backend": "Backend Web Developer",
  "អ្នកអភិវឌ្ឍន៍គេហទំព័រ backend": "Backend Web Developer",
  "អ្នករចនា UI/UX": "UI/UX Designer",
  "អ្នករចនា ui/ux": "UI/UX Designer",
  "អ្នកវិភាគទិន្នន័យ": "Data Analyst",
  "អ្នកវិទ្យាសាស្ត្រទិន្នន័យ": "Data Scientist",
  "វិស្វករទិន្នន័យ": "Data Engineer",
  "អ្នកអភិវឌ្ឍន៍កម្មវិធីទូរស័ព្ទ": "Mobile App Developer",
  "វិស្វករ DevOps": "DevOps Engineer",
  "វិស្វករ devops": "DevOps Engineer",
  "វិស្វករ Cloud": "Cloud Engineer",
  "វិស្វករ cloud": "Cloud Engineer",
  "វិស្វករកម្មវិធី": "Software Engineer",
  "អ្នកជំនាញសន្តិសុខសាយប័រ": "Cybersecurity Specialist",

  // Gender
  "ប្រុស": "Male",
  "male": "ប្រុស",
  "ស្រី": "Female",
  "female": "ស្រី",

  // Marital Status
  "នៅលីវ": "Single",
  "single": "នៅលីវ",
  "រៀបការរួច": "Married",
  "មានគ្រួសារ": "Married",
  "married": "រៀបការរួច",

  // Nationality
  "ខ្មែរ": "Cambodian",
  "cambodian": "ខ្មែរ",

  // Languages
  "ភាសាខ្មែរ": "Khmer",
  "ខ្មែរ": "Khmer",
  "khmer": "ភាសាខ្មែរ",
  "ភាសាអង់គ្លេស": "English",
  "អង់គ្លេស": "English",
  "english": "ភាសាអង់គ្លេស",
  "ភាសាបារាំង": "French",
  "បារាំង": "French",
  "french": "ភាសាបារាំង",
  "ភាសាចិន": "Chinese",
  "ចិន": "Chinese",
  "chinese": "ភាសាចិន",
  "ភាសាជប៉ុន": "Japanese",
  "ជប៉ុន": "Japanese",
  "japanese": "ភាសាជប៉ុន",
  "ភាសាកូរ៉េ": "Korean",
  "កូរ៉េ": "Korean",
  "korean": "ភាសាកូរ៉េ",

  // Language Levels
  "ភាសាកំណើត": "Native / Mother Tongue",
  "មាតុភាសា": "Native / Mother Tongue",
  "native / mother tongue": "ភាសាកំណើត",
  "native": "ភាសាកំណើត",
  "mother tongue": "ភាសាកំណើត",
  "កម្រិតវិជ្ជាជីវៈ": "Professional Working",
  "professional working": "កម្រិតវិជ្ជាជីវៈ",
  "ស្ទាត់ជំនាញ": "Fluent",
  "fluent": "ស្ទាត់ជំនាញ",
  "ល្អណាស់": "Advanced",
  "advanced": "ល្អណាស់",
  "ល្អបង្គួរ": "Intermediate",
  "កម្រិតមធ្យម": "Intermediate",
  "intermediate": "ល្អបង្គួរ",
  "មូលដ្ឋាន": "Basic",
  "basic": "មូលដ្ឋាន",

  // Common Places (All 25 Provinces & Capital of Cambodia)
  "រាជធានីភ្នំពេញ កម្ពុជា": "Phnom Penh, Cambodia",
  "រាជធានីភ្នំពេញ, កម្ពុជា": "Phnom Penh, Cambodia",
  "រាជធានីភ្នំពេញ": "Phnom Penh, Cambodia",
  "ភ្នំពេញ កម្ពុជា": "Phnom Penh, Cambodia",
  "ភ្នំពេញ, កម្ពុជា": "Phnom Penh, Cambodia",
  "ភ្នំពេញ": "Phnom Penh, Cambodia",
  "phnom penh, cambodia": "រាជធានីភ្នំពេញ កម្ពុជា",
  "phnom penh": "រាជធានីភ្នំពេញ កម្ពុជា",

  "ខេត្តកណ្តាល កម្ពុជា": "Kandal Province, Cambodia",
  "ខេត្តកណ្តាល, កម្ពុជា": "Kandal Province, Cambodia",
  "ខេត្តកណ្តាល": "Kandal Province, Cambodia",
  "កណ្តាល កម្ពុជា": "Kandal Province, Cambodia",
  "កណ្តាល, កម្ពុជា": "Kandal Province, Cambodia",
  "កណ្តាល": "Kandal Province, Cambodia",
  "kandal province, cambodia": "ខេត្តកណ្តាល កម្ពុជា",
  "kandal": "ខេត្តកណ្តាល កម្ពុជា",

  "ខេត្តសៀមរាប កម្ពុជា": "Siem Reap Province, Cambodia",
  "ខេត្តសៀមរាប, កម្ពុជា": "Siem Reap Province, Cambodia",
  "ខេត្តសៀមរាប": "Siem Reap Province, Cambodia",
  "សៀមរាប កម្ពុជា": "Siem Reap Province, Cambodia",
  "សៀមរាប": "Siem Reap Province, Cambodia",
  "siem reap province, cambodia": "ខេត្តសៀមរាប កម្ពុជា",
  "siem reap": "ខេត្តសៀមរាប កម្ពុជា",

  "ខេត្តបាត់ដំបង កម្ពុជា": "Battambang Province, Cambodia",
  "ខេត្តបាត់ដំបង": "Battambang Province, Cambodia",
  "បាត់ដំបង កម្ពុជា": "Battambang Province, Cambodia",
  "បាត់ដំបង": "Battambang Province, Cambodia",
  "battambang province, cambodia": "ខេត្តបាត់ដំបង កម្ពុជា",
  "battambang": "ខេត្តបាត់ដំបង កម្ពុជា",

  "ខេត្តកំពង់ចាម": "Kampong Cham Province, Cambodia",
  "កំពង់ចាម": "Kampong Cham Province, Cambodia",
  "kampong cham": "ខេត្តកំពង់ចាម",

  "ខេត្តកំពង់ឆ្នាំង": "Kampong Chhnang Province, Cambodia",
  "កំពង់ឆ្នាំង": "Kampong Chhnang Province, Cambodia",
  "kampong chhnang": "ខេត្តកំពង់ឆ្នាំង",

  "ខេត្តកំពង់ស្ពឺ": "Kampong Speu Province, Cambodia",
  "កំពង់ស្ពឺ": "Kampong Speu Province, Cambodia",
  "kampong speu": "ខេត្តកំពង់ស្ពឺ",

  "ខេត្តកំពង់ធំ": "Kampong Thom Province, Cambodia",
  "កំពង់ធំ": "Kampong Thom Province, Cambodia",
  "kampong thom": "ខេត្តកំពង់ធំ",

  "ខេត្តកំពត": "Kampot Province, Cambodia",
  "កំពត": "Kampot Province, Cambodia",
  "kampot": "ខេត្តកំពត",

  "ខេត្តកែប": "Kep Province, Cambodia",
  "កែប": "Kep Province, Cambodia",
  "kep": "ខេត្តកែប",

  "ខេត្តកោះកុង": "Koh Kong Province, Cambodia",
  "កោះកុង": "Koh Kong Province, Cambodia",
  "koh kong": "ខេត្តកោះកុង",

  "ខេត្តក្រចេះ": "Kratie Province, Cambodia",
  "ក្រចេះ": "Kratie Province, Cambodia",
  "kratie": "ខេត្តក្រចេះ",

  "ខេត្តមណ្ឌលគិរី": "Mondulkiri Province, Cambodia",
  "មណ្ឌលគិរី": "Mondulkiri Province, Cambodia",
  "mondulkiri": "ខេត្តមណ្ឌលគិរី",

  "ខេត្តព្រះវិហារ": "Preah Vihear Province, Cambodia",
  "ព្រះវិហារ": "Preah Vihear Province, Cambodia",
  "preah vihear": "ខេត្តព្រះវិហារ",

  "ខេត្តព្រៃវែង": "Prey Veng Province, Cambodia",
  "ព្រៃវែង": "Prey Veng Province, Cambodia",
  "prey veng": "ខេត្តព្រៃវែង",

  "ខេត្តពោធិ៍សាត់": "Pursat Province, Cambodia",
  "ពោធិ៍សាត់": "Pursat Province, Cambodia",
  "pursat": "ខេត្តពោធិ៍សាត់",

  "ខេត្តរតនគិរី": "Ratanakiri Province, Cambodia",
  "រតនគិរី": "Ratanakiri Province, Cambodia",
  "ratanakiri": "ខេត្តរតនគិរី",

  "ខេត្តព្រះសីហនុ": "Preah Sihanouk Province, Cambodia",
  "ព្រះសីហនុ": "Preah Sihanouk Province, Cambodia",
  "ក្រុងព្រះសីហនុ": "Preah Sihanouk Province, Cambodia",
  "sihanoukville": "ខេត្តព្រះសីហនុ",

  "ខេត្តស្ទឹងត្រែង": "Stung Treng Province, Cambodia",
  "ស្ទឹងត្រែង": "Stung Treng Province, Cambodia",
  "stung treng": "ខេត្តស្ទឹងត្រែង",

  "ខេត្តស្វាយរៀង": "Svay Rieng Province, Cambodia",
  "ស្វាយរៀង": "Svay Rieng Province, Cambodia",
  "svay rieng": "ខេត្តស្វាយរៀង",

  "ខេត្តតាកែវ": "Takeo Province, Cambodia",
  "តាកែវ": "Takeo Province, Cambodia",
  "takeo": "ខេត្តតាកែវ",

  "ខេត្តឧត្តរមានជ័យ": "Oddar Meanchey Province, Cambodia",
  "ឧត្តរមានជ័យ": "Oddar Meanchey Province, Cambodia",
  "oddar meanchey": "ខេត្តឧត្តរមានជ័យ",

  "ខេត្តប៉ៃលិន": "Pailin Province, Cambodia",
  "ប៉ៃលិន": "Pailin Province, Cambodia",
  "pailin": "ខេត្តប៉ៃលិន",

  "ខេត្តត្បូងឃ្មុំ": "Tboung Khmum Province, Cambodia",
  "ត្បូងឃ្មុំ": "Tboung Khmum Province, Cambodia",
  "tboung khmum": "ខេត្តត្បូងឃ្មុំ",

  "ខេត្តបន្ទាយមានជ័យ": "Banteay Meanchey Province, Cambodia",
  "បន្ទាយមានជ័យ": "Banteay Meanchey Province, Cambodia",
  "banteay meanchey": "ខេត្តបន្ទាយមានជ័យ",

  "កម្ពុជា": "Cambodia",
  "ប្រទេសកម្ពុជា": "Cambodia",
  "cambodia": "កម្ពុជា",

  // Sample References & Institutions
  "លោក ឈុន វឌ្ឍនៈ": "Mr. Chhun Vathanak",
  "mr. chhun vathanak": "លោក ឈុន វឌ្ឍនៈ",
  "អ្នកស្រី គឹម សុផល": "Mrs. Kim Sophal",
  "mrs. kim sophal": "អ្នកស្រី គឹម សុផល",
  "ប្រធានផ្នែកបច្ចេកវិទ្យា": "Lead Software Engineer",
  "lead software engineer": "ប្រធានផ្នែកបច្ចេកវិទ្យា",
  "សាស្ត្រាចារ្យជាន់ខ្ពស់": "Senior Lecturer & Academic Advisor",
  "senior lecturer & academic advisor": "សាស្ត្រាចារ្យជាន់ខ្ពស់",
  "ក្រុមហ៊ុន ឌីជីថល ខេមបូឌា សូលូសិន": "Digital Cambodia Solutions",
  "digital cambodia solutions": "ក្រុមហ៊ុន ឌីជីថល ខេមបូឌា សូលូសិន",
  "សាកលវិទ្យាល័យភូមិន្ទភ្នំពេញ (RUPP)": "Royal University of Phnom Penh (RUPP)",
  "royal university of phnom penh (rupp)": "សាកលវិទ្យាល័យភូមិន្ទភ្នំពេញ (RUPP)",
  "សាកលវិទ្យាល័យភូមិន្ទភ្នំពេញ": "Royal University of Phnom Penh",
  "royal university of phnom penh": "សាកលវិទ្យាល័យភូមិន្ទភ្នំពេញ",
  "បណ្ឌិត្យសភាបច្ចេកវិទ្យា Smart Community": "Smart Community Tech Academy",
  "smart community tech academy": "បណ្ឌិត្យសភាបច្ចេកវិទ្យា Smart Community",
  "freeCodeCamp កម្ពុជា": "freeCodeCamp Cambodia",
  "freecodecamp cambodia": "freeCodeCamp កម្ពុជា",
};

function translateCvField(val, isKm) {
  if (!val || typeof val !== "string") return val || "";
  const stripped = stripBilingual(val, isKm).trim();
  const lower = stripped.toLowerCase();
  const hasKhmer = /[\u1780-\u17FF]/.test(stripped);

  if (isKm) {
    if (hasKhmer) return stripped;
    if (CV_FIELD_TRANSLATIONS[stripped]) return CV_FIELD_TRANSLATIONS[stripped];
    if (CV_FIELD_TRANSLATIONS[lower]) return CV_FIELD_TRANSLATIONS[lower];
  } else {
    if (!hasKhmer) return stripped;
    if (CV_FIELD_TRANSLATIONS[stripped]) return CV_FIELD_TRANSLATIONS[stripped];
    if (CV_FIELD_TRANSLATIONS[lower]) return CV_FIELD_TRANSLATIONS[lower];
  }

  // Date of birth format handling (e.g. "១៥ ឧសភា ២០០២" <-> "15 May 2002")
  if (!isKm && /[\u1780-\u17FF]/.test(stripped)) {
    const kmMonths = ["មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា", "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ"];
    const enMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let converted = stripped;
    kmMonths.forEach((m, idx) => {
      converted = converted.replace(m, enMonths[idx]);
    });
    const kmDigits = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"];
    kmDigits.forEach((d, idx) => {
      converted = converted.replaceAll(d, String(idx));
    });
    if (converted !== stripped) return converted;
  } else if (isKm && !/[\u1780-\u17FF]/.test(stripped)) {
    const enMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December", "Jan", "Feb", "Mar", "Apr", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const kmMonths = ["មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា", "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ", "មករា", "កុម្ភៈ", "មីនា", "មេសា", "មិថុនា", "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ"];
    let converted = stripped;
    enMonths.forEach((m, idx) => {
      converted = converted.replace(new RegExp(`\\b${m}\\b`, "i"), kmMonths[idx]);
    });
    converted = toKhmerDigits(converted);
    if (converted !== stripped) return converted;
  }

  return stripped;
}

function resolveCvBio(bio, isKm) {
  if (!bio || typeof bio !== "string") {
    return isKm ? SAMPLE_CV_DATA_KM.basicInfo.bio : SAMPLE_CV_DATA_EN.basicInfo.bio;
  }
  const hasKm = /[\u1780-\u17FF]/.test(bio);
  if (isKm && !hasKm) {
    return SAMPLE_CV_DATA_KM.basicInfo.bio;
  }
  if (!isKm && hasKm) {
    return SAMPLE_CV_DATA_EN.basicInfo.bio;
  }
  return bio;
}

const SAMPLE_CV_DATA_KM = {
  basicInfo: {
    fullName: "សុខា វណ្ណៈ",
    jobTitle: "អ្នកអភិវឌ្ឍន៍គេហទំព័រ Full-Stack & រចនា UI/UX",
    email: "sokha.vannak@smartcommunity.kh",
    phone: "+855 12 345 678",
    location: "រាជធានីភ្នំពេញ កម្ពុជា",
    placeOfBirth: "ខេត្តកណ្តាល កម្ពុជា",
    bio: "និស្សិតផ្នែកវិទ្យាសាស្ត្រកុំព្យូទ័រ ដែលមានបទពិសោធន៍ក្នុងការបង្កើតគេហទំព័រទំនើប (React, Node.js, PostgreSQL) និងការរចនាទម្រង់អ្នកប្រើប្រាស់ (UI/UX)។ មានឆន្ទៈខ្ពស់ក្នុងការស្រាវជ្រាវបច្ចេកវិទ្យាថ្មីៗ និងចូលរួមអភិវឌ្ឍប្រព័ន្ធឌីជីថលប្រកបដោយគុណភាពខ្ពស់។",
    githubUrl: "https://github.com/sokhavannak-dev",
    linkedinUrl: "https://linkedin.com/in/sokhavannak",
    portfolioUrl: "https://sokhavannak.dev",
    photoUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    showPhoto: true,
    dateOfBirth: "១៥ ឧសភា ២០០២",
    gender: "ប្រុស",
    nationality: "ខ្មែរ",
    maritalStatus: "នៅលីវ",
  },
  skills: [
    "React.js",
    "Node.js",
    "TypeScript",
    "PostgreSQL",
    "Tailwind CSS",
    "REST API",
    "Git & GitHub",
    "Figma UI/UX",
    "Next.js",
    "Docker Basics",
  ],
  languages: [
    {
      id: "lang-1",
      language: "ភាសាខ្មែរ",
      level: "ភាសាកំណើត",
    },
    {
      id: "lang-2",
      language: "ភាសាអង់គ្លេស",
      level: "កម្រិតវិជ្ជាជីវៈ",
    },
  ],
  certifications: [
    {
      id: "cert-1",
      title: "វគ្គបណ្តុះបណ្តាលវិស្វកម្មគេហទំព័រ Full-Stack",
      issuer: "បណ្ឌិត្យសភាបច្ចេកវិទ្យា Smart Community",
      year: "២០២៤",
    },
    {
      id: "cert-2",
      title: "វិញ្ញាបនបត្រការរចនាគេហទំព័រ និងបទពិសោធន៍អ្នកប្រើប្រាស់",
      issuer: "freeCodeCamp កម្ពុជា",
      year: "២០២៣",
    },
  ],
  education: [
    {
      id: "sample-edu-1",
      institution: "សាកលវិទ្យាល័យភូមិន្ទភ្នំពេញ (RUPP)",
      degree: "បរិញ្ញាបត្រ",
      fieldOfStudy: "វិទ្យាសាស្ត្រកុំព្យូទ័រ និងវិស្វកម្ម",
      startDate: "2022-10-01",
      endDate: "2026-07-01",
    },
    {
      id: "sample-edu-2",
      institution: "បណ្ឌិត្យសភាបច្ចេកវិទ្យា Smart Community",
      degree: "វិញ្ញាបនបត្រជាន់ខ្ពស់",
      fieldOfStudy: "ការអភិវឌ្ឍគេហទំព័រ Full-Stack",
      startDate: "2024-01-01",
      endDate: "2024-09-01",
    },
  ],
  projects: [
    {
      id: "sample-proj-1",
      title: "ប្រព័ន្ធ Smart Community Skill & Career",
      description:
        "ប្រព័ន្ធសហគមន៍បច្ចេកវិទ្យាសម្រាប់សិស្ស-និស្សិតផ្លាស់ប្តូរជំនាញ សិក្សាវគ្គខ្លីៗ បង្កើត CV និងស្វែងរកឱកាសការងារ។",
      technologies: ["React", "Node.js", "PostgreSQL", "Socket.IO"],
      projectUrl: "https://smartcommunity.kh",
      githubUrl: "https://github.com/sokhavannak-dev/smart-community",
    },
    {
      id: "sample-proj-2",
      title: "គេហទំព័រលក់ទំនិញអនឡាញ & ការទូទាត់ QR",
      description:
        "គេហទំព័រលក់ទំនិញអនឡាញដែលមានមុខងារគ្រប់គ្រងស្តុកទំនិញ និងផ្ទាំងទូទាត់ប្រាក់រហ័សតាម KHQR។",
      technologies: ["Next.js", "Tailwind CSS", "Prisma"],
      projectUrl: "https://khmer-shop-demo.vercel.app",
      githubUrl: "https://github.com/sokhavannak-dev/khmer-ecommerce",
    },
  ],
  experiences: [
    {
      id: "sample-exp-1",
      title: "អ្នកអភិវឌ្ឍ Frontend (កម្មសិក្សាការងារ)",
      company: "ក្រុមហ៊ុន ឌីជីថល ខេមបូឌា សូលូសិន",
      employmentType: "ពេញម៉ោង",
      startDate: "2024-05-01",
      endDate: "",
      isCurrent: true,
      description:
        "សហការជាមួយក្រុមវិស្វករក្នុងការរចនា និងបង្កើតផ្ទាំង Dashboard សម្រាប់អតិថិជន ដោយប្រើប្រាស់ React និងបង្កើនល្បឿនទំព័រ 35%។",
    },
  ],
  references: [
    {
      id: "ref-1",
      name: "លោក ឈុន វឌ្ឍនៈ",
      position: "ប្រធានផ្នែកបច្ចេកវិទ្យា",
      organization: "ក្រុមហ៊ុន ឌីជីថល ខេមបូឌា សូលូសិន",
      phone: "+855 12 888 999",
      email: "vathanak.chhun@digicambodia.kh",
    },
    {
      id: "ref-2",
      name: "អ្នកស្រី គឹម សុផល",
      position: "សាស្ត្រាចារ្យជាន់ខ្ពស់",
      organization: "សាកលវិទ្យាល័យភូមិន្ទភ្នំពេញ (RUPP)",
      phone: "+855 11 777 666",
      email: "sophal.kim@rupp.edu.kh",
    },
  ],
};

const SAMPLE_CV_DATA_EN = {
  basicInfo: {
    fullName: "Sokha Vannak",
    jobTitle: "Full-Stack Web Developer & UI/UX Designer",
    email: "sokha.vannak@smartcommunity.kh",
    phone: "+855 12 345 678",
    location: "Phnom Penh, Cambodia",
    placeOfBirth: "Kandal Province, Cambodia",
    bio: "Computer Science student with hands-on experience in modern web development (React, Node.js, PostgreSQL) and UI/UX design. Passionate about learning new technologies and building high-impact digital solutions.",
    githubUrl: "https://github.com/sokhavannak-dev",
    linkedinUrl: "https://linkedin.com/in/sokhavannak",
    portfolioUrl: "https://sokhavannak.dev",
    photoUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    showPhoto: true,
    dateOfBirth: "15 May 2002",
    gender: "Male",
    nationality: "Cambodian",
    maritalStatus: "Single",
  },
  skills: [
    "React.js",
    "Node.js",
    "TypeScript",
    "PostgreSQL",
    "Tailwind CSS",
    "REST API",
    "Git & GitHub",
    "Figma UI/UX",
    "Next.js",
    "Docker Basics",
  ],
  languages: [
    {
      id: "lang-1",
      language: "Khmer",
      level: "Native / Mother Tongue",
    },
    {
      id: "lang-2",
      language: "English",
      level: "Professional Working",
    },
  ],
  certifications: [
    {
      id: "cert-1",
      title: "Full-Stack Web Engineering Bootcamp",
      issuer: "Smart Community Tech Academy",
      year: "2024",
    },
    {
      id: "cert-2",
      title: "Responsive Web Design & Modern UX",
      issuer: "freeCodeCamp Cambodia",
      year: "2023",
    },
  ],
  education: [
    {
      id: "sample-edu-1",
      institution: "Royal University of Phnom Penh (RUPP)",
      degree: "Bachelor of Science",
      fieldOfStudy: "Computer Science & Engineering",
      startDate: "2022-10-01",
      endDate: "2026-07-01",
    },
    {
      id: "sample-edu-2",
      institution: "Smart Community Tech Academy",
      degree: "Professional Certificate",
      fieldOfStudy: "Full-Stack Web Development Bootcamp",
      startDate: "2024-01-01",
      endDate: "2024-09-01",
    },
  ],
  projects: [
    {
      id: "sample-proj-1",
      title: "Smart Community Skill & Career Platform",
      description:
        "Community web platform connecting students and mentors for skill exchanges, courses, CV generation, and career opportunities.",
      technologies: ["React", "Node.js", "PostgreSQL", "Socket.IO"],
      projectUrl: "https://smartcommunity.kh",
      githubUrl: "https://github.com/sokhavannak-dev/smart-community",
    },
    {
      id: "sample-proj-2",
      title: "Khmer E-Commerce & ABA QR Checkout UI",
      description:
        "Online store web application featuring product catalog, inventory management, and fast mobile payments via KHQR.",
      technologies: ["Next.js", "Tailwind CSS", "Prisma"],
      projectUrl: "https://khmer-shop-demo.vercel.app",
      githubUrl: "https://github.com/sokhavannak-dev/khmer-ecommerce",
    },
  ],
  experiences: [
    {
      id: "sample-exp-1",
      title: "Frontend Developer Intern",
      company: "Digital Cambodia Solutions",
      employmentType: "Full-time",
      startDate: "2024-05-01",
      endDate: "",
      isCurrent: true,
      description:
        "Collaborated with engineering team to design and build responsive customer dashboards using React, improving page load speed by 35%.",
    },
  ],
  references: [
    {
      id: "ref-1",
      name: "Mr. Chhun Vathanak",
      position: "Lead Software Engineer",
      organization: "Digital Cambodia Solutions",
      phone: "+855 12 888 999",
      email: "vathanak.chhun@digicambodia.kh",
    },
    {
      id: "ref-2",
      name: "Mrs. Kim Sophal",
      position: "Senior Lecturer",
      organization: "Royal University of Phnom Penh (RUPP)",
      phone: "+855 11 777 666",
      email: "sophal.kim@rupp.edu.kh",
    },
  ],
};

const SAMPLE_CV_DATA = SAMPLE_CV_DATA_KM;

const CV_TEMPLATES = [
  {
    id: "khmer_std",
    nameKm: "ទម្រង់ស្តង់ដារកម្ពុជា",
    nameEn: "Cambodia Corporate",
    badgeKm: "ផ្លូវការនៅកម្ពុជា",
    badgeEn: "Official Standard",
    descKm: "មានស៊ុមរូបថត 4x6 និងតារាងព័ត៌មានផ្ទាល់ខ្លួន (DOB, Gender, Nationality)",
    descEn: "Features 4x6 photo box and personal details table (DOB, Gender, Nationality)",
  },
  {
    id: "modern",
    nameKm: "ទំនើប Tech ATS",
    nameEn: "Modern Tech ATS",
    badgeKm: "ពេញនិយម",
    badgeEn: "Popular",
    descKm: "ស្តង់ដារ ATS ងាយស្រួលអានបំផុត សម្រាប់ក្រុមហ៊ុនបច្ចេកវិទ្យា",
    descEn: "Single-column ATS scannable resume, best for tech companies",
  },
  {
    id: "sidebar",
    nameKm: "២ ជួរឈរ (Sidebar)",
    nameEn: "Creative Split Sidebar",
    badgeKm: "ស្អាតទាក់ទាញ",
    badgeEn: "Creative",
    descKm: "មាន Sidebar ឆ្វេងសម្រាប់រូបថត ជំនាញ និងទំនាក់ទំនង",
    descEn: "Modern 2-column layout with left sidebar for skills and contacts",
  },
  {
    id: "executive",
    nameKm: "ផ្លូវការបុរាណ",
    nameEn: "Executive Classic",
    badgeKm: "ស្តង់ដារ",
    badgeEn: "Executive",
    descKm: "ទម្រង់បុរាណបែបផ្លូវការ កណ្តាល ជាមួយបន្ទាត់ទ្វេ",
    descEn: "Formal centered layout with double divider rules for senior roles",
  },
];

const ACCENT_COLORS = [
  { id: "blue", hex: "#2563eb", labelKm: "ខៀវទំនើប", labelEn: "Royal Blue" },
  { id: "emerald", hex: "#059669", labelKm: "បៃតង", labelEn: "Emerald" },
  { id: "indigo", hex: "#4f46e5", labelKm: "ស្វាយខៀវ", labelEn: "Indigo" },
  { id: "slate", hex: "#0f172a", labelKm: "ខ្មៅផ្លូវការ", labelEn: "Executive Dark" },
  { id: "rose", hex: "#e11d48", labelKm: "ក្រហមទំនើប", labelEn: "Crimson" },
];

export default function CvStudioPage() {
  const { user, updateUser } = useGlobleContext();
  const { language } = useLanguage();
  const isKm = language === "km";
  const fileInputRef = useRef(null);

  // CV Language: pure Khmer ('km') or pure English ('en')
  const [cvLanguage, setCvLanguage] = useState(language === "en" ? "en" : "km");
  const isCvKm = cvLanguage === "km";

  // Sync with global language if changed externally
  useEffect(() => {
    setCvLanguage(language === "en" ? "en" : "km");
  }, [language]);

  // View Mode: 'cv' (A4 Document) vs 'portfolio' (Interactive Web Showcase)
  const [viewMode, setViewMode] = useState("cv");

  // Template & Accent Color State
  const [selectedTemplate, setSelectedTemplate] = useState("khmer_std");
  const [accentColor, setAccentColor] = useState("#2563eb");

  // Stepper State
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Step 0: Basic Info State
  const [basicInfo, setBasicInfo] = useState({
    fullName: "",
    jobTitle: "",
    email: "",
    phone: "+855 12 345 678",
    location: "រាជធានីភ្នំពេញ កម្ពុជា",
    placeOfBirth: "ខេត្តកណ្តាល កម្ពុជា",
    bio: "",
    githubUrl: "",
    linkedinUrl: "",
    portfolioUrl: "",
    photoUrl: "",
    showPhoto: true,
    dateOfBirth: "១៥ ឧសភា ២០០២",
    gender: "ប្រុស",
    nationality: "ខ្មែរ",
    maritalStatus: "នៅលីវ",
  });

  // Step 1: Education & Languages
  const [educationList, setEducationList] = useState([]);
  const [newEdu, setNewEdu] = useState({
    institution: "",
    degree: "",
    fieldOfStudy: "",
    startDate: "",
    endDate: "",
  });

  const [languagesList, setLanguagesList] = useState(SAMPLE_CV_DATA_KM.languages);
  const [newLang, setNewLang] = useState({
    language: "",
    level: "កម្រិតវិជ្ជាជីវៈ",
  });

  // Step 2: Skills & Certifications
  const [skillsList, setSkillsList] = useState([]);
  const [newSkillInput, setNewSkillInput] = useState("");

  const [certificatesList, setCertificatesList] = useState(
    SAMPLE_CV_DATA_KM.certifications
  );
  const [newCert, setNewCert] = useState({
    title: "",
    issuer: "",
    year: "",
  });

  // Step 3: Projects & Experience & References
  const [projectsList, setProjectsList] = useState([]);
  const [newProj, setNewProj] = useState({
    title: "",
    description: "",
    technologies: "",
    projectUrl: "",
    githubUrl: "",
  });

  const [experiencesList, setExperiencesList] = useState([]);
  const [newExp, setNewExp] = useState({
    title: "",
    company: "",
    employmentType: "ពេញម៉ោង",
    startDate: "",
    endDate: "",
    isCurrent: false,
    description: "",
  });

  const [referencesList, setReferencesList] = useState(
    SAMPLE_CV_DATA_KM.references
  );
  const [newRef, setNewRef] = useState({
    name: "",
    position: "",
    organization: "",
    phone: "",
    email: "",
  });

  // Status message auto-clear
  const showSuccess = (msg) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(""), 4500);
  };

  const showError = (msg) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(""), 4500);
  };

  // Switch Pure CV Language (Khmer only vs English only)
  const handleSwitchCvLanguage = (targetLang) => {
    setCvLanguage(targetLang);
    const isTargetKm = targetLang === "km";
    const sample = isTargetKm ? SAMPLE_CV_DATA_KM : SAMPLE_CV_DATA_EN;

    setBasicInfo((prev) => ({
      ...prev,
      fullName: translateCvField(prev.fullName, isTargetKm) || sample.basicInfo.fullName,
      jobTitle: sanitizeJobTitle(prev.jobTitle, isTargetKm, sample.basicInfo.jobTitle),
      location: translateCvField(prev.location, isTargetKm) || sample.basicInfo.location,
      placeOfBirth: translateCvField(prev.placeOfBirth, isTargetKm) || sample.basicInfo.placeOfBirth,
      gender: translateCvField(prev.gender, isTargetKm) || sample.basicInfo.gender,
      nationality: translateCvField(prev.nationality, isTargetKm) || sample.basicInfo.nationality,
      maritalStatus: translateCvField(prev.maritalStatus, isTargetKm) || sample.basicInfo.maritalStatus,
      bio: resolveCvBio(prev.bio, isTargetKm) || sample.basicInfo.bio,
    }));

    setEducationList((prev) => {
      const isSample =
        !prev.length ||
        prev.some(
          (e) =>
            String(e.id).startsWith("sample-") ||
            String(e.id).startsWith("edu-") ||
            (e.institution && (e.institution.includes("RUPP") || e.institution.includes("ភូមិន្ទ")))
        );
      return isSample
        ? sample.education
        : prev.map((e) => ({
            ...e,
            degree: translateCvField(e.degree, isTargetKm),
            fieldOfStudy: translateCvField(e.fieldOfStudy, isTargetKm),
            institution: translateCvField(e.institution, isTargetKm),
          }));
    });

    setExperiencesList((prev) => {
      const isSample =
        !prev.length ||
        prev.some(
          (e) =>
            String(e.id).startsWith("sample-") ||
            String(e.id).startsWith("exp-") ||
            (e.company && (e.company.includes("Digital") || e.company.includes("DigiCambodia") || e.company.includes("ឌីជីថល")))
        );
      return isSample
        ? sample.experiences
        : prev.map((e) => ({
            ...e,
            title: translateCvField(e.title, isTargetKm),
            company: translateCvField(e.company, isTargetKm),
            employmentType: translateCvField(e.employmentType, isTargetKm),
            description: translateCvField(e.description, isTargetKm),
          }));
    });

    setProjectsList((prev) => {
      const isSample =
        !prev.length ||
        prev.some(
          (p) =>
            String(p.id).startsWith("sample-") ||
            String(p.id).startsWith("proj-") ||
            (p.title && (p.title.includes("Smart Community") || p.title.includes("ប្រព័ន្ធ") || p.title.includes("Khmer E-Commerce") || p.title.includes("ទំនិញអនឡាញ")))
        );
      return isSample ? sample.projects : prev;
    });

    setLanguagesList((prev) => {
      const isSample =
        !prev.length || prev.some((l) => String(l.id).startsWith("lang-") || String(l.id).startsWith("sample-"));
      return isSample
        ? sample.languages
        : prev.map((l) => ({
            ...l,
            language: translateCvField(l.language, isTargetKm),
            level: translateCvField(l.level, isTargetKm),
          }));
    });

    setCertificatesList((prev) => {
      const isSample =
        !prev.length || prev.some((c) => String(c.id).startsWith("cert-") || String(c.id).startsWith("sample-"));
      return isSample ? sample.certifications : prev;
    });

    setReferencesList((prev) => {
      const isSample =
        !prev.length || prev.some((r) => String(r.id).startsWith("ref-") || String(r.id).startsWith("sample-"));
      return isSample
        ? sample.references
        : prev.map((r) => ({
            ...r,
            name: translateCvField(r.name, isTargetKm),
            position: translateCvField(r.position, isTargetKm),
            organization: translateCvField(r.organization, isTargetKm),
          }));
    });

    showSuccess(
      isTargetKm
        ? "បានប្តូរទៅជាទម្រង់ CV ភាសាខ្មែរសុទ្ធ (Pure Khmer CV)!"
        : "Switched to Pure English CV format!"
    );
  };

  // Load Sample CV Helper
  const handleLoadSampleData = (forceLang) => {
    const targetLang = forceLang || cvLanguage;
    const sample = targetLang === "en" ? SAMPLE_CV_DATA_EN : SAMPLE_CV_DATA_KM;
    setBasicInfo(sample.basicInfo);
    setSkillsList(sample.skills);
    setEducationList(sample.education);
    setLanguagesList(sample.languages);
    setCertificatesList(sample.certifications);
    setProjectsList(sample.projects);
    setExperiencesList(sample.experiences);
    setReferencesList(sample.references);
    showSuccess(
      targetLang === "km"
        ? "បានដាក់ទិន្នន័យគំរូ CV ភាសាខ្មែរសុទ្ធរួចរាល់! (Pure Khmer CV)"
        : "Loaded 100% English Sample CV data!"
    );
  };

  // Client-Side Photo Upload (instant FileReader preview for offline & guests)
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showError(isKm ? "សូមជ្រើសរើសឯកសារជារូបភាព (JPG, PNG, WebP)!" : "Please choose an image file (JPG, PNG, WebP)!");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError(isKm ? "ទំហំរូបភាពមិនត្រូវលើសពី 5MB ឡើយ!" : "Image file size should not exceed 5MB!");
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target.result;
      setBasicInfo((prev) => ({
        ...prev,
        photoUrl: dataUrl,
        showPhoto: true,
      }));
      showSuccess(isKm ? "បានបញ្ចូលរូបថតដោយជោគជ័យ!" : "Profile photo uploaded successfully!");
    };
    reader.readAsDataURL(file);
  };

  // Load Initial Profile Data (or Sample Data for Guests)
  const loadFullProfile = async () => {
    const defaultSample = isCvKm ? SAMPLE_CV_DATA_KM : SAMPLE_CV_DATA_EN;
    if (!user) {
      setBasicInfo(defaultSample.basicInfo);
      setSkillsList(defaultSample.skills);
      setLanguagesList(defaultSample.languages);
      setCertificatesList(defaultSample.certifications);
      setEducationList(defaultSample.education);
      setProjectsList(defaultSample.projects);
      setExperiencesList(defaultSample.experiences);
      setReferencesList(defaultSample.references);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await fetchProfileRequest();
      const profileUser = data?.user || user || {};

      const rawJob = profileUser.profession || profileUser.jobTitle || "";
      const safeJob = sanitizeJobTitle(rawJob, isCvKm, defaultSample.basicInfo.jobTitle);

      setBasicInfo({
        fullName: profileUser.fullName || defaultSample.basicInfo.fullName,
        jobTitle: safeJob,
        email: profileUser.email || defaultSample.basicInfo.email,
        phone: profileUser.phone || "+855 12 345 678",
        location: profileUser.location
          ? translateCvField(profileUser.location, isCvKm)
          : defaultSample.basicInfo.location,
        placeOfBirth: profileUser.placeOfBirth
          ? translateCvField(profileUser.placeOfBirth, isCvKm)
          : defaultSample.basicInfo.placeOfBirth,
        bio: profileUser.bio
          ? resolveCvBio(profileUser.bio, isCvKm)
          : defaultSample.basicInfo.bio,
        githubUrl: profileUser.githubUrl || "",
        linkedinUrl: profileUser.linkedinUrl || "",
        portfolioUrl: profileUser.portfolioUrl || "",
        photoUrl:
          profileUser.avatar ||
          profileUser.profilePicture ||
          defaultSample.basicInfo.photoUrl,
        showPhoto: true,
        dateOfBirth: profileUser.dateOfBirth
          ? translateCvField(profileUser.dateOfBirth, isCvKm)
          : defaultSample.basicInfo.dateOfBirth,
        gender: profileUser.gender
          ? translateCvField(profileUser.gender, isCvKm)
          : defaultSample.basicInfo.gender,
        nationality: profileUser.nationality
          ? translateCvField(profileUser.nationality, isCvKm)
          : defaultSample.basicInfo.nationality,
        maritalStatus: profileUser.maritalStatus
          ? translateCvField(profileUser.maritalStatus, isCvKm)
          : defaultSample.basicInfo.maritalStatus,
      });

      const teach = profileUser.skills?.teach || [];
      const candidate = profileUser.skills?.candidate || [];
      const interested = profileUser.interestedSkills || [];
      const mergedSkills = Array.from(
        new Set([...teach, ...candidate, ...interested])
      ).filter(Boolean);

      setSkillsList(
        mergedSkills.length > 0 ? mergedSkills : defaultSample.skills
      );
      setEducationList(
        data?.education?.length > 0 ? data.education : defaultSample.education
      );
      setProjectsList(
        data?.projects?.length > 0 ? data.projects : defaultSample.projects
      );
      setExperiencesList(
        data?.experiences?.length > 0
          ? data.experiences
          : defaultSample.experiences
      );
      setReferencesList(defaultSample.references);
    } catch {
      // Graceful fallback to sample data so the user is never blocked
      setBasicInfo(defaultSample.basicInfo);
      setSkillsList(defaultSample.skills);
      setEducationList(defaultSample.education);
      setProjectsList(defaultSample.projects);
      setExperiencesList(defaultSample.experiences);
      setReferencesList(defaultSample.references);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFullProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Combine saved items + live draft inputs so preview updates dynamically
  const previewEducation = useMemo(() => {
    if (newEdu.institution.trim()) {
      return [...educationList, { ...newEdu, id: "draft-edu" }];
    }
    return educationList;
  }, [educationList, newEdu]);

  const previewProjects = useMemo(() => {
    if (newProj.title.trim()) {
      const techs = String(newProj.technologies || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      return [
        ...projectsList,
        {
          ...newProj,
          id: "draft-proj",
          technologies: techs,
        },
      ];
    }
    return projectsList;
  }, [projectsList, newProj]);

  const previewExperiences = useMemo(() => {
    if (newExp.title.trim() && newExp.company.trim()) {
      return [...experiencesList, { ...newExp, id: "draft-exp" }];
    }
    return experiencesList;
  }, [experiencesList, newExp]);

  // Calculate CV Completeness percentage
  const completionStats = useMemo(() => {
    let score = 0;
    if (basicInfo.fullName) score += 15;
    if (basicInfo.jobTitle) score += 10;
    if (basicInfo.email) score += 10;
    if (basicInfo.bio) score += 15;
    if (skillsList.length >= 3) score += 15;
    if (educationList.length >= 1) score += 10;
    if (experiencesList.length >= 1) score += 15;
    if (projectsList.length >= 1) score += 10;
    return Math.min(score, 100);
  }, [basicInfo, skillsList, educationList, experiencesList, projectsList]);

  // Handle Save Basic Info
  const handleSaveBasicInfo = async () => {
    if (!user) {
      showSuccess(
        isKm
          ? "បានរក្សាទុកព័ត៌មាននៅលើ CV ផ្ទាល់!"
          : "Updated on your live CV preview!"
      );
      return;
    }

    try {
      setSaving(true);
      await updateUser({
        fullName: basicInfo.fullName,
        jobTitle: basicInfo.jobTitle,
        location: basicInfo.location,
        bio: basicInfo.bio,
        githubUrl: basicInfo.githubUrl,
        linkedinUrl: basicInfo.linkedinUrl,
      });
      showSuccess(
        isKm
          ? "បានរក្សាទុកព័ត៌មានផ្ទាល់ខ្លួនដោយជោគជ័យ!"
          : "Personal details saved successfully!"
      );
    } catch {
      showError(
        isKm
          ? "បានធ្វើបច្ចុប្បន្នភាពលើ CV (ការរក្សាទុកលើ Server មិនដំណើរការបណ្តោះអាសន្ន)"
          : "Updated live CV preview (server sync pending)"
      );
    } finally {
      setSaving(false);
    }
  };

  // Education Handlers
  const handleAddEducation = async (e) => {
    e.preventDefault();
    if (!newEdu.institution.trim() || !newEdu.degree.trim()) {
      showError(
        isKm
          ? "សូមបញ្ចូលឈ្មោះគ្រឹះស្ថានសិក្សា និងកម្រិតសញ្ញាបត្រ!"
          : "Please provide institution and degree!"
      );
      return;
    }

    const itemToAdd = {
      ...newEdu,
      id: "edu-" + Date.now(),
    };

    setEducationList((prev) => [...prev, itemToAdd]);
    setNewEdu({
      institution: "",
      degree: "",
      fieldOfStudy: "",
      startDate: "",
      endDate: "",
    });

    if (user) {
      try {
        setSaving(true);
        await createProfileItemRequest("education", newEdu);
      } catch {
        // Kept in local state
      } finally {
        setSaving(false);
      }
    }
    showSuccess(isKm ? "បានបន្ថែមការអប់រំចូល CV!" : "Education added to CV!");
  };

  const handleDeleteEducation = async (id) => {
    setEducationList((prev) => prev.filter((item) => item.id !== id));
    if (user && !String(id).startsWith("sample-") && !String(id).startsWith("edu-")) {
      try {
        await deleteProfileItemRequest("education", id);
      } catch {
        // Ignore
      }
    }
    showSuccess(isKm ? "បានលុបការអប់រំចេញ!" : "Education removed!");
  };

  // Skills Handlers
  const handleAddSkill = async (e) => {
    e.preventDefault();
    const trimmed = newSkillInput.trim();
    if (!trimmed) return;
    if (skillsList.includes(trimmed)) {
      showError(isKm ? "ជំនាញនេះមានរួចហើយ!" : "Skill already added!");
      return;
    }

    const updated = [...skillsList, trimmed];
    setSkillsList(updated);
    setNewSkillInput("");

    if (user) {
      try {
        await updateUser({
          skillsToTeach: updated,
        });
      } catch {
        // Keep in local
      }
    }
    showSuccess(isKm ? `បានបន្ថែម ${trimmed}!` : `Added ${trimmed}!`);
  };

  const handleRemoveSkill = async (skillToRemove) => {
    const updated = skillsList.filter((s) => s !== skillToRemove);
    setSkillsList(updated);
    if (user) {
      try {
        await updateUser({
          skillsToTeach: updated,
        });
      } catch {
        // Keep in local
      }
    }
  };

  const handleSelectPopularSkill = (skill) => {
    if (!skillsList.includes(skill)) {
      setSkillsList([...skillsList, skill]);
      showSuccess(isKm ? `បានបន្ថែម ${skill}!` : `Added ${skill}!`);
    }
  };

  // Languages Handlers
  const handleAddLanguage = (e) => {
    e.preventDefault();
    if (!newLang.language.trim()) {
      showError(isKm ? "សូមបញ្ចូលឈ្មោះភាសា!" : "Please enter language name!");
      return;
    }
    setLanguagesList((prev) => [
      ...prev,
      { id: "lang-" + Date.now(), ...newLang },
    ]);
    setNewLang({ language: "", level: "កម្រិតវិជ្ជាជីវៈ (Professional Working)" });
    showSuccess(isKm ? "បានបន្ថែមភាសាចូល CV!" : "Language added to CV!");
  };

  const handleDeleteLanguage = (id) => {
    setLanguagesList((prev) => prev.filter((l) => l.id !== id));
    showSuccess(isKm ? "បានលុបភាសាចេញ!" : "Language removed!");
  };

  // Certifications Handlers
  const handleAddCertificate = (e) => {
    e.preventDefault();
    if (!newCert.title.trim()) {
      showError(isKm ? "សូមបញ្ចូលឈ្មោះវិញ្ញាបនបត្រ!" : "Please enter certificate title!");
      return;
    }
    setCertificatesList((prev) => [
      ...prev,
      { id: "cert-" + Date.now(), ...newCert },
    ]);
    setNewCert({ title: "", issuer: "", year: "" });
    showSuccess(isKm ? "បានបន្ថែមវិញ្ញាបនបត្រចូល CV!" : "Certificate added to CV!");
  };

  const handleDeleteCertificate = (id) => {
    setCertificatesList((prev) => prev.filter((c) => c.id !== id));
    showSuccess(isKm ? "បានលុបវិញ្ញាបនបត្រចេញ!" : "Certificate removed!");
  };

  // Projects Handlers
  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!newProj.title.trim()) {
      showError(isKm ? "សូមបញ្ចូលឈ្មោះគម្រោង!" : "Please enter project title!");
      return;
    }

    const techArray = String(newProj.technologies || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const itemToAdd = {
      ...newProj,
      technologies: techArray,
      id: "proj-" + Date.now(),
    };

    setProjectsList((prev) => [...prev, itemToAdd]);
    setNewProj({
      title: "",
      description: "",
      technologies: "",
      projectUrl: "",
      githubUrl: "",
    });

    if (user) {
      try {
        setSaving(true);
        await createProfileItemRequest("projects", {
          ...newProj,
          technologies: techArray,
        });
      } catch {
        // Saved locally
      } finally {
        setSaving(false);
      }
    }
    showSuccess(isKm ? "បានបន្ថែមគម្រោងចូល CV!" : "Project added to CV!");
  };

  const handleDeleteProject = async (id) => {
    setProjectsList((prev) => prev.filter((item) => item.id !== id));
    if (user && !String(id).startsWith("sample-") && !String(id).startsWith("proj-")) {
      try {
        await deleteProfileItemRequest("projects", id);
      } catch {
        // Ignore
      }
    }
    showSuccess(isKm ? "បានលុបគម្រោងចេញ!" : "Project removed!");
  };

  // Experience Handlers
  const handleAddExperience = async (e) => {
    e.preventDefault();
    if (!newExp.title.trim() || !newExp.company.trim()) {
      showError(
        isKm
          ? "សូមបញ្ចូលតួនាទី និងឈ្មោះស្ថាប័ន / ក្រុមហ៊ុន!"
          : "Please enter job title and company!"
      );
      return;
    }

    const itemToAdd = {
      ...newExp,
      id: "exp-" + Date.now(),
    };

    setExperiencesList((prev) => [...prev, itemToAdd]);
    setNewExp({
      title: "",
      company: "",
      employmentType: "Internship",
      startDate: "",
      endDate: "",
      isCurrent: false,
      description: "",
    });

    if (user) {
      try {
        setSaving(true);
        await createProfileItemRequest("experiences", newExp);
      } catch {
        // Saved locally
      } finally {
        setSaving(false);
      }
    }
    showSuccess(isKm ? "បានបន្ថែមបទពិសោធន៍ចូល CV!" : "Experience added to CV!");
  };

  const handleDeleteExperience = async (id) => {
    setExperiencesList((prev) => prev.filter((item) => item.id !== id));
    if (user && !String(id).startsWith("sample-") && !String(id).startsWith("exp-")) {
      try {
        await deleteProfileItemRequest("experiences", id);
      } catch {
        // Ignore
      }
    }
    showSuccess(isKm ? "បានលុបបទពិសោធន៍ចេញ!" : "Experience removed!");
  };

  // References Handlers
  const handleAddReference = (e) => {
    e.preventDefault();
    if (!newRef.name.trim() || !newRef.position.trim()) {
      showError(
        isKm
          ? "សូមបញ្ចូលឈ្មោះ និងមុខតំណែងបុគ្គលធានា!"
          : "Please enter referee name and position!"
      );
      return;
    }
    setReferencesList((prev) => [
      ...prev,
      { id: "ref-" + Date.now(), ...newRef },
    ]);
    setNewRef({ name: "", position: "", organization: "", phone: "", email: "" });
    showSuccess(isKm ? "បានបន្ថែមបុគ្គលធានាចូល CV!" : "Referee added to CV!");
  };

  const handleDeleteReference = (id) => {
    setReferencesList((prev) => prev.filter((r) => r.id !== id));
    showSuccess(isKm ? "បានលុបបុគ្គលធានាចេញ!" : "Referee removed!");
  };

  // PDF Print & Download Trigger
  const handlePrintPdf = () => {
    // If currently in portfolio view, switch to CV mode for printing
    if (viewMode !== "cv") {
      setViewMode("cv");
      setTimeout(() => window.print(), 180);
    } else {
      window.print();
    }
  };

  // Copy Public Portfolio Link
  const handleCopyPortfolioLink = () => {
    const shareUrl =
      basicInfo.portfolioUrl ||
      `${window.location.origin}/discover/${user?._id || user?.id || "member"}`;
    navigator.clipboard
      ?.writeText(shareUrl)
      .then(() => {
        showSuccess(
          isKm
            ? `បានចម្លងតំណភ្ជាប់ Portfolio៖ ${shareUrl}`
            : `Portfolio link copied: ${shareUrl}`
        );
      })
      .catch(() => {
        showSuccess(isKm ? `តំណភ្ជាប់ Portfolio៖ ${shareUrl}` : shareUrl);
      });
  };

  const steps = [
    {
      id: 0,
      labelKm: "ព័ត៌មានផ្ទាល់ខ្លួន & រូបថត",
      labelEn: "Personal & Photo",
      icon: FiUser,
    },
    {
      id: 1,
      labelKm: "ការអប់រំ & ភាសា",
      labelEn: "Education & Languages",
      icon: FiBookOpen,
    },
    {
      id: 2,
      labelKm: "ជំនាញ & វិញ្ញាបនបត្រ",
      labelEn: "Skills & Certificates",
      icon: FiCode,
    },
    {
      id: 3,
      labelKm: "គម្រោង & បទពិសោធន៍",
      labelEn: "Projects & Experience",
      icon: FiBriefcase,
    },
    {
      id: 4,
      labelKm: "មើលពេញលេញ & ទាញយក PDF",
      labelEn: "Full Preview & Export",
      icon: FiEye,
    },
  ];

  if (loading) {
    return (
      <div className="cv-studio-loading-state">
        <div className="loading-spinner" />
        <p>
          {isKm
            ? "កំពុងរៀបចំស្ទូឌីយោបង្កើត CV & Portfolio ស្តង់ដារ..."
            : "Loading Professional CV & Portfolio Studio..."}
        </p>
      </div>
    );
  }

  return (
    <div className="cv-studio-page" style={{ "--cv-accent": accentColor }}>
      {/* 1. TOP STUDIO HEADER (Hidden when printing) */}
      <header className="cv-studio-header no-print">
        <div className="cv-studio-header-inner">
          <div className="header-titles">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
                marginBottom: "10px",
              }}
            >
              <span className="studio-pill-tag" style={{ marginBottom: 0 }}>
                <FiAward className="tag-icon" />
                {isKm
                  ? "ស្តង់ដារអាជីព ATS & Cambodia Corporate • ឥតគិតថ្លៃ 100%"
                  : "ATS & Cambodia Corporate Standard • 100% FREE"}
              </span>
              <span className="cv-free-forever-pill">
                ✨{" "}
                {isKm
                  ? "ទាញយក PDF ដោយសេរី មិនគិតប្រាក់ គ្មានគិតពន្ធ"
                  : "Free Unlimited A4 PDF Export"}
              </span>
            </div>
            <h1>
              {isKm
                ? "បង្កើត CV និង Portfolio ស្តង់ដារអាជីព (ឥតគិតថ្លៃ)"
                : "Free Multi-Template CV & Portfolio Builder"}
            </h1>
            <p>
              {isKm
                ? "រៀបចំ CV តាមស្តង់ដារអន្តរជាតិ ATS និងទម្រង់ក្រុមហ៊ុននៅកម្ពុជា រួមជាមួយ Web Portfolio បង្ហាញគម្រោងស្នាដៃបច្ចេកវិទ្យាផ្ទាល់!"
                : "Create recruiter-approved ATS and Cambodia Corporate CVs alongside an interactive Web Portfolio showcase."}
            </p>
          </div>

          {/* Quick Actions & Completion Meter */}
          <div className="cv-header-right-cluster">
            <div className="cv-quick-top-actions">
              <button
                type="button"
                className="btn btn-outline cv-sample-btn"
                onClick={handleLoadSampleData}
              >
                <FiRefreshCw />
                <span>
                  {isKm ? "ដាក់ទិន្នន័យគំរូ (Sample Data)" : "Load Sample Data"}
                </span>
              </button>
              <button
                type="button"
                className="btn btn-primary cv-top-download-btn"
                onClick={handlePrintPdf}
              >
                <FiDownload />
                <span>
                  {isKm ? "ទាញយក PDF / Print (ឥតគិតថ្លៃ)" : "Download Free PDF"}
                </span>
              </button>
            </div>

            <div className="cv-completion-box glass">
              <div className="completion-top-row">
                <span className="comp-label">
                  {isKm ? "កម្រិតពេញលេញនៃ CV" : "CV Completeness"}
                </span>
                <span className="comp-percent">{completionStats}%</span>
              </div>
              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${completionStats}%` }}
                />
              </div>
              <span className="comp-hint">
                {completionStats >= 80 ? (
                  <span className="ready-text">
                    <FiCheckCircle />{" "}
                    {isKm
                      ? "រួចរាល់សម្រាប់ការទាញយក PDF និងដាក់ពាក្យការងារ!"
                      : "Ready for PDF Download & Job Applications!"}
                  </span>
                ) : isKm ? (
                  "បំពេញព័ត៌មានបន្ថែម ឬចុច 'ដាក់ទិន្នន័យគំរូ' ខាងលើ"
                ) : (
                  "Add more details or click 'Load Sample Data' above"
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div className="studio-alert-banner success">
            <FiCheckCircle /> <span>{statusMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="studio-alert-banner error">
            <span>{errorMessage}</span>
          </div>
        )}

        {/* PRIMARY VIEW MODE SWITCHER: A4 CV DOCUMENT vs WEB PORTFOLIO SHOWCASE */}
        <div className="cv-view-mode-tabs-wrap">
          <div className="cv-view-mode-tabs" role="tablist">
            <button
              type="button"
              className={`view-mode-tab-btn ${viewMode === "cv" ? "active" : ""}`}
              onClick={() => setViewMode("cv")}
              role="tab"
              aria-selected={viewMode === "cv"}
            >
              <FiPrinter className="tab-ico" />
              <span>
                {isKm
                  ? "📄 ទម្រង់ CV ស្តង់ដារ (A4 PDF Printable)"
                  : "📄 Standard A4 CV (Printable PDF)"}
              </span>
              <span className="view-mode-pill-sub">
                {isKm ? "ATS & Corporate" : "ATS & Corporate"}
              </span>
            </button>
            <button
              type="button"
              className={`view-mode-tab-btn ${
                viewMode === "portfolio" ? "active" : ""
              }`}
              onClick={() => setViewMode("portfolio")}
              role="tab"
              aria-selected={viewMode === "portfolio"}
            >
              <FiGlobe className="tab-ico" />
              <span>
                {isKm
                  ? "🌐 ទម្រង់ Web Portfolio អាជីព (Interactive Showcase)"
                  : "🌐 Professional Web Portfolio (Live Showcase)"}
              </span>
              <span className="view-mode-pill-sub">
                {isKm ? "Live Demo & Projects" : "Live Demos & Links"}
              </span>
            </button>
          </div>
        </div>

        {/* TEMPLATE PICKER & COLOR CUSTOMIZATION (Active when in CV Mode) */}
        {viewMode === "cv" && (
          <div className="cv-template-picker-bar">
            <div className="template-picker-group">
              <span className="picker-group-label">
                <FiLayout /> {isKm ? "ជ្រើសរើសម៉ូត CV:" : "CV Template:"}
              </span>
              <div className="template-pills-row">
                {CV_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    className={`template-choice-pill ${
                      selectedTemplate === tpl.id ? "active" : ""
                    }`}
                    onClick={() => setSelectedTemplate(tpl.id)}
                    title={isKm ? tpl.descKm : tpl.nameEn}
                  >
                    <span>{isKm ? tpl.nameKm : tpl.nameEn}</span>
                    <span className="tpl-badge">
                      {isKm ? tpl.badgeKm : tpl.badgeEn}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="color-picker-group">
              <span className="picker-group-label">
                🎨 {isKm ? "ពណ៌ចម្បង:" : "Accent Color:"}
              </span>
              <div className="color-swatches-row">
                {ACCENT_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`cv-color-swatch ${
                      accentColor === c.hex ? "active" : ""
                    }`}
                    style={{ backgroundColor: c.hex }}
                    onClick={() => setAccentColor(c.hex)}
                    title={isKm ? c.labelKm : c.labelEn}
                    aria-label={c.labelEn}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEPPER NAVIGATION BAR */}
        <nav className="cv-stepper-bar" aria-label="CV Builder Steps">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = activeStep === index;
            const isDone = activeStep > index;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStep(index)}
                className={`stepper-tab-item ${isActive ? "active" : ""} ${
                  isDone ? "done" : ""
                }`}
              >
                <span className="step-num">{index + 1}</span>
                <Icon className="step-ico" />
                <span className="step-text">
                  {isKm ? step.labelKm : step.labelEn}
                </span>
              </button>
            );
          })}
        </nav>
      </header>

      {/* 2. MAIN WORKSPACE: LEFT STEP EDITOR + RIGHT LIVE PREVIEW */}
      <div className="cv-studio-main-grid">
        {/* LEFT COLUMN: STEP-BY-STEP FORM EDITOR */}
        <div
          className={`cv-editor-panel no-print ${
            activeStep === 4 ? "hidden-on-preview" : ""
          }`}
        >
          {/* STEP 0: PERSONAL INFO & PHOTO */}
          {activeStep === 0 && (
            <section className="step-editor-card">
              <div className="card-header-bar">
                <h2>
                  {isKm
                    ? "១. ព័ត៌មានផ្ទាល់ខ្លួន រូបថត និងទំនាក់ទំនង"
                    : "1. Personal Details, Photo & Contacts"}
                </h2>
                <p>
                  {isKm
                    ? "កែសម្រួលឈ្មោះ រូបថត តួនាទី ព័ត៌មានផ្លូវការ និងទំនាក់ទំនង — ទិន្នន័យនឹងបង្ហាញភ្លាមៗនៅលើ CV និង Web Portfolio!"
                    : "Edit your name, photo, job title, and contacts — updates appear in real-time across both CV and Portfolio!"}
                </p>
              </div>

              {/* Profile Photo Uploader */}
              <div className="photo-uploader-box">
                <div className="photo-preview-wrap">
                  {basicInfo.photoUrl ? (
                    <img
                      src={basicInfo.photoUrl}
                      alt={basicInfo.fullName || "Applicant"}
                      className="photo-preview-img"
                    />
                  ) : (
                    <div className="photo-placeholder-box">
                      <FiCamera />
                      <span>{isKm ? "គ្មានរូបថត" : "No Photo"}</span>
                    </div>
                  )}
                </div>

                <div className="photo-actions-wrap">
                  <label className="photo-upload-label">
                    <FiCamera />{" "}
                    <span>
                      {isKm ? "បញ្ចូលរូបថតពីកុំព្យូទ័រ / ទូរស័ព្ទ" : "Upload Photo"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handlePhotoUpload}
                      style={{ display: "none" }}
                    />
                  </label>

                  <div className="photo-toggle-row">
                    <label className="checkbox-toggle-label">
                      <input
                        type="checkbox"
                        checked={basicInfo.showPhoto}
                        onChange={(e) =>
                          setBasicInfo({
                            ...basicInfo,
                            showPhoto: e.target.checked,
                          })
                        }
                      />
                      <span>
                        {isKm
                          ? "បង្ហាញរូបថតលើ CV (Cambodia Corporate & Split Sidebar)"
                          : "Display photo on CV (Cambodia Corporate & Sidebar)"}
                      </span>
                    </label>
                  </div>
                  <span className="photo-helper-text">
                    {isKm
                      ? "រូបថតទំហំ 4x6 ឬរូបសក្ដិសមបែបអាជីព (JPG, PNG) មិនលើសពី 5MB"
                      : "Passport-style or clean professional headshot (JPG, PNG, max 5MB)"}
                  </span>
                </div>
              </div>

              <div className="form-two-col">
                <div className="form-group">
                  <label>{isKm ? "ឈ្មោះពេញ *" : "Full Name *"}</label>
                  <input
                    type="text"
                    value={basicInfo.fullName}
                    onChange={(e) =>
                      setBasicInfo({ ...basicInfo, fullName: e.target.value })
                    }
                    placeholder={
                      isCvKm ? "ឧ. សុខា វណ្ណៈ" : "e.g. Sokha Vannak"
                    }
                  />
                </div>

                <div className="form-group">
                  <label>
                    {isKm ? "តួនាទីជំនាញ / មុខតំណែង *" : "Professional Job Title *"}
                  </label>
                  <input
                    type="text"
                    value={basicInfo.jobTitle}
                    onChange={(e) =>
                      setBasicInfo({ ...basicInfo, jobTitle: e.target.value })
                    }
                    placeholder={
                      isCvKm
                        ? "ឧ. អ្នកបង្កើតគេហទំព័រ Full-Stack"
                        : "e.g. Full-Stack Web Developer"
                    }
                  />
                </div>
              </div>

              <div className="form-two-col">
                <div className="form-group">
                  <label>{isKm ? "អ៊ីមែល *" : "Email Address *"}</label>
                  <input
                    type="email"
                    value={basicInfo.email}
                    onChange={(e) =>
                      setBasicInfo({ ...basicInfo, email: e.target.value })
                    }
                    placeholder="you@smartcommunity.kh"
                  />
                </div>

                <div className="form-group">
                  <label>{isKm ? "លេខទូរស័ព្ទ" : "Phone Number"}</label>
                  <input
                    type="text"
                    value={basicInfo.phone}
                    onChange={(e) =>
                      setBasicInfo({ ...basicInfo, phone: e.target.value })
                    }
                    placeholder="+855 12 345 678"
                  />
                </div>
              </div>

              {/* Cambodia Corporate Official Details */}
              <div className="corporate-details-group">
                <h4 className="sub-group-title">
                  🇰🇭{" "}
                  {isKm
                    ? "ព័ត៌មានលម្អិតផ្លូវការ (សម្រាប់ទម្រង់ស្ថាប័ន និងក្រុមហ៊ុននៅកម្ពុជា)"
                    : "Official Personal Details (For Cambodia Corporate CV)"}
                </h4>
                <div className="form-four-col">
                  <div className="form-group">
                    <label>{isKm ? "ថ្ងៃខែឆ្នាំកំណើត" : "Date of Birth"}</label>
                    <input
                      type="text"
                      value={basicInfo.dateOfBirth}
                      onChange={(e) =>
                        setBasicInfo({ ...basicInfo, dateOfBirth: e.target.value })
                      }
                      placeholder={isCvKm ? "១៥ ឧសភា ២០០២" : "15 May 2002"}
                    />
                  </div>

                  <div className="form-group">
                    <label>{isKm ? "ភេទ" : "Gender"}</label>
                    <select
                      value={basicInfo.gender}
                      onChange={(e) =>
                        setBasicInfo({ ...basicInfo, gender: e.target.value })
                      }
                    >
                      {isCvKm ? (
                        <>
                          <option value="ប្រុស">ប្រុស</option>
                          <option value="ស្រី">ស្រី</option>
                          <option value="ផ្សេងទៀត">ផ្សេងទៀត</option>
                        </>
                      ) : (
                        <>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>{isKm ? "សញ្ជាតិ" : "Nationality"}</label>
                    <input
                      type="text"
                      value={basicInfo.nationality}
                      onChange={(e) =>
                        setBasicInfo({ ...basicInfo, nationality: e.target.value })
                      }
                      placeholder={isCvKm ? "ខ្មែរ" : "Cambodian"}
                    />
                  </div>

                  <div className="form-group">
                    <label>{isKm ? "ស្ថានភាពគ្រួសារ" : "Marital Status"}</label>
                    <select
                      value={basicInfo.maritalStatus}
                      onChange={(e) =>
                        setBasicInfo({
                          ...basicInfo,
                          maritalStatus: e.target.value,
                        })
                      }
                    >
                      {isCvKm ? (
                        <>
                          <option value="នៅលីវ">នៅលីវ</option>
                          <option value="រៀបការរួច">រៀបការរួច</option>
                        </>
                      ) : (
                        <>
                          <option value="Single">Single</option>
                          <option value="Married">Married</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="form-group" style={{ gridColumn: "span 2" }}>
                    <label>{isKm ? "ទីកន្លែងកំណើត" : "Place of Birth"}</label>
                    <input
                      type="text"
                      value={basicInfo.placeOfBirth}
                      onChange={(e) =>
                        setBasicInfo({ ...basicInfo, placeOfBirth: e.target.value })
                      }
                      placeholder={isCvKm ? "ឧ. ខេត្តកណ្តាល កម្ពុជា" : "e.g. Kandal Province, Cambodia"}
                    />
                  </div>
                </div>
              </div>

              <div className="form-two-col">
                <div className="form-group">
                  <label>{isKm ? "ទីតាំង / អាសយដ្ឋានបច្ចុប្បន្ន" : "Current Address / City"}</label>
                  <input
                    type="text"
                    value={basicInfo.location}
                    onChange={(e) =>
                      setBasicInfo({ ...basicInfo, location: e.target.value })
                    }
                    placeholder={isCvKm ? "ឧ. រាជធានីភ្នំពេញ កម្ពុជា" : "e.g. Phnom Penh, Cambodia"}
                  />
                </div>

                <div className="form-group">
                  <label>{isKm ? "គេហទំព័រ / Web Portfolio" : "Portfolio Website URL"}</label>
                  <input
                    type="url"
                    value={basicInfo.portfolioUrl}
                    onChange={(e) =>
                      setBasicInfo({ ...basicInfo, portfolioUrl: e.target.value })
                    }
                    placeholder="https://sokhavannak.dev"
                  />
                </div>
              </div>

              <div className="form-two-col">
                <div className="form-group">
                  <label>GitHub Profile URL</label>
                  <input
                    type="url"
                    value={basicInfo.githubUrl}
                    onChange={(e) =>
                      setBasicInfo({ ...basicInfo, githubUrl: e.target.value })
                    }
                    placeholder="https://github.com/username"
                  />
                </div>

                <div className="form-group">
                  <label>LinkedIn Profile URL</label>
                  <input
                    type="url"
                    value={basicInfo.linkedinUrl}
                    onChange={(e) =>
                      setBasicInfo({ ...basicInfo, linkedinUrl: e.target.value })
                    }
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>
                  {isKm
                    ? "សង្ខេបអំពីខ្លួនឯង / គោលបំណងអាជីព (Professional Summary) *"
                    : "Professional Summary / Career Objective *"}
                </label>
                <textarea
                  rows={4}
                  value={basicInfo.bio}
                  onChange={(e) =>
                    setBasicInfo({ ...basicInfo, bio: e.target.value })
                  }
                  placeholder={
                    isKm
                      ? "សរសេរសង្ខេបអំពីជំនាញ បទពិសោធន៍ និងគោលដៅការងាររបស់អ្នក..."
                      : "Briefly highlight your technical background, passions, and value you bring..."
                  }
                />
              </div>

              <div className="step-actions-footer">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveBasicInfo}
                  disabled={saving}
                >
                  <FiSave />{" "}
                  <span>
                    {saving
                      ? isKm
                        ? "កំពុងរក្សាទុក..."
                        : "Saving..."
                      : isKm
                      ? "រក្សាទុកព័ត៌មានផ្ទាល់ខ្លួន"
                      : "Save Personal Details"}
                  </span>
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setActiveStep(1)}
                >
                  <span>{isKm ? "បន្តទៅការអប់រំ & ភាសា" : "Next: Education"}</span>{" "}
                  <FiArrowRight />
                </button>
              </div>
            </section>
          )}

          {/* STEP 1: EDUCATION & LANGUAGES */}
          {activeStep === 1 && (
            <section className="step-editor-card">
              <div className="card-header-bar">
                <h2>
                  {isKm
                    ? "២. ប្រវត្តិការអប់រំ និងភាសាទំនាក់ទំនង"
                    : "2. Education & Languages Spoken"}
                </h2>
                <p>
                  {isKm
                    ? "បន្ថែមសាកលវិទ្យាល័យ វគ្គបណ្តុះបណ្តាល និងភាសាដែលអ្នកចេះនិយាយ — បង្ហាញលើសន្លឹក CV ភ្លាមៗ!"
                    : "Add your academic degrees, bootcamp credentials, and language proficiencies."}
                </p>
              </div>

              {/* Education List */}
              <div className="existing-items-list">
                <h3>{isKm ? "បញ្ជីការអប់រំរបស់អ្នក:" : "Your Education History:"}</h3>
                {educationList.length === 0 ? (
                  <p className="empty-subtext">
                    {isKm
                      ? "មិនទាន់មានការអប់រំនៅឡើយ។ សូមបំពេញទម្រង់ខាងក្រោម!"
                      : "No education entries added yet. Use the form below to add one!"}
                  </p>
                ) : (
                  educationList.map((edu) => (
                    <div key={edu.id} className="cv-item-card">
                      <div className="item-info">
                        <strong className="item-title">
                          {edu.institution}
                        </strong>
                        <p className="item-sub">
                          {edu.degree}{" "}
                          {edu.fieldOfStudy ? `• ${edu.fieldOfStudy}` : ""}
                        </p>
                        <span className="item-dates">
                          {edu.startDate ? edu.startDate.slice(0, 7) : ""}{" "}
                          —{" "}
                          {edu.endDate ? edu.endDate.slice(0, 7) : "Present"}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn-delete-item"
                        onClick={() => handleDeleteEducation(edu.id)}
                        title={isKm ? "លុប" : "Delete"}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add Education Form */}
              <form onSubmit={handleAddEducation} className="add-subform">
                <h3>{isKm ? "+ បន្ថែមការអប់រំថ្មី" : "+ Add Education"}</h3>
                <div className="form-group">
                  <label>
                    {isKm
                      ? "ឈ្មោះគ្រឹះស្ថាន / សាកលវិទ្យាល័យ *"
                      : "School / University *"}
                  </label>
                  <input
                    type="text"
                    value={newEdu.institution}
                    onChange={(e) =>
                      setNewEdu({ ...newEdu, institution: e.target.value })
                    }
                    placeholder="e.g. Royal University of Phnom Penh (RUPP)"
                  />
                </div>

                <div className="form-two-col">
                  <div className="form-group">
                    <label>
                      {isKm ? "កម្រិតសញ្ញាបត្រ *" : "Degree / Certificate *"}
                    </label>
                    <input
                      type="text"
                      value={newEdu.degree}
                      onChange={(e) =>
                        setNewEdu({ ...newEdu, degree: e.target.value })
                      }
                      placeholder="e.g. Bachelor of Science"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      {isKm ? "ជំនាញឯកទេស" : "Field of Study / Major"}
                    </label>
                    <input
                      type="text"
                      value={newEdu.fieldOfStudy}
                      onChange={(e) =>
                        setNewEdu({ ...newEdu, fieldOfStudy: e.target.value })
                      }
                      placeholder="e.g. Computer Science"
                    />
                  </div>
                </div>

                <div className="form-two-col">
                  <div className="form-group">
                    <label>{isKm ? "កាលបរិច្ឆេទចាប់ផ្តើម" : "Start Date"}</label>
                    <input
                      type="date"
                      value={newEdu.startDate}
                      onChange={(e) =>
                        setNewEdu({ ...newEdu, startDate: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      {isKm ? "កាលបរិច្ឆេទបញ្ចប់ (ទទេ = បច្ចុប្បន្ន)" : "End Date (empty = Present)"}
                    </label>
                    <input
                      type="date"
                      value={newEdu.endDate}
                      onChange={(e) =>
                        setNewEdu({ ...newEdu, endDate: e.target.value })
                      }
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  <FiPlus />{" "}
                  <span>{isKm ? "បញ្ចូលការអប់រំ" : "Add Education Item"}</span>
                </button>
              </form>

              {/* Languages Spoken Manager */}
              <div className="languages-section-manager">
                <h3 className="section-subhead">
                  🗣️ {isKm ? "ភាសាទំនាក់ទំនង (Languages Spoken):" : "Languages Spoken:"}
                </h3>
                <div className="languages-pill-list">
                  {languagesList.map((lang) => (
                    <div key={lang.id} className="lang-item-badge">
                      <strong>{lang.language}</strong>
                      <span className="lang-level-tag">{lang.level}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteLanguage(lang.id)}
                        className="lang-del-btn"
                        title={isKm ? "លុប" : "Delete"}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddLanguage} className="add-lang-form">
                  <div className="form-two-col">
                    <input
                      type="text"
                      value={newLang.language}
                      onChange={(e) =>
                        setNewLang({ ...newLang, language: e.target.value })
                      }
                      placeholder={isKm ? "ឈ្មោះភាសា (ឧ. ភាសាខ្មែរ, English, 中文)" : "Language Name"}
                    />
                    <select
                      value={newLang.level}
                      onChange={(e) =>
                        setNewLang({ ...newLang, level: e.target.value })
                      }
                    >
                      <option value="ភាសាកំណើត (Mother Tongue / Native)">
                        {isKm ? "ភាសាកំណើត (Mother Tongue / Native)" : "Native"}
                      </option>
                      <option value="កម្រិតវិជ្ជាជីវៈ (Professional Working)">
                        {isKm ? "កម្រិតវិជ្ជាជីវៈ (Professional Working)" : "Professional Working"}
                      </option>
                      <option value="កម្រិតសន្ទនា (Conversational)">
                        {isKm ? "កម្រិតសន្ទនា (Conversational)" : "Conversational"}
                      </option>
                      <option value="កម្រិតមូលដ្ឋាន (Elementary)">
                        {isKm ? "កម្រិតមូលដ្ឋាន (Elementary)" : "Elementary"}
                      </option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-outline btn-sm">
                    <FiPlus /> {isKm ? "បន្ថែមភាសា" : "Add Language"}
                  </button>
                </form>
              </div>

              <div className="step-actions-footer">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setActiveStep(0)}
                >
                  <FiArrowLeft /> <span>{isKm ? "ថយក្រោយ" : "Back"}</span>
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setActiveStep(2)}
                >
                  <span>{isKm ? "បន្តទៅជំនាញ & វិញ្ញាបនបត្រ" : "Next: Skills"}</span>{" "}
                  <FiArrowRight />
                </button>
              </div>
            </section>
          )}

          {/* STEP 2: SKILLS & CERTIFICATIONS */}
          {activeStep === 2 && (
            <section className="step-editor-card">
              <div className="card-header-bar">
                <h2>
                  {isKm
                    ? "៣. ជំនាញបច្ចេកវិទ្យា និងវិញ្ញាបនបត្រ"
                    : "3. Technical Skills & Certifications"}
                </h2>
                <p>
                  {isKm
                    ? "ជំនាញជាផ្នែកសំខាន់សម្រាប់ប្រព័ន្ធ ATS ស្កេន CV របស់អ្នក — បញ្ចូលបច្ចេកវិទ្យាដែលអ្នកចេះ និងវិញ្ញាបនបត្រដែលទទួលបាន!"
                    : "Skills are prioritized by ATS scanners — enter your core tech stack and credentials!"}
                </p>
              </div>

              {/* Skills Tag Input */}
              <form onSubmit={handleAddSkill} className="add-skill-form">
                <input
                  type="text"
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  placeholder={
                    isKm
                      ? "វាយបញ្ចូលឈ្មោះជំនាញ (ឧ. React, Docker, Python)..."
                      : "Type a skill (e.g. React, Docker, Python)..."
                  }
                />
                <button type="submit" className="btn btn-primary">
                  <FiPlus /> <span>{isKm ? "បន្ថែមជំនាញ" : "Add Skill"}</span>
                </button>
              </form>

              {/* Skills Cloud */}
              <div className="skills-cloud-wrap">
                {skillsList.map((skill) => (
                  <span key={skill} className="skill-bubble-pill">
                    {skill}
                    <button
                      type="button"
                      className="skill-remove-btn"
                      onClick={() => handleRemoveSkill(skill)}
                      title={isKm ? "លុប" : "Remove"}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              {/* Popular Suggestions */}
              <div className="popular-skills-suggestions">
                <span className="suggestions-label">
                  ⚡ {isKm ? "ជំនាញពេញនិយម (ចុចដើម្បីបន្ថែមរហ័ស):" : "Popular (click to add):"}
                </span>
                {[
                  "JavaScript",
                  "TypeScript",
                  "React",
                  "Next.js",
                  "Node.js",
                  "Python",
                  "PostgreSQL",
                  "MongoDB",
                  "Tailwind CSS",
                  "Docker",
                  "Git & GitHub",
                  "Figma UI/UX",
                  "REST API",
                  "Spring Boot",
                ].map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="suggestion-chip"
                    onClick={() => handleSelectPopularSkill(s)}
                  >
                    + {s}
                  </button>
                ))}
              </div>

              {/* Certifications Manager */}
              <div className="certifications-manager-wrap">
                <h3 className="section-subhead">
                  🏆 {isKm ? "វិញ្ញាបនបត្រ និងរង្វាន់ (Certifications & Awards):" : "Certifications & Awards:"}
                </h3>
                <div className="cert-list-grid">
                  {certificatesList.map((cert) => (
                    <div key={cert.id} className="cert-item-card">
                      <div className="cert-info">
                        <strong>{cert.title}</strong>
                        <span>
                          {cert.issuer} {cert.year ? `(${cert.year})` : ""}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn-delete-item"
                        onClick={() => handleDeleteCertificate(cert.id)}
                        title={isKm ? "លុប" : "Delete"}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddCertificate} className="add-subform">
                  <h4>{isKm ? "+ បន្ថែមវិញ្ញាបនបត្រថ្មី" : "+ Add Certificate"}</h4>
                  <div className="form-group">
                    <label>{isKm ? "ឈ្មោះវិញ្ញាបនបត្រ *" : "Certificate Title *"}</label>
                    <input
                      type="text"
                      value={newCert.title}
                      onChange={(e) =>
                        setNewCert({ ...newCert, title: e.target.value })
                      }
                      placeholder="e.g. Full-Stack Web Engineering Bootcamp"
                    />
                  </div>
                  <div className="form-two-col">
                    <div className="form-group">
                      <label>{isKm ? "ស្ថាប័នចេញវិញ្ញាបនបត្រ" : "Issuing Organization"}</label>
                      <input
                        type="text"
                        value={newCert.issuer}
                        onChange={(e) =>
                          setNewCert({ ...newCert, issuer: e.target.value })
                        }
                        placeholder="e.g. Smart Community Academy"
                      />
                    </div>
                    <div className="form-group">
                      <label>{isKm ? "ឆ្នាំទទួល" : "Year"}</label>
                      <input
                        type="text"
                        value={newCert.year}
                        onChange={(e) =>
                          setNewCert({ ...newCert, year: e.target.value })
                        }
                        placeholder="2024"
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-outline btn-sm">
                    <FiPlus /> {isKm ? "បញ្ចូលវិញ្ញាបនបត្រ" : "Add Certificate Item"}
                  </button>
                </form>
              </div>

              <div className="step-actions-footer">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setActiveStep(1)}
                >
                  <FiArrowLeft /> <span>{isKm ? "ថយក្រោយ" : "Back"}</span>
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setActiveStep(3)}
                >
                  <span>
                    {isKm ? "បន្តទៅគម្រោង & បទពិសោធន៍" : "Next: Projects & Work"}
                  </span>{" "}
                  <FiArrowRight />
                </button>
              </div>
            </section>
          )}

          {/* STEP 3: PROJECTS & EXPERIENCE & REFERENCES */}
          {activeStep === 3 && (
            <section className="step-editor-card">
              <div className="card-header-bar">
                <h2>
                  {isKm
                    ? "៤. គម្រោងស្នាដៃ និងបទពិសោធន៍ការងារ"
                    : "4. Portfolio Projects & Work Experience"}
                </h2>
                <p>
                  {isKm
                    ? "គម្រោងជាក់ស្តែងបង្ហាញលើ Web Portfolio ជាមួយប៊ូតុង Live Demo & GitHub Code!"
                    : "Real-world projects showcase with live demo links and GitHub repository buttons!"}
                </p>
              </div>

              {/* Projects List */}
              <div className="existing-items-list">
                <h3>{isKm ? "គម្រោងស្នាដៃ (Portfolio Projects):" : "Portfolio Projects:"}</h3>
                {projectsList.map((proj) => (
                  <div key={proj.id} className="cv-item-card">
                    <div className="item-info">
                      <strong className="item-title">{proj.title}</strong>
                      {proj.projectUrl && (
                        <p className="item-sub">
                          🔗{" "}
                          <a
                            href={proj.projectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {proj.projectUrl}
                          </a>
                        </p>
                      )}
                      {proj.description && (
                        <p className="item-desc">{proj.description}</p>
                      )}
                      {Array.isArray(proj.technologies) && (
                        <div className="item-tech-tags">
                          {proj.technologies.map((t) => (
                            <span key={t} className="tech-mini-tag">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="btn-delete-item"
                      onClick={() => handleDeleteProject(proj.id)}
                      title={isKm ? "លុប" : "Delete"}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Project Form */}
              <form onSubmit={handleAddProject} className="add-subform">
                <h3>{isKm ? "+ បន្ថែមគម្រោងថ្មី" : "+ Add Project"}</h3>
                <div className="form-group">
                  <label>{isKm ? "ឈ្មោះគម្រោង *" : "Project Title *"}</label>
                  <input
                    type="text"
                    value={newProj.title}
                    onChange={(e) =>
                      setNewProj({ ...newProj, title: e.target.value })
                    }
                    placeholder="e.g. Smart Community Platform"
                  />
                </div>

                <div className="form-two-col">
                  <div className="form-group">
                    <label>{isKm ? "តំណភ្ជាប់ Live Demo (URL)" : "Live Demo URL"}</label>
                    <input
                      type="url"
                      value={newProj.projectUrl}
                      onChange={(e) =>
                        setNewProj({ ...newProj, projectUrl: e.target.value })
                      }
                      placeholder="https://my-app.vercel.app"
                    />
                  </div>

                  <div className="form-group">
                    <label>{isKm ? "GitHub Repository URL" : "GitHub Repo URL"}</label>
                    <input
                      type="url"
                      value={newProj.githubUrl}
                      onChange={(e) =>
                        setNewProj({ ...newProj, githubUrl: e.target.value })
                      }
                      placeholder="https://github.com/user/project"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    {isKm
                      ? "បច្ចេកវិទ្យាប្រើប្រាស់ (ខណ្ឌដោយសញ្ញាក្បៀស)"
                      : "Technologies (comma-separated)"}
                  </label>
                  <input
                    type="text"
                    value={newProj.technologies}
                    onChange={(e) =>
                      setNewProj({ ...newProj, technologies: e.target.value })
                    }
                    placeholder="React, Node.js, PostgreSQL, Tailwind"
                  />
                </div>

                <div className="form-group">
                  <label>{isKm ? "ពិពណ៌នាអំពីគម្រោង" : "Project Description"}</label>
                  <textarea
                    rows={2}
                    value={newProj.description}
                    onChange={(e) =>
                      setNewProj({ ...newProj, description: e.target.value })
                    }
                    placeholder={
                      isKm
                        ? "តើគម្រោងនេះដោះស្រាយបញ្ហាអ្វីខ្លះ? មានមុខងារសំខាន់អ្វីខ្លះ?"
                        : "What problem does this project solve? What did you build?"
                    }
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  <FiPlus />{" "}
                  <span>{isKm ? "បញ្ចូលគម្រោង" : "Add Project Item"}</span>
                </button>
              </form>

              {/* Experience List */}
              <div className="existing-items-list" style={{ marginTop: "32px" }}>
                <h3>{isKm ? "បទពិសោធន៍ការងារ (Work Experience):" : "Work Experience:"}</h3>
                {experiencesList.map((exp) => (
                  <div key={exp.id} className="cv-item-card">
                    <div className="item-info">
                      <strong className="item-title">{exp.title}</strong>
                      <p className="item-sub">
                        {exp.company}{" "}
                        {exp.employmentType ? `• ${exp.employmentType}` : ""}
                      </p>
                      <span className="item-dates">
                        {exp.startDate ? exp.startDate.slice(0, 7) : ""}{" "}
                        —{" "}
                        {exp.isCurrent || !exp.endDate
                          ? "Present"
                          : exp.endDate.slice(0, 7)}
                      </span>
                      {exp.description && (
                        <p className="item-desc">{exp.description}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      className="btn-delete-item"
                      onClick={() => handleDeleteExperience(exp.id)}
                      title={isKm ? "លុប" : "Delete"}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Experience Form */}
              <form onSubmit={handleAddExperience} className="add-subform">
                <h3>{isKm ? "+ បន្ថែមបទពិសោធន៍ថ្មី" : "+ Add Experience"}</h3>
                <div className="form-two-col">
                  <div className="form-group">
                    <label>{isKm ? "តួនាទី / មុខតំណែង *" : "Job Title *"}</label>
                    <input
                      type="text"
                      value={newExp.title}
                      onChange={(e) =>
                        setNewExp({ ...newExp, title: e.target.value })
                      }
                      placeholder="e.g. Frontend Developer Intern"
                    />
                  </div>

                  <div className="form-group">
                    <label>{isKm ? "ក្រុមហ៊ុន / ស្ថាប័ន *" : "Company / Organization *"}</label>
                    <input
                      type="text"
                      value={newExp.company}
                      onChange={(e) =>
                        setNewExp({ ...newExp, company: e.target.value })
                      }
                      placeholder="e.g. Digital Cambodia Solutions"
                    />
                  </div>
                </div>

                <div className="form-three-col">
                  <div className="form-group">
                    <label>{isKm ? "ប្រភេទការងារ" : "Employment Type"}</label>
                    <select
                      value={newExp.employmentType}
                      onChange={(e) =>
                        setNewExp({ ...newExp, employmentType: e.target.value })
                      }
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Internship">Internship</option>
                      <option value="Freelance">Freelance</option>
                      <option value="Volunteer">Volunteer</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>{isKm ? "ថ្ងៃចាប់ផ្តើម" : "Start Date"}</label>
                    <input
                      type="date"
                      value={newExp.startDate}
                      onChange={(e) =>
                        setNewExp({ ...newExp, startDate: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>{isKm ? "ថ្ងៃបញ្ចប់" : "End Date"}</label>
                    <input
                      type="date"
                      value={newExp.endDate}
                      disabled={newExp.isCurrent}
                      onChange={(e) =>
                        setNewExp({ ...newExp, endDate: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="checkbox-toggle-label">
                    <input
                      type="checkbox"
                      checked={newExp.isCurrent}
                      onChange={(e) =>
                        setNewExp({ ...newExp, isCurrent: e.target.checked })
                      }
                    />
                    <span>{isKm ? "កំពុងបម្រើការងារនៅទីនេះ (Currently Working)" : "Currently working here"}</span>
                  </label>
                </div>

                <div className="form-group">
                  <label>{isKm ? "ការទទួលខុសត្រូវ និងស្នាដៃសម្រេចបាន" : "Responsibilities & Accomplishments"}</label>
                  <textarea
                    rows={3}
                    value={newExp.description}
                    onChange={(e) =>
                      setNewExp({ ...newExp, description: e.target.value })
                    }
                    placeholder={
                      isKm
                        ? "បញ្ជាក់ពីតួនាទី និងលទ្ធផលការងារ (ឧ. បង្កើត UI Dashboard បង្កើនល្បឿន 35%)..."
                        : "Key achievements, technologies used, metrics improved..."
                    }
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  <FiPlus />{" "}
                  <span>{isKm ? "បន្ថែមបទពិសោធន៍ចូល CV" : "Add Experience Item"}</span>
                </button>
              </form>

              {/* References Form */}
              <div className="references-editor-wrap">
                <h3 className="section-subhead">
                  🤝 {isKm ? "បុគ្គលធានា (References — យ៉ាងតិច ២ នាក់):" : "References (At least 2 Referees):"}
                </h3>

                <div className="existing-items-list">
                  {referencesList.map((ref, idx) => (
                    <div key={ref.id} className="cv-item-card">
                      <div className="item-info">
                        <strong className="item-title">
                          {idx + 1}. {ref.name}
                        </strong>
                        <p className="item-sub">
                          {ref.position} • {ref.organization}
                        </p>
                        <span className="item-dates">
                          📞 {ref.phone} {ref.email ? `| ✉️ ${ref.email}` : ""}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn-delete-item"
                        onClick={() => handleDeleteReference(ref.id)}
                        title={isKm ? "លុប" : "Delete"}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddReference} className="add-subform">
                  <h4>{isKm ? "+ បន្ថែមបុគ្គលធានាថ្មី" : "+ Add Referee"}</h4>
                  <div className="form-two-col">
                    <div className="form-group">
                      <label>{isKm ? "ឈ្មោះពេញ *" : "Full Name *"}</label>
                      <input
                        type="text"
                        value={newRef.name}
                        onChange={(e) =>
                          setNewRef({ ...newRef, name: e.target.value })
                        }
                        placeholder="e.g. លោក ឈុន វឌ្ឍនៈ"
                      />
                    </div>
                    <div className="form-group">
                      <label>{isKm ? "មុខតំណែង *" : "Position *"}</label>
                      <input
                        type="text"
                        value={newRef.position}
                        onChange={(e) =>
                          setNewRef({ ...newRef, position: e.target.value })
                        }
                        placeholder="e.g. Lead Software Engineer"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>{isKm ? "ស្ថាប័ន / ក្រុមហ៊ុន" : "Company / Organization"}</label>
                    <input
                      type="text"
                      value={newRef.organization}
                      onChange={(e) =>
                        setNewRef({ ...newRef, organization: e.target.value })
                      }
                      placeholder="e.g. Digital Cambodia Solutions"
                    />
                  </div>
                  <div className="form-two-col">
                    <div className="form-group">
                      <label>{isKm ? "លេខទូរស័ព្ទ" : "Phone"}</label>
                      <input
                        type="text"
                        value={newRef.phone}
                        onChange={(e) =>
                          setNewRef({ ...newRef, phone: e.target.value })
                        }
                        placeholder="+855 12 888 999"
                      />
                    </div>
                    <div className="form-group">
                      <label>{isKm ? "អ៊ីមែល" : "Email"}</label>
                      <input
                        type="email"
                        value={newRef.email}
                        onChange={(e) =>
                          setNewRef({ ...newRef, email: e.target.value })
                        }
                        placeholder="referee@example.com"
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-outline btn-sm">
                    <FiPlus /> {isKm ? "បញ្ចូលបុគ្គលធានា" : "Add Referee Item"}
                  </button>
                </form>
              </div>

              <div className="step-actions-footer">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setActiveStep(2)}
                >
                  <FiArrowLeft /> <span>{isKm ? "ថយក្រោយ" : "Back"}</span>
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={() => setActiveStep(4)}
                >
                  <FiEye />{" "}
                  <span>
                    {isKm
                      ? "មើលពេញ & ទាញយក PDF"
                      : "Full Preview & Download PDF"}
                  </span>
                </button>
              </div>
            </section>
          )}
        </div>

        {/* RIGHT COLUMN: DYNAMIC LIVE PREVIEW (CV SHEET vs WEB PORTFOLIO) */}
        <div
          className={`cv-preview-column ${
            activeStep === 4 ? "full-preview-mode" : ""
          }`}
        >
          {/* Always-Visible Action Bar */}
          <div className="cv-live-sheet-toolbar no-print">
            <div className="sheet-toolbar-left">
              <span className="live-indicator-dot" />
              <strong>
                {viewMode === "cv"
                  ? isCvKm
                    ? "មើល CV ផ្ទាល់ (A4 Live)"
                    : "Live A4 CV Preview"
                  : isCvKm
                  ? "មើល Web Portfolio ផ្ទាល់"
                  : "Live Web Portfolio Showcase"}
              </strong>
              {viewMode === "cv" && (
                <>
                  <span className="sheet-tpl-tag">
                    {
                      CV_TEMPLATES.find((t) => t.id === selectedTemplate)?.[
                        isCvKm ? "nameKm" : "nameEn"
                      ]
                    }
                  </span>
                  <div className="cv-lang-switch-pill-wrap" title={isCvKm ? "ជ្រើសរើសភាសា CV" : "Choose CV Language"}>
                    <button
                      type="button"
                      className={`cv-lang-pill-btn ${isCvKm ? "active" : ""}`}
                      onClick={() => handleSwitchCvLanguage("km")}
                      title="ទម្រង់ CV ជាភាសាខ្មែរសុទ្ធ (Pure Khmer CV)"
                    >
                      🇰🇭 ខ្មែរ (Khmer)
                    </button>
                    <button
                      type="button"
                      className={`cv-lang-pill-btn ${!isCvKm ? "active" : ""}`}
                      onClick={() => handleSwitchCvLanguage("en")}
                      title="Pure English CV only"
                    >
                      🇬🇧 English
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="sheet-toolbar-actions">
              {activeStep === 4 && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setActiveStep(0)}
                >
                  <FiArrowLeft />{" "}
                  {isKm ? "ត្រឡប់ទៅកែសម្រួល" : "Back to Editor"}
                </button>
              )}

              {viewMode === "portfolio" ? (
                <>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={handleCopyPortfolioLink}
                  >
                    <FiCopy /> {isKm ? "ចម្លងតំណភ្ជាប់ Portfolio" : "Share Portfolio"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setViewMode("cv");
                      setTimeout(() => window.print(), 180);
                    }}
                  >
                    <FiPrinter />{" "}
                    {isKm ? "ទាញយក PDF / Print" : "Download PDF / Print"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handlePrintPdf}
                >
                  <FiPrinter />{" "}
                  {isKm ? "ទាញយក PDF / Print (ឥតគិតថ្លៃ)" : "Download PDF / Print"}
                </button>
              )}

              <Link to="/jobs" className="btn btn-success btn-sm">
                <FiBriefcase /> {isKm ? "ដាក់ពាក្យការងារ" : "Apply for Jobs"}
              </Link>
            </div>
          </div>

          {/* VIEW MODE 1: INTERACTIVE WEB PORTFOLIO SHOWCASE */}
          {viewMode === "portfolio" ? (
            <div className="portfolio-showcase-view no-print">
              {/* Hero Showcase Card */}
              <div className="portfolio-hero-card">
                <div className="hero-avatar-col">
                  {basicInfo.photoUrl ? (
                    <img
                      src={basicInfo.photoUrl}
                      alt={basicInfo.fullName}
                      className="portfolio-hero-avatar"
                    />
                  ) : (
                    <div className="portfolio-avatar-placeholder">
                      {basicInfo.fullName?.charAt(0) || "U"}
                    </div>
                  )}
                  <span className="open-to-work-pill">
                    <span className="green-pulse-dot" />{" "}
                    {isKm ? "ត្រៀមខ្លួនសម្រាប់ឱកាសការងារ" : "Open to Work"}
                  </span>
                </div>

                <div className="hero-info-col">
                  <h1 className="portfolio-hero-name">
                    {basicInfo.fullName || (isKm ? "ឈ្មោះរបស់អ្នក" : "Your Name")}
                  </h1>
                  <h2 className="portfolio-hero-role">
                    {basicInfo.jobTitle || "Full-Stack Web Developer"}
                  </h2>

                  <div className="portfolio-meta-strip">
                    {basicInfo.location && (
                      <span className="meta-pill">
                        <FiMapPin /> {basicInfo.location}
                      </span>
                    )}
                    {basicInfo.email && (
                      <a
                        href={`mailto:${basicInfo.email}`}
                        className="meta-pill linkable"
                      >
                        <FiMail /> {basicInfo.email}
                      </a>
                    )}
                    {basicInfo.phone && (
                      <a
                        href={`tel:${basicInfo.phone}`}
                        className="meta-pill linkable"
                      >
                        <FiPhone /> {basicInfo.phone}
                      </a>
                    )}
                  </div>

                  {basicInfo.bio && (
                    <p className="portfolio-hero-bio">{basicInfo.bio}</p>
                  )}

                  {/* Social & Direct Contact Links */}
                  <div className="portfolio-social-row">
                    {basicInfo.portfolioUrl && (
                      <a
                        href={safeExternalUrl(basicInfo.portfolioUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="social-btn website"
                      >
                        <FiGlobe /> <span>Portfolio Website</span>{" "}
                        <FiExternalLink />
                      </a>
                    )}
                    {basicInfo.githubUrl && (
                      <a
                        href={safeExternalUrl(basicInfo.githubUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="social-btn github"
                      >
                        <FiGithub /> <span>GitHub</span> <FiExternalLink />
                      </a>
                    )}
                    {basicInfo.linkedinUrl && (
                      <a
                        href={safeExternalUrl(basicInfo.linkedinUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="social-btn linkedin"
                      >
                        <FiLinkedin /> <span>LinkedIn</span>{" "}
                        <FiExternalLink />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Featured Portfolio Projects Grid */}
              <section className="portfolio-section">
                <div className="section-head-bar">
                  <h3>
                    <FiLayers />{" "}
                    {isKm
                      ? "គម្រោងស្នាដៃបច្ចេកវិទ្យា (Featured Projects)"
                      : "Featured Tech Projects"}
                  </h3>
                  <span className="count-badge">
                    {previewProjects.length} {isKm ? "គម្រោង" : "Projects"}
                  </span>
                </div>

                <div className="portfolio-projects-grid">
                  {previewProjects.map((proj) => (
                    <div key={proj.id} className="portfolio-project-card">
                      <div className="proj-card-top">
                        <h4 className="proj-title">{proj.title}</h4>
                        {proj.description && (
                          <p className="proj-desc">{proj.description}</p>
                        )}
                      </div>

                      {Array.isArray(proj.technologies) &&
                        proj.technologies.length > 0 && (
                          <div className="proj-tech-stack">
                            {proj.technologies.map((t) => (
                              <span key={t} className="tech-badge">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}

                      <div className="proj-card-actions">
                        {proj.projectUrl && (
                          <a
                            href={safeExternalUrl(proj.projectUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="proj-action-btn live"
                          >
                            🚀 {isKm ? "មើលគម្រោងផ្ទាល់" : "Live Demo"}
                          </a>
                        )}
                        {proj.githubUrl && (
                          <a
                            href={safeExternalUrl(proj.githubUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="proj-action-btn code"
                          >
                            💻 {isKm ? "កូដប្រភព" : "Source Code"}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Skills Matrix */}
              <section className="portfolio-section">
                <div className="section-head-bar">
                  <h3>
                    <FiCode />{" "}
                    {isKm
                      ? "ជំនាញបច្ចេកវិទ្យា & ឧបករណ៍ (Tech Stack & Skills)"
                      : "Core Tech Stack & Tools"}
                  </h3>
                </div>
                <div className="portfolio-skills-matrix">
                  {skillsList.map((skill) => (
                    <div key={skill} className="portfolio-skill-chip">
                      <FiStar className="chip-ico" />
                      <span>{skill}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Experience & Education 2-Column Showcase */}
              <div className="portfolio-two-column-row">
                <section className="portfolio-sub-section">
                  <div className="section-head-bar">
                    <h3>
                      <FiBriefcase />{" "}
                      {isKm ? "បទពិសោធន៍ការងារ" : "Work Experience"}
                    </h3>
                  </div>
                  <div className="portfolio-timeline">
                    {previewExperiences.map((exp) => (
                      <div key={exp.id} className="timeline-item">
                        <strong className="tl-title">{exp.title}</strong>
                        <p className="tl-sub">
                          {exp.company}{" "}
                          {exp.employmentType ? `• ${exp.employmentType}` : ""}
                        </p>
                        <span className="tl-date">
                          {exp.startDate ? exp.startDate.slice(0, 7) : ""}{" "}
                          —{" "}
                          {exp.isCurrent || !exp.endDate
                            ? "Present"
                            : exp.endDate.slice(0, 7)}
                        </span>
                        {exp.description && (
                          <p className="tl-desc">{exp.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                <section className="portfolio-sub-section">
                  <div className="section-head-bar">
                    <h3>
                      <FiBookOpen /> {isKm ? "ការអប់រំ" : "Education"}
                    </h3>
                  </div>
                  <div className="portfolio-timeline">
                    {previewEducation.map((edu) => (
                      <div key={edu.id} className="timeline-item">
                        <strong className="tl-title">{edu.institution}</strong>
                        <p className="tl-sub">
                          {edu.degree}{" "}
                          {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ""}
                        </p>
                        <span className="tl-date">
                          {edu.startDate ? edu.startDate.slice(0, 4) : ""}{" "}
                          —{" "}
                          {edu.endDate ? edu.endDate.slice(0, 4) : "Present"}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Certifications & Languages Strip */}
              <div className="portfolio-two-column-row">
                {certificatesList.length > 0 && (
                  <section className="portfolio-sub-section">
                    <div className="section-head-bar">
                      <h3>
                        <FiAward />{" "}
                        {isKm ? "វិញ្ញាបនបត្រ" : "Certifications"}
                      </h3>
                    </div>
                    <div className="portfolio-cert-list">
                      {certificatesList.map((c) => (
                        <div key={c.id} className="cert-card">
                          <FiAward className="cert-ico" />
                          <div>
                            <strong>{c.title}</strong>
                            <p>
                              {c.issuer} {c.year ? `(${c.year})` : ""}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {languagesList.length > 0 && (
                  <section className="portfolio-sub-section">
                    <div className="section-head-bar">
                      <h3>
                        🗣️ {isKm ? "ភាសាទំនាក់ទំនង" : "Languages"}
                      </h3>
                    </div>
                    <div className="portfolio-lang-list">
                      {languagesList.map((l) => (
                        <div key={l.id} className="lang-card">
                          <strong>{l.language}</strong>
                          <span className="lang-badge">{l.level}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {/* Share & Contact Callout */}
              <div className="portfolio-share-banner">
                <div className="share-text">
                  <h3>
                    {isKm
                      ? "ចាប់អារម្មណ៍សហការ ឬចង់ជ្រើសរើសចូលរួមការងារ?"
                      : "Interested in hiring or collaborating?"}
                  </h3>
                  <p>
                    {isKm
                      ? "អ្នកអាចទាក់ទងដោយផ្ទាល់ ឬចែករំលែកតំណភ្ជាប់ Portfolio នេះទៅកាន់ក្រុមការងារ!"
                      : "Get in touch directly or share this interactive portfolio with your team!"}
                  </p>
                </div>
                <div className="share-buttons">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handleCopyPortfolioLink}
                  >
                    <FiCopy /> {isKm ? "ចម្លងតំណភ្ជាប់" : "Copy Link"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      setViewMode("cv");
                      setTimeout(() => window.print(), 180);
                    }}
                  >
                    <FiPrinter />{" "}
                    {isKm ? "ទាញយក PDF CV ពេញលេញ" : "Download PDF CV"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* VIEW MODE 2: ACTUAL PRINTABLE A4 CV SHEET */
            <div className="cv-preview-sheet-wrapper">
              <article
                className={`cv-printable-document tpl-${selectedTemplate}`}
                id="printable-cv-sheet"
                style={{ "--cv-accent": accentColor }}
              >
                {/* ========================================================
                    TEMPLATE 1: 2-COLUMN SPLIT SIDEBAR
                    ======================================================== */}
                {selectedTemplate === "sidebar" ? (
                  <div className="cv-sidebar-layout">
                    <aside className="cv-sidebar-left">
                      {/* Photo if enabled */}
                      {basicInfo.showPhoto && basicInfo.photoUrl && (
                        <div className="cv-sidebar-photo-wrap">
                          <img
                            src={basicInfo.photoUrl}
                            alt={stripBilingual(basicInfo.fullName, isCvKm)}
                            className="cv-sidebar-photo"
                          />
                        </div>
                      )}

                      <div className="cv-sidebar-identity">
                        <h1 className="cv-applicant-name">
                          {stripBilingual(basicInfo.fullName, isCvKm) ||
                            (isCvKm ? "សុខា វណ្ណៈ" : "Your Full Name")}
                        </h1>
                        <p className="cv-applicant-title">
                          {sanitizeJobTitle(
                            basicInfo.jobTitle,
                            isCvKm,
                            isCvKm ? "អ្នកអភិវឌ្ឍន៍គេហទំព័រ" : "Full-Stack Web Developer"
                          )}
                        </p>
                      </div>

                      <div className="cv-sidebar-block">
                        <h3 className="sidebar-heading">
                          {isCvKm ? "ទំនាក់ទំនង" : "CONTACT DETAILS"}
                        </h3>
                        <div className="cv-sidebar-contacts">
                          {basicInfo.email && (
                            <div className="contact-item">
                              <FiMail /> <span>{basicInfo.email}</span>
                            </div>
                          )}
                          {basicInfo.phone && (
                            <div className="contact-item">
                              <span>📞 {basicInfo.phone}</span>
                            </div>
                          )}
                          {basicInfo.location && (
                            <div className="contact-item">
                              <FiMapPin /> <span>{translateCvField(basicInfo.location, isCvKm)}</span>
                            </div>
                          )}
                          {basicInfo.portfolioUrl && (
                            <div className="contact-item">
                              <FiGlobe />{" "}
                              <span>
                                {basicInfo.portfolioUrl.replace(
                                  /^https?:\/\/(www\.)?/,
                                  ""
                                )}
                              </span>
                            </div>
                          )}
                          {basicInfo.githubUrl && (
                            <div className="contact-item">
                              <FiGithub />{" "}
                              <span>
                                {basicInfo.githubUrl.replace(
                                  /^https?:\/\/(www\.)?/,
                                  ""
                                )}
                              </span>
                            </div>
                          )}
                          {basicInfo.linkedinUrl && (
                            <div className="contact-item">
                              <FiLinkedin />{" "}
                              <span>
                                {basicInfo.linkedinUrl.replace(
                                  /^https?:\/\/(www\.)?/,
                                  ""
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Languages in Sidebar */}
                      {languagesList.length > 0 && (
                        <div className="cv-sidebar-block">
                          <h3 className="sidebar-heading">
                            {isCvKm ? "ភាសាទំនាក់ទំនង" : "LANGUAGES"}
                          </h3>
                          <div className="cv-sidebar-lang-list">
                            {languagesList.map((lang) => (
                              <div key={lang.id} className="sidebar-lang-entry">
                                <strong>{translateCvField(lang.language, isCvKm)}</strong>
                                <span>{translateCvField(lang.level, isCvKm)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {skillsList.length > 0 && (
                        <div className="cv-sidebar-block">
                          <h3 className="sidebar-heading">
                            {isCvKm ? "ជំនាញបច្ចេកទេស" : "TECHNICAL SKILLS"}
                          </h3>
                          <div className="cv-skills-grid">
                            {skillsList.map((skill) => (
                              <span key={skill} className="cv-doc-skill-pill">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {previewEducation.length > 0 && (
                        <div className="cv-sidebar-block">
                          <h3 className="sidebar-heading">
                            {isCvKm ? "កម្រិតវប្បធម៌ និងការអប់រំ" : "EDUCATION"}
                          </h3>
                          <div className="cv-timeline">
                            {previewEducation.map((edu) => (
                              <div key={edu.id} className="cv-entry">
                                <strong className="entry-title">
                                  {edu.institution}
                                </strong>
                                <p className="entry-sub">
                                  {edu.degree}{" "}
                                  {edu.fieldOfStudy
                                    ? (isCvKm ? `• ជំនាញ ${edu.fieldOfStudy}` : `• in ${edu.fieldOfStudy}`)
                                    : ""}
                                </p>
                                <span className="entry-dates">
                                  {formatCvDateRange(edu.startDate, edu.endDate, false, isCvKm, true)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </aside>

                    <div className="cv-sidebar-main">
                      {basicInfo.bio && (
                        <section className="cv-doc-section">
                          <h2 className="section-heading">
                            {isCvKm
                              ? "សេចក្តីសង្ខេបអំពីខ្លួនឯង"
                              : "PROFESSIONAL SUMMARY"}
                          </h2>
                          <p className="cv-body-text">{resolveCvBio(basicInfo.bio, isCvKm)}</p>
                        </section>
                      )}

                      {previewExperiences.length > 0 && (
                        <section className="cv-doc-section">
                          <h2 className="section-heading">
                            {isCvKm
                              ? "បទពិសោធន៍ការងារ"
                              : "WORK EXPERIENCE"}
                          </h2>
                          <div className="cv-timeline">
                            {previewExperiences.map((exp) => (
                              <div key={exp.id} className="cv-entry">
                                <div className="entry-header">
                                  <strong className="entry-title">
                                    {exp.title}
                                  </strong>
                                  <span className="entry-dates">
                                    {formatCvDateRange(exp.startDate, exp.endDate, exp.isCurrent, isCvKm)}
                                  </span>
                                </div>
                                <p className="entry-sub">
                                  {exp.company}{" "}
                                  {exp.employmentType
                                    ? `(${exp.employmentType})`
                                    : ""}
                                </p>
                                {exp.description && (
                                  <p className="entry-desc">{exp.description}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </section>
                      )}

                      {previewProjects.length > 0 && (
                        <section className="cv-doc-section">
                          <h2 className="section-heading">
                            {isCvKm
                              ? "គម្រោងស្នាដៃ"
                              : "PORTFOLIO PROJECTS"}
                          </h2>
                          <div className="cv-timeline">
                            {previewProjects.map((proj) => (
                              <div key={proj.id} className="cv-entry">
                                <div className="entry-header">
                                  <strong className="entry-title">
                                    {proj.title}
                                  </strong>
                                  {proj.projectUrl && (
                                    <span className="entry-link">
                                      {proj.projectUrl.replace(
                                        /^https?:\/\/(www\.)?/,
                                        ""
                                      )}
                                    </span>
                                  )}
                                </div>
                                {proj.description && (
                                  <p className="entry-desc">{proj.description}</p>
                                )}
                                {Array.isArray(proj.technologies) &&
                                  proj.technologies.length > 0 && (
                                    <p className="entry-tech-line">
                                      <strong>{isCvKm ? "បច្ចេកវិទ្យា ៖" : "Tech Stack:"}</strong>{" "}
                                      {proj.technologies.join(", ")}
                                    </p>
                                  )}
                              </div>
                            ))}
                          </div>
                        </section>
                      )}

                      {certificatesList.length > 0 && (
                        <section className="cv-doc-section">
                          <h2 className="section-heading">
                            {isCvKm
                              ? "វិញ្ញាបនបត្រ"
                              : "CERTIFICATIONS & HONORS"}
                          </h2>
                          <div className="cv-timeline">
                            {certificatesList.map((c) => (
                              <div key={c.id} className="cv-entry">
                                <div className="entry-header">
                                  <strong className="entry-title">{c.title}</strong>
                                  <span className="entry-dates">{c.year}</span>
                                </div>
                                <p className="entry-sub">{c.issuer}</p>
                              </div>
                            ))}
                          </div>
                        </section>
                      )}

                      {referencesList.length > 0 && (
                        <section className="cv-doc-section">
                          <h2 className="section-heading">
                            {isCvKm ? "បុគ្គលធានា" : "REFERENCES"}
                          </h2>
                          <div className="corp-referees-grid">
                            {referencesList.map((ref, idx) => (
                              <div key={ref.id} className="corp-referee-card">
                                <strong className="corp-ref-name">{isCvKm ? toKhmerDigits(idx + 1) : idx + 1}. {translateCvField(ref.name, isCvKm)}</strong>
                                <div className="corp-ref-meta">
                                  <p><strong>{isCvKm ? "មុខតំណែង ៖" : "Position:"}</strong> {translateCvField(ref.position, isCvKm)}</p>
                                  <p><strong>{isCvKm ? "ស្ថាប័ន / ក្រុមហ៊ុន ៖" : "Company / Institution:"}</strong> {translateCvField(ref.organization, isCvKm)}</p>
                                  <p><strong>{isCvKm ? "ទូរស័ព្ទ ៖" : "Phone:"}</strong> {ref.phone}</p>
                                  {ref.email && <p><strong>{isCvKm ? "អ៊ីមែល ៖" : "Email:"}</strong> {ref.email}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>
                      )}
                    </div>
                  </div>
                ) : selectedTemplate === "executive" ? (
                  /* ========================================================
                      TEMPLATE 2: EXECUTIVE CLASSIC (Formal Centered, Double-Rule)
                      ======================================================== */
                  <div className="cv-executive-layout">
                    <div className="cv-executive-header">
                      <h1 className="exec-applicant-name">
                        {stripBilingual(basicInfo.fullName, isCvKm) || (isCvKm ? "សុខា វណ្ណៈ" : "SOKHA VANNAK")}
                      </h1>
                      <p className="exec-applicant-title">
                        {sanitizeJobTitle(
                          basicInfo.jobTitle,
                          isCvKm,
                          isCvKm ? "អ្នកជំនាញវិជ្ជាជីវៈ" : "EXECUTIVE PROFESSIONAL"
                        )}
                      </p>

                      <div className="exec-contact-strip">
                        {basicInfo.email && <span>{basicInfo.email}</span>}
                        {basicInfo.phone && <span>• {basicInfo.phone}</span>}
                        {basicInfo.location && <span>• {translateCvField(basicInfo.location, isCvKm)}</span>}
                        {basicInfo.portfolioUrl && (
                          <span>
                            •{" "}
                            {basicInfo.portfolioUrl.replace(
                              /^https?:\/\/(www\.)?/,
                              ""
                            )}
                          </span>
                        )}
                        {basicInfo.linkedinUrl && (
                          <span>
                            •{" "}
                            {basicInfo.linkedinUrl.replace(
                              /^https?:\/\/(www\.)?/,
                              ""
                            )}
                          </span>
                        )}
                      </div>
                      <div className="exec-double-divider" />
                    </div>

                    {basicInfo.bio && (
                      <section className="cv-doc-section">
                        <h2 className="exec-section-heading">
                          {isCvKm ? "សេចក្តីសង្ខេបអំពីខ្លួនឯង" : "EXECUTIVE SUMMARY"}
                        </h2>
                        <p className="cv-body-text exec-summary-text">
                          {resolveCvBio(basicInfo.bio, isCvKm)}
                        </p>
                      </section>
                    )}

                    {skillsList.length > 0 && (
                      <section className="cv-doc-section">
                        <h2 className="exec-section-heading">
                          {isCvKm ? "ជំនាញស្នូល និងឯកទេស" : "AREAS OF EXPERTISE"}
                        </h2>
                        <div className="exec-skills-grid">
                          {skillsList.map((s) => (
                            <div key={s} className="exec-skill-cell">
                              • {s}
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {previewExperiences.length > 0 && (
                      <section className="cv-doc-section">
                        <h2 className="exec-section-heading">
                          {isCvKm ? "បទពិសោធន៍ការងារ" : "PROFESSIONAL EXPERIENCE"}
                        </h2>
                        <div className="exec-timeline">
                          {previewExperiences.map((exp) => (
                            <div key={exp.id} className="exec-entry">
                              <div className="exec-entry-top">
                                <strong className="exec-entry-title">
                                  {exp.title}
                                </strong>
                                <span className="exec-entry-date">
                                  {formatCvDateRange(exp.startDate, exp.endDate, exp.isCurrent, isCvKm)}
                                </span>
                              </div>
                              <p className="exec-entry-company">
                                {exp.company}{" "}
                                {exp.employmentType
                                  ? `| ${exp.employmentType}`
                                  : ""}
                              </p>
                              {exp.description && (
                                <p className="exec-entry-desc">
                                  {exp.description}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {previewProjects.length > 0 && (
                      <section className="cv-doc-section">
                        <h2 className="exec-section-heading">
                          {isCvKm ? "គម្រោងស្នាដៃសំខាន់ៗ" : "KEY INITIATIVES & PROJECTS"}
                        </h2>
                        <div className="exec-timeline">
                          {previewProjects.map((proj) => (
                            <div key={proj.id} className="exec-entry">
                              <div className="exec-entry-top">
                                <strong className="exec-entry-title">
                                  {proj.title}
                                </strong>
                                {proj.projectUrl && (
                                  <span className="exec-entry-date">
                                    {proj.projectUrl.replace(
                                      /^https?:\/\/(www\.)?/,
                                      ""
                                    )}
                                  </span>
                                )}
                              </div>
                              {proj.description && (
                                <p className="exec-entry-desc">
                                  {proj.description}
                                </p>
                              )}
                              {Array.isArray(proj.technologies) &&
                                proj.technologies.length > 0 && (
                                  <p className="entry-tech-line">
                                    <strong>{isCvKm ? "បច្ចេកវិទ្យា ៖" : "Technologies:"}</strong>{" "}
                                    {proj.technologies.join(", ")}
                                  </p>
                                )}
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {previewEducation.length > 0 && (
                      <section className="cv-doc-section">
                        <h2 className="exec-section-heading">
                          {isCvKm ? "កម្រិតវប្បធម៌ និងការអប់រំ" : "EDUCATION & CREDENTIALS"}
                        </h2>
                        <div className="exec-timeline">
                          {previewEducation.map((edu) => (
                            <div key={edu.id} className="exec-entry">
                              <div className="exec-entry-top">
                                <strong className="exec-entry-title">
                                  {edu.institution}
                                </strong>
                                <span className="exec-entry-date">
                                  {formatCvDateRange(edu.startDate, edu.endDate, false, isCvKm, true)}
                                </span>
                              </div>
                              <p className="exec-entry-company">
                                {edu.degree}{" "}
                                {edu.fieldOfStudy
                                  ? (isCvKm ? `- ជំនាញ ${edu.fieldOfStudy}` : `- in ${edu.fieldOfStudy}`)
                                  : ""}
                              </p>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {certificatesList.length > 0 && (
                      <section className="cv-doc-section">
                        <h2 className="exec-section-heading">
                          {isCvKm ? "វិញ្ញាបនបត្រ និងការទទួលស្គាល់" : "HONORS & CERTIFICATIONS"}
                        </h2>
                        <div className="exec-timeline">
                          {certificatesList.map((c) => (
                            <div key={c.id} className="exec-entry">
                              <div className="exec-entry-top">
                                <strong className="exec-entry-title">{c.title}</strong>
                                <span className="exec-entry-date">{isCvKm ? toKhmerDigits(c.year) : c.year}</span>
                              </div>
                              <p className="exec-entry-company">{c.issuer}</p>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {referencesList.length > 0 && (
                      <section className="cv-doc-section">
                        <h2 className="exec-section-heading">
                          {isCvKm ? "បុគ្គលធានា" : "REFERENCES"}
                        </h2>
                        <div className="corp-referees-grid">
                          {referencesList.map((ref, idx) => (
                            <div key={ref.id} className="corp-referee-card">
                              <strong className="corp-ref-name">{isCvKm ? toKhmerDigits(idx + 1) : idx + 1}. {translateCvField(ref.name, isCvKm)}</strong>
                              <div className="corp-ref-meta">
                                <p><strong>{isCvKm ? "មុខតំណែង ៖" : "Position:"}</strong> {translateCvField(ref.position, isCvKm)}</p>
                                <p><strong>{isCvKm ? "ក្រុមហ៊ុន / ស្ថាប័ន ៖" : "Company / Institution:"}</strong> {translateCvField(ref.organization, isCvKm)}</p>
                                <p><strong>{isCvKm ? "ទំនាក់ទំនង ៖" : "Contact:"}</strong> 📞 {ref.phone} {ref.email ? `| ✉️ ${ref.email}` : ""}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                ) : selectedTemplate === "khmer_std" ? (
                  /* ========================================================
                      TEMPLATE 3: CAMBODIA CORPORATE STANDARD
                      (Header with Official 4x6 Photo Frame + Personal Details Table)
                      ======================================================== */
                  <div className="cv-khmer-corp-layout">
                    {/* Official Header Banner */}
                    <div className="khmer-cv-top-banner">
                      <h1 className="khmer-cv-main-title">
                        {isCvKm ? "ជីវប្រវត្តិសង្ខេប" : "CURRICULUM VITAE"}
                      </h1>
                      {!isCvKm && (
                        <p className="khmer-cv-sub-title">Professional Resume</p>
                      )}
                    </div>

                    {/* Official Header */}
                    <div className="khmer-corp-header">
                      <div className="corp-header-left">
                        <h2 className="corp-name-km">
                          {stripBilingual(basicInfo.fullName, isCvKm) || (isCvKm ? "សុខា វណ្ណៈ" : "Sokha Vannak")}
                        </h2>
                        <p className="corp-target-position">
                          <strong>{isCvKm ? "មុខតំណែងស្នើសុំ ៖" : "Applied Position:"}</strong>{" "}
                          <span className="corp-job-badge">
                            {sanitizeJobTitle(
                              basicInfo.jobTitle,
                              isCvKm,
                              isCvKm ? "អ្នកអភិវឌ្ឍន៍គេហទំព័រ" : "Full-Stack Web Developer"
                            )}
                          </span>
                        </p>

                        <div className="corp-contact-summary">
                          {basicInfo.phone && (
                            <span>📞 {basicInfo.phone}</span>
                          )}
                          {basicInfo.email && (
                            <span>✉️ {basicInfo.email}</span>
                          )}
                          {basicInfo.location && (
                            <span>📍 {translateCvField(basicInfo.location, isCvKm)}</span>
                          )}
                        </div>
                      </div>

                      {/* Official 4x6 Photo Frame */}
                      {basicInfo.showPhoto && (
                        <div className="corp-header-photo-box">
                          {basicInfo.photoUrl ? (
                            <img
                              src={basicInfo.photoUrl}
                              alt={stripBilingual(basicInfo.fullName, isCvKm)}
                              className="corp-passport-photo"
                            />
                          ) : (
                            <div className="corp-photo-placeholder">
                              <span>{isCvKm ? "រូបថត 4x6" : "Photo 4x6"}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Section 1: ព័ត៌មានផ្ទាល់ខ្លួន / PERSONAL DETAILS */}
                    <section className="cv-doc-section">
                      <h2 className="corp-section-title">
                        {isCvKm ? "១. ព័ត៌មានផ្ទាល់ខ្លួន" : "I. PERSONAL DETAILS"}
                      </h2>
                      <div className="corp-personal-grid">
                        <div className="corp-info-card">
                          <div className="corp-info-item">
                            <span className="corp-item-label">{isCvKm ? "ឈ្មោះពេញ ៖" : "Full Name:"}</span>
                            <span className="corp-item-value">
                              <strong>{stripBilingual(basicInfo.fullName, isCvKm) || (isCvKm ? "សុខា វណ្ណៈ" : "Sokha Vannak")}</strong>
                            </span>
                          </div>
                          <div className="corp-info-item">
                            <span className="corp-item-label">{isCvKm ? "ភេទ ៖" : "Gender:"}</span>
                            <span className="corp-item-value">
                              {translateCvField(basicInfo.gender, isCvKm) || (isCvKm ? "ប្រុស" : "Male")}
                            </span>
                          </div>
                          <div className="corp-info-item">
                            <span className="corp-item-label">{isCvKm ? "ថ្ងៃខែឆ្នាំកំណើត ៖" : "Date of Birth:"}</span>
                            <span className="corp-item-value">
                              {translateCvField(basicInfo.dateOfBirth, isCvKm) || (isCvKm ? "១៥ ឧសភា ២០០២" : "15 May 2002")}
                            </span>
                          </div>
                          <div className="corp-info-item">
                            <span className="corp-item-label">{isCvKm ? "ទីកន្លែងកំណើត ៖" : "Place of Birth:"}</span>
                            <span className="corp-item-value">
                              {translateCvField(basicInfo.placeOfBirth, isCvKm) || (isCvKm ? "ខេត្តកណ្តាល កម្ពុជា" : "Kandal Province, Cambodia")}
                            </span>
                          </div>
                          <div className="corp-info-item">
                            <span className="corp-item-label">{isCvKm ? "សញ្ជាតិ ៖" : "Nationality:"}</span>
                            <span className="corp-item-value">
                              {translateCvField(basicInfo.nationality, isCvKm) || (isCvKm ? "ខ្មែរ" : "Cambodian")}
                            </span>
                          </div>
                          <div className="corp-info-item">
                            <span className="corp-item-label">{isCvKm ? "ស្ថានភាពគ្រួសារ ៖" : "Marital Status:"}</span>
                            <span className="corp-item-value">
                              {translateCvField(basicInfo.maritalStatus, isCvKm) || (isCvKm ? "នៅលីវ" : "Single")}
                            </span>
                          </div>
                          <div className="corp-info-item full-width">
                            <span className="corp-item-label">{isCvKm ? "អាសយដ្ឋានបច្ចុប្បន្ន ៖" : "Current Address:"}</span>
                            <span className="corp-item-value">
                              {translateCvField(basicInfo.location, isCvKm) || (isCvKm ? "រាជធានីភ្នំពេញ កម្ពុជា" : "Phnom Penh, Cambodia")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Section 2: គោលបំណងការងារ / CAREER OBJECTIVE */}
                    {basicInfo.bio && (
                      <section className="cv-doc-section">
                        <h2 className="corp-section-title">
                          {isCvKm ? "២. គោលបំណងការងារ" : "II. CAREER OBJECTIVE"}
                        </h2>
                        <p className="cv-body-text">{resolveCvBio(basicInfo.bio, isCvKm)}</p>
                      </section>
                    )}

                    {/* Section 3: ប្រវត្តិការអប់រំ / EDUCATION BACKGROUND */}
                    {previewEducation.length > 0 && (
                      <section className="cv-doc-section">
                        <h2 className="corp-section-title">
                          {isCvKm ? "៣. កម្រិតវប្បធម៌ និងការអប់រំ" : "III. EDUCATION BACKGROUND"}
                        </h2>
                        <div className="cv-timeline">
                          {previewEducation.map((edu) => (
                            <div key={edu.id} className="cv-entry corp-entry">
                              <div className="entry-header">
                                <strong className="entry-title">
                                  {edu.institution}
                                </strong>
                                <span className="entry-dates">
                                  {formatCvDateRange(edu.startDate, edu.endDate, false, isCvKm, true)}
                                </span>
                              </div>
                              <p className="entry-sub">
                                {edu.degree}{" "}
                                {edu.fieldOfStudy ? (isCvKm ? `• ជំនាញ ${edu.fieldOfStudy}` : `• in ${edu.fieldOfStudy}`) : ""}
                              </p>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Section 4: បទពិសោធន៍ការងារ / WORK EXPERIENCE */}
                    {previewExperiences.length > 0 && (
                      <section className="cv-doc-section">
                        <h2 className="corp-section-title">
                          {isCvKm ? "៤. បទពិសោធន៍ការងារ" : "IV. WORK EXPERIENCE"}
                        </h2>
                        <div className="cv-timeline">
                          {previewExperiences.map((exp) => (
                            <div key={exp.id} className="cv-entry corp-entry">
                              <div className="entry-header">
                                <strong className="entry-title">
                                  {exp.title} — {exp.company}
                                </strong>
                                <span className="entry-dates">
                                  {formatCvDateRange(exp.startDate, exp.endDate, exp.isCurrent, isCvKm)}
                                </span>
                              </div>
                              {exp.employmentType && (
                                <p className="entry-sub">
                                  {isCvKm ? "ប្រភេទការងារ ៖" : "Employment Type:"} {exp.employmentType}
                                </p>
                              )}
                              {exp.description && (
                                <p className="entry-desc">{exp.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Section 5: ជំនាញបច្ចេកទេស និងកុំព្យូទ័រ / TECHNICAL & COMPUTER SKILLS */}
                    {skillsList.length > 0 && (
                      <section className="cv-doc-section">
                        <h2 className="corp-section-title">
                          {isCvKm ? "៥. ជំនាញបច្ចេកទេស និងកុំព្យូទ័រ" : "V. TECHNICAL & COMPUTER SKILLS"}
                        </h2>
                        <div className="cv-skills-grid">
                          {skillsList.map((skill) => (
                            <span key={skill} className="cv-doc-skill-pill">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Section 6: ភាសាទំនាក់ទំនង / LANGUAGES */}
                    {languagesList.length > 0 && (
                      <section className="cv-doc-section">
                        <h2 className="corp-section-title">
                          {isCvKm ? "៦. ភាសាទំនាក់ទំនង" : "VI. LANGUAGES SPOKEN"}
                        </h2>
                        <div className="corp-lang-strip">
                          {languagesList.map((l) => (
                            <span key={l.id} className="corp-lang-pill">
                              <strong>{translateCvField(l.language, isCvKm)} {isCvKm ? "៖" : ":"}</strong> {translateCvField(l.level, isCvKm)}
                            </span>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Section 7: វគ្គបណ្តុះបណ្តាល និងវិញ្ញាបនបត្រ / TRAININGS & CERTIFICATIONS */}
                    {certificatesList.length > 0 && (
                      <section className="cv-doc-section">
                        <h2 className="corp-section-title">
                          {isCvKm ? "៧. វគ្គបណ្តុះបណ្តាល និងវិញ្ញាបនបត្រ" : "VII. TRAININGS & CERTIFICATIONS"}
                        </h2>
                        <div className="cv-timeline">
                          {certificatesList.map((c) => (
                            <div key={c.id} className="cv-entry corp-entry">
                              <div className="entry-header">
                                <strong className="entry-title">{c.title}</strong>
                                <span className="entry-dates">{isCvKm ? toKhmerDigits(c.year) : c.year}</span>
                              </div>
                              <p className="entry-sub">{c.issuer}</p>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Section 8: បុគ្គលធានា (២ នាក់ជាក់លាក់) / REFERENCES (2 Referees) */}
                    {referencesList.length > 0 && (
                      <section className="cv-doc-section">
                        <h2 className="corp-section-title">
                          {isCvKm ? "៨. បុគ្គលធានា" : "VIII. REFERENCES"}
                        </h2>
                        <div className="corp-referees-grid">
                          {referencesList.map((ref, idx) => (
                            <div key={ref.id} className="corp-referee-card">
                              <strong className="corp-ref-name">
                                {isCvKm ? toKhmerDigits(idx + 1) : idx + 1}. {translateCvField(ref.name, isCvKm)}
                              </strong>
                              <div className="corp-ref-meta">
                                <p><strong>{isCvKm ? "មុខតំណែង ៖" : "Position:"}</strong> {translateCvField(ref.position, isCvKm)}</p>
                                <p><strong>{isCvKm ? "ស្ថាប័ន / ក្រុមហ៊ុន ៖" : "Company / Institution:"}</strong> {translateCvField(ref.organization, isCvKm)}</p>
                                <p><strong>{isCvKm ? "ទូរស័ព្ទ ៖" : "Phone:"}</strong> {ref.phone}</p>
                                {ref.email && <p><strong>{isCvKm ? "អ៊ីមែល ៖" : "Email:"}</strong> {ref.email}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                ) : (
                  /* ========================================================
                      TEMPLATE 4: MODERN TECH ATS (Single Column Scannable)
                      ======================================================== */
                  <>
                    <div className="cv-doc-header">
                      <div className="cv-header-main">
                        <h1 className="cv-applicant-name">
                          {stripBilingual(basicInfo.fullName, isCvKm) ||
                            (isCvKm ? "ឈ្មោះរបស់អ្នក" : "Your Full Name")}
                        </h1>
                        <p className="cv-applicant-title">
                          {sanitizeJobTitle(
                            basicInfo.jobTitle,
                            isCvKm,
                            isCvKm ? "អ្នកអភិវឌ្ឍន៍គេហទំព័រ" : "Full-Stack Web Developer"
                          )}
                        </p>

                        <div className="cv-contact-strip">
                          {basicInfo.email && (
                            <span className="contact-item">
                              <FiMail /> {basicInfo.email}
                            </span>
                          )}
                          {basicInfo.phone && (
                            <span className="contact-item">
                              📞 {basicInfo.phone}
                            </span>
                          )}
                          {basicInfo.location && (
                            <span className="contact-item">
                              <FiMapPin /> {translateCvField(basicInfo.location, isCvKm)}
                            </span>
                          )}
                          {basicInfo.portfolioUrl && (
                            <span className="contact-item">
                              <FiGlobe />{" "}
                              {basicInfo.portfolioUrl.replace(
                                /^https?:\/\/(www\.)?/,
                                ""
                              )}
                            </span>
                          )}
                          {basicInfo.githubUrl && (
                            <span className="contact-item">
                              <FiGithub />{" "}
                              {basicInfo.githubUrl.replace(
                                /^https?:\/\/(www\.)?/,
                                ""
                              )}
                            </span>
                          )}
                          {basicInfo.linkedinUrl && (
                            <span className="contact-item">
                              <FiLinkedin />{" "}
                              {basicInfo.linkedinUrl.replace(
                                /^https?:\/\/(www\.)?/,
                                ""
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {basicInfo.bio && (
                      <section className="cv-doc-section">
                        <h2 className="section-heading">
                          {isCvKm
                            ? "សេចក្តីសង្ខេបអំពីខ្លួនឯង"
                            : "PROFESSIONAL SUMMARY"}
                        </h2>
                        <p className="cv-body-text">{resolveCvBio(basicInfo.bio, isCvKm)}</p>
                      </section>
                    )}

                    {skillsList.length > 0 && (
                      <section className="cv-doc-section">
                        <h2 className="section-heading">
                          {isCvKm
                            ? "ជំនាញបច្ចេកទេស និងកុំព្យូទ័រ"
                            : "TECHNICAL SKILLS & COMPETENCIES"}
                        </h2>
                        <div className="cv-skills-grid">
                          {skillsList.map((skill) => (
                            <span key={skill} className="cv-doc-skill-pill">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </section>
                    )}

                    {previewExperiences.length > 0 && (
                      <section className="cv-doc-section">
                        <h2 className="section-heading">
                          {isCvKm
                            ? "បទពិសោធន៍ការងារ"
                            : "WORK EXPERIENCE"}
                        </h2>
                        <div className="cv-timeline">
                          {previewExperiences.map((exp) => (
                            <div key={exp.id} className="cv-entry">
                              <div className="entry-header">
                                <strong className="entry-title">
                                  {exp.title}
                                </strong>
                                <span className="entry-dates">
                                  {formatCvDateRange(exp.startDate, exp.endDate, exp.isCurrent, isCvKm)}
                                </span>
                              </div>
                              <p className="entry-sub">
                                {exp.company}{" "}
                                {exp.employmentType
                                  ? `• ${exp.employmentType}`
                                  : ""}
                              </p>
                              {exp.description && (
                                <p className="entry-desc">{exp.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {previewProjects.length > 0 && (
                      <section className="cv-doc-section">
                        <h2 className="section-heading">
                          {isCvKm
                            ? "គម្រោងស្នាដៃ"
                            : "KEY PORTFOLIO PROJECTS"}
                        </h2>
                        <div className="cv-timeline">
                          {previewProjects.map((proj) => (
                            <div key={proj.id} className="cv-entry">
                              <div className="entry-header">
                                <strong className="entry-title">
                                  {proj.title}
                                </strong>
                                {proj.projectUrl && (
                                  <span className="entry-link">
                                    {proj.projectUrl.replace(
                                      /^https?:\/\/(www\.)?/,
                                      ""
                                    )}
                                  </span>
                                )}
                              </div>
                              {proj.description && (
                                <p className="entry-desc">{proj.description}</p>
                              )}
                              {Array.isArray(proj.technologies) &&
                                proj.technologies.length > 0 && (
                                  <p className="entry-tech-line">
                                    <strong>{isCvKm ? "បច្ចេកវិទ្យា ៖" : "Technologies:"}</strong>{" "}
                                    {proj.technologies.join(", ")}
                                  </p>
                                )}
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {previewEducation.length > 0 && (
                      <section className="cv-doc-section">
                        <h2 className="section-heading">
                          {isCvKm ? "ប្រវត្តិការអប់រំ" : "EDUCATION"}
                        </h2>
                        <div className="cv-timeline">
                          {previewEducation.map((edu) => (
                            <div key={edu.id} className="cv-entry">
                              <div className="entry-header">
                                <strong className="entry-title">
                                  {edu.institution}
                                </strong>
                                <span className="entry-dates">
                                  {formatCvDateRange(edu.startDate, edu.endDate, false, isCvKm, true)}
                                </span>
                              </div>
                              <p className="entry-sub">
                                {edu.degree}{" "}
                                {edu.fieldOfStudy
                                  ? (isCvKm ? `- ជំនាញ ${edu.fieldOfStudy}` : `- in ${edu.fieldOfStudy}`)
                                  : ""}
                              </p>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Languages & Certifications Strip */}
                    {(languagesList.length > 0 ||
                       certificatesList.length > 0) && (
                      <section className="cv-doc-section">
                        <h2 className="section-heading">
                          {isCvKm
                            ? "ភាសា និងវិញ្ញាបនបត្រ"
                            : "LANGUAGES & CREDENTIALS"}
                        </h2>
                        <div className="corp-lang-strip">
                          {languagesList.map((l) => (
                            <span key={l.id} className="corp-lang-pill">
                              <strong>{translateCvField(l.language, isCvKm)}:</strong> {translateCvField(l.level, isCvKm)}
                            </span>
                          ))}
                          {certificatesList.map((c) => (
                            <span key={c.id} className="corp-lang-pill">
                              <strong>{c.title}</strong> ({c.issuer})
                            </span>
                          ))}
                        </div>
                      </section>
                    )}

                    {referencesList.length > 0 ? (
                      <section className="cv-doc-section">
                        <h2 className="section-heading">
                          {isCvKm ? "បុគ្គលធានា" : "REFERENCES"}
                        </h2>
                        <div className="corp-referees-grid">
                          {referencesList.map((ref, idx) => (
                            <div key={ref.id} className="corp-referee-card">
                              <strong className="corp-ref-name">
                                {isCvKm ? toKhmerDigits(idx + 1) : idx + 1}. {translateCvField(ref.name, isCvKm)}
                              </strong>
                              <div className="corp-ref-meta">
                                <p><strong>{isCvKm ? "មុខតំណែង ៖" : "Position:"}</strong> {translateCvField(ref.position, isCvKm)}</p>
                                <p><strong>{isCvKm ? "ស្ថាប័ន / ក្រុមហ៊ុន ៖" : "Company / Org:"}</strong> {translateCvField(ref.organization, isCvKm)}</p>
                                <p><strong>{isCvKm ? "ទូរស័ព្ទ ៖" : "Phone:"}</strong> {ref.phone}</p>
                                {ref.email && <p><strong>{isCvKm ? "អ៊ីមែល ៖" : "Email:"}</strong> {ref.email}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    ) : referencesText ? (
                      <section className="cv-doc-section">
                        <h2 className="section-heading">
                          {isCvKm ? "បុគ្គលធានា" : "REFERENCES"}
                        </h2>
                        <p className="cv-body-text">{referencesText}</p>
                      </section>
                    ) : null}
                  </>
                )}

                {/* Footer Verification Seal */}
                <div className="cv-doc-footer">
                  <span className="platform-verified-seal">
                    {isCvKm
                      ? "✓ ជីវប្រវត្តិសង្ខេបឌីជីថលផ្លូវការ • បង្កើតដោយឥតគិតថ្លៃតាមរយៈ Smart Community Platform • ស្តង់ដារកម្ពុជា"
                      : "✓ Official Verified Resume • Generated Free via Smart Community Platform • ATS Standard"}
                  </span>
                </div>
              </article>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
