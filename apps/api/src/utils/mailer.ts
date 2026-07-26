import nodemailer, { Transporter } from "nodemailer";
import { env } from "@/config/env";

let transporter: Transporter | null = null;
let initialized = false;

function getTransporter(): Transporter | null {
  if (initialized) return transporter;
  initialized = true;

  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD) {
    console.log("SMTP not configured — email notifications are disabled (in-app notifications still work).");
    return null;
  }

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ?? 587,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
  });

  return transporter;
}

/**
 * Fire-and-forget email send. Failures are logged, never thrown — a broken SMTP
 * config must not break payment submission, which is the critical path.
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const client = getTransporter();
  if (!client) return;

  try {
    await client.sendMail({
      from: env.SMTP_FROM ?? "RentLedger <no-reply@rentledger.app>",
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error("Failed to send email:", err);
  }
}
