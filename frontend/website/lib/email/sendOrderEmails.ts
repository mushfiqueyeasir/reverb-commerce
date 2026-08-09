import "server-only";

import nodemailer from "nodemailer";
import { getSmtpSettings } from "@/lib/email/smtpSettings";
import {
  buildCustomerOrderEmailHtml,
  buildOwnerOrderEmailHtml,
  type OrderEmailPayload,
} from "@/lib/email/orderEmailHtml";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

type MailSetup =
  | { error: string }
  | {
      transporter: nodemailer.Transporter;
      user: string;
      fromName: string;
      fromEmail: string;
      notifyEmails: string[];
    };

async function createMailTransport(): Promise<MailSetup> {
  const smtp = await getSmtpSettings();
  const user = (smtp.username ?? smtp.fromEmail ?? "").trim();
  const pass = (smtp.password ?? "").replace(/\s+/g, "");

  if (!smtp.enabled) {
    return {
      error:
        "Order email notifications are disabled in Settings → Notifications.",
    };
  }
  if (!user || !pass) {
    return {
      error:
        "SMTP credentials missing. Configure them in Settings → Notifications.",
    };
  }

  const transporter =
    smtp.provider === "smtp" && smtp.host
      ? nodemailer.createTransport({
          host: smtp.host,
          port: smtp.port,
          secure: smtp.secure,
          requireTLS: !smtp.secure,
          auth: { user, pass },
        })
      : nodemailer.createTransport({
          service: "gmail",
          auth: { user, pass },
          requireTLS: true,
        });

  return {
    transporter,
    user,
    fromName: smtp.fromName || "VE Gear",
    fromEmail: (smtp.fromEmail || user).trim(),
    notifyEmails: smtp.notifyEmails.filter(isValidEmail),
  };
}

export async function sendOrderEmails(payload: OrderEmailPayload) {
  const setup = await createMailTransport();
  if ("error" in setup) {
    return { sent: false, reason: setup.error };
  }

  const { transporter, user, fromName, fromEmail, notifyEmails } = setup;

  const results: { to: string; role: "customer" | "owner"; ok: boolean }[] = [];
  const customerEmail = payload.customerEmail.trim();
  const customerNorm = normalizeEmail(customerEmail);
  const fromAddress = `"${fromName.replace(/"/g, "")}" <${fromEmail}>`;
  const ownerFrom = `"${fromName.replace(/"/g, "")} Orders" <${fromEmail}>`;

  // 1) Customer confirmation — To customer only.
  if (isValidEmail(customerEmail)) {
    try {
      await transporter.sendMail({
        from: fromAddress,
        to: customerEmail,
        subject: `Order received · ${payload.orderNumber}`,
        html: buildCustomerOrderEmailHtml(payload),
      });
      results.push({ to: customerEmail, role: "customer", ok: true });
    } catch {
      results.push({ to: customerEmail, role: "customer", ok: false });
    }
  }

  // 2) Owner alert — To SMTP user, CC notify list (not the customer).
  const ccList = notifyEmails.filter(
    (email) =>
      normalizeEmail(email) !== normalizeEmail(user) &&
      normalizeEmail(email) !== normalizeEmail(fromEmail) &&
      normalizeEmail(email) !== customerNorm,
  );

  const ownerTo = isValidEmail(fromEmail)
    ? fromEmail
    : isValidEmail(user)
      ? user
      : ccList[0];

  if (ownerTo) {
    try {
      await transporter.sendMail({
        from: ownerFrom,
        to: ownerTo,
        ...(ccList.filter((e) => normalizeEmail(e) !== normalizeEmail(ownerTo))
          .length
          ? {
              cc: ccList
                .filter((e) => normalizeEmail(e) !== normalizeEmail(ownerTo))
                .join(", "),
            }
          : {}),
        replyTo: isValidEmail(customerEmail) ? customerEmail : undefined,
        subject: `New order · ${payload.orderNumber} · ${payload.customerName}`,
        html: buildOwnerOrderEmailHtml(payload),
      });
      results.push({ to: ownerTo, role: "owner", ok: true });
      for (const cc of ccList) {
        if (normalizeEmail(cc) !== normalizeEmail(ownerTo)) {
          results.push({ to: cc, role: "owner", ok: true });
        }
      }
    } catch {
      results.push({ to: ownerTo, role: "owner", ok: false });
    }
  }

  return { sent: results.some((r) => r.ok), results };
}
