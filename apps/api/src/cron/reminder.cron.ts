import cron from "node-cron";
import { processDueReminders } from "@/services/reminder.service";

/**
 * Scheduled cron job: Runs daily at 09:00 AM to send automated WhatsApp rent due reminders.
 */
export function initReminderCron() {
  cron.schedule("0 9 * * *", async () => {
    console.log("[CRON]: Running daily WhatsApp rent reminder check...");
    try {
      const result = await processDueReminders();
      console.log(`[CRON]: Processed ${result.processed} tenants, sent ${result.sent} WhatsApp reminders.`);
    } catch (err) {
      console.error("[CRON ERROR]: Error running WhatsApp reminder cron:", err);
    }
  });

  console.log("[CRON]: WhatsApp rent reminder scheduler initialized (Daily at 09:00 AM).");
}
