/**
 * RAG Chat Service.
 *
 * Coordinates context retrieval and LLM completion generation.
 * Guarantees that only documents belonging to the requesting landlord and
 * permitted by their role are included in the prompt context.
 */

import { retrieveContext, RetrievedChunk } from "./retrieve.service";
import { getLlmProvider, ChatMessage } from "./providers";
import type { ChatSourceCitation, UserRole } from "@rentledger/shared";

export interface ChatParams {
  landlordId: string;
  role: UserRole;
  message: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface ChatResponse {
  answer: string;
  citations: ChatSourceCitation[];
}

export async function chatWithAssistant(params: ChatParams): Promise<ChatResponse> {
  const { landlordId, role, message, history = [] } = params;

  // 1. Retrieve permission-aware relevant chunks
  const chunks = await retrieveContext({
    landlordId,
    role,
    query: message,
    limit: 5,
  });

  // 2. Format context records for the prompt
  const contextText =
    chunks.length > 0
      ? chunks
          .map(
            (c, i) =>
              `[Record ${i + 1}] (Source: ${c.sourceType})\n${c.content}`
          )
          .join("\n\n")
      : "No matching records found in the database for this query.";

  const systemPrompt = `You are RentLedger AI, a knowledgeable and precise assistant for landlords and property managers.
You answer questions strictly based on the provided landlord records below.
If the answer is not present in the records, state clearly and politely that your current records do not contain this information.
Never guess or hallucinate payment dates, amounts, or tenant names.
Always quote amounts in ₹ (INR) unless specified otherwise.

--- BEGIN CONTEXT RECORDS ---
${contextText}
--- END CONTEXT RECORDS ---`;

  // 3. Assemble chat message history for the LLM
  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...history.slice(-6).map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: message },
  ];

  // 4. Generate response via configured LLM provider
  const llmProvider = getLlmProvider();
  const answer = await llmProvider.chat(messages);

  // 5. Build citations
  const citations: ChatSourceCitation[] = chunks.map((c) => ({
    chunkId: c.id,
    sourceType: c.sourceType,
    sourceId: c.sourceId,
    tenantId: c.tenantId,
    snippet: c.content.length > 150 ? c.content.slice(0, 147) + "..." : c.content,
  }));

  return {
    answer,
    citations,
  };
}
