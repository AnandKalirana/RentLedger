/**
 * Mock providers for unit tests and local testing without external API keys.
 * Deterministic vector generation based on input string tokens/hash.
 */

import type { EmbeddingProvider } from "./embedding.provider";
import type { ChatMessage, LlmProvider } from "./llm.provider";

export class MockEmbeddingProvider implements EmbeddingProvider {
  readonly dimension: number;

  constructor(dimension?: number) {
    this.dimension = dimension ?? Number(process.env.EMBEDDING_DIM ?? "768");
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((t) => this.embedQuery(t)));
  }

  async embedQuery(text: string): Promise<number[]> {
    // Generate deterministic normalized vector from string
    const vector = new Array(this.dimension).fill(0);
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      const idx = (charCode * 31 + i) % this.dimension;
      vector[idx] = (vector[idx] + (charCode % 10) + 1);
    }

    // Normalize vector
    let norm = 0;
    for (let i = 0; i < this.dimension; i++) {
      norm += vector[i] * vector[i];
    }
    norm = Math.sqrt(norm) || 1;
    for (let i = 0; i < this.dimension; i++) {
      vector[i] = Number((vector[i] / norm).toFixed(6));
    }

    return vector;
  }
}

export class MockLlmProvider implements LlmProvider {
  private replyGenerator?: (messages: ChatMessage[]) => string;

  constructor(replyGenerator?: (messages: ChatMessage[]) => string) {
    this.replyGenerator = replyGenerator;
  }

  setReplyGenerator(fn: (messages: ChatMessage[]) => string) {
    this.replyGenerator = fn;
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    if (this.replyGenerator) {
      return this.replyGenerator(messages);
    }

    const lastMsg = messages[messages.length - 1];
    return `[Mock Assistant] Based on your records: Analysis completed for "${lastMsg?.content ?? ""}".`;
  }
}
