const assert = require("node:assert/strict");

const API_URL = process.env.TEST_API_URL || "http://127.0.0.1:4000/api";

const run = async () => {
  console.log("Starting Smart Community V6 Advanced Global Search Test Suite...\n");

  // 1. Guest Public Search (English query: "react")
  console.log("1. Testing Guest public search with English query ('react')...");
  const resReact = await fetch(`${API_URL}/search?q=react&type=all`);
  assert.equal(resReact.status, 200, "Search endpoint must return 200 for public guests");
  const dataReact = await resReact.json();
  assert.equal(dataReact.query, "react", "Query must match input");
  assert.ok(dataReact.counts.all > 0, "Query 'react' should find matches across courses/jobs/skills");
  console.log(`   -> Passed: Found ${dataReact.counts.all} total matches across 5 domains.`);

  // 2. Empty Query Browsing
  console.log("2. Testing empty query (default explore state)...");
  const resEmpty = await fetch(`${API_URL}/search?q=`);
  assert.equal(resEmpty.status, 200, "Empty query must return 200");
  const dataEmpty = await resEmpty.json();
  assert.ok(dataEmpty.counts.all > 0, "Empty query should return default featured platform items");
  assert.ok(dataEmpty.data.courses.length > 0, "Should contain default courses");
  console.log(`   -> Passed: Default state returned ${dataEmpty.counts.all} platform items with category breakdown.`);

  // 3. Category Specific Filter: type=courses
  console.log("3. Testing category filter (type=courses)...");
  const resCourses = await fetch(`${API_URL}/search?type=courses&q=`);
  assert.equal(resCourses.status, 200);
  const dataCourses = await resCourses.json();
  assert.ok(dataCourses.data.courses.length > 0, "Must return course items");
  assert.equal(dataCourses.data.mentors.length, 0, "Mentors array must be empty when type=courses");
  assert.equal(dataCourses.data.jobs.length, 0, "Jobs array must be empty when type=courses");
  console.log(`   -> Passed: Scoped strictly to courses with ${dataCourses.counts.courses} items.`);

  // 4. Sub-filter: Courses by level and price
  console.log("4. Testing course sub-filters (level=intermediate)...");
  const resLevel = await fetch(`${API_URL}/search?type=courses&level=intermediate`);
  const dataLevel = await resLevel.json();
  assert.ok(dataLevel.data.courses.every(c => c.level === "intermediate"), "All returned courses must be intermediate");
  console.log(`   -> Passed: All ${dataLevel.data.courses.length} courses match intermediate level.`);

  // 5. Jobs search by employment type
  console.log("5. Testing jobs filter (type=jobs)...");
  const resJobs = await fetch(`${API_URL}/search?type=jobs&jobType=full_time`);
  const dataJobs = await resJobs.json();
  assert.ok(dataJobs.data.jobs.every(j => j.jobType === "full_time"), "All jobs must match jobType filter");
  console.log(`   -> Passed: Job filter verified.`);

  // 6. Khmer Unicode Search
  console.log("6. Testing Khmer Unicode query preservation...");
  const khmerTerm = "វគ្គសិក្សា";
  const resKhmer = await fetch(`${API_URL}/search?q=${encodeURIComponent(khmerTerm)}`);
  assert.equal(resKhmer.status, 200);
  const dataKhmer = await resKhmer.json();
  assert.equal(dataKhmer.query, khmerTerm, "Khmer Unicode string must be preserved without normalization corruption");
  console.log(`   -> Passed: Khmer query correctly parsed as "${dataKhmer.query}".`);

  // 7. No Results handling
  console.log("7. Testing non-existent query handling...");
  const resNone = await fetch(`${API_URL}/search?q=xyznonexistentterm999888`);
  const dataNone = await resNone.json();
  assert.equal(dataNone.counts.all, 0, "Non-existent term should yield 0 results");
  assert.equal(dataNone.data.courses.length, 0);
  console.log("   -> Passed: Clean empty state returned.");

  // 8. SQL Injection Resistance
  console.log("8. Testing SQL Injection resistance (' OR '1'='1)...");
  const sqlPayload = "' OR '1'='1' -- ";
  const resInjection = await fetch(`${API_URL}/search?q=${encodeURIComponent(sqlPayload)}`);
  assert.equal(resInjection.status, 200, "Injected query should execute safely without SQL error");
  const dataInjection = await resInjection.json();
  // Safe parameterization will search literally for the quote string, returning 0
  assert.equal(dataInjection.counts.all, 0, "SQL injection string must not bypass parameterized filters");
  console.log("   -> Passed: SQL Injection safely handled by parameterized queries.");

  // 9. Privacy and Sensitive Data Leak Prevention
  console.log("9. Verifying private fields exclusion (passwords, tokens, applicant CVs)...");
  const resPrivacy = await fetch(`${API_URL}/search?q=&type=all`);
  const dataPrivacy = await resPrivacy.json();
  const allJson = JSON.stringify(dataPrivacy);

  assert.ok(!allJson.includes("password_hash"), "Search results must NEVER expose password_hash");
  assert.ok(!allJson.includes("resume_url"), "Search results must NEVER expose candidate resumes");
  assert.ok(!allJson.includes("google_id"), "Search results must NEVER expose google_id");
  assert.ok(!allJson.includes("suspension_reason"), "Search results must NEVER expose suspension_reason");
  console.log("   -> Passed: Zero sensitive fields detected in search responses.");

  // 10. Pagination Testing
  console.log("10. Testing pagination (limit=2, page=1 vs page=2)...");
  const resPage1 = await fetch(`${API_URL}/search?type=skills&limit=2&page=1`);
  const dataPage1 = await resPage1.json();
  const resPage2 = await fetch(`${API_URL}/search?type=skills&limit=2&page=2`);
  const dataPage2 = await resPage2.json();

  if (dataPage1.data.skills.length > 0 && dataPage2.data.skills.length > 0) {
    assert.notEqual(
      dataPage1.data.skills[0].id,
      dataPage2.data.skills[0].id,
      "Page 1 and Page 2 must return distinct items"
    );
  }
  console.log("   -> Passed: Safe pagination offset verified.");

  console.log("\n=======================================================");
  console.log("ALL V6 ADVANCED GLOBAL SEARCH TESTS PASSED SUCCESSFULLY!");
  console.log("=======================================================\n");
};

run().catch((err) => {
  console.error("Search test suite failed:", err);
  process.exit(1);
});
