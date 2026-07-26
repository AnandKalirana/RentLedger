import { prisma } from "@/config/database";

export async function notifyPaymentSubmitted(landlordId: string, tenantName: string, amount: number) {
  return prisma.notification.create({
    data: {
      landlordId,
      type: "PAYMENT_SUBMITTED",
      title: "New payment submitted",
      message: `${tenantName} submitted a payment of ₹${amount.toLocaleString("en-IN")} for verification.`,
    },
  });
}

export async function listNotifications(landlordId: string, unreadOnly = false) {
  return prisma.notification.findMany({
    where: { landlordId, ...(unreadOnly ? { isRead: false } : {}) },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function markNotificationRead(landlordId: string, notificationId: string) {
  return prisma.notification.updateMany({
    where: { id: notificationId, landlordId },
    data: { isRead: true },
  });
}
