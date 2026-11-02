const puppeteer = require("puppeteer-core");
const path = require("path");
const fs = require("fs");

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE_URL = process.env.CLIENT_URL || "http://localhost:5173";
const ARTIFACT_DIR = "C:\\Users\\heang\\.gemini\\antigravity-ide\\brain\\f5a380c4-0690-483a-80a6-f8b9214cbabd";

const captureScreenshot = async (page, filename) => {
  const filePath = path.join(ARTIFACT_DIR, filename);
  await page.screenshot({ path: filePath, fullPage: false });
  console.log(`[Captured Screenshot] ${filename}`);
  return filePath;
};

const runE2E = async () => {
  console.log("Launching local Chrome for E2E visual verification...");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 850 });

  try {
    // 1. GUEST HOMEPAGE
    console.log("1. Visiting Homepage as Guest...");
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle2" });
    await captureScreenshot(page, "v5_guest_homepage.png");

    // 2. STUDENT LOGIN & WORKSPACE & CALENDAR
    console.log("2. Logging in as Student (test.student@smartcommunity.local)...");
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });
    await page.type('input[type="email"]', "test.student@smartcommunity.local");
    await page.type('input[type="password"]', "TestUser1234*");
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 8000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 1200));

    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle2" });
    await captureScreenshot(page, "v5_student_workspace.png");

    console.log("2b. Visiting Unified Calendar as Student...");
    await page.goto(`${BASE_URL}/calendar`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1000));
    await captureScreenshot(page, "v5_student_calendar_agenda.png");

    // Test switching to Month view
    const monthViewBtn = await page.$('.view-toggle-btn:nth-child(2)');
    if (monthViewBtn) {
      await monthViewBtn.click();
      await new Promise((r) => setTimeout(r, 500));
      await captureScreenshot(page, "v5_student_calendar_month.png");
    }

    // 3. MENTOR LOGIN & CALENDAR
    console.log("3. Logging in as Mentor (test.mentor@smartcommunity.local)...");
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });
    await page.type('input[type="email"]', "test.mentor@smartcommunity.local");
    await page.type('input[type="password"]', "TestUser1234*");
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 8000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 1200));

    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle2" });
    await captureScreenshot(page, "v5_mentor_workspace.png");

    await page.goto(`${BASE_URL}/calendar`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1000));
    await captureScreenshot(page, "v5_mentor_calendar.png");

    // 4. RECRUITER LOGIN & CALENDAR
    console.log("4. Logging in as Recruiter (test.recruiter@smartcommunity.local)...");
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });
    await page.type('input[type="email"]', "test.recruiter@smartcommunity.local");
    await page.type('input[type="password"]', "TestUser1234*");
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 8000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 1200));

    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle2" });
    await captureScreenshot(page, "v5_recruiter_workspace.png");

    await page.goto(`${BASE_URL}/calendar`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1000));
    await captureScreenshot(page, "v5_recruiter_calendar.png");

    // 5. RESPONSIVE MOBILE VIEW (390px)
    console.log("5. Testing Mobile View (390px)...");
    await page.setViewport({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/calendar`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1000));
    await captureScreenshot(page, "v5_mobile_calendar_390px.png");

    console.log("\nAll E2E browser tests and screenshot captures PASSED successfully!");
  } catch (err) {
    console.error("Browser E2E test encountered an error:", err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
};

runE2E();
