/**
 * EmbeddingProvider interface.
 *
 * All embedding providers must implement this interface so the RAG layer
 * can be configured at runtime without changing any service code.
 */
export interface EmbeddingProvider {
  /**
   * Embed a batch of texts. Returns a 2-D array: embeddings[i] is the vector
   * for texts[i]. Implementations must batch internally when the model has a
   * per-request limit.
   */
  embedBatch(texts: string[]): Promise<number[][]>;

  /** Embed a single query string (usually shorter than document chunks). */
  embedQuery(text: string): Promise<number[]>;

  /** The dimension of the vectors returned by this provider. */
  readonly dimension: number;
}
