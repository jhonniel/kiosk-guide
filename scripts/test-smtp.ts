/**
 * Verify SMTP credentials from .env / database settings.
 *
 * Usage:
 *   npm run smtp:test
 *   npm run smtp:test -- someone@example.com
 */
import "dotenv/config";
import { getResolvedSettings } from "@/features/settings/resolve-settings";
import { verifySmtpConnection, sendDownloadEmail } from "@/features/downloads/email-service";

async function main() {
  const settings = await getResolvedSettings();
  const smtp = await verifySmtpConnection(settings);

  console.log("SMTP connection OK:");
  console.log(`  host: ${smtp.host}:${smtp.port}`);
  console.log(`  from: ${smtp.fromName} <${smtp.fromEmail}>`);
  console.log(`  auth: ${smtp.user ? "yes" : "no"}`);

  const testTo = process.argv[2]?.trim();
  if (testTo) {
    await sendDownloadEmail({
      settings,
      to: testTo,
      subject: "Kiosk SMTP test",
      body: "If you received this message, SMTP is configured correctly for the LGU Kiosk.",
      attachmentBuffer: Buffer.from("Kiosk SMTP test attachment\n", "utf8"),
      attachmentName: "kiosk-smtp-test.txt",
      attachmentContentType: "text/plain",
    });
    console.log(`Test email sent to ${testTo}`);
  } else {
    console.log("Tip: pass a recipient to send a test email, e.g. npm run smtp:test -- you@example.com");
  }
}

main().catch((error) => {
  console.error("SMTP test failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
