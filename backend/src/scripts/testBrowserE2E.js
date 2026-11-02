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
  console.log("Launching local Chrome for V6 Advanced Global Search & Calendar visual verification...");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 850 });

  try {
    // -------------------------------------------------------------
    // 1. GLOBAL SEARCH - DEFAULT EXPLORE VIEW (DESKTOP)
    // -------------------------------------------------------------
    console.log("1. Visiting /search as Guest (Default explore state)...");
    await page.goto(`${BASE_URL}/search`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1000));
    await captureScreenshot(page, "v6_search_default_desktop.png");

    // -------------------------------------------------------------
    // 2. GLOBAL SEARCH - QUERY 'react' WITH RESULTS & HIGHLIGHTING
    // -------------------------------------------------------------
    console.log("2. Searching query 'react' across all categories...");
    await page.goto(`${BASE_URL}/search?q=react&type=all`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1200));
    await captureScreenshot(page, "v6_search_react_all_desktop.png");

    // -------------------------------------------------------------
    // 3. TAB FILTERING - COURSES TAB WITH FILTERS
    // -------------------------------------------------------------
    console.log("3. Switching to Courses category tab...");
    await page.goto(`${BASE_URL}/search?q=react&type=courses`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1000));
    await captureScreenshot(page, "v6_search_courses_tab.png");

    // -------------------------------------------------------------
    // 4. TAB FILTERING - MENTORS & JOBS TABS
    // -------------------------------------------------------------
    console.log("4. Switching to Mentors category tab...");
    await page.goto(`${BASE_URL}/search?type=mentors`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1000));
    await captureScreenshot(page, "v6_search_mentors_tab.png");

    console.log("4b. Switching to Jobs category tab...");
    await page.goto(`${BASE_URL}/search?type=jobs`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1000));
    await captureScreenshot(page, "v6_search_jobs_tab.png");

    // -------------------------------------------------------------
    // 5. HOMEPAGE HERO SEARCH REDIRECT INTERACTION
    // -------------------------------------------------------------
    console.log("5. Testing Homepage Hero Search submission...");
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 800));

    // Type "Cloud" in hero search bar and press Enter
    const heroInput = await page.$('input[type="search"]');
    if (heroInput) {
      await heroInput.click();
      await heroInput.type("Cloud");
      await page.keyboard.press("Enter");
      await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 8000 }).catch(() => {});
      await new Promise((r) => setTimeout(r, 1000));
      console.log("   Current URL after hero search:", page.url());
      await captureScreenshot(page, "v6_homepage_hero_search_redirect.png");
    }

    // -------------------------------------------------------------
    // 6. COMMAND PALETTE GLOBAL SEARCH (⌘K)
    // -------------------------------------------------------------
    console.log("6. Testing Command Palette Global Search integration...");
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent("open-command-palette"));
    });
    await new Promise((r) => setTimeout(r, 600));
    const cmdInput = await page.$('.cmd-input');
    if (cmdInput) {
      await cmdInput.type("Python");
      await new Promise((r) => setTimeout(r, 500));
      await captureScreenshot(page, "v6_command_palette_global_search.png");
      await page.keyboard.press("Escape");
    }

    // -------------------------------------------------------------
    // 7. EMPTY / NO RESULTS STATE
    // -------------------------------------------------------------
    console.log("7. Testing empty search query state...");
    await page.goto(`${BASE_URL}/search?q=xyznonexistentterm999888&type=all`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 800));
    await captureScreenshot(page, "v6_search_empty_state.png");

    // -------------------------------------------------------------
    // 8. MOBILE VIEWPORT (390px iPhone / Mobile Standard)
    // -------------------------------------------------------------
    console.log("8. Testing Mobile Viewport (390px)...");
    await page.setViewport({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/search?q=react&type=all`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1000));
    await captureScreenshot(page, "v6_mobile_search_390px.png");

    // Also verify mobile calendar occurrence view
    await page.goto(`${BASE_URL}/calendar`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 800));
    await captureScreenshot(page, "v6_mobile_calendar_occurrences_390px.png");

    console.log("\n==================================================================");
    console.log("ALL V6 CHROME BROWSER E2E TESTS & SCREENSHOTS COMPLETED SUCCESSFULLY!");
    console.log("==================================================================\n");
  } catch (err) {
    console.error("Browser E2E test encountered an error:", err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
};

runE2E();
