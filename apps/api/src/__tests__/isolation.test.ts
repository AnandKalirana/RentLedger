/**
 * Phase 1 — Landlord isolation tests
 *
 * These tests prove, at the service layer, that landlord A can NEVER read or
 * modify landlord B's tenants, payments, or payment links, and vice versa.
 *
 * The Prisma client is mocked in-process — no real DB connection is opened.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Must be vi.mock() before any import that resolves the module under test.
vi.mock("@/config/database", async () => {
  const { mockPrisma } = await import("./helpers/prisma.mock");
  return { prisma: mockPrisma };
});

// Also mock storage so tenant/payment services don't crash on missing config
vi.mock("@/utils/storage", () => ({
  persistUploadedFile: vi.fn().mockResolvedValue("https://example.com/file"),
}));

// Silence email/notifications in these tests
vi.mock("@/services/email.service", () => ({
  sendPaymentStatusEmail: vi.fn(),
  sendPaymentSubmittedEmail: vi.fn(),
}));
vi.mock("@/services/notification.service", () => ({
  notifyPaymentSubmitted: vi.fn(),
}));

import * as tenantService from "@/services/tenant.service";
import * as paymentService from "@/services/payment.service";
import * as paymentLinkService from "@/services/paymentLink.service";
import {
  seedStores,
  LANDLORD_A_ID,
  LANDLORD_B_ID,
  TENANT_A_ID,
  TENANT_B_ID,
  PAYMENT_A_ID,
  PAYMENT_B_ID,
  LINK_A_ID,
  LINK_B_ID,
} from "./helpers/prisma.mock";

// ---------------------------------------------------------------------------
// Helper — ApiError throws with .statusCode
// ---------------------------------------------------------------------------
async function expectNotFound(fn: () => Promise<unknown>) {
  try {
    await fn();
    expect.fail("Expected an error to be thrown");
  } catch (err: unknown) {
    const e = err as { statusCode?: number };
    expect(e.statusCode).toBe(404);
  }
}

// ---------------------------------------------------------------------------

describe("Tenant isolation", () => {
  beforeEach(() => {
    seedStores();
  });

  it("landlord A sees only their own tenants", async () => {
    const tenants = await tenantService.listTenants(LANDLORD_A_ID);
    expect(tenants).toHaveLength(1);
    expect(tenants[0].id).toBe(TENANT_A_ID);
    expect(tenants[0].landlordId).toBe(LANDLORD_A_ID);
  });

  it("landlord B sees only their own tenants", async () => {
    const tenants = await tenantService.listTenants(LANDLORD_B_ID);
    expect(tenants).toHaveLength(1);
    expect(tenants[0].id).toBe(TENANT_B_ID);
    expect(tenants[0].landlordId).toBe(LANDLORD_B_ID);
  });

  it("landlord A cannot read landlord B's tenant by ID", async () => {
    await expectNotFound(() => tenantService.getTenantById(LANDLORD_A_ID, TENANT_B_ID));
  });

  it("landlord B cannot read landlord A's tenant by ID", async () => {
    await expectNotFound(() => tenantService.getTenantById(LANDLORD_B_ID, TENANT_A_ID));
  });

  it("landlord A cannot update landlord B's tenant", async () => {
    await expectNotFound(() =>
      tenantService.updateTenant(LANDLORD_A_ID, TENANT_B_ID, { fullName: "Hacked" })
    );
  });

  it("landlord B cannot update landlord A's tenant", async () => {
    await expectNotFound(() =>
      tenantService.updateTenant(LANDLORD_B_ID, TENANT_A_ID, { fullName: "Hacked" })
    );
  });

  it("landlord A cannot delete landlord B's tenant", async () => {
    await expectNotFound(() => tenantService.deleteTenant(LANDLORD_A_ID, TENANT_B_ID));
  });

  it("landlord B cannot delete landlord A's tenant", async () => {
    await expectNotFound(() => tenantService.deleteTenant(LANDLORD_B_ID, TENANT_A_ID));
  });

  it("landlord A cannot upload lease for landlord B's tenant", async () => {
    await expectNotFound(() =>
      tenantService.uploadLeaseDocument(LANDLORD_A_ID, TENANT_B_ID, "https://evil.example/lease")
    );
  });

  it("new tenant created by landlord A is scoped to landlord A", async () => {
    const input = {
      fullName: "New Alice Tenant",
      mobileNumber: "9999999999",
      monthlyRent: 4000,
      monthlyMaintenance: 0,
      securityDeposit: 0,
      moveInDate: new Date("2026-01-01"),
      rentDueDay: 1,
      status: "ACTIVE" as const,
    };
    const created = await tenantService.createTenant(LANDLORD_A_ID, input);
    expect(created.landlordId).toBe(LANDLORD_A_ID);

    // Landlord B cannot see or touch this new tenant
    await expectNotFound(() => tenantService.getTenantById(LANDLORD_B_ID, created.id));
  });
});

// ---------------------------------------------------------------------------

describe("Payment isolation", () => {
  beforeEach(() => {
    seedStores();
  });

  it("landlord A sees only their own payments", async () => {
    const result = await paymentService.listPayments(LANDLORD_A_ID, {
      page: 1,
      pageSize: 10,
    });
    expect(result.items.every((p) => p.landlordId === LANDLORD_A_ID)).toBe(true);
    expect(result.items.some((p) => p.landlordId === LANDLORD_B_ID)).toBe(false);
  });

  it("landlord B sees only their own payments", async () => {
    const result = await paymentService.listPayments(LANDLORD_B_ID, {
      page: 1,
      pageSize: 10,
    });
    expect(result.items.every((p) => p.landlordId === LANDLORD_B_ID)).toBe(true);
  });

  it("landlord A cannot read landlord B's payment by ID", async () => {
    await expectNotFound(() => paymentService.getPaymentById(LANDLORD_A_ID, PAYMENT_B_ID));
  });

  it("landlord B cannot read landlord A's payment by ID", async () => {
    await expectNotFound(() => paymentService.getPaymentById(LANDLORD_B_ID, PAYMENT_A_ID));
  });

  it("landlord A cannot verify landlord B's payment", async () => {
    await expectNotFound(() => paymentService.verifyPayment(LANDLORD_A_ID, PAYMENT_B_ID));
  });

  it("landlord B cannot reject landlord A's payment", async () => {
    await expectNotFound(() =>
      paymentService.rejectPayment(LANDLORD_B_ID, PAYMENT_A_ID, "Attempted cross-tenant rejection")
    );
  });
});

// ---------------------------------------------------------------------------

describe("PaymentLink isolation", () => {
  beforeEach(() => {
    seedStores();
  });

  it("landlord A sees only their own links", async () => {
    const links = await paymentLinkService.listPaymentLinks(LANDLORD_A_ID);
    expect(links.every((l) => l.landlordId === LANDLORD_A_ID)).toBe(true);
    expect(links.some((l) => l.landlordId === LANDLORD_B_ID)).toBe(false);
  });

  it("landlord B sees only their own links", async () => {
    const links = await paymentLinkService.listPaymentLinks(LANDLORD_B_ID);
    expect(links.every((l) => l.landlordId === LANDLORD_B_ID)).toBe(true);
  });

  it("landlord A cannot deactivate landlord B's link", async () => {
    await expectNotFound(() =>
      paymentLinkService.deactivatePaymentLink(LANDLORD_A_ID, LINK_B_ID)
    );
  });

  it("landlord B cannot deactivate landlord A's link", async () => {
    await expectNotFound(() =>
      paymentLinkService.deactivatePaymentLink(LANDLORD_B_ID, LINK_A_ID)
    );
  });
});
