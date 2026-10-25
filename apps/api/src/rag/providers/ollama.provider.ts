/**
 * Ollama provider for local embeddings and chat completions.
 *
 * Connects to a local Ollama daemon (default: http://localhost:11434).
 * - Embedding: nomic-embed-text or all-minilm (768-dim)
 * - Chat: llama3.2, mistral, or any pulled chat model
 */

import type { EmbeddingProvider } from "./embedding.provider";
import type { ChatMessage, LlmProvider } from "./llm.provider";
import { withRetry, isRetryableNetworkError } from "./retry";

export class OllamaEmbeddingProvider implements EmbeddingProvider {
  readonly dimension: number;
  private readonly baseUrl: string;
  private readonly model: string;

  constructor() {
    this.baseUrl = (process.env.OLLAMA_BASE_URL ?? "http://localhost:11434").replace(/\/$/, "");
    this.model = process.env.OLLAMA_EMBED_MODEL ?? "nomic-embed-text";
    this.dimension = Number(process.env.EMBEDDING_DIM ?? "768");
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const results: number[][] = [];
    for (const text of texts) {
      const vec = await this.embedQuery(text);
      results.push(vec);
    }
    return results;
  }

  async embedQuery(text: string): Promise<number[]> {
    const res = await withRetry(
      async () => {
        const response = await fetch(`${this.baseUrl}/api/embeddings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: this.model,
            prompt: text,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => response.statusText);
          throw new Error(`Ollama embedding error ${response.status}: ${errorText}`);
        }

        return (await response.json()) as { embedding: number[] };
      },
      isRetryableNetworkError
    );

    return res.embedding;
  }
}

export class OllamaLlmProvider implements LlmProvider {
  private readonly baseUrl: string;
  private readonly model: string;

  constructor() {
    this.baseUrl = (process.env.OLLAMA_BASE_URL ?? "http://localhost:11434").replace(/\/$/, "");
    this.model = process.env.OLLAMA_CHAT_MODEL ?? "llama3.2";
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    const formattedMessages = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const res = await withRetry(
      async () => {
        const response = await fetch(`${this.baseUrl}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: this.model,
            messages: formattedMessages,
            stream: false,
            options: {
              temperature: 0.2,
            },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => response.statusText);
          throw new Error(`Ollama chat error ${response.status}: ${errorText}`);
        }

        return (await response.json()) as { message?: { content: string } };
      },
      isRetryableNetworkError
    );

    return res.message?.content?.trim() ?? "";
  }
}
