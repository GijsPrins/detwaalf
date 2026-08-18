import type { ContactMessageType } from "~/queries/contactMessages";

type ContactNotificationPayload = {
  id: string;
  email: string;
  type: ContactMessageType;
  message: string;
  adminUrl: string;
};

const typeLabels: Record<ContactMessageType, string> = {
  general: "Algemene vraag",
  data_request: "Mijn gegevens opvragen",
  delete_account: "Account verwijderen",
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeEmail(email: string) {
  return email.replace(/[\r\n]/g, "").trim();
}

export async function sendContactMessageNotification(
  payload: ContactNotificationPayload,
) {
  const config = useRuntimeConfig();
  const apiKey = config.brevoApiKey || process.env.BREVO_API_KEY || "";
  const fromEmail = normalizeEmail(
    config.contactNotificationFrom ||
      process.env.CONTACT_NOTIFICATION_FROM ||
      "",
  );
  const toEmail = normalizeEmail(
    config.contactNotificationTo || process.env.CONTACT_NOTIFICATION_TO || "",
  );
  const replyToEmail = normalizeEmail(payload.email);

  if (!apiKey || !isValidEmail(fromEmail) || !isValidEmail(toEmail)) {
    throw new Error("Contact notification email is not configured");
  }

  const body = [
    "Er is een nieuw bericht binnengekomen via TwaalfProvincies.run.",
    "",
    `Van: ${payload.email}`,
    `Onderwerp: ${typeLabels[payload.type]}`,
    "",
    "Bericht:",
    payload.message,
    "",
    `Openen in beheer: ${payload.adminUrl}`,
    "",
    `Bericht-id: ${payload.id}`,
  ].join("\n");

  await $fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    timeout: 3000,
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: {
      sender: {
        name: "TwaalfProvincies.run",
        email: fromEmail,
      },
      to: [{ email: toEmail }],
      replyTo: isValidEmail(replyToEmail)
        ? { email: replyToEmail }
        : undefined,
      subject: "Nieuw bericht via TwaalfProvincies.run",
      textContent: body,
      tags: ["contact-message"],
    },
  });
}
