const assert = require("node:assert/strict");
const path = require("node:path");
const { test } = require("node:test");

const backend = path.resolve(__dirname, "../backend");
const requireBackend = (id) => require(require.resolve(id, { paths: [backend] }));

// Replace the Anthropic SDK with a scripted stand-in so the agent loop can be
// tested without network access or an API key.
const scripted = [];
const requests = [];
class FakeAPIError extends Error {}
class FakeAnthropic {
  constructor() {
    this.beta = {
      messages: {
        stream: (params) => {
          requests.push(JSON.parse(JSON.stringify(params)));
          const next = scripted.shift();
          const listeners = [];
          return {
            on: (event, fn) => { if (event === "text") listeners.push(fn); },
            finalMessage: async () => {
              for (const block of next.content) if (block.type === "text") listeners.forEach((fn) => fn(block.text));
              return next;
            },
          };
        },
      },
    };
  }
}
FakeAnthropic.APIError = FakeAPIError;
FakeAnthropic.RateLimitError = class extends FakeAPIError {};
FakeAnthropic.AuthenticationError = class extends FakeAPIError {};
const sdkPath = require.resolve("@anthropic-ai/sdk", { paths: [backend] });
require.cache[sdkPath] = { id: sdkPath, filename: sdkPath, loaded: true, exports: FakeAnthropic };

// Stand-in database for the one tool this test exercises.
const dbPath = require.resolve("./src/config/db", { paths: [backend] });
require.cache[dbPath] = {
  id: dbPath, filename: dbPath, loaded: true,
  exports: { query: async () => [[{ slug: "react-modern-web", title: "React for Modern Web", level: "beginner", category: "Frontend", duration_text: "6 hours", lessons: 4 }]] },
};

process.env.ANTHROPIC_API_KEY = "test-key";
const { runAssistantTurn, normaliseHistory } = requireBackend("./src/services/assistant/agent");

test("history is rebuilt as alternating turns that start with the user", () => {
  const turns = normaliseHistory(
    [
      { role: "assistant", text: "dropped: history may not start with the assistant" },
      { role: "user", text: "hi" },
      { role: "user", text: "again" },
      { role: "system", text: "ignored role" },
      { role: "assistant", text: "hello" },
      { role: "user", text: "unanswered, replaced by the new message" },
    ],
    "new question",
  );
  assert.deepEqual(turns, [
    { role: "user", content: "hi\n\nagain" },
    { role: "assistant", content: "hello" },
    { role: "user", content: "new question" },
  ]);
});

test("a tool call is executed, its result sent back, and the answer streamed", async () => {
  scripted.push(
    { stop_reason: "tool_use", content: [{ type: "tool_use", id: "t1", name: "search_courses", input: { query: "react", level: "any" } }] },
    { stop_reason: "end_turn", content: [{ type: "text", text: "Try [React for Modern Web](/courses/react-modern-web)." }] },
  );
  const events = [];
  await runAssistantTurn({ message: "React course?", history: [], user: null, page: "/courses", language: "en", emit: (e) => events.push(e) });

  assert.deepEqual(events.map((e) => e.type), ["tool", "text", "done"]);
  assert.equal(events[0].name, "search_courses");
  const second = requests[1];
  const toolResult = second.messages.at(-1).content[0];
  assert.equal(toolResult.type, "tool_result");
  assert.equal(toolResult.tool_use_id, "t1");
  assert.match(toolResult.content, /react-modern-web/);
  // Stable, cacheable prefix; per-request context only in the user turn.
  assert.equal(requests[0].system, requests[1].system);
  assert.doesNotMatch(requests[0].system, /not signed in|\/courses,/);
  assert.match(requests[0].messages[0].content[0].text, /not signed in.*viewing \/courses/);
  assert.equal(requests[0].output_config.effort, "low");
});

test("a refusal stops the turn without running tools", async () => {
  requests.length = 0;
  scripted.push({ stop_reason: "refusal", content: [{ type: "tool_use", id: "t2", name: "search_courses", input: {} }] });
  const events = [];
  await runAssistantTurn({ message: "x", history: [], user: null, emit: (e) => events.push(e) });
  assert.deepEqual(events.map((e) => e.type), ["notice", "done"]);
  assert.equal(requests.length, 1);
});
