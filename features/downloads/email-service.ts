import {
  createSmtpTransporter,
  formatSmtpFrom,
  resolveSmtpConfig,
  resolveSmtpConfigForRecipient,
} from "@/features/email/smtp-config";

interface SendDownloadEmailInput {
  settings: Record<string, string>;
  to: string;
  subject: string;
  body: string;
  attachmentBuffer: Buffer;
  attachmentName: string;
  attachmentContentType: string;
}

export async function sendDownloadEmail(input: SendDownloadEmailInput) {
  const smtp = resolveSmtpConfigForRecipient(input.settings, input.to);
  if (!smtp.configured) {
    throw new Error("SMTP host and from email are required.");
  }

  const transporter = createSmtpTransporter(smtp);

  try {
    const info = await transporter.sendMail({
      from: formatSmtpFrom(smtp),
      to: input.to,
      subject: input.subject,
      text: input.body,
      attachments: [
        {
          filename: input.attachmentName,
          content: input.attachmentBuffer,
          contentType: input.attachmentContentType,
        },
      ],
    });

    if (process.env.NODE_ENV === "development") {
      console.info("[smtp] sent", {
        to: input.to,
        messageId: info.messageId,
        response: info.response,
      });
    }

    return {
      messageId: info.messageId,
      response: info.response,
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown SMTP error";
    throw new Error(`Email could not be sent: ${detail}`);
  }
}

export async function verifySmtpConnection(settings: Record<string, string>) {
  const smtp = resolveSmtpConfig(settings);
  if (!smtp.configured) {
    throw new Error("SMTP host and from email are required.");
  }
  const transporter = createSmtpTransporter(smtp);
  await transporter.verify();
  return smtp;
}
