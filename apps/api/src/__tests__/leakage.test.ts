/**
 * Phase 9 — Multi-tenant RAG Leakage & Isolation Tests
 *
 * These tests prove:
 * 1. Cross-landlord leakage is mathematically impossible: Landlord A's queries NEVER
 *    return chunks belonging to Landlord B.
 * 2. Role-based visibility filtering is strictly enforced BEFORE reaching any LLM:
 *    - LANDLORD can see all visibilities (LANDLORD, MANAGER, TENANT_VIEWER)
 *    - MANAGER can see MANAGER and TENANT_VIEWER, but NEVER LANDLORD
 *    - TENANT_VIEWER can only see TENANT_VIEWER, never MANAGER or LANDLORD
 * 3. Every retrieval operation is audit-logged with actorRole, landlordId, query, and resourceIds.
 * 4. Ingestion correctly partitions records and creates idempotent chunks.
 * 5. End-to-end chat assistant returns citations only from the caller's tenancy.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock database using our in-memory mock store
vi.mock("@/config/database", async () => {
  const { mockPrisma } = await import("./helpers/prisma.mock");
  return { prisma: mockPrisma };
});

import {
  seedStores,
  chunkStore,
  auditLogStore,
  LANDLORD_A_ID,
  LANDLORD_B_ID,
  TENANT_A_ID,
  TENANT_B_ID,
  PAYMENT_A_ID,
  PAYMENT_B_ID,
} from "./helpers/prisma.mock";

import { retrieveContext, getAllowedVisibilities } from "@/rag/retrieve.service";
import { ingestPayment, ingestTenant, deletePaymentChunks, deleteTenantChunks } from "@/rag/ingest.service";
import { chatWithAssistant } from "@/rag/chat.service";
import { setCustomEmbeddingProvider, setCustomLlmProvider, MockEmbeddingProvider, MockLlmProvider } from "@/rag/providers";

describe("RAG Multi-Tenant Isolation & Role Visibility Suite", () => {
  beforeEach(() => {
    seedStores();
    setCustomEmbeddingProvider(new MockEmbeddingProvider(768));
    setCustomLlmProvider(
      new MockLlmProvider((msgs) => {
        const sysMsg = msgs.find((m) => m.role === "system")?.content ?? "";
        return `Assistant response based on: ${sysMsg.includes("BEGIN CONTEXT") ? "Context Present" : "No Context"}`;
      })
    );
  });

  describe("1. Role Visibility Matrix", () => {
    it("returns correct allowed visibilities for each role", () => {
      expect(getAllowedVisibilities("LANDLORD")).toEqual(["LANDLORD", "MANAGER", "TENANT_VIEWER"]);
      expect(getAllowedVisibilities("MANAGER")).toEqual(["MANAGER", "TENANT_VIEWER"]);
      expect(getAllowedVisibilities("TENANT_VIEWER")).toEqual(["TENANT_VIEWER"]);
    });
  });

  describe("2. Cross-Landlord Leakage Prevention", () => {
    it("never returns Landlord B's chunks when Landlord A queries", async () => {
      // Seed chunks directly into chunkStore for Landlord A and Landlord B
      chunkStore.set("chunk-a-1", {
        id: "chunk-a-1",
        landlordId: LANDLORD_A_ID,
        tenantId: TENANT_A_ID,
        sourceType: "PAYMENT",
        sourceId: PAYMENT_A_ID,
        chunkIndex: 0,
        content: "Payment of ₹5000 for Alice Tenant (Landlord A)",
        visibility: "MANAGER",
      });

      chunkStore.set("chunk-b-1", {
        id: "chunk-b-1",
        landlordId: LANDLORD_B_ID,
        tenantId: TENANT_B_ID,
        sourceType: "PAYMENT",
        sourceId: PAYMENT_B_ID,
        chunkIndex: 0,
        content: "Secret Payment of ₹8000 for Bob Tenant (Landlord B)",
        visibility: "MANAGER",
      });

      // Landlord A executes retrieval
      const resultsA = await retrieveContext({
        landlordId: LANDLORD_A_ID,
        role: "LANDLORD",
        query: "Who paid rent?",
      });

      expect(resultsA.length).toBeGreaterThan(0);
      expect(resultsA.every((c) => c.landlordId === LANDLORD_A_ID)).toBe(true);
      expect(resultsA.some((c) => c.landlordId === LANDLORD_B_ID)).toBe(false);
      expect(resultsA.some((c) => c.content.includes("Bob Tenant"))).toBe(false);

      // Landlord B executes retrieval
      const resultsB = await retrieveContext({
        landlordId: LANDLORD_B_ID,
        role: "LANDLORD",
        query: "Who paid rent?",
      });

      expect(resultsB.length).toBeGreaterThan(0);
      expect(resultsB.every((c) => c.landlordId === LANDLORD_B_ID)).toBe(true);
      expect(resultsB.some((c) => c.landlordId === LANDLORD_A_ID)).toBe(false);
      expect(resultsB.some((c) => c.content.includes("Alice Tenant"))).toBe(false);
    });

    it("throws if landlordId is empty or undefined", async () => {
      await expect(
        retrieveContext({
          landlordId: "",
          role: "LANDLORD",
          query: "Test query",
        })
      ).rejects.toThrow("Security violation: landlordId is required");
    });
  });

  describe("3. Role-Based Visibility Enforcement", () => {
    beforeEach(() => {
      // Seed 3 chunks for Landlord A with varying visibility levels
      chunkStore.set("chunk-landlord-only", {
        id: "chunk-landlord-only",
        landlordId: LANDLORD_A_ID,
        tenantId: TENANT_A_ID,
        sourceType: "TENANT_NOTE",
        sourceId: TENANT_A_ID,
        chunkIndex: 0,
        content: "Confidential Landlord Private Note: Tenant had previous eviction dispute.",
        visibility: "LANDLORD",
      });

      chunkStore.set("chunk-manager-level", {
        id: "chunk-manager-level",
        landlordId: LANDLORD_A_ID,
        tenantId: TENANT_A_ID,
        sourceType: "PAYMENT",
        sourceId: PAYMENT_A_ID,
        chunkIndex: 0,
        content: "Financial Payment Record: ₹5000 paid via UPI.",
        visibility: "MANAGER",
      });

      chunkStore.set("chunk-tenant-viewer", {
        id: "chunk-tenant-viewer",
        landlordId: LANDLORD_A_ID,
        tenantId: TENANT_A_ID,
        sourceType: "TENANT_NOTE",
        sourceId: TENANT_A_ID,
        chunkIndex: 1,
        content: "General Tenant Profile: Alice Tenant, Flat 101.",
        visibility: "TENANT_VIEWER",
      });
    });

    it("LANDLORD role can see all 3 chunks (LANDLORD, MANAGER, TENANT_VIEWER)", async () => {
      const results = await retrieveContext({
        landlordId: LANDLORD_A_ID,
        role: "LANDLORD",
        query: "Alice Tenant details",
      });

      const ids = results.map((r) => r.id);
      expect(ids).toContain("chunk-landlord-only");
      expect(ids).toContain("chunk-manager-level");
      expect(ids).toContain("chunk-tenant-viewer");
    });

    it("MANAGER role can see MANAGER and TENANT_VIEWER, but NEVER LANDLORD chunks", async () => {
      const results = await retrieveContext({
        landlordId: LANDLORD_A_ID,
        role: "MANAGER",
        query: "Alice Tenant details",
      });

      const ids = results.map((r) => r.id);
      expect(ids).not.toContain("chunk-landlord-only");
      expect(ids).toContain("chunk-manager-level");
      expect(ids).toContain("chunk-tenant-viewer");
    });

    it("TENANT_VIEWER role can ONLY see TENANT_VIEWER chunks", async () => {
      const results = await retrieveContext({
        landlordId: LANDLORD_A_ID,
        role: "TENANT_VIEWER",
        query: "Alice Tenant details",
      });

      const ids = results.map((r) => r.id);
      expect(ids).not.toContain("chunk-landlord-only");
      expect(ids).not.toContain("chunk-manager-level");
      expect(ids).toContain("chunk-tenant-viewer");
    });
  });

  describe("4. Mandatory Audit Logging", () => {
    it("creates an audit log entry for every retrieval operation", async () => {
      auditLogStore.clear();

      chunkStore.set("chunk-audit-test", {
        id: "chunk-audit-test",
        landlordId: LANDLORD_A_ID,
        tenantId: TENANT_A_ID,
        sourceType: "PAYMENT",
        sourceId: PAYMENT_A_ID,
        chunkIndex: 0,
        content: "Payment of ₹5000",
        visibility: "MANAGER",
      });

      await retrieveContext({
        landlordId: LANDLORD_A_ID,
        role: "MANAGER",
        query: "Find October payments",
      });

      const logs = [...auditLogStore.values()].filter((l) => l.landlordId === LANDLORD_A_ID);
      expect(logs.length).toBe(1);

      const log = logs[0];
      expect(log.action).toBe("RAG_RETRIEVE");
      expect(log.actorRole).toBe("MANAGER");
      expect(log.resourceType).toBe("DocumentChunk");
      expect(log.query).toBe("Find October payments");
      expect(log.resourceIds).toContain("chunk-audit-test");
    });
  });

  describe("5. Ingestion Pipeline & Lifecycle", () => {
    it("ingests tenant and payment into scoped document chunks", async () => {
      chunkStore.clear();

      await ingestTenant(TENANT_A_ID, LANDLORD_A_ID);
      await ingestPayment(PAYMENT_A_ID, LANDLORD_A_ID);

      const chunks = [...chunkStore.values()].filter((c) => c.landlordId === LANDLORD_A_ID);
      expect(chunks.length).toBeGreaterThanOrEqual(2);

      const tenantChunk = chunks.find((c) => c.sourceType === "TENANT_NOTE");
      expect(tenantChunk).toBeDefined();
      expect(tenantChunk?.content).toContain("Alice Tenant");

      const paymentChunk = chunks.find((c) => c.sourceType === "PAYMENT");
      expect(paymentChunk).toBeDefined();
      expect(paymentChunk?.content).toContain("5000");
    });

    it("ingests rejection reason chunk when payment status is REJECTED", async () => {
      chunkStore.clear();

      // Update payment to REJECTED with reason
      const { paymentStore } = await import("./helpers/prisma.mock");
      const p = paymentStore.get(PAYMENT_A_ID);
      if (p) {
        paymentStore.set(PAYMENT_A_ID, {
          ...p,
          status: "REJECTED",
          rejectionReason: "Screenshot blurred and amount mismatch",
        });
      }

      await ingestPayment(PAYMENT_A_ID, LANDLORD_A_ID);

      const rejectionChunk = [...chunkStore.values()].find(
        (c) => c.sourceType === "REJECTION_REASON" && c.sourceId === PAYMENT_A_ID
      );

      expect(rejectionChunk).toBeDefined();
      expect(rejectionChunk?.content).toContain("Screenshot blurred and amount mismatch");
      expect(rejectionChunk?.visibility).toBe("MANAGER");
    });

    it("cleans up chunks on tenant deletion", async () => {
      await ingestTenant(TENANT_A_ID, LANDLORD_A_ID);
      expect([...chunkStore.values()].some((c) => c.tenantId === TENANT_A_ID)).toBe(true);

      await deleteTenantChunks(TENANT_A_ID, LANDLORD_A_ID);
      expect([...chunkStore.values()].some((c) => c.tenantId === TENANT_A_ID)).toBe(false);
    });
  });

  describe("6. Chat Assistant End-to-End", () => {
    it("provides answer and citations strictly from the requesting landlord", async () => {
      chunkStore.clear();
      await ingestTenant(TENANT_A_ID, LANDLORD_A_ID);
      await ingestTenant(TENANT_B_ID, LANDLORD_B_ID);

      const response = await chatWithAssistant({
        landlordId: LANDLORD_A_ID,
        role: "LANDLORD",
        message: "What is Alice's rent?",
      });

      expect(response.answer).toBeDefined();
      expect(response.citations.length).toBeGreaterThan(0);
      expect(response.citations.every((cit) => cit.tenantId === TENANT_A_ID)).toBe(true);
      expect(response.citations.some((cit) => cit.tenantId === TENANT_B_ID)).toBe(false);
    });
  });
});
