import nodemailer from "nodemailer";

function getFromAddress(): string {
  return process.env.SMTP_FROM ?? "KlikMoment <noreply@klikmoment.com>";
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getSmtpTransporter() {
  const port = Number(process.env.SMTP_PORT ?? 587);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendMail(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const from = getFromAddress();

  if (!isEmailConfigured()) {
    console.log("[email:dev]", options.subject, "->", options.to);
    return false;
  }

  try {
    await getSmtpTransporter().sendMail({ from, ...options });
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown SMTP error";
    console.error("[email:smtp]", message);
    return false;
  }
}

export async function sendOwnerActivationEmail(params: {
  to: string;
  eventName: string;
  activationUrl: string;
}): Promise<boolean> {
  return sendMail({
    to: params.to,
    subject: `Activate your KlikMoment event: ${stripTags(params.eventName)}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
        <h1 style="color: #7c3aed;">Welcome to KlikMoment</h1>
        <p>Your event <strong>${params.eventName}</strong> has been created.</p>
        <p>Click the button below to set your password and access your dashboard.</p>
        <a href="${params.activationUrl}" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0;">Activate Account</a>
        <p style="color:#666;font-size:14px;">This link expires in 7 days.</p>
      </div>
    `,
  });
}

export async function sendExpirationWarningEmail(params: {
  to: string;
  eventName: string;
  daysLeft: number;
  isAdmin?: boolean;
}) {
  await sendMail({
    to: params.to,
    subject: `Event expiring in ${params.daysLeft} days – ${stripTags(params.eventName)}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 560px;">
        <h2>Expiration reminder</h2>
        <p>Event <strong>${params.eventName}</strong> will expire in <strong>${params.daysLeft} days</strong>.</p>
        ${params.isAdmin ? "<p>As admin, you can extend the event from the admin panel.</p>" : "<p>Contact support if you need an extension.</p>"}
      </div>
    `,
  });
}

export async function sendExpirationNoticeEmail(params: {
  to: string;
  eventName: string;
  isAdmin?: boolean;
}) {
  await sendMail({
    to: params.to,
    subject: `Event expired – ${stripTags(params.eventName)}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 560px;">
        <h2>Event expired</h2>
        <p>Event <strong>${params.eventName}</strong> has expired. Uploads are now disabled.</p>
        ${params.isAdmin ? "<p>Manage this event in the admin panel.</p>" : ""}
      </div>
    `,
  });
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}
