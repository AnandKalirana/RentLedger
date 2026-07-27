import { prisma } from "@/config/database";

export async function getDashboardSummary(landlordId: string) {
  const now = new Date();
  const billingMonth = now.getMonth() + 1;
  const billingYear = now.getFullYear();

  const [
    revenueAgg,
    pendingCount,
    verifiedCount,
    activeTenants,
    verifiedTenantIdsThisMonth,
    recentTransactions,
  ] = await Promise.all([
    prisma.payment.aggregate({
      where: { landlordId, status: "VERIFIED", billingMonth, billingYear },
      _sum: { amount: true },
    }),
    prisma.payment.count({ where: { landlordId, status: "PENDING" } }),
    prisma.payment.count({ where: { landlordId, status: "VERIFIED", billingMonth, billingYear } }),
    prisma.tenant.findMany({
      where: { landlordId, status: "ACTIVE" },
      select: { id: true, monthlyRent: true },
    }),
    prisma.payment.findMany({
      where: { landlordId, status: "VERIFIED", billingMonth, billingYear },
      select: { tenantId: true },
      distinct: ["tenantId"],
    }),
    prisma.payment.findMany({
      where: { landlordId },
      include: { tenant: { select: { fullName: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const paidTenantIds = new Set(verifiedTenantIdsThisMonth.map((p: (typeof verifiedTenantIdsThisMonth)[0]) => p.tenantId));
  const totalDueAmount = activeTenants
    .filter((tenant: (typeof activeTenants)[0]) => !paidTenantIds.has(tenant.id))
    .reduce((sum: number, tenant: (typeof activeTenants)[0]) => sum + Number(tenant.monthlyRent), 0);

  return {
    currentMonthRevenue: Number(revenueAgg._sum.amount ?? 0),
    pendingPaymentsCount: pendingCount,
    verifiedPaymentsCount: verifiedCount,
    totalDueAmount,
    activeTenantsCount: activeTenants.length,
    recentTransactions: recentTransactions.map((payment: (typeof recentTransactions)[0]) => ({
      id: payment.id,
      tenantId: payment.tenantId,
      tenantName: payment.tenant.fullName,
      amount: Number(payment.amount),
      billingMonth: payment.billingMonth,
      billingYear: payment.billingYear,
      status: payment.status,
      proofFileUrl: payment.proofFileUrl,
      submittedName: payment.submittedName,
      submittedMobile: payment.submittedMobile,
      submittedEmail: payment.submittedEmail,
      rejectionReason: payment.rejectionReason,
      createdAt: payment.createdAt.toISOString(),
      verifiedAt: payment.verifiedAt?.toISOString() ?? null,
    })),
  };
}
