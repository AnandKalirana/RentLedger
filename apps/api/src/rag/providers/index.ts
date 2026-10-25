/**
 * Provider factory for RAG embeddings and LLM completions.
 * Configured via environment variables (EMBEDDING_PROVIDER, LLM_PROVIDER).
 */

import type { EmbeddingProvider } from "./embedding.provider";
import type { LlmProvider } from "./llm.provider";
import { GeminiEmbeddingProvider, GeminiLlmProvider } from "./gemini.provider";
import { OllamaEmbeddingProvider, OllamaLlmProvider } from "./ollama.provider";
import { MockEmbeddingProvider, MockLlmProvider } from "./mock.provider";

let customEmbeddingProvider: EmbeddingProvider | null = null;
let customLlmProvider: LlmProvider | null = null;

export function setCustomEmbeddingProvider(provider: EmbeddingProvider | null) {
  customEmbeddingProvider = provider;
}

export function setCustomLlmProvider(provider: LlmProvider | null) {
  customLlmProvider = provider;
}

export function getEmbeddingProvider(): EmbeddingProvider {
  if (customEmbeddingProvider) return customEmbeddingProvider;

  const providerType = (process.env.EMBEDDING_PROVIDER ?? "mock").toLowerCase();
  switch (providerType) {
    case "gemini":
      return new GeminiEmbeddingProvider();
    case "ollama":
      return new OllamaEmbeddingProvider();
    case "mock":
    default:
      return new MockEmbeddingProvider();
  }
}

export function getLlmProvider(): LlmProvider {
  if (customLlmProvider) return customLlmProvider;

  const providerType = (process.env.LLM_PROVIDER ?? "mock").toLowerCase();
  switch (providerType) {
    case "gemini":
      return new GeminiLlmProvider();
    case "ollama":
      return new OllamaLlmProvider();
    case "mock":
    default:
      return new MockLlmProvider();
  }
}

export * from "./embedding.provider";
export * from "./llm.provider";
export * from "./gemini.provider";
export * from "./ollama.provider";
export * from "./mock.provider";
export * from "./retry";
