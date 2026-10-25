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
    <div className="mx-auto flex h-[calc(100vh-64px)] max-w-5xl flex-col px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">AI Assistant</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--stamp-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--stamp)]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Permission-aware RAG
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            Ask questions about tenants, collections, and payment history. Scoped strictly to your tenancy.
          </p>
        </div>
      </div>

      {/* Suggested prompts chips */}
      <div className="flex flex-wrap items-center gap-2 py-3">
        <span className="text-xs font-medium text-[var(--ink-soft)]">Suggested:</span>
        {SAMPLE_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => sendMessage(q)}
            disabled={isLoading}
            className="rounded-full border border-[var(--line)] bg-[var(--paper-raised)] px-3 py-1 text-xs text-[var(--ink-soft)] transition-colors hover:border-[var(--stamp)] hover:text-[var(--stamp)] disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 space-y-4 overflow-y-auto rounded-lg border border-[var(--line)] bg-[var(--paper-raised)] p-5">
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
                className={`max-w-[78%] rounded-xl px-4 py-3 shadow-xs ${
                  isUser
                    ? "bg-[var(--stamp)] text-white"
                    : "border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)]"
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>

                {/* Citations / Sources */}
                {!isUser && m.citations && m.citations.length > 0 && (
                  <div className="mt-3 border-t border-[var(--line)] pt-2.5">
                    <div className="text-xs font-semibold text-[var(--ink-soft)]">
                      Sources &amp; Citations ({m.citations.length}):
                    </div>
                    <div className="mt-1.5 space-y-1.5">
                      {m.citations.map((c, cIdx) => {
                        const isExpanded = expandedCitationId === c.chunkId;
                        return (
                          <div
                            key={c.chunkId || cIdx}
                            className="rounded-md border border-[var(--line)] bg-[var(--paper-raised)] p-2 text-xs"
                          >
                            <div
                              onClick={() =>
                                setExpandedCitationId(isExpanded ? null : c.chunkId)
                              }
                              className="flex cursor-pointer items-center justify-between font-mono-data text-[11px] text-[var(--stamp)]"
                            >
                              <span className="flex items-center gap-1 font-semibold">
                                <FileText className="h-3 w-3" />
                                [{c.sourceType}] ID: {c.sourceId.slice(0, 12)}...
                              </span>
                              {isExpanded ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )}
                            </div>
                            <p className="mt-1 text-[var(--ink-soft)]">
                              {isExpanded ? c.snippet : c.snippet.slice(0, 80) + (c.snippet.length > 80 ? "..." : "")}
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
            <div className="rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-xs text-[var(--ink-soft)]">
              Retrieving scoped records and formulating answer...
            </div>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-[var(--danger)] bg-[var(--danger-soft)] p-3 text-xs text-[var(--danger)]">
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
            className="w-full resize-none rounded-lg border border-[var(--line)] bg-[var(--paper-raised)] py-3 pl-4 pr-12 text-sm text-[var(--ink)] placeholder:text-[var(--ink-soft)] focus:border-[var(--stamp)] focus:ring-1 focus:ring-[var(--stamp)] focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2.5 rounded-md bg-[var(--stamp)] p-1.5 text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-[var(--ink-soft)]">
          <span>Press Enter to send, Shift + Enter for new line</span>
          <span>Role-aware retrieval: Financial records filtered by role.</span>
        </div>
      </div>
    </div>
  );
}
