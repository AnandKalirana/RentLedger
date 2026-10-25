/**
 * Gemini provider for embeddings and chat completions.
 *
 * Uses the Google Generative Language REST API (no SDK dependency).
 * - Embedding: text-embedding-004 (768-dim, supports outputDimensionality param)
 * - Chat: gemini-2.0-flash-lite or gemini-1.5-flash
 *
 * Rate limiting: free tier is 60 RPM for embeddings; the ingest pipeline runs
 * through a SequentialQueue so it never fires concurrent requests.
 */

import type { EmbeddingProvider } from "./embedding.provider";
import type { ChatMessage, LlmProvider } from "./llm.provider";
import { withRetry, is429 } from "./retry";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

// Batch size: Gemini embed API accepts up to 100 texts per request
const EMBED_BATCH_SIZE = 100;

async function geminiPost(url: string, body: unknown, apiKey: string): Promise<unknown> {
  const res = await fetch(`${url}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    const err = new Error(`Gemini API error ${res.status}: ${text}`);
    (err as unknown as Record<string, number>).status = res.status;
    throw err;
  }

  return res.json();
}

export class GeminiEmbeddingProvider implements EmbeddingProvider {
  readonly dimension: number;
  private readonly apiKey: string;
  private readonly model: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    this.apiKey = apiKey;
    this.model = process.env.GEMINI_EMBED_MODEL ?? "text-embedding-004";
    this.dimension = Number(process.env.EMBEDDING_DIM ?? "768");
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const results: number[][] = [];

    // Chunk into batches of EMBED_BATCH_SIZE
    for (let i = 0; i < texts.length; i += EMBED_BATCH_SIZE) {
      const batch = texts.slice(i, i + EMBED_BATCH_SIZE);

      const data = await withRetry(
        () =>
          geminiPost(
            `${GEMINI_API_BASE}/models/${this.model}:batchEmbedContents`,
            {
              requests: batch.map((text) => ({
                model: `models/${this.model}`,
                content: { parts: [{ text }] },
                // Request the configured dimension if the model supports it
                outputDimensionality: this.dimension,
              })),
            },
            this.apiKey
          ),
        is429
      ) as { embeddings: Array<{ values: number[] }> };

      for (const emb of data.embeddings) {
        results.push(emb.values);
      }
    }

    return results;
  }

  async embedQuery(text: string): Promise<number[]> {
    const [vec] = await this.embedBatch([text]);
    return vec;
  }
}

export class GeminiLlmProvider implements LlmProvider {
  private readonly apiKey: string;
  private readonly model: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    this.apiKey = apiKey;
    this.model = process.env.GEMINI_CHAT_MODEL ?? "gemini-2.0-flash-lite";
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    // Convert to Gemini's contents format
    const contents = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    // Prepend system message as a user turn if present (Gemini free tier limitation)
    const systemMsg = messages.find((m) => m.role === "system");
    if (systemMsg) {
      contents.unshift({ role: "user", parts: [{ text: systemMsg.content }] });
      contents.splice(1, 0, { role: "model", parts: [{ text: "Understood." }] });
    }

    const data = await withRetry(
      () =>
        geminiPost(
          `${GEMINI_API_BASE}/models/${this.model}:generateContent`,
          {
            contents,
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 1024,
            },
          },
          this.apiKey
        ),
      is429
    ) as {
      candidates: Array<{
        content: { parts: Array<{ text: string }> };
        finishReason?: string;
      }>;
    };

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return text.trim();
  }
}
