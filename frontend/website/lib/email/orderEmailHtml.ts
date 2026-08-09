import type { ThemePalette } from "@/lib/theme/palette";
import { DEFAULT_PALETTE } from "@/lib/theme/palette";

export type OrderEmailItem = {
  title: string;
  size: string | null;
  quantity: number;
  unitPrice: number;
  imageUrl?: string | null;
};

export type OrderEmailPayload = {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  shippingLabel: string;
  items: OrderEmailItem[];
  subtotal: number;
  shipping: number;
  discount?: number;
  discountPercent?: number;
  promoCode?: string | null;
  total: number;
  currencyLabel?: string;
  storeName?: string;
  logoUrl?: string | null;
  palette?: ThemePalette;
};

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function money(amount: number, currency = "BDT") {
  return `${currency} ${Number(amount).toLocaleString("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function itemsRows(
  items: OrderEmailItem[],
  currency: string,
  colors: ThemePalette,
) {
  return items
    .map((item) => {
      const line = item.unitPrice * item.quantity;
      const img = item.imageUrl?.trim();
      const thumb = img
        ? `<img src="${escapeHtml(img)}" alt="" width="56" height="70" style="display:block;width:56px;height:70px;object-fit:cover;border-radius:8px;border:1px solid ${colors.border};background:${colors.surface};" />`
        : `<div style="width:56px;height:70px;border-radius:8px;border:1px solid ${colors.border};background:${colors.surface};"></div>`;

      return `
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid ${colors.border};vertical-align:top;">
            <table role="presentation" style="border-collapse:collapse;">
              <tr>
                <td style="padding-right:12px;vertical-align:top;">${thumb}</td>
                <td style="vertical-align:middle;font-size:14px;color:${colors.foreground};">
                  <div style="font-weight:600;">${escapeHtml(item.title)}</div>
                   ${item.size ? `<div style="color:${colors.mutedForeground};font-size:13px;margin-top:4px;">Size: ${escapeHtml(item.size)}</div>` : ""}
                </td>
              </tr>
            </table>
          </td>
          <td style="padding:14px 0;border-bottom:1px solid ${colors.border};text-align:center;font-size:14px;color:${colors.foreground};vertical-align:middle;">
            ${item.quantity}
          </td>
          <td style="padding:14px 0;border-bottom:1px solid ${colors.border};text-align:right;font-size:14px;color:${colors.foreground};vertical-align:middle;">
            ${escapeHtml(money(line, currency))}
          </td>
        </tr>`;
    })
    .join("");
}

function shell(opts: {
  title: string;
  intro: string;
  payload: OrderEmailPayload;
  footerNote: string;
}) {
  const { title, intro, payload, footerNote } = opts;
  const currency = payload.currencyLabel || "BDT";
  const year = new Date().getFullYear();
  const storeName = payload.storeName?.trim() || "Store";
  const colors = payload.palette ?? DEFAULT_PALETTE;
  const logo = payload.logoUrl?.trim();

  const headerBrand = logo
    ? `<img src="${escapeHtml(logo)}" alt="${escapeHtml(storeName)}" width="160" style="display:block;margin:0 auto;max-width:160px;height:auto;" />`
    : `<div style="font-size:22px;font-weight:700;letter-spacing:-0.03em;color:${colors.foreground};">${escapeHtml(storeName)}</div>
       <div style="margin-top:6px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${colors.primary};">Online Store</div>`;

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:${colors.background};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
    <table role="presentation" style="width:100%;border-collapse:collapse;background:${colors.background};">
      <tr>
        <td style="padding:32px 16px;">
          <table role="presentation" style="width:100%;max-width:600px;margin:0 auto;background:${colors.card};border:1px solid ${colors.border};border-collapse:collapse;">
            <tr>
              <td style="padding:28px 28px 20px;border-bottom:1px solid ${colors.border};text-align:center;background:${colors.surface};">
                ${headerBrand}
              </td>
            </tr>
            <tr>
              <td style="padding:28px 28px 8px;">
                <h1 style="margin:0;font-size:22px;font-weight:600;color:${colors.foreground};">${escapeHtml(title)}</h1>
                <p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:${colors.mutedForeground};">${escapeHtml(intro)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px;">
                <div style="padding:14px 16px;background:${colors.surface};border:1px solid ${colors.border};">
                  <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${colors.primary};">Order number</div>
                  <div style="margin-top:4px;font-size:18px;font-weight:600;color:${colors.foreground};">${escapeHtml(payload.orderNumber)}</div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 28px 4px;">
                <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${colors.primary};margin-bottom:10px;">Customer</div>
                <div style="font-size:15px;color:${colors.foreground};font-weight:600;">${escapeHtml(payload.customerName)}</div>
                <div style="font-size:13px;color:${colors.mutedForeground};margin-top:4px;">
                  <a href="mailto:${escapeHtml(payload.customerEmail)}" style="color:${colors.primary};text-decoration:none;">${escapeHtml(payload.customerEmail)}</a>
                </div>
                <div style="font-size:13px;color:${colors.mutedForeground};margin-top:2px;">${escapeHtml(payload.customerPhone)}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px 8px;">
                <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${colors.primary};margin-bottom:10px;">Items</div>
                <table role="presentation" style="width:100%;border-collapse:collapse;">
                  <tr>
                    <td style="padding-bottom:8px;border-bottom:1px solid ${colors.border};font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:${colors.mutedForeground};">Product</td>
                    <td style="padding-bottom:8px;border-bottom:1px solid ${colors.border};font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:${colors.mutedForeground};text-align:center;">Qty</td>
                    <td style="padding-bottom:8px;border-bottom:1px solid ${colors.border};font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:${colors.mutedForeground};text-align:right;">Total</td>
                  </tr>
                  ${itemsRows(payload.items, currency, colors)}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px 8px;">
                <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${colors.primary};margin-bottom:10px;">Delivery</div>
                <div style="padding:14px 16px;background:${colors.surface};border-left:3px solid ${colors.primary};">
                  <div style="font-size:14px;font-weight:600;color:${colors.foreground};">${escapeHtml(payload.customerName)}</div>
                  <div style="font-size:13px;color:${colors.mutedForeground};margin-top:6px;line-height:1.5;">${escapeHtml(payload.deliveryAddress)}</div>
                  <div style="font-size:13px;color:${colors.mutedForeground};margin-top:6px;">${escapeHtml(payload.shippingLabel)}</div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px 28px;">
                <table role="presentation" style="width:100%;border-collapse:collapse;">
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:${colors.mutedForeground};">Subtotal</td>
                    <td style="padding:6px 0;font-size:13px;color:${colors.mutedForeground};text-align:right;">${escapeHtml(money(payload.subtotal, currency))}</td>
                  </tr>
                  ${
                    payload.discount && payload.discount > 0
                      ? `<tr>
                    <td style="padding:6px 0;font-size:13px;color:${colors.primary};">Promo${payload.promoCode ? ` (${escapeHtml(payload.promoCode)})` : ""}${payload.discountPercent ? ` · ${payload.discountPercent}%` : ""}</td>
                    <td style="padding:6px 0;font-size:13px;color:${colors.primary};text-align:right;">-${escapeHtml(money(payload.discount, currency))}</td>
                  </tr>`
                      : ""
                  }
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:${colors.mutedForeground};">Delivery</td>
                    <td style="padding:6px 0;font-size:13px;color:${colors.mutedForeground};text-align:right;">${escapeHtml(money(payload.shipping, currency))}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 0 0;font-size:16px;font-weight:700;color:${colors.foreground};border-top:1px solid ${colors.border};">Total</td>
                    <td style="padding:12px 0 0;font-size:16px;font-weight:700;color:${colors.primary};text-align:right;border-top:1px solid ${colors.border};">${escapeHtml(money(payload.total, currency))}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 28px;background:${colors.surface};border-top:1px solid ${colors.border};text-align:center;">
                <p style="margin:0;font-size:12px;color:${colors.mutedForeground};line-height:1.6;">${escapeHtml(footerNote)}</p>
                <p style="margin:10px 0 0;font-size:11px;color:${colors.mutedForeground};">© ${year} ${escapeHtml(storeName)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function buildCustomerOrderEmailHtml(payload: OrderEmailPayload) {
  const store = payload.storeName?.trim() || "Store";
  return shell({
    title: "Order received",
    intro: `Hi ${payload.customerName}, thanks for shopping with ${store}. We've received your order and will process it shortly.`,
    payload,
    footerNote: `This is a confirmation that we received your order. We'll contact you on your phone if we need anything else.`,
  });
}

export function buildOwnerOrderEmailHtml(payload: OrderEmailPayload) {
  const store = payload.storeName?.trim() || "Store";
  return shell({
    title: "New order received",
    intro: `A customer just placed order ${payload.orderNumber}. Review the details below and process the order.`,
    payload,
    footerNote: `${store} store notification — new checkout order.`,
  });
}
