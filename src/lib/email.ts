import nodemailer from "nodemailer";
import { stripHtml } from "@/lib/sanitize";

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
    subject: `Aktivirajte KlikMoment nalog — ${params.eventName}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
        <h1 style="color: #C4A574;">Dobrodošli u KlikMoment</h1>
        <p>Vaš događaj <strong>${params.eventName}</strong> je spreman.</p>
        <p>Kliknite na dugme ispod da postavite lozinku i pristupite galeriji.</p>
        <a href="${params.activationUrl}" style="display:inline-block;background:#2C2825;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0;">Aktiviraj nalog</a>
        <p style="color:#666;font-size:14px;">Link važi 7 dana.</p>
      </div>
    `,
  });
}

export async function sendPaymentInstructionsEmail(params: {
  to: string;
  ownerName: string;
  eventName: string;
  packageName: string;
  priceRsd: number;
  bankName: string | null;
  accountHolder: string | null;
  accountNumber: string | null;
  instructions: string | null;
  reference: string;
}) {
  const bankBlock =
    params.bankName && params.accountNumber
      ? `
        <p><strong>Banka:</strong> ${params.bankName}</p>
        <p><strong>Primalac:</strong> ${params.accountHolder ?? "—"}</p>
        <p><strong>Račun:</strong> ${params.accountNumber}</p>
        <p><strong>Poziv na broj:</strong> ${params.reference}</p>
      `
      : "<p>Kontaktirajte nas za podatke o uplati.</p>";

  await sendMail({
    to: params.to,
    subject: `Uputstva za uplatu — ${params.eventName}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 560px;">
        <h2>Zdravo ${params.ownerName},</h2>
        <p>Hvala na zahtevu za galeriju <strong>${params.eventName}</strong>.</p>
        <p><strong>Paket:</strong> ${params.packageName}<br/>
        <strong>Iznos:</strong> ${params.priceRsd.toLocaleString("sr-RS")} RSD</p>
        <h3>Podaci za uplatu</h3>
        ${bankBlock}
        ${params.instructions ? `<p>${params.instructions}</p>` : ""}
        <p style="color:#666;font-size:14px;">Galerija će biti aktivirana nakon potvrde uplate (obično u roku od 24h).</p>
      </div>
    `,
  });
}

export async function sendNewPendingOrderEmail(params: {
  to: string;
  eventName: string;
  ownerEmail: string;
  packageName: string;
  adminUrl: string;
}) {
  await sendMail({
    to: params.to,
    subject: `Novi zahtev na čekanju — ${params.eventName}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 560px;">
        <h2>Novi zahtev za galeriju</h2>
        <p><strong>Događaj:</strong> ${params.eventName}</p>
        <p><strong>Email:</strong> ${params.ownerEmail}</p>
        <p><strong>Paket:</strong> ${params.packageName}</p>
        <a href="${params.adminUrl}">Otvori u admin panelu</a>
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
    subject: `Događaj ističe za ${params.daysLeft} dana — ${stripHtml(params.eventName)}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 560px;">
        <h2>Podsetnik</h2>
        <p>Događaj <strong>${stripHtml(params.eventName)}</strong> ističe za <strong>${params.daysLeft} dana</strong>.</p>
        ${params.isAdmin ? "<p>Možete produžiti događaj iz admin panela.</p>" : "<p>Kontaktirajte nas ako vam treba produženje.</p>"}
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
    subject: `Događaj je istekao — ${stripHtml(params.eventName)}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 560px;">
        <h2>Događaj je istekao</h2>
        <p>Događaj <strong>${stripHtml(params.eventName)}</strong> je istekao. Slanje medija je isključeno.</p>
        ${params.isAdmin ? "<p>Upravljajte događajem u admin panelu.</p>" : ""}
      </div>
    `,
  });
}
