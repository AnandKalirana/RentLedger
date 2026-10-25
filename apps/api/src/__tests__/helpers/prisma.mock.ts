/**
 * Minimal in-memory Prisma mock.
 *
 * Each function can be overridden per-test via vi.mocked().mockImplementation().
 * The default behaviour mirrors the landlordId-scoping contract: reads and
 * mutations that don't match the provided landlordId return null or throw.
 *
 * Note: this is purely a type-level stub — we never open a real DB connection
 * in unit tests.
 */
import { vi } from "vitest";

// ---------------------------------------------------------------------------
// Stable fake IDs used across every test in the isolation suite
// ---------------------------------------------------------------------------
export const LANDLORD_A_ID = "landlord-a-id";
export const LANDLORD_B_ID = "landlord-b-id";

export const TENANT_A_ID = "tenant-a-id";
export const TENANT_B_ID = "tenant-b-id";

export const PAYMENT_A_ID = "payment-a-id";
export const PAYMENT_B_ID = "payment-b-id";

export const LINK_A_ID = "link-a-id";
export const LINK_B_ID = "link-b-id";

// ---------------------------------------------------------------------------
// In-memory "database" tables
// ---------------------------------------------------------------------------

export const tenantStore = new Map<string, { id: string; landlordId: string; fullName: string; [k: string]: unknown }>();
export const paymentStore = new Map<string, { id: string; landlordId: string; [k: string]: unknown }>();
export const linkStore = new Map<string, { id: string; landlordId: string; [k: string]: unknown }>();
export const chunkStore = new Map<string, { id: string; landlordId: string; sourceType: string; sourceId: string; chunkIndex: number; content: string; visibility: string; [k: string]: unknown }>();
export const auditLogStore = new Map<string, { id: string; landlordId: string; action: string; [k: string]: unknown }>();

// ---------------------------------------------------------------------------
// Seed helper — call in beforeEach so tests start from a known state
// ---------------------------------------------------------------------------
export function seedStores() {
  tenantStore.clear();
  paymentStore.clear();
  linkStore.clear();
  chunkStore.clear();
  auditLogStore.clear();

  tenantStore.set(TENANT_A_ID, {
    id: TENANT_A_ID,
    landlordId: LANDLORD_A_ID,
    fullName: "Alice Tenant",
    mobileNumber: "1111111111",
    monthlyRent: 5000,
    status: "ACTIVE",
  });

  tenantStore.set(TENANT_B_ID, {
    id: TENANT_B_ID,
    landlordId: LANDLORD_B_ID,
    fullName: "Bob Tenant",
    mobileNumber: "2222222222",
    monthlyRent: 8000,
    status: "ACTIVE",
  });

  paymentStore.set(PAYMENT_A_ID, {
    id: PAYMENT_A_ID,
    landlordId: LANDLORD_A_ID,
    tenantId: TENANT_A_ID,
    amount: 5000,
    status: "PENDING",
    billingMonth: 10,
    billingYear: 2026,
  });

  paymentStore.set(PAYMENT_B_ID, {
    id: PAYMENT_B_ID,
    landlordId: LANDLORD_B_ID,
    tenantId: TENANT_B_ID,
    amount: 8000,
    status: "PENDING",
    billingMonth: 10,
    billingYear: 2026,
  });

  linkStore.set(LINK_A_ID, {
    id: LINK_A_ID,
    landlordId: LANDLORD_A_ID,
    token: "token-a",
    isActive: true,
  });

  linkStore.set(LINK_B_ID, {
    id: LINK_B_ID,
    landlordId: LANDLORD_B_ID,
    token: "token-b",
    isActive: true,
  });
}

// ---------------------------------------------------------------------------
// Mock prisma object — only the methods exercised by the isolation tests
// ---------------------------------------------------------------------------
export const mockPrisma = {
  tenant: {
    findMany: vi.fn(({ where }: { where: { landlordId: string } }) =>
      [...tenantStore.values()].filter((t) => t.landlordId === where.landlordId)
    ),
    findFirst: vi.fn(({ where }: { where: { id: string; landlordId: string } }) => {
      const t = tenantStore.get(where.id);
      if (!t || t.landlordId !== where.landlordId) return null;
      return { ...t, payments: [] };
    }),
    create: vi.fn(({ data }: { data: Record<string, unknown> }) => {
      const rec = { fullName: "", ...data, id: `new-tenant-${Date.now()}` } as { id: string; landlordId: string; fullName: string; [k: string]: unknown };
      tenantStore.set(rec.id, rec);
      return rec;
    }),
    update: vi.fn(({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      const existing = tenantStore.get(where.id);
      if (!existing) return null;
      const updated = { ...existing, ...data };
      tenantStore.set(where.id, updated);
      return updated;
    }),
    delete: vi.fn(({ where }: { where: { id: string } }) => {
      tenantStore.delete(where.id);
    }),
  },

  payment: {
    findMany: vi.fn(({ where }: { where: { landlordId: string } }) =>
      [...paymentStore.values()].filter((p) => p.landlordId === where.landlordId)
    ),
    findFirst: vi.fn(({ where }: { where: { id: string; landlordId: string } }) => {
      const p = paymentStore.get(where.id);
      if (!p || p.landlordId !== where.landlordId) return null;
      return {
        ...p,
        tenant: { id: where.id, fullName: "Test Tenant", mobileNumber: "0000", email: null },
      };
    }),
    update: vi.fn(({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      const existing = paymentStore.get(where.id);
      if (!existing) return null;
      const updated = { ...existing, ...data };
      paymentStore.set(where.id, updated);
      return updated;
    }),
    count: vi.fn(({ where }: { where: { landlordId: string } }) =>
      [...paymentStore.values()].filter((p) => p.landlordId === where.landlordId).length
    ),
  },

  paymentLink: {
    findUnique: vi.fn(({ where }: { where: { token?: string; id?: string } }) => {
      if (where.token) return [...linkStore.values()].find((l) => l.token === where.token) ?? null;
      if (where.id) return linkStore.get(where.id) ?? null;
      return null;
    }),
    findMany: vi.fn(({ where }: { where: { landlordId: string }; include?: unknown }) =>
      [...linkStore.values()].filter((l) => l.landlordId === where.landlordId)
    ),
    findFirst: vi.fn(({ where }: { where: { id: string; landlordId: string } }) => {
      const l = linkStore.get(where.id);
      if (!l || l.landlordId !== where.landlordId) return null;
      return l;
    }),
    create: vi.fn(({ data }: { data: Record<string, unknown> }) => {
      const rec = { ...data, id: `new-link-${Date.now()}` } as { id: string; landlordId: string; [k: string]: unknown };
      linkStore.set(rec.id, rec);
      return rec;
    }),
    update: vi.fn(({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      const existing = linkStore.get(where.id);
      if (!existing) return null;
      const updated = { ...existing, ...data };
      linkStore.set(where.id, updated);
      return updated;
    }),
    delete: vi.fn(({ where }: { where: { id: string } }) => {
      linkStore.delete(where.id);
    }),
  },

  documentChunk: {
    upsert: vi.fn(({ where, create, update }: { where: { landlordId_sourceType_sourceId_chunkIndex: { landlordId: string; sourceType: string; sourceId: string; chunkIndex: number } }; create: Record<string, unknown>; update: Record<string, unknown> }) => {
      const key = `${where.landlordId_sourceType_sourceId_chunkIndex.landlordId}:${where.landlordId_sourceType_sourceId_chunkIndex.sourceType}:${where.landlordId_sourceType_sourceId_chunkIndex.sourceId}:${where.landlordId_sourceType_sourceId_chunkIndex.chunkIndex}`;
      const existing = chunkStore.get(key);
      if (existing) {
        const updated = { ...existing, ...update, updatedAt: new Date() };
        chunkStore.set(key, updated);
        return updated;
      }
      const created = { ...create, id: `chunk-${Date.now()}-${Math.random()}`, createdAt: new Date(), updatedAt: new Date() } as unknown as { id: string; landlordId: string; sourceType: string; sourceId: string; chunkIndex: number; content: string; visibility: string };
      chunkStore.set(key, created);
      return created;
    }),
    findMany: vi.fn(({ where, take }: { where: { landlordId: string; visibility?: { in: string[] } }; take?: number }) => {
      const all = [...chunkStore.values()].filter((c) => {
        if (c.landlordId !== where.landlordId) return false;
        if (where.visibility?.in && !where.visibility.in.includes(c.visibility)) return false;
        return true;
      });
      return typeof take === "number" ? all.slice(0, take) : all;
    }),
    deleteMany: vi.fn(async ({ where }: { where: { landlordId: string; sourceId?: string; tenantId?: string; sourceType?: string | { in: string[] }; OR?: Array<{ tenantId?: string; sourceId?: string; sourceType?: string }> } }) => {
      let count = 0;
      for (const [key, chunk] of chunkStore.entries()) {
        if (chunk.landlordId !== where.landlordId) continue;

        // If sourceType is specified directly
        if (typeof where.sourceType === "string" && chunk.sourceType !== where.sourceType) continue;
        if (where.sourceType && typeof where.sourceType === "object" && "in" in where.sourceType && !where.sourceType.in.includes(chunk.sourceType)) continue;

        let match = false;
        if (where.sourceId && chunk.sourceId === where.sourceId) match = true;
        if (where.tenantId && chunk.tenantId === where.tenantId) match = true;
        if (where.OR) {
          for (const cond of where.OR) {
            if (cond.tenantId && chunk.tenantId === cond.tenantId) match = true;
            if (cond.sourceId && chunk.sourceId === cond.sourceId) match = true;
          }
        }

        if (match) {
          chunkStore.delete(key);
          count++;
        }
      }
      return { count };
    }),
  },

  auditLog: {
    create: vi.fn(({ data }: { data: Record<string, unknown> }) => {
      const entry = { ...data, id: `audit-${Date.now()}-${Math.random()}`, createdAt: new Date() } as unknown as { id: string; landlordId: string; action: string; [k: string]: unknown };
      auditLogStore.set(entry.id, entry);
      return entry;
    }),
    findMany: vi.fn(({ where, skip = 0, take = 20 }: { where: { landlordId: string }; skip?: number; take?: number }) => {
      const entries = [...auditLogStore.values()]
        .filter((a) => a.landlordId === where.landlordId)
        .slice(skip, skip + take);
      return entries;
    }),
    count: vi.fn(({ where }: { where: { landlordId: string } }) => {
      return [...auditLogStore.values()].filter((a) => a.landlordId === where.landlordId).length;
    }),
  },

  $executeRawUnsafe: vi.fn().mockResolvedValue(1),
  $queryRawUnsafe: vi.fn().mockResolvedValue([]),
  $connect: vi.fn(),
  $disconnect: vi.fn(),
};

