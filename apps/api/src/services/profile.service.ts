import { prisma } from "@/config/database";
import { UpdateProfileInput } from "@/validators/profile.validator";

const PUBLIC_PROFILE_FIELDS = {
  id: true,
  email: true,
  fullName: true,
  businessName: true,
  phone: true,
  upiId: true,
  upiQrImageUrl: true,
} as const;

export async function getProfile(landlordId: string) {
  return prisma.landlord.findUniqueOrThrow({
    where: { id: landlordId },
    select: PUBLIC_PROFILE_FIELDS,
  });
}

export async function updateProfile(landlordId: string, input: UpdateProfileInput) {
  // Only these fields are ever written — never spread req.body directly (see
  // auth.service.ts for why: prevents a client-supplied field from silently
  // becoming persisted, e.g. escalating to fields that shouldn't be user-writable).
  return prisma.landlord.update({
    where: { id: landlordId },
    data: {
      fullName: input.fullName,
      businessName: input.businessName || null,
      phone: input.phone || null,
      upiId: input.upiId || null,
    },
    select: PUBLIC_PROFILE_FIELDS,
  });
}

/**
 * Stores a single QR code image on the landlord's account. Because payment links
 * only ever read `landlord.upiQrImageUrl` (see paymentLink.service.ts), uploading
 * once here makes the same QR appear on every current and future payment link —
 * there's no per-link QR to manage.
 */
export async function updateQrImage(landlordId: string, url: string) {
  return prisma.landlord.update({
    where: { id: landlordId },
    data: { upiQrImageUrl: url },
    select: PUBLIC_PROFILE_FIELDS,
  });
}
