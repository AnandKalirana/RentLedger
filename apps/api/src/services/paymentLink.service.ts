import { prisma } from "@/config/database";
import { ApiError } from "@/utils/ApiError";
import { CreatePaymentLinkInput } from "@/validators/paymentLink.validator";

export async function createPaymentLink(landlordId: string, input: CreatePaymentLinkInput) {
  if (input.tenantId) {
    const tenant = await prisma.tenant.findFirst({
      where: { id: input.tenantId, landlordId },
    });
    if (!tenant) throw ApiError.notFound("Tenant not found");
  }

  return prisma.paymentLink.create({
    data: {
      landlordId,
      type: input.type,
      tenantId: input.tenantId,
      expiresAt: input.expiresAt,
    },
  });
}

export async function listPaymentLinks(landlordId: string) {
  return prisma.paymentLink.findMany({
    where: { landlordId },
    include: { tenant: { select: { id: true, fullName: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function deactivatePaymentLink(landlordId: string, linkId: string) {
  const link = await prisma.paymentLink.findFirst({ where: { id: linkId, landlordId } });
  if (!link) throw ApiError.notFound("Payment link not found");

  return prisma.paymentLink.update({
    where: { id: linkId },
    data: { isActive: false },
  });
}

/**
 * Public lookup by token — no landlordId available (the caller is an unauthenticated
 * tenant), so this MUST validate isActive/expiresAt itself and MUST NOT return any
 * sensitive landlord fields (email, phone, passwordHash, etc).
 */
export async function getPublicPaymentLink(token: string) {
  const link = await prisma.paymentLink.findUnique({
    where: { token },
    include: {
      landlord: {
        select: { businessName: true, upiId: true, upiQrImageUrl: true, fullName: true },
      },
      tenant: {
        select: { id: true, fullName: true, mobileNumber: true, email: true, monthlyRent: true },
      },
    },
  });

  if (!link || !link.isActive) {
    throw ApiError.notFound("This payment link is no longer active");
  }
  if (link.expiresAt && link.expiresAt < new Date()) {
    throw ApiError.notFound("This payment link has expired");
  }

  return {
    token: link.token,
    type: link.type,
    landlord: {
      displayName: link.landlord.businessName ?? link.landlord.fullName,
      upiId: link.landlord.upiId,
      upiQrImageUrl: link.landlord.upiQrImageUrl,
    },
    tenant:
      link.type === "TENANT_SPECIFIC" && link.tenant
        ? {
            id: link.tenant.id,
            fullName: link.tenant.fullName,
            mobileNumber: link.tenant.mobileNumber,
            email: link.tenant.email,
            monthlyRent: link.tenant.monthlyRent,
          }
        : null,
  };
}
