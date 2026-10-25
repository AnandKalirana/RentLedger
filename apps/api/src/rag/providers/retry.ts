/**
 * Shared retry utilities for API providers.
 *
 * Implements exponential backoff with jitter for 429 (rate-limit) errors so
 * free-tier LLM/embedding API limits don't crash ingestion.
 */

/**
 * Sleep for a given number of milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry an async function with exponential backoff.
 *
 * @param fn          - The function to call. Should throw on error.
 * @param isRetryable - Returns true if the error is worth retrying (e.g. 429).
 * @param maxAttempts - Maximum number of attempts (default 4).
 * @param baseDelayMs - Starting delay in ms (default 1000). Doubles each attempt.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  isRetryable: (err: unknown) => boolean,
  maxAttempts = 4,
  baseDelayMs = 1000
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isRetryable(err) || attempt === maxAttempts) {
        throw err;
      }
      // Exponential backoff with ±20% jitter
      const delay = baseDelayMs * Math.pow(2, attempt - 1) * (0.8 + Math.random() * 0.4);
      console.warn(
        `[RAG] Rate-limited or transient error (attempt ${attempt}/${maxAttempts}). ` +
          `Retrying in ${Math.round(delay)}ms…`,
        err instanceof Error ? err.message : err
      );
      await sleep(delay);
    }
  }
  throw lastErr;
}

/**
 * Returns true if the error looks like an HTTP 429 response from fetch/axios.
 */
export function is429(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (msg.includes("429") || msg.includes("rate limit") || msg.includes("quota")) return true;
  }
  const e = err as { status?: number; response?: { status?: number } } | undefined;
  return e?.status === 429 || e?.response?.status === 429;
}

/**
 * Returns true if error is a transient network or server error worth retrying.
 */
export function isRetryableNetworkError(err: unknown): boolean {
  if (is429(err)) return true;
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (msg.includes("econnrefused") || msg.includes("fetch failed") || msg.includes("503") || msg.includes("502")) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// In-memory ingestion queue so rate-limit stops don't lose items.
// ---------------------------------------------------------------------------

type Task<T> = () => Promise<T>;

/**
 * A simple sequential queue that processes tasks one at a time.
 * Useful for ingestion pipelines where parallelism would trigger rate limits.
 */
export class SequentialQueue {
  private queue: Array<() => Promise<void>> = [];
  private running = false;

  /**
   * Enqueue an async task. Returns a promise that resolves when the task
   * completes (or rejects if the task throws).
   */
  enqueue<T>(task: Task<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          resolve(await task());
        } catch (err) {
          reject(err);
        }
      });
      this.drain();
    });
  }

  private async drain(): Promise<void> {
    if (this.running) return;
    this.running = true;
    while (this.queue.length > 0) {
      const task = this.queue.shift()!;
      await task();
    }
    this.running = false;
  }

  get size(): number {
    return this.queue.length;
  }
}
