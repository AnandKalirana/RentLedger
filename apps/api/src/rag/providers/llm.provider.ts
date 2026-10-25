/**
 * LlmProvider interface.
 *
 * All LLM providers implement this minimal contract used by the chat service.
 */

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface LlmProvider {
  /**
   * Generate a chat response given a message history.
   * Returns the assistant's reply text.
   */
  chat(messages: ChatMessage[]): Promise<string>;
}
