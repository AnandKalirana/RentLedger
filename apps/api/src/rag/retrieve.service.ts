/**
 * Permission-Aware RAG Retrieval Service.
 *
 * Enforces strict multi-tenant isolation (landlordId is ALWAYS mandatory)
 * and role-based visibility filtering BEFORE results reach any LLM.
 *
 * Every retrieval is recorded in the AuditLog.
 */

import { prisma } from "@/config/database";
import { logAuditEvent } from "@/services/audit.service";
import { getEmbeddingProvider } from "./providers";
import type { ChunkSourceType, ChunkVisibility, UserRole } from "@rentledger/shared";

export interface RetrieveParams {
  landlordId: string;
  role: UserRole;
  query: string;
  limit?: number;
}

export interface RetrievedChunk {
  id: string;
  landlordId: string;
  tenantId?: string | null;
  sourceType: ChunkSourceType;
  sourceId: string;
  chunkIndex: number;
  content: string;
  visibility: ChunkVisibility;
  similarity?: number;
}

/**
 * Maps a UserRole to the list of ChunkVisibilities the user is allowed to read.
 * - LANDLORD sees all chunks (LANDLORD, MANAGER, TENANT_VIEWER).
 * - MANAGER sees operational & payment chunks (MANAGER, TENANT_VIEWER).
 * - TENANT_VIEWER only sees general tenant chunks (TENANT_VIEWER).
 */
export function getAllowedVisibilities(role: UserRole): ChunkVisibility[] {
  switch (role) {
    case "LANDLORD":
      return ["LANDLORD", "MANAGER", "TENANT_VIEWER"];
    case "MANAGER":
      return ["MANAGER", "TENANT_VIEWER"];
    case "TENANT_VIEWER":
      return ["TENANT_VIEWER"];
    default:
      return ["TENANT_VIEWER"];
  }
}

/**
 * Retrieve document chunks relevant to the user's query, strictly scoped to their
 * landlordId and filtered by their role's allowed visibilities.
 */
export async function retrieveContext(params: RetrieveParams): Promise<RetrievedChunk[]> {
  const { landlordId, role, query, limit = 5 } = params;

  if (!landlordId) {
    throw new Error("Security violation: landlordId is required for retrieval");
  }

  const allowedVisibilities = getAllowedVisibilities(role);
  const embeddingProvider = getEmbeddingProvider();
  const queryVector = await embeddingProvider.embedQuery(query);

  let chunks: RetrievedChunk[] = [];

  // Attempt pgvector cosine similarity search via raw SQL
  try {
    if (typeof (prisma as unknown as { $queryRawUnsafe?: unknown }).$queryRawUnsafe === "function") {
      const vectorStr = `[${queryVector.join(",")}]`;
      const rows = await prisma.$queryRawUnsafe<RetrievedChunk[]>(
        `SELECT "id", "landlordId", "tenantId", "sourceType", "sourceId", "chunkIndex", "content", "visibility",
                1 - ("embedding" <=> $1::vector) as similarity
         FROM "document_chunks"
         WHERE "landlordId" = $2
           AND "visibility"::text = ANY($3)
         ORDER BY "embedding" <=> $1::vector ASC
         LIMIT $4`,
        vectorStr,
        landlordId,
        allowedVisibilities,
        limit
      );

      if (Array.isArray(rows) && rows.length > 0) {
        chunks = rows;
      }
    }
  } catch (err: unknown) {
    // If pgvector is unavailable or in mock/test environment, fall back to standard Prisma query
    if (process.env.NODE_ENV !== "test") {
      console.warn(`[Retrieve] pgvector search fallback: ${(err as Error)?.message}`);
    }
  }

  // Fallback to Prisma query if raw SQL didn't return results (e.g. tests or mock DB)
  if (chunks.length === 0) {
    const records = await prisma.documentChunk.findMany({
      where: {
        landlordId,
        visibility: { in: allowedVisibilities as unknown as ChunkVisibility[] },
      },
      take: limit,
      orderBy: { updatedAt: "desc" },
    });

    chunks = records.map((r) => ({
      id: r.id,
      landlordId: r.landlordId,
      tenantId: r.tenantId,
      sourceType: r.sourceType as ChunkSourceType,
      sourceId: r.sourceId,
      chunkIndex: r.chunkIndex,
      content: r.content,
      visibility: r.visibility as ChunkVisibility,
    }));
  }

  // Mandatory Audit Logging for every RAG retrieval
  await logAuditEvent({
    landlordId,
    actorId: landlordId,
    actorRole: role,
    action: "RAG_RETRIEVE",
    resourceType: "DocumentChunk",
    resourceIds: chunks.map((c) => c.id),
    query,
  });

  return chunks;
}
