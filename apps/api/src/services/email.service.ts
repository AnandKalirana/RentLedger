import nodemailer, { Transporter } from "nodemailer";
import { env } from "@/config/env";

const isConfigured = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD);

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!isConfigured) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ?? 587,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    });
  }
  return transporter;
}

async function sendMail(to: string, subject: string, html: string) {
  const client = getTransporter();
  if (!client) {
    // SMTP isn't configured — this is expected in dev. The in-app notification
    // (see notification.service.ts) still fires either way, so nothing is lost.
    return;
  }
  try {
    await client.sendMail({ from: env.SMTP_FROM ?? env.SMTP_USER, to, subject, html });
  } catch (err) {
    // Never let an email delivery failure fail the request that triggered it.
    console.error("Failed to send email notification:", err);
  }
}

export async function sendPaymentSubmittedEmail(
  landlordEmail: string,
  tenantName: string,
  amount: number
) {
  await sendMail(
    landlordEmail,
    "New rent payment submitted for verification",
    `<p><strong>${tenantName}</strong> submitted a payment of ₹${amount.toLocaleString("en-IN")} for verification.</p>
     <p>Log in to RentLedger to review the proof and verify or reject it.</p>`
  );
}

export async function sendPaymentStatusEmail(
  tenantEmail: string,
  status: "VERIFIED" | "REJECTED",
  amount: number,
  reason?: string | null
) {
  const subject = status === "VERIFIED" ? "Your rent payment was verified" : "Your rent payment was rejected";
  const body =
    status === "VERIFIED"
      ? `<p>Your payment of ₹${amount.toLocaleString("en-IN")} has been verified. Thank you!</p>`
      : `<p>Your payment of ₹${amount.toLocaleString("en-IN")} was rejected.</p>
         ${reason ? `<p>Reason: ${reason}</p>` : ""}
         <p>Please contact your landlord or resubmit with a valid payment proof.</p>`;
  await sendMail(tenantEmail, subject, body);
}
