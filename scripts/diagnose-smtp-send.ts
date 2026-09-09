import "dotenv/config";
import nodemailer from "nodemailer";
import { getResolvedSettings } from "@/features/settings/resolve-settings";
import { createSmtpTransporter, formatSmtpFrom, resolveSmtpConfig } from "@/features/email/smtp-config";

async function main() {
  const to = process.argv[2]?.trim() ?? "devjry@gmail.com";
  const settings = await getResolvedSettings();
  const smtp = resolveSmtpConfig(settings);

  console.log("Config:", {
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    user: smtp.user,
    from: formatSmtpFrom(smtp),
    to,
  });

  const transporter = createSmtpTransporter(smtp);
  transporter.set("logger", true);
  transporter.set("debug", true);

  const info = await transporter.sendMail({
    from: formatSmtpFrom(smtp),
    to,
    subject: "Kiosk delivery test",
    text: `Test message sent at ${new Date().toISOString()}\nIf you receive this, outbound mail works.`,
  });

  console.log("\nServer response:");
  console.log("  messageId:", info.messageId);
  console.log("  response:", info.response);
  console.log("  accepted:", info.accepted);
  console.log("  rejected:", info.rejected);
  console.log("  envelope:", info.envelope);
}

main().catch((error) => {
  console.error("\nSend failed:");
  console.error(error);
  process.exit(1);
});
