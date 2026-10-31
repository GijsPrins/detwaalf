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

  await sendContactEmail({
    subject: "Nieuw bericht via TwaalfProvincies.run",
    text: body,
    replyTo: payload.email,
    tag: "contact-message",
  });
}

export async function sendContactReplyNotification(payload: {
  email: string;
  body: string;
  messagesUrl: string;
}) {
  if (!isValidEmail(payload.email)) throw new Error("Invalid notification recipient");
  await sendContactEmail({
    to: payload.email,
    subject: "Antwoord op je bericht aan TwaalfProvincies.run",
    text: [
      "Je hebt een antwoord ontvangen van TwaalfProvincies.run.",
      "",
      payload.body,
      "",
      `Bekijk je berichten: ${payload.messagesUrl}`,
      "",
      "Wil je reageren? Stuur een nieuw bericht via het contactformulier in de app.",
    ].join("\n"),
    tag: "contact-reply",
  });
}

async function sendContactEmail(input: {
  to?: string;
  subject: string;
  text: string;
  replyTo?: string;
  tag: string;
}) {
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
  const replyToEmail = normalizeEmail(input.replyTo || toEmail);

  if (!apiKey || !isValidEmail(fromEmail) || !isValidEmail(toEmail)) {
    throw new Error("Contact notification email is not configured");
  }

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
      to: [{ email: input.to || toEmail }],
      replyTo: isValidEmail(replyToEmail)
        ? { email: replyToEmail }
        : undefined,
      subject: input.subject,
      textContent: input.text,
      tags: [input.tag],
    },
  });
}
