import { prisma } from "@/config/database";
import { ApiError } from "@/utils/ApiError";
import { resolveProofUrl } from "@/utils/storage";
import { getPublicPaymentLink } from "@/services/paymentLink.service";
import { notifyPaymentSubmitted } from "@/services/notification.service";
import { sendPaymentStatusEmail, sendPaymentSubmittedEmail } from "@/services/email.service";
import { ListPaymentsQuery, SubmitPaymentInput } from "@/validators/payment.validator";
import { Prisma } from "@rentledger/database";

/**
 * Public, unauthenticated submission. Resolves which Tenant this payment belongs
 * to from the link itself (TENANT_SPECIFIC) or by matching the submitted mobile
 * number against the landlord's existing tenants (REUSABLE) — a Payment can never
 * be created for a tenant the landlord hasn't onboarded first.
 */
export async function submitPublicPayment(
  token: string,
  input: SubmitPaymentInput,
  file: Express.Multer.File
) {
  const link = await prisma.paymentLink.findUnique({ where: { token } });
  if (!link || !link.isActive) {
    throw ApiError.notFound("This payment link is no longer active");
  }
  if (link.expiresAt && link.expiresAt < new Date()) {
    throw ApiError.notFound("This payment link has expired");
  }

  let tenantId = link.tenantId;
  if (!tenantId) {
    const tenant = await prisma.tenant.findFirst({
      where: { landlordId: link.landlordId, mobileNumber: input.submittedMobile },
    });
    if (!tenant) {
      throw ApiError.badRequest(
        "We couldn't find a tenant record matching this mobile number. Please contact your landlord to be added first."
      );
    }
    tenantId = tenant.id;
  }

  const payment = await prisma.payment.create({
    data: {
      landlordId: link.landlordId,
      tenantId,
      paymentLinkId: link.id,
      submittedName: input.submittedName,
      submittedMobile: input.submittedMobile,
      submittedEmail: input.submittedEmail || undefined,
      amount: input.amount,
      billingMonth: input.billingMonth,
      billingYear: input.billingYear,
      proofFileUrl: resolveProofUrl(file.filename),
      proofFileType: file.mimetype,
      status: "PENDING",
    },
  });

  await notifyPaymentSubmitted(link.landlordId, input.submittedName, input.amount);

  const landlord = await prisma.landlord.findUnique({
    where: { id: link.landlordId },
    select: { email: true },
  });
  if (landlord) {
    await sendPaymentSubmittedEmail(landlord.email, input.submittedName, input.amount);
  }

  return payment;
}

export async function listPayments(landlordId: string, query: ListPaymentsQuery) {
  const where: Prisma.PaymentWhereInput = {
    landlordId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.search
      ? {
          OR: [
            { submittedName: { contains: query.search, mode: "insensitive" } },
            { submittedMobile: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: { tenant: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.payment.count({ where }),
  ]);

  return { items, total, page: query.page, pageSize: query.pageSize };
}

export async function getPaymentById(landlordId: string, paymentId: string) {
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, landlordId },
    include: { tenant: { select: { id: true, fullName: true, mobileNumber: true, email: true } } },
  });
  if (!payment) throw ApiError.notFound("Payment not found");
  return payment;
}

export async function verifyPayment(landlordId: string, paymentId: string) {
  const payment = await getPaymentById(landlordId, paymentId);
  if (payment.status !== "PENDING") {
    throw ApiError.badRequest(`Payment is already ${payment.status.toLowerCase()}`);
  }

  const updated = await prisma.payment.update({
    where: { id: paymentId },
    data: { status: "VERIFIED", verifiedAt: new Date(), verifiedByLandlordId: landlordId },
  });

  if (payment.tenant.email) {
    await sendPaymentStatusEmail(payment.tenant.email, "VERIFIED", Number(payment.amount));
  }

  return updated;
}

export async function rejectPayment(landlordId: string, paymentId: string, reason: string) {
  const payment = await getPaymentById(landlordId, paymentId);
  if (payment.status !== "PENDING") {
    throw ApiError.badRequest(`Payment is already ${payment.status.toLowerCase()}`);
  }

  const updated = await prisma.payment.update({
    where: { id: paymentId },
    data: { status: "REJECTED", rejectionReason: reason, verifiedByLandlordId: landlordId },
  });

  if (payment.tenant.email) {
    await sendPaymentStatusEmail(payment.tenant.email, "REJECTED", Number(payment.amount), reason);
  }

  return updated;
}
