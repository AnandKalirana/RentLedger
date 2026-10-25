/**
 * Audit service — centralised logging for every sensitive action in the system.
 *
 * All write operations go through this function so there is a single, auditable
 * path.  The function is fire-and-forget by design (it never throws) so that a
 * logging failure never blocks the primary request.
 */

import { prisma } from "@/config/database";
import type { UserRole } from "@rentledger/shared";

export interface AuditLogEntry {
  /** The landlord account that owns the resources being acted upon. */
  landlordId: string;
  /** The user who performed the action (usually = landlordId). */
  actorId: string;
  /** The role of the actor at the time of the action. */
  actorRole: UserRole;
  /**
   * A short machine-readable verb, e.g.:
   *   "RAG_RETRIEVE" | "CHAT_QUERY" | "PAYMENT_VERIFY" | "PAYMENT_REJECT"
   */
  action: string;
  /** The model / entity type being acted upon, e.g. "DocumentChunk", "Payment". */
  resourceType: string;
  /** IDs of the specific records affected. */
  resourceIds: string[];
  /** Optional free-text query (e.g. the chat message that triggered retrieval). */
  query?: string | null;
}

/**
 * Write an audit log entry.
 *
 * Fire-and-forget — errors are swallowed and printed to stderr so the caller
 * is never blocked by a logging failure.
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        landlordId: entry.landlordId,
        actorId: entry.actorId,
        actorRole: entry.actorRole,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceIds: entry.resourceIds,
        query: entry.query ?? null,
      },
    });
  } catch (err) {
    // Never let logging failures surface to the caller
    console.error("[AuditLog] Failed to write audit entry:", err);
  }
}
