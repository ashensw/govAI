import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../context/I18nContext";
import {
  createChatSession,
  deleteChatSession,
  fetchChatSessions,
  fetchSessionMessages,
  streamChatMessage,
} from "../api/chat";
import type { ChatMessage, ChatSession, Citation } from "../types";

interface UiMessage extends ChatMessage {
  streaming?: boolean;
}

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function ChatPage() {
  const { t } = useI18n();

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const threadEndRef = useRef<HTMLDivElement | null>(null);
  // When sendMessage() creates a brand-new session, it sets activeSessionId
  // itself and immediately starts optimistically rendering the user message
  // + streaming assistant placeholder. Without this guard, that state change
  // also triggers the fetch-messages effect below, whose GET resolves with
  // the server's not-yet-updated message list (the assistant reply is only
  // persisted once streaming finishes) and clobbers the in-progress stream.
  const skipNextMessagesFetchRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setSessionsLoading(true);
    fetchChatSessions()
      .then((list) => {
        if (cancelled) return;
        setSessions(list);
      })
      .catch(() => {
        // Non-fatal: leave sessions empty, user can still start a new chat.
      })
      .finally(() => {
        if (!cancelled) setSessionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }
    if (skipNextMessagesFetchRef.current) {
      skipNextMessagesFetchRef.current = false;
      return;
    }
    let cancelled = false;
    setMessagesLoading(true);
    fetchSessionMessages(activeSessionId)
      .then((list) => {
        if (cancelled) return;
        setMessages(list);
      })
      .catch(() => {
        if (!cancelled) setMessages([]);
      })
      .finally(() => {
        if (!cancelled) setMessagesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeSessionId]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  function selectSession(id: string) {
    if (isStreaming) return;
    setActiveSessionId(id);
    setSidebarOpen(false);
  }

  function startNewChat() {
    if (isStreaming) return;
    setActiveSessionId(null);
    setMessages([]);
    setSendError(null);
    setSidebarOpen(false);
  }

  async function handleDeleteSession(id: string, e: MouseEvent) {
    e.stopPropagation();
    if (isStreaming) return;
    const previous = sessions;
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSessionId === id) {
      setActiveSessionId(null);
      setMessages([]);
    }
    try {
      await deleteChatSession(id);
    } catch {
      setSessions(previous);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void sendMessage();
  }

  async function sendMessage() {
    const content = input.trim();
    if (!content || isStreaming) return;

    setSendError(null);
    setInput("");

    let sessionId = activeSessionId;
    try {
      if (!sessionId) {
        const created = await createChatSession(content.slice(0, 60));
        sessionId = created.id;
        skipNextMessagesFetchRef.current = true;
        setActiveSessionId(created.id);
        setSessions((prev) => [created, ...prev]);
      }
    } catch (err) {
      setSendError(err instanceof Error ? err.message : t.error);
      setInput(content);
      return;
    }

    const userMessage: UiMessage = {
      id: newId(),
      role: "user",
      content,
      citations: null,
      created_at: new Date().toISOString(),
    };
    const assistantId = newId();
    const assistantPlaceholder: UiMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      citations: null,
      created_at: new Date().toISOString(),
      streaming: true,
    };
    setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    let accumulated = "";
    await streamChatMessage(
      sessionId,
      content,
      {
        onToken: (text) => {
          accumulated += text;
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: accumulated } : m)),
          );
        },
        onCitations: (citations: Citation[]) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, citations } : m)),
          );
        },
        onDone: () => {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m)),
          );
          setIsStreaming(false);
          fetchChatSessions()
            .then(setSessions)
            .catch(() => undefined);
        },
        onError: (message) => {
          setSendError(message);
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m)),
          );
          setIsStreaming(false);
        },
      },
      controller.signal,
    );
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Mobile sidebar toggle */}
      <button
        type="button"
        onClick={() => setSidebarOpen((v) => !v)}
        className="fixed bottom-4 left-4 z-20 rounded-full bg-navy-700 p-3 text-white shadow-card md:hidden"
        aria-label="Toggle sessions"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 left-0 z-10 flex w-72 flex-col border-r border-navy-100 bg-white transition-transform md:static md:translate-x-0`}
      >
        <div className="border-b border-navy-100 p-3">
          <button
            type="button"
            onClick={startNewChat}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-navy-700 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-navy-600"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t.chatNewSession}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
          <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-navy-400">
            {t.chatSessionsTitle}
          </p>
          {sessionsLoading ? (
            <p className="px-2 py-2 text-sm text-navy-400">{t.loading}</p>
          ) : sessions.length === 0 ? (
            <p className="px-2 py-2 text-sm text-navy-400">{t.chatEmptySessions}</p>
          ) : (
            <ul className="space-y-0.5">
              {sessions.map((session) => (
                <li key={session.id}>
                  <button
                    type="button"
                    onClick={() => selectSession(session.id)}
                    className={`group flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-sm transition-colors ${
                      activeSessionId === session.id
                        ? "bg-navy-50 text-navy-900 font-medium"
                        : "text-navy-600 hover:bg-slate-100"
                    }`}
                  >
                    <span className="truncate">{session.title || t.chatNewSession}</span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => handleDeleteSession(session.id, e)}
                      aria-label={t.chatDeleteSession}
                      title={t.chatDeleteSession}
                      className="ml-2 shrink-0 rounded p-1 text-navy-300 opacity-0 hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[5] bg-navy-950/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main thread */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b border-navy-100 bg-white px-4 py-2 text-center text-xs text-navy-500">
          {t.chatGroundedNotice}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-6">
          <div className="mx-auto flex max-w-3xl flex-col gap-5">
            {messagesLoading ? (
              <p className="text-center text-sm text-navy-400">{t.loading}</p>
            ) : messages.length === 0 ? (
              <p className="mt-16 text-center text-sm text-navy-400">{t.chatEmptyThread}</p>
            ) : (
              messages.map((message) => <MessageBubble key={message.id} message={message} />)
            )}
            <div ref={threadEndRef} />
          </div>
        </div>

        {sendError && (
          <div className="mx-auto mb-2 w-full max-w-3xl px-4">
            <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{sendError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="border-t border-navy-100 bg-white p-4">
          <div className="mx-auto flex max-w-3xl items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.chatInputPlaceholder}
              rows={1}
              disabled={isStreaming}
              className="max-h-40 flex-1 resize-none rounded-md border border-navy-200 px-3 py-2.5 text-sm text-navy-900 shadow-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500 disabled:bg-slate-50"
            />
            <button
              type="submit"
              disabled={isStreaming || !input.trim()}
              className="rounded-md bg-navy-700 px-4 py-2.5 text-sm font-semibold text-white shadow-card transition-colors hover:bg-navy-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t.chatSend}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: UiMessage }) {
  const { t } = useI18n();
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const isUser = message.role === "user";

  return (
    <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-card ${
          isUser
            ? "rounded-br-sm bg-navy-700 text-white"
            : "rounded-bl-sm border border-navy-100 bg-white text-navy-900"
        }`}
      >
        <p className={`whitespace-pre-wrap ${message.streaming && !message.content ? "typing-caret" : ""}`}>
          {message.content}
          {message.streaming && message.content ? <span className="typing-caret" /> : null}
        </p>
      </div>
      <span className="mt-1 px-1 text-[11px] text-navy-300">{formatTime(message.created_at)}</span>

      {!isUser && message.citations && message.citations.length > 0 && (
        <div className="mt-1.5 w-full max-w-[85%]">
          <button
            type="button"
            onClick={() => setSourcesOpen((v) => !v)}
            className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-navy-500 hover:text-navy-700"
          >
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`h-3.5 w-3.5 transition-transform ${sourcesOpen ? "rotate-90" : ""}`}
            >
              <path d="M7.05 4.05a.75.75 0 011.06 0l4.5 4.5a.75.75 0 010 1.06l-4.5 4.5a.75.75 0 01-1.06-1.06L10.94 9 7.05 5.11a.75.75 0 010-1.06z" />
            </svg>
            {t.chatSourcesLabel} ({message.citations.length})
          </button>

          {sourcesOpen && (
            <ul className="mt-1 space-y-2">
              {message.citations.map((citation, idx) => (
                <li
                  key={`${citation.document_id}-${idx}`}
                  className="rounded-md border border-navy-100 bg-slate-50 p-2.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      to={`/documents?doc=${citation.document_id}`}
                      className="font-medium text-navy-700 hover:underline"
                    >
                      {citation.title}
                    </Link>
                    <span className="shrink-0 text-navy-400">
                      {citation.page != null ? `${t.chatPage} ${citation.page} · ` : ""}
                      {t.chatScore} {(citation.score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-3 text-navy-500">{citation.chunk_text}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
