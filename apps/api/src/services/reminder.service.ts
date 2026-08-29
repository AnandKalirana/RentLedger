import { prisma } from "@/config/database";

/**
 * Send a WhatsApp message using Meta's WhatsApp Cloud API (free tier).
 *
 * The Cloud API uses pre-approved "message templates" for business-initiated
 * conversations (like reminders). You must create a template in Meta Business
 * Manager before sending. If no template is configured yet, we fall back to
 * logging the message so development/testing isn't blocked.
 */
export async function sendWhatsAppReminder(
  mobileNumber: string,
  tenantName: string,
  amount: number,
  dueDay: number
) {
  // Normalise to international format (default: India +91)
  const formattedMobile = mobileNumber.startsWith("+")
    ? mobileNumber.replace(/\D/g, "")          // "+91 98765 43210" → "919876543210"
    : `91${mobileNumber.replace(/\D/g, "")}`;   // "9876543210"     → "919876543210"

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken   = process.env.WHATSAPP_ACCESS_TOKEN;
  const templateName  = process.env.WHATSAPP_TEMPLATE_NAME ?? "rent_reminder";

  if (!phoneNumberId || !accessToken) {
    // Mock / log mode — credentials not configured yet
    console.log(`[WHATSAPP MOCK]: (WhatsApp Cloud API credentials not set)`);
    console.log(`  To: ${formattedMobile}`);
    console.log(`  Tenant: ${tenantName}, Amount: ₹${amount.toLocaleString("en-IN")}, Due day: ${dueDay}`);
    return;
  }

  try {
    const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: formattedMobile,
        type: "template",
        template: {
          name: templateName,
          language: { code: "en" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: tenantName },
                { type: "text", text: `₹${amount.toLocaleString("en-IN")}` },
                { type: "text", text: String(dueDay) },
              ],
            },
          ],
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[WHATSAPP ERROR]: Cloud API returned ${response.status}: ${errorBody}`);
    } else {
      const result = (await response.json()) as { messages?: Array<{ id: string }> };
      console.log(`[WHATSAPP SENT]: Reminder sent to ${formattedMobile}, message ID: ${result.messages?.[0]?.id}`);
    }
  } catch (err) {
    console.error("[WHATSAPP ERROR]: Failed to send via Cloud API:", err);
  }
}

export async function processDueReminders() {
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Find active tenants who have rent due in 3 days or today
  const targetTenants = await prisma.tenant.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { rentDueDay: currentDay },
        { rentDueDay: currentDay + 3 },
      ],
    },
    include: {
      payments: {
        where: {
          billingMonth: currentMonth,
          billingYear: currentYear,
          status: { in: ["PENDING", "VERIFIED"] },
        },
      },
    },
  });

  let sentCount = 0;
  for (const tenant of targetTenants) {
    // If no verified/pending payment for this month, send reminder
    if (tenant.payments.length === 0) {
      await sendWhatsAppReminder(
        tenant.mobileNumber,
        tenant.fullName,
        Number(tenant.monthlyRent),
        tenant.rentDueDay
      );
      sentCount++;
    }
  }

  return { processed: targetTenants.length, sent: sentCount };
}
