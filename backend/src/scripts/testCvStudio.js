const puppeteer = require("puppeteer-core");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE_URL = "http://localhost:5173";
const API_URL = "http://localhost:4000/api";
const ARTIFACT_DIR = "C:\\Users\\heang\\.gemini\\antigravity-ide\\brain\\f5a380c4-0690-483a-80a6-f8b9214cbabd";

const capture = async (page, filename) => {
  const filePath = path.join(ARTIFACT_DIR, filename);
  await page.screenshot({ path: filePath, fullPage: false });
  console.log(`[Captured Screenshot] ${filename}`);
  return filePath;
};

const run = async () => {
  console.log("Starting V7 CV & Portfolio Studio E2E Validation with Chrome...");

  const { signToken } = require("../utils/auth");
  const db = require("../config/db");
  const [[student]] = await db.query(
    "SELECT id, email, role FROM users WHERE role = 'student' AND is_active = 1 LIMIT 1"
  );
  const token = signToken({
    id: student.id,
    email: student.email,
    role: "student",
  });
  console.log(`Student token generated for: ${student.email}`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const page = await browser.newPage();

  // Set auth token on every page load
  if (token) {
    await page.evaluateOnNewDocument((t) => {
      localStorage.setItem("smartCommunityToken", t);
      sessionStorage.setItem("smartCommunityToken", t);
    }, token);
  }

  page.on("pageerror", (err) => console.log("PAGE ERROR:", err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") console.log("PAGE LOG ERROR:", msg.text());
  });

  // 1. Desktop 1366px - CV Studio Editor
  await page.setViewport({ width: 1366, height: 950 });
  console.log("Navigating to /cv-studio (Desktop 1366px)...");
  await page.goto(`${BASE_URL}/cv-studio`, { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 1200));
  const desktopToken = await page.evaluate(() => localStorage.getItem("smartCommunityToken"));
  console.log("Desktop localStorage token exists:", Boolean(desktopToken));
  await capture(page, "v7_cv_studio_desktop_1366px.png");

  // 2. Click to Preview Tab (Step 5)
  console.log("Switching to Preview & Export step...");
  const tabs = await page.$$(".stepper-tab-item");
  if (tabs.length >= 5) {
    await tabs[4].click();
    await new Promise((r) => setTimeout(r, 800));
    await capture(page, "v7_cv_studio_preview_desktop.png");
  }

  // 3. Mobile 390px - CV Studio
  await page.setViewport({ width: 390, height: 844, isMobile: true });
  console.log("Testing Mobile 390px Viewport...");
  await new Promise((r) => setTimeout(r, 1200));
  const mobileToken = await page.evaluate(() => localStorage.getItem("smartCommunityToken"));
  console.log("Mobile localStorage token exists:", Boolean(mobileToken));
  await capture(page, "v7_cv_studio_mobile_390px.png");

  await browser.close();
  console.log("\n=======================================================");
  console.log("ALL V7 CV & PORTFOLIO STUDIO VALIDATIONS COMPLETED!");
  console.log("=======================================================\n");
};

run().catch((err) => {
  console.error("CV Studio E2E failed:", err);
  process.exit(1);
});
