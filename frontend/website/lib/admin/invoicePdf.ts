import { jsPDF } from "jspdf";
import {
  DEFAULT_PALETTE,
  normalizePalette,
  type ThemePalette,
} from "@/lib/theme/palette";

export interface InvoiceLineItem {
  title: string;
  size: string | null;
  color: string | null;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceData {
  orderNumber: string;
  createdAt: string;
  status: string;
  paymentMethod: string;
  storeName: string;
  storeEmail: string | null;
  storePhone: string | null;
  /** ASCII-safe currency label for PDF (e.g. BDT, USD). Avoid symbols like ৳. */
  currencyCode: string;
  logoUrl: string | null;
  palette: ThemePalette;
  customerName: string;
  phone: string | null;
  addressLines: string[];
  deliveryZone: string | null;
  items: InvoiceLineItem[];
  subtotal: number;
  shipping: number;
  discount?: number;
  discountPercent?: number;
  promoCode?: string | null;
  total: number;
}

type Rgb = [number, number, number];

function hexToRgb(hex: string, fallback = "#000000"): Rgb {
  const raw = (hex || fallback).replace("#", "").trim();
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw.padEnd(6, "0").slice(0, 6);
  const n = Number.parseInt(full, 16);
  if (!Number.isFinite(n)) return hexToRgb(fallback);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function money(value: number, code: string): string {
  const safe = Number.isFinite(value) ? value : 0;
  const [intPart, decPart] = safe.toFixed(2).split(".");
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${code} ${withCommas}.${decPart}`;
}

function formatDate(value: string): string {
  try {
    const d = new Date(value);
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}, ${hour12}:${m} ${ampm}`;
  } catch {
    return value;
  }
}

function asciiSafe(text: string): string {
  return text
    .replace(/[–—]/g, "-")
    .replace(/[·•]/g, "|")
    .replace(/[^\x20-\x7E\n]/g, "");
}

async function loadImageAsDataUrl(url: string): Promise<{
  dataUrl: string;
  format: "PNG" | "JPEG";
  width: number;
  height: number;
} | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    const dims = await new Promise<{ width: number; height: number }>(
      (resolve, reject) => {
        const img = new Image();
        img.onload = () =>
          resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = reject;
        img.src = dataUrl;
      },
    );

    const format: "PNG" | "JPEG" =
      blob.type.includes("png") || dataUrl.startsWith("data:image/png")
        ? "PNG"
        : "JPEG";

    return { dataUrl, format, ...dims };
  } catch {
    return null;
  }
}

async function buildOrderInvoicePdf(
  data: InvoiceData,
): Promise<{ filename: string; blob: Blob }> {
  const palette = normalizePalette(data.palette ?? DEFAULT_PALETTE);
  const bg = hexToRgb(palette.background);
  const surface = hexToRgb(palette.surface);
  const card = hexToRgb(palette.card);
  const fg = hexToRgb(palette.foreground);
  const muted = hexToRgb(palette.mutedForeground);
  const border = hexToRgb(palette.border);
  const primary = hexToRgb(palette.primary);
  const onPrimary = hexToRgb(palette.primaryForeground);

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentW = pageW - margin * 2;
  const code = asciiSafe(data.currencyCode || "BDT").trim() || "BDT";
  let y = margin;

  const paintPage = () => {
    doc.setFillColor(...bg);
    doc.rect(0, 0, pageW, pageH, "F");
    doc.setFillColor(...primary);
    doc.rect(0, 0, pageW, 3, "F");
  };

  paintPage();

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - margin - 14) {
      doc.addPage();
      paintPage();
      y = margin + 4;
    }
  };

  // Logo / store name
  let headerBottom = margin + 18;
  if (data.logoUrl) {
    const logo = await loadImageAsDataUrl(data.logoUrl);
    if (logo && logo.width > 0 && logo.height > 0) {
      const maxW = 42;
      const maxH = 14;
      const ratio = logo.width / logo.height;
      let drawW = maxW;
      let drawH = drawW / ratio;
      if (drawH > maxH) {
        drawH = maxH;
        drawW = drawH * ratio;
      }
      doc.addImage(
        logo.dataUrl,
        logo.format,
        margin,
        margin + 2,
        drawW,
        drawH,
        undefined,
        "FAST",
      );
      headerBottom = margin + 2 + drawH + 4;
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(...fg);
      doc.text(asciiSafe(data.storeName || "Store"), margin, margin + 10);
      headerBottom = margin + 16;
    }
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...fg);
    doc.text(asciiSafe(data.storeName || "Store"), margin, margin + 10);
    headerBottom = margin + 16;
  }

  // Contact under logo
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...muted);
  let contactY = headerBottom;
  if (data.storeEmail) {
    doc.text(asciiSafe(data.storeEmail), margin, contactY);
    contactY += 4;
  }
  if (data.storePhone) {
    doc.text(asciiSafe(data.storePhone), margin, contactY);
    contactY += 4;
  }

  // Invoice title block (right)
  doc.setTextColor(...primary);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("INVOICE", pageW - margin, margin + 9, { align: "right" });
  doc.setTextColor(...fg);
  doc.setFontSize(11);
  doc.text(asciiSafe(data.orderNumber), pageW - margin, margin + 16, {
    align: "right",
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.text(formatDate(data.createdAt), pageW - margin, margin + 21.5, {
    align: "right",
  });

  y = Math.max(contactY, margin + 26) + 4;

  doc.setDrawColor(...border);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageW - margin, y);
  y += 10;

  const colGap = 10;
  const colW = (contentW - colGap) / 2;
  const col2 = margin + colW + colGap;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...primary);
  doc.text("BILL TO", margin, y);
  doc.text("ORDER DETAILS", col2, y);
  y += 6;

  let leftY = y;
  doc.setTextColor(...fg);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(asciiSafe(data.customerName), margin, leftY);
  leftY += 5.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...muted);
  if (data.phone) {
    doc.text(asciiSafe(data.phone), margin, leftY);
    leftY += 5;
  }
  for (const line of data.addressLines) {
    const wrapped = doc.splitTextToSize(asciiSafe(line), colW);
    doc.text(wrapped, margin, leftY);
    leftY += wrapped.length * 4.8;
  }

  let rightY = y;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  const meta = [
    ["Status", asciiSafe(data.status)],
    ["Payment", asciiSafe(data.paymentMethod).toUpperCase()],
  ];
  if (data.deliveryZone) {
    meta.push(["Delivery", asciiSafe(data.deliveryZone)]);
  }
  for (const [label, value] of meta) {
    doc.setTextColor(...muted);
    doc.text(label, col2, rightY);
    doc.setTextColor(...fg);
    doc.text(value, col2 + 28, rightY);
    rightY += 5.5;
  }

  y = Math.max(leftY, rightY) + 10;

  const hasSizedItems = data.items.some((item) => Boolean(item.size));
  const cols = {
    item: margin + 2,
    size: margin + contentW * 0.48,
    qty: margin + contentW * (hasSizedItems ? 0.62 : 0.58),
    unit: margin + contentW * 0.74,
    total: pageW - margin - 2,
  };

  ensureSpace(14);
  doc.setFillColor(...primary);
  doc.roundedRect(margin, y - 5, contentW, 9, 1, 1, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...onPrimary);
  doc.text("ITEM", cols.item, y);
  if (hasSizedItems) doc.text("SIZE", cols.size, y);
  doc.text("QTY", cols.qty, y);
  doc.text("UNIT", cols.unit, y);
  doc.text("TOTAL", cols.total, y, { align: "right" });
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);

  if (data.items.length === 0) {
    doc.setTextColor(...muted);
    doc.text("No items on this order.", margin + 2, y + 2);
    y += 10;
  } else {
    data.items.forEach((item, index) => {
      const titleParts = [asciiSafe(item.title)];
      if (item.color) titleParts.push(asciiSafe(item.color));
      const title = doc.splitTextToSize(
        titleParts.join(" / "),
        contentW * (hasSizedItems ? 0.44 : 0.54),
      );
      const rowH = Math.max(8, title.length * 4.5 + 3);
      ensureSpace(rowH + 2);

      if (index % 2 === 0) {
        doc.setFillColor(...surface);
        doc.rect(margin, y - 3.5, contentW, rowH, "F");
      }

      doc.setTextColor(...fg);
      doc.text(title, cols.item, y);
      doc.setTextColor(...muted);
      if (hasSizedItems) doc.text(asciiSafe(item.size || "-"), cols.size, y);
      doc.text(String(item.quantity), cols.qty, y);
      doc.setTextColor(...fg);
      doc.text(money(item.unitPrice, code), cols.unit, y);
      doc.text(money(item.unitPrice * item.quantity, code), cols.total, y, {
        align: "right",
      });
      y += rowH;
    });
  }

  // Totals card
  ensureSpace(36);
  y += 6;
  const boxW = 72;
  const boxX = pageW - margin - boxW;
  const hasDiscount = (data.discount ?? 0) > 0;
  const boxH = hasDiscount ? 36 : 30;
  doc.setFillColor(...card);
  doc.setDrawColor(...border);
  doc.roundedRect(boxX, y - 4, boxW, boxH, 2, 2, "FD");

  let ty = y + 2;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.text("Subtotal", boxX + 4, ty);
  doc.setTextColor(...fg);
  doc.text(money(data.subtotal, code), boxX + boxW - 4, ty, { align: "right" });
  ty += 6;

  if (hasDiscount) {
    const promoLabel = data.promoCode
      ? `Promo (${data.promoCode}${data.discountPercent ? ` ${data.discountPercent}%` : ""})`
      : "Promo";
    doc.setTextColor(...primary);
    doc.text(promoLabel, boxX + 4, ty);
    doc.text(`-${money(data.discount ?? 0, code)}`, boxX + boxW - 4, ty, {
      align: "right",
    });
    ty += 6;
  }

  doc.setTextColor(...muted);
  doc.text("Delivery", boxX + 4, ty);
  doc.setTextColor(...fg);
  doc.text(money(data.shipping, code), boxX + boxW - 4, ty, {
    align: "right",
  });
  ty += 7;

  doc.setDrawColor(...border);
  doc.line(boxX + 4, ty - 3, boxX + boxW - 4, ty - 3);

  // Total row with primary accent
  doc.setFillColor(...primary);
  doc.roundedRect(boxX + 1, ty - 1, boxW - 2, 9, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...onPrimary);
  doc.text("Total", boxX + 4, ty + 5);
  doc.text(money(data.total, code), boxX + boxW - 4, ty + 5, {
    align: "right",
  });

  // Footer
  doc.setDrawColor(...border);
  doc.line(margin, pageH - 16, pageW - margin, pageH - 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...muted);
  doc.text(
    "Thank you for your order. This is a computer-generated invoice.",
    pageW / 2,
    pageH - 11,
    { align: "center" },
  );

  const safeName = asciiSafe(data.orderNumber).replace(/[^\w.-]+/g, "_");
  const filename = `invoice-${safeName || "order"}.pdf`;
  const blob = doc.output("blob");
  return { filename, blob };
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function downloadOrderInvoice(data: InvoiceData): Promise<void> {
  const { filename, blob } = await buildOrderInvoicePdf(data);
  triggerBlobDownload(blob, filename);
}

/** Build all invoices and download them as a single ZIP. */
export async function downloadOrderInvoicesZip(
  invoices: InvoiceData[],
): Promise<void> {
  if (!invoices.length) throw new Error("No invoices to download.");

  if (invoices.length === 1) {
    await downloadOrderInvoice(invoices[0]);
    return;
  }

  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  const usedNames = new Set<string>();

  for (const invoice of invoices) {
    const { filename, blob } = await buildOrderInvoicePdf(invoice);
    let name = filename;
    let n = 2;
    while (usedNames.has(name)) {
      name = filename.replace(/\.pdf$/i, `-${n}.pdf`);
      n += 1;
    }
    usedNames.add(name);
    zip.file(name, blob);
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  const stamp = new Date().toISOString().slice(0, 10);
  triggerBlobDownload(zipBlob, `invoices-${stamp}.zip`);
}
