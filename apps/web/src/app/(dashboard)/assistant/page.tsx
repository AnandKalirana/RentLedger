"use client";

import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";
import { Sparkles, Send, ShieldCheck, FileText, User, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import type { ChatSourceCitation, ChatMessageDTO } from "@rentledger/shared";

interface MessageItem extends ChatMessageDTO {
  id: string;
}

const SAMPLE_QUESTIONS = [
  "Who is overdue this month?",
  "Why was the last payment rejected?",
  "List active tenants and their monthly rent",
  "What is the total rent expected this month?",
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: "intro-1",
      role: "assistant",
      content:
        "Hello! I am your RentLedger Assistant. You can ask me questions about your tenants, payments, verification history, and notes. All queries are filtered strictly to your account and logged for security.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCitationId, setExpandedCitationId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  async function sendMessage(textToSend?: string) {
    const text = (textToSend ?? input).trim();
    if (!text || isLoading) return;

    setError(null);
    setInput("");

    const userMessage: MessageItem = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      // Send history excluding the welcome message if not user/assistant conversation
      const apiHistory = newHistory
        .filter((m) => m.id !== "intro-1")
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await api.post<{
        success: boolean;
        data: { answer: string; citations: ChatSourceCitation[] };
      }>("/assistant/chat", {
        message: text,
        history: apiHistory.slice(0, -1), // prior history
      });

      const assistantMessage: MessageItem = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: res.data.data.answer,
        citations: res.data.data.citations,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to communicate with assistant. Please try again.";
      setError(msg);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-8.5rem)] min-h-[30rem] max-w-5xl flex-col px-4 py-5 sm:px-8 sm:py-6 md:h-[calc(100vh-56px)]">
      {/* Header */}
      <div className="ledger-head">
        <div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h1>AI Assistant</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--stamp-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-accent-deep)] ring-1 ring-inset ring-[var(--stamp)]/25">
              <ShieldCheck className="h-3.5 w-3.5" />
              Permission-aware RAG
            </span>
          </div>
          <p>Ask questions about tenants, collections, and payment history. Scoped strictly to your tenancy.</p>
        </div>
      </div>

      {/* Suggested prompts chips */}
      <div className="flex flex-wrap items-center gap-2 py-3">
        <span className="text-[0.8125rem] font-medium text-[var(--color-muted)]">Suggested:</span>
        {SAMPLE_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => sendMessage(q)}
            disabled={isLoading}
            className="rounded-full bg-[var(--color-cotton)] px-3 py-1.5 text-[0.8125rem] text-[var(--color-ink-2)] shadow-[0_0_0_1px_var(--color-rule-2)] transition-[box-shadow,color,transform] duration-150 hover:text-[var(--color-accent-deep)] hover:shadow-[0_0_0_1px_var(--color-accent)] active:translate-y-px disabled:pointer-events-none disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div className="panel flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
        {messages.map((m) => {
          const isUser = m.role === "user";
          return (
            <div
              key={m.id}
              className={`flex gap-3 text-sm ${isUser ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar */}
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  isUser
                    ? "bg-[var(--stamp)] text-white"
                    : "bg-[var(--stamp-soft)] text-[var(--stamp)]"
                }`}
              >
                {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] rounded-[var(--radius-card)] px-4 py-3 sm:max-w-[78%] ${
                  isUser
                    ? "bg-[var(--stamp)] text-white"
                    : "border border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)]"
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>

                {/* Citations / Sources */}
                {!isUser && m.citations && m.citations.length > 0 && (
                  <div className="mt-3 border-t border-[var(--color-rule)] pt-2.5">
                    <div className="text-[0.8125rem] font-medium text-[var(--color-muted)]">
                      Sources &amp; Citations ({m.citations.length}):
                    </div>
                    <div className="mt-1.5 space-y-1.5">
                      {m.citations.map((c, cIdx) => {
                        const isExpanded = expandedCitationId === c.chunkId;
                        return (
                          <div
                            key={c.chunkId || cIdx}
                            className="rounded-md border border-[var(--color-rule)] bg-[var(--color-cotton)] p-2 text-xs"
                          >
                            <button
                              type="button"
                              aria-expanded={isExpanded}
                              onClick={() =>
                                setExpandedCitationId(isExpanded ? null : c.chunkId)
                              }
                              className="flex w-full cursor-pointer items-center justify-between text-left font-mono-data text-xs text-[var(--color-accent-deep)]"
                            >
                              <span className="flex items-center gap-1 font-medium">
                                <FileText className="h-3 w-3" />
                                [{c.sourceType}] ID: {c.sourceId.slice(0, 12)}…
                              </span>
                              {isExpanded ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )}
                            </button>
                            <p className="mt-1 text-[var(--color-muted)]">
                              {isExpanded ? c.snippet : c.snippet.slice(0, 80) + (c.snippet.length > 80 ? "…" : "")}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3 text-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--stamp-soft)] text-[var(--stamp)]">
              <Sparkles className="h-4 w-4 animate-spin" />
            </div>
            <div className="rounded-[var(--radius-card)] border border-[var(--color-rule)] bg-[var(--color-paper)] px-4 py-3 text-[0.8125rem] text-[var(--color-muted)]">
              Retrieving scoped records and formulating answer…
            </div>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div role="alert"
            className="flex items-center gap-2 rounded-[var(--radius-input)] border border-[var(--danger)] bg-[var(--danger-soft)] p-3 text-[0.8125rem] text-[var(--danger)]">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="mt-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="relative flex items-center"
        >
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your tenants, rent due, or payment history..."
            disabled={isLoading}
            aria-label="Message the assistant"
            className="input min-h-[48px] resize-none py-3 pl-4 pr-12 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
            className="absolute right-2.5 rounded-md bg-[var(--stamp)] p-1.5 text-white transition-[background-color,transform] duration-150 hover:bg-[var(--color-accent-deep)] active:translate-y-px disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-4 text-[0.8125rem] text-[var(--color-muted)]">
          <span>Press Enter to send, Shift + Enter for new line</span>
          <span>Role-aware retrieval: Financial records filtered by role.</span>
        </div>
      </div>
    </div>
  );
}
