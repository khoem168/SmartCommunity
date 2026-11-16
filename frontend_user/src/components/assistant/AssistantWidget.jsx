import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { IoChatbubbleEllipsesOutline, IoClose, IoRefreshOutline, IoSend, IoSparkles } from "react-icons/io5";
import { API_BASE_URL, getAuthToken } from "../../services/api";
import { useLanguage } from "../../context/LanguageContext";
import "./AssistantWidget.css";

const STORAGE_KEY = "smartCommunityAssistantChat";

const copy = {
  km: {
    open: "បើកជំនួយការ AI",
    close: "បិទ",
    title: "ជំនួយការ Smart Community",
    subtitle: "សួរអំពីវគ្គសិក្សា ការងារ អ្នកណែនាំ ឬរបៀបប្រើវេបសាយ",
    placeholder: "សរសេរសំណួររបស់អ្នក…",
    send: "ផ្ញើ",
    reset: "ចាប់ផ្តើមថ្មី",
    greeting: "សួស្តី! ខ្ញុំអាចជួយស្វែងរកវគ្គសិក្សា ការងារ អ្នកណែនាំ ឬពន្យល់ពីរបៀបប្រើវេបសាយ។ តើអ្នកចង់ដឹងអ្វី?",
    suggestions: ["ខ្ញុំគួររៀនអ្វីដើម្បីក្លាយជា Frontend Developer?", "មានវគ្គ Python សម្រាប់អ្នកចាប់ផ្តើមទេ?", "តើ Skill Exchange ដំណើរការយ៉ាងដូចម្តេច?"],
    tools: { search_courses: "កំពុងស្វែងរកវគ្គសិក្សា…", search_mentors: "កំពុងស្វែងរកអ្នកណែនាំ…", search_internships: "កំពុងស្វែងរកការងារ…", search_forum: "កំពុងស្វែងរកក្នុង Forum…", list_career_paths: "កំពុងមើលផែនទីអាជីព…", get_my_progress: "កំពុងមើលវឌ្ឍនភាពរបស់អ្នក…" },
    thinking: "កំពុងគិត…",
    errors: {
      ASSISTANT_NOT_CONFIGURED: "ជំនួយការមិនទាន់ដំណើរការនៅឡើយទេ។",
      ASSISTANT_KEY_REJECTED: "ជំនួយការមិនទាន់ដំណើរការនៅឡើយទេ។",
      ASSISTANT_NO_ACCESS: "ជំនួយការមិនទាន់ដំណើរការនៅឡើយទេ។",
      DAILY_LIMIT: "អ្នកបានប្រើអស់ចំនួនសំណួរសម្រាប់ថ្ងៃនេះហើយ។ សូមព្យាយាមម្តងទៀតថ្ងៃស្អែក។",
      GUEST_LIMIT: "អ្នកបានប្រើអស់ចំនួនសំណួរសម្រាប់ភ្ញៀវហើយ។ សូមចូលគណនីដើម្បីសួរបន្ថែម។",
      SITE_LIMIT: "ជំនួយការរវល់ខ្លាំងនៅថ្ងៃនេះ។ សូមព្យាយាមម្តងទៀតថ្ងៃស្អែក។",
      UPSTREAM_BUSY: "ជំនួយការរវល់បន្តិច។ សូមព្យាយាមម្តងទៀតក្នុងពេលបន្តិចទៀត។",
      REFUSED: "ខ្ញុំមិនអាចជួយលើសំណួរនេះបានទេ។ សូមសួរអំពីការសិក្សា ឬអាជីព។",
      TOO_MANY_STEPS: "សំណួរនេះស្មុគស្មាញពេក។ សូមសួរឱ្យខ្លី និងច្បាស់ជាងនេះ។",
      default: "មានបញ្ហាបន្តិច។ សូមព្យាយាមម្តងទៀត។",
    },
    note: "AI អាចមានកំហុស។ សូមពិនិត្យព័ត៌មានសំខាន់ៗ។",
  },
  en: {
    open: "Open AI assistant",
    close: "Close",
    title: "Smart Community Assistant",
    subtitle: "Ask about courses, jobs, mentors or how to use the site",
    placeholder: "Type your question…",
    send: "Send",
    reset: "Start over",
    greeting: "Hi! I can find courses, jobs and mentors for you, or explain how the site works. What would you like to know?",
    suggestions: ["What should I learn to become a frontend developer?", "Is there a beginner Python course?", "How does Skill Exchange work?"],
    tools: { search_courses: "Searching courses…", search_mentors: "Searching mentors…", search_internships: "Searching jobs…", search_forum: "Searching the forum…", list_career_paths: "Checking career roadmaps…", get_my_progress: "Checking your progress…" },
    thinking: "Thinking…",
    errors: {
      ASSISTANT_NOT_CONFIGURED: "The assistant isn't available yet.",
      ASSISTANT_KEY_REJECTED: "The assistant isn't available yet.",
      ASSISTANT_NO_ACCESS: "The assistant isn't available yet.",
      DAILY_LIMIT: "You've reached today's question limit. Please try again tomorrow.",
      GUEST_LIMIT: "You've reached the guest question limit. Sign in to ask more.",
      SITE_LIMIT: "The assistant is very busy today. Please try again tomorrow.",
      UPSTREAM_BUSY: "The assistant is a little busy. Please try again in a moment.",
      REFUSED: "I can't help with that one. Ask me about learning or careers.",
      TOO_MANY_STEPS: "That question needed too many steps. Try asking something shorter and more specific.",
      default: "Something went wrong. Please try again.",
    },
    note: "AI can make mistakes. Check important details.",
  },
};

const loadChat = () => {
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved.filter((m) => m && typeof m.text === "string") : [];
  } catch {
    return [];
  }
};

const saveChat = (messages) => {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
  } catch {
    // Private mode or full storage: the chat still works for this page view.
  }
};

// Minimal, safe Markdown: [links](/path), **bold**, "- " bullets and line
// breaks, built as React elements (never raw HTML).
const renderInline = (text, keyPrefix) => {
  const parts = [];
  const pattern = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0;
  let match;
  while ((match = pattern.exec(text))) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const key = `${keyPrefix}-${match.index}`;
    if (match[1]) {
      const href = match[2];
      if (href.startsWith("/") && !href.startsWith("//")) {
        parts.push(<Link key={key} to={href}>{match[1]}</Link>);
      } else if (/^https:\/\//i.test(href)) {
        parts.push(<a key={key} href={href} target="_blank" rel="noopener noreferrer">{match[1]}</a>);
      } else {
        parts.push(match[1]);
      }
    } else {
      parts.push(<strong key={key}>{match[3]}</strong>);
    }
    last = pattern.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
};

const MessageText = ({ text }) => {
  const lines = text.split("\n");
  const blocks = [];
  let list = [];
  const flush = (key) => {
    if (list.length) blocks.push(<ul key={`ul-${key}`}>{list}</ul>);
    list = [];
  };
  lines.forEach((line, index) => {
    const bullet = line.match(/^\s*(?:[-*•]|\d+\.)\s+(.*)$/);
    if (bullet) {
      list.push(<li key={index}>{renderInline(bullet[1], index)}</li>);
    } else {
      flush(index);
      if (line.trim()) blocks.push(<p key={index}>{renderInline(line, index)}</p>);
    }
  });
  flush("end");
  return <Fragment>{blocks}</Fragment>;
};

const AssistantWidget = () => {
  const { language } = useLanguage();
  const text = copy[language === "en" ? "en" : "km"];
  const location = useLocation();
  const [available, setAvailable] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(loadChat);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE_URL}/assistant/status`)
      .then((r) => (r.ok ? r.json() : { available: false }))
      .then((data) => { if (!cancelled) setAvailable(Boolean(data.available)); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => saveChat(messages), [messages]);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, status, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
    const onKey = (event) => { if (event.key === "Escape") setOpen(false); };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const updateLast = (fn) =>
    setMessages((prev) => {
      const next = [...prev];
      next[next.length - 1] = fn(next[next.length - 1]);
      return next;
    });

  const send = useCallback(async (raw) => {
    const message = raw.trim();
    if (!message || busy) return;
    const history = messages.filter((m) => !m.error).map(({ role, text: t }) => ({ role, text: t }));
    setMessages((prev) => [...prev, { role: "user", text: message }, { role: "assistant", text: "" }]);
    setInput("");
    setBusy(true);
    setStatus(text.thinking);

    const controller = new AbortController();
    abortRef.current = controller;
    const token = getAuthToken();
    try {
      const response = await fetch(`${API_BASE_URL}/assistant/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ message, history, page: location.pathname, language }),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => ({}));
        throw Object.assign(new Error("request failed"), { code: data.code });
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop();
        for (const chunk of events) {
          const line = chunk.split("\n").find((l) => l.startsWith("data: "));
          if (!line) continue;
          const event = JSON.parse(line.slice(6));
          if (event.type === "text") {
            setStatus("");
            updateLast((m) => ({ ...m, text: m.text + event.text }));
          } else if (event.type === "tool") {
            setStatus(text.tools[event.name] || text.thinking);
          } else if (event.type === "notice" || event.type === "error") {
            const note = text.errors[event.code] || text.errors.default;
            updateLast((m) => ({ ...m, text: m.text ? `${m.text}\n\n${note}` : note, error: !m.text }));
          }
        }
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        const note = text.errors[error.code] || text.errors.default;
        updateLast((m) => ({ ...m, text: note, error: true }));
        if (error.code === "ASSISTANT_NOT_CONFIGURED") setAvailable(false);
      }
    } finally {
      // An empty reply (e.g. the stream closed early) becomes an error note.
      updateLast((m) => (m.text ? m : { ...m, text: text.errors.default, error: true }));
      setBusy(false);
      setStatus("");
      abortRef.current = null;
    }
  }, [busy, messages, text, location.pathname, language]);

  const reset = () => {
    abortRef.current?.abort();
    setMessages([]);
  };

  if (!available) return null;

  return (
    <>
      <button
        type="button"
        className={`assistant-fab${open ? " is-open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? text.close : text.open}
        aria-expanded={open}
        aria-controls="assistant-panel"
      >
        {open ? <IoClose /> : <IoChatbubbleEllipsesOutline />}
      </button>

      {open && (
        <section id="assistant-panel" className="assistant-panel" role="dialog" aria-label={text.title}>
          <header className="assistant-head">
            <span className="assistant-avatar" aria-hidden="true"><IoSparkles /></span>
            <div className="assistant-head-text">
              <strong>{text.title}</strong>
              <small>{text.subtitle}</small>
            </div>
            {messages.length > 0 && (
              <button type="button" className="assistant-icon-btn" onClick={reset} aria-label={text.reset} title={text.reset}>
                <IoRefreshOutline />
              </button>
            )}
            <button type="button" className="assistant-icon-btn" onClick={() => setOpen(false)} aria-label={text.close}>
              <IoClose />
            </button>
          </header>

          <div className="assistant-messages" ref={listRef} aria-live="polite">
            <div className="assistant-msg assistant">
              <MessageText text={text.greeting} />
            </div>
            {messages.length === 0 && (
              <div className="assistant-suggestions">
                {text.suggestions.map((s) => (
                  <button key={s} type="button" onClick={() => send(s)}>{s}</button>
                ))}
              </div>
            )}
            {messages.map((m, i) =>
              m.text ? (
                <div key={i} className={`assistant-msg ${m.role}${m.error ? " error" : ""}`}>
                  {m.role === "assistant" ? <MessageText text={m.text} /> : <p>{m.text}</p>}
                </div>
              ) : null,
            )}
            {status && <div className="assistant-status"><span className="assistant-dots" aria-hidden="true" />{status}</div>}
          </div>

          <form
            className="assistant-form"
            onSubmit={(event) => {
              event.preventDefault();
              send(input);
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value.slice(0, 2000))}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  send(input);
                }
              }}
              placeholder={text.placeholder}
              rows={1}
              aria-label={text.placeholder}
            />
            <button type="submit" disabled={busy || !input.trim()} aria-label={text.send}>
              <IoSend />
            </button>
          </form>
          <p className="assistant-note">{text.note}</p>
        </section>
      )}
    </>
  );
};

export default AssistantWidget;
