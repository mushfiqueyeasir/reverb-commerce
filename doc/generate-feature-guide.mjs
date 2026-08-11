import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(
  new URL("../frontend/website/package.json", import.meta.url),
);
const { jsPDF } = require("jspdf");

const currentDir = dirname(fileURLToPath(import.meta.url));
const outputPath = join(currentDir, "Reverb-Commerce-Feature-Guide.pdf");
const logoData = `data:image/png;base64,${readFileSync(
  join(currentDir, "reverb-solution-logo.png"),
).toString("base64")}`;

const C = {
  black: [255, 255, 255],
  surface: [255, 255, 255],
  surface2: [247, 249, 252],
  surface3: [241, 246, 255],
  grid: [255, 255, 255],
  border: [226, 231, 239],
  borderBlue: [176, 202, 244],
  white: [15, 23, 42],
  paper: [255, 255, 255],
  body: [51, 65, 85],
  muted: [89, 103, 123],
  dim: [120, 132, 149],
  blue: [37, 99, 235],
  blue2: [30, 86, 200],
  blueSoft: [29, 78, 160],
  violet: [109, 76, 190],
  green: [5, 139, 98],
  greenSoft: [4, 112, 80],
  pink: [190, 24, 93],
};

const doc = new jsPDF({
  orientation: "portrait",
  unit: "mm",
  format: "a4",
  compress: true,
});

doc.setProperties({
  title: "Reverb Commerce",
  subject: "Customer feature and pricing brochure",
  author: "Reverb Solution",
  creator: "Reverb Solution",
  keywords:
    "Reverb Commerce, ecommerce Bangladesh, online store, bKash, Pathao, Steadfast, REDX, pricing",
});

const pageWidth = doc.internal.pageSize.getWidth();
const pageHeight = doc.internal.pageSize.getHeight();
const margin = 16;
const pages = 5;

function fill(color) {
  doc.setFillColor(...color);
}

function stroke(color) {
  doc.setDrawColor(...color);
}

function ink(color) {
  doc.setTextColor(...color);
}

function font(style = "normal", family = "helvetica") {
  doc.setFont(family, style);
}

function text(textValue, x, y, size, color = C.body, style = "normal", options = {}) {
  const { family = "helvetica", ...textOptions } = options;
  ink(color);
  font(style, family);
  doc.setFontSize(size);
  doc.text(textValue, x, y, textOptions);
}

function wrapped(
  textValue,
  x,
  y,
  width,
  size = 9,
  color = C.muted,
  style = "normal",
  lineHeight = 1.3,
) {
  ink(color);
  font(style);
  doc.setFontSize(size);
  const lines = doc.splitTextToSize(textValue, width);
  doc.text(lines, x, y, { lineHeightFactor: lineHeight });
  return y + lines.length * size * 0.3528 * lineHeight;
}

function card(x, y, width, height, options = {}) {
  fill(options.fill ?? C.surface);
  stroke(options.stroke ?? C.border);
  doc.setLineWidth(options.lineWidth ?? 0.22);
  doc.roundedRect(x, y, width, height, options.radius ?? 2, options.radius ?? 2, "FD");
}

function line(x1, y1, x2, y2, color = C.border, width = 0.3) {
  stroke(color);
  doc.setLineWidth(width);
  doc.line(x1, y1, x2, y2);
}

function pill(label, x, y, options = {}) {
  const size = options.size ?? 7.2;
  font(options.style ?? "bold", options.family ?? "helvetica");
  doc.setFontSize(size);
  const width = doc.getTextWidth(label) + (options.padding ?? 7);
  fill(options.fill ?? C.surface2);
  stroke(options.stroke ?? C.border);
  doc.setLineWidth(0.22);
  doc.roundedRect(x, y, width, options.height ?? 7, 2, 2, "FD");
  text(
    label,
    x + width / 2,
    y + (options.textY ?? 4.7),
    size,
    options.color ?? C.body,
    options.style ?? "bold",
    { align: "center" },
  );
  return width;
}

function eyebrow(label, y) {
  line(margin, y - 1.3, margin + 5, y - 1.3, C.blue, 0.9);
  text(label.toUpperCase(), margin + 8, y, 7.4, C.blueSoft, "bold");
}

function pageTitle(primary, secondary, y = 43) {
  text(primary, margin, y, 25, C.white, "bold");
  if (secondary) text(secondary, margin, y + 19, 25, C.dim, "bold");
}

function bulletList(items, x, y, width, options = {}) {
  const size = options.size ?? 8.2;
  const gap = options.gap ?? 4.2;
  let cursor = y;
  for (const item of items) {
    fill(options.dot ?? C.blue);
    doc.circle(x + 1.2, cursor - 1, 0.75, "F");
    cursor = wrapped(
      item,
      x + 5,
      cursor,
      width - 5,
      size,
      options.color ?? C.body,
      "normal",
      1.25,
    );
    cursor += gap;
  }
  return cursor;
}

function metric(x, y, width, label, value, accent = C.blue) {
  card(x, y, width, 22, { fill: C.surface, stroke: C.border });
  text(label.toUpperCase(), x + 4, y + 6, 6.2, C.dim, "bold");
  text(value, x + 4, y + 15, 13, C.white, "bold");
  fill(accent);
  doc.circle(x + width - 5, y + 6, 1.2, "F");
}

function drawBackground(pageNumber) {
  fill(C.paper);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  doc.addImage(logoData, "PNG", margin, 10, 12, 12 / (988 / 707));
  text("REVERB SOLUTION", margin + 16, 16.3, 9.5, C.white, "bold");
  text(
    "REVERB COMMERCE",
    pageWidth - margin,
    16.3,
    6.8,
    C.dim,
    "bold",
    { align: "right" },
  );
  line(margin, 23, pageWidth - margin, 23, C.border, 0.2);

  line(margin, 284, pageWidth - margin, 284, C.border, 0.2);
  text("REVERBSOLUTION.COM/ECOMMERCE", margin, 290, 6.6, C.blueSoft, "bold");
  text("contact@reverbsolution.com", pageWidth / 2, 290, 6.6, C.dim, "normal", {
    align: "center",
  });
  text(`${pageNumber} / ${pages}`, pageWidth - margin, 290, 6.6, C.dim, "normal", {
    align: "right",
  });
}

function drawHero() {
  drawBackground(1);
  eyebrow("New product by Reverb Solution", 34);
  text("Commerce,", margin, 53, 34, C.white, "bold");
  text("connected.", margin, 78, 34, C.blueSoft, "bold");
  wrapped(
    "A complete online store and merchant control room built for how Bangladesh sells, gets paid and delivers.",
    margin,
    91,
    128,
    11.5,
    C.body,
    "normal",
    1.35,
  );

  let tagX = margin;
  for (const label of ["YOUR BRANDING", "YOUR DOMAIN", "YOUR BUSINESS DATA", "AI SEARCH + CHAT"]) {
    const width = pill(label, tagX, 111, {
      size: 6.3,
      fill: C.surface3,
      stroke: C.surface3,
      color: C.blueSoft,
      family: "courier",
    });
    tagX += width + 3;
  }

  card(margin, 127, pageWidth - margin * 2, 104, {
    fill: C.surface2,
    stroke: C.border,
    lineWidth: 0.22,
    radius: 3,
  });
  text("Merchant control room", margin + 7, 138, 11, C.white, "bold");
  text("LIVE OVERVIEW", pageWidth - margin - 7, 138, 6.3, C.greenSoft, "bold", {
    align: "right",
  });
  fill(C.green);
  doc.circle(pageWidth - margin - 39, 136.4, 1, "F");

  const innerWidth = pageWidth - margin * 2 - 14;
  const metricGap = 3;
  const metricWidth = (innerWidth - metricGap * 3) / 4;
  const metrics = [
    ["Orders", "48", C.blue],
    ["Sales", "BDT 86K", C.green],
    ["Customers", "31", C.violet],
    ["Low stock", "06", C.pink],
  ];
  metrics.forEach(([label, value, accent], index) =>
    metric(
      margin + 7 + index * (metricWidth + metricGap),
      145,
      metricWidth,
      label,
      value,
      accent,
    ),
  );

  card(margin + 7, 172, 103, 50, { fill: C.surface, stroke: C.border });
  text("SALES PULSE", margin + 12, 181, 6.3, C.dim, "bold");
  line(margin + 13, 212, margin + 102, 212, C.border, 0.25);
  const chartPoints = [207, 202, 205, 194, 197, 186, 190, 179];
  for (let index = 0; index < chartPoints.length - 1; index += 1) {
    line(
      margin + 14 + index * 12,
      chartPoints[index],
      margin + 14 + (index + 1) * 12,
      chartPoints[index + 1],
      C.blue2,
      1.1,
    );
  }
  fill(C.blue);
  doc.circle(margin + 98, chartPoints.at(-1), 1.6, "F");

  card(margin + 114, 172, 57, 50, { fill: C.surface, stroke: C.border });
  text("RECENT ORDERS", margin + 119, 181, 6.3, C.dim, "bold");
  const orders = [
    ["#RV-1048", "Processing", "2,480"],
    ["#RV-1047", "Confirmed", "1,890"],
    ["#RV-1046", "Shipped", "3,220"],
  ];
  orders.forEach((order, index) => {
    const y = 190 + index * 10;
    text(order[0], margin + 119, y, 6.5, C.body, "bold");
    text(order[1], margin + 138, y, 5.8, index === 2 ? C.greenSoft : C.blueSoft);
    text(order[2], margin + 166, y, 6.2, C.white, "bold", { align: "right" });
    if (index < 2) line(margin + 119, y + 3.5, margin + 166, y + 3.5, C.border, 0.2);
  });

  text("BUILT-IN LOCAL COMMERCE", margin, 244, 6.5, C.dim, "bold");
  let integrationX = margin;
  const integrations = [
    ["bKash", C.pink],
    ["Pathao", C.blue],
    ["Steadfast", C.green],
    ["REDX", C.violet],
  ];
  integrations.forEach(([label, accent]) => {
    const width = pill(label, integrationX, 250, {
      size: 8,
      height: 9,
      textY: 6,
      fill: C.surface2,
      stroke: accent,
      color: C.white,
      padding: 10,
    });
    integrationX += width + 4;
  });
  text(
    "YOUR STOREFRONT. YOUR OPERATIONS. ONE CONNECTED PLATFORM.",
    margin,
    273,
    7.2,
    C.blueSoft,
    "bold",
  );
}

function drawExperience() {
  doc.addPage();
  drawBackground(2);
  eyebrow("One product, two experiences", 34);
  pageTitle("Delight shoppers.", "Empower your team.");

  const gap = 6;
  const width = (pageWidth - margin * 2 - gap) / 2;
  const left = margin;
  const right = margin + width + gap;

  card(left, 72, width, 167, { fill: C.surface2, stroke: C.surface2, radius: 3 });
  text("CUSTOMER STOREFRONT", left + 7, 83, 6.5, C.blueSoft, "bold");
  text("Your brand gets", left + 7, 96, 16, C.white, "bold");
  text("the spotlight.", left + 7, 108, 16, C.dim, "bold");
  bulletList(
    [
      "Responsive storefront for mobile, tablet and desktop",
      "AI product search and chat grounded in current store information",
      "Product galleries, prices, stock, optional sizes and size charts",
      "Persistent wishlist and cart without customer registration",
      "Guest checkout with promo codes, COD and optional bKash",
      "Order confirmation and courier-status tracking",
    ],
    left + 7,
    121,
    width - 14,
    { size: 7.8, gap: 3.2 },
  );

  card(left + 7, 190, width - 14, 40, { fill: C.surface, stroke: C.border, radius: 2 });
  text("CHECKOUT", left + 12, 199, 6.3, C.dim, "bold");
  text("Complete your order", left + 12, 208, 10.5, C.white, "bold");
  pill("COD", left + 12, 214, {
    size: 6.5,
    height: 8,
    textY: 5.4,
    stroke: C.blue,
    color: C.blueSoft,
  });
  pill("bKash", left + 34, 214, {
    size: 6.5,
    height: 8,
    textY: 5.4,
    stroke: C.pink,
    color: C.white,
  });
  text("TOTAL  BDT 2,240", left + width - 12, 219.5, 7.2, C.white, "bold", {
    align: "right",
  });

  card(right, 72, width, 167, { fill: C.surface2, stroke: C.surface2, radius: 3 });
  text("MERCHANT CONTROL ROOM", right + 7, 83, 6.5, C.greenSoft, "bold");
  text("Everything your team", right + 7, 96, 16, C.white, "bold");
  text("uses every day.", right + 7, 108, 16, C.dim, "bold");
  bulletList(
    [
      "Dashboard for orders, sales, customers and low stock",
      "Products, categories, variants, inventory and images",
      "Order approval and local courier booking from one screen",
      "Customers, reports, CSV exports and branded PDF invoices",
      "Homepage, promotions, reviews, About and policy content",
      "Admin, editor and viewer roles with an activity trail",
    ],
    right + 7,
    121,
    width - 14,
    { size: 7.8, gap: 3.2, dot: C.green },
  );

  card(right + 7, 190, width - 14, 40, { fill: C.surface, stroke: C.border, radius: 2 });
  text("TODAY", right + 12, 199, 6.3, C.dim, "bold");
  text("12", right + 12, 213, 15, C.white, "bold");
  text("ORDERS", right + 12, 221, 5.8, C.dim, "bold");
  text("BDT 24K", right + width / 2, 213, 15, C.greenSoft, "bold", {
    align: "center",
  });
  text("SALES", right + width / 2, 221, 5.8, C.dim, "bold", { align: "center" });
  text("03", right + width - 12, 213, 15, C.pink, "bold", { align: "right" });
  text("LOW STOCK", right + width - 12, 221, 5.8, C.dim, "bold", { align: "right" });

  card(margin, 243, pageWidth - margin * 2, 35, {
    fill: C.surface3,
    stroke: C.surface3,
    radius: 2,
  });
  fill(C.blue);
  doc.rect(margin, 243, 1.4, 35, "F");
  pill("NEW", margin + 7, 249, {
    size: 5.8,
    height: 7,
    textY: 4.8,
    fill: C.blue,
    stroke: C.blue,
    color: C.paper,
    padding: 6,
  });
  text("AI SEARCH + CHAT", margin + 25, 254, 8, C.blueSoft, "bold");
  text("Help every shopper find the right product faster.", margin + 7, 264, 11.5, C.white, "bold");
  wrapped(
    "Instant, store-aware answers about products, stock, delivery, returns and navigation.",
    margin + 7,
    272,
    pageWidth - margin * 2 - 14,
    7.4,
    C.body,
  );
}

function featureCard(x, y, width, height, label, titleValue, bullets, accent = C.blue) {
  fill(C.surface2);
  doc.roundedRect(x, y, width, height, 2, 2, "F");
  line(x + 7, y + 8, x + 22, y + 8, accent, 0.9);
  text(label.toUpperCase(), x + 7, y + 15, 5.9, accent, "bold");
  text(titleValue, x + 7, y + 26, 10.5, C.white, "bold");
  bulletList(bullets, x + 7, y + 36, width - 14, {
    size: 7,
    gap: 2.4,
    dot: accent,
    color: C.muted,
  });
}

function drawFeatures() {
  doc.addPage();
  drawBackground(3);
  eyebrow("Complete feature set", 34);
  pageTitle("Everything required", "to sell and operate.");

  const gap = 6;
  const width = (pageWidth - margin * 2 - gap) / 2;
  const height = 58;
  const left = margin;
  const right = margin + width + gap;
  const rows = [75, 139, 203];

  featureCard(left, rows[0], width, height, "Courier control centre", "Delivery without switching tabs", [
    "Approve and book Pathao, Steadfast or REDX",
    "Refresh status and review delivery events",
    "Keep public customer tracking updated",
  ]);
  featureCard(right, rows[0], width, height, "Payment system", "COD and bKash at checkout", [
    "Cash on Delivery ready by default",
    "Optional hosted bKash payment",
    "Order, payment and stock stay synchronized",
  ], C.pink);

  featureCard(left, rows[1], width, height, "Live theme builder", "Make the storefront yours", [
    "Five ready-made themes plus custom colors",
    "Live preview before saving changes",
    "Logo, favicon, invoice logo and social links",
  ], C.violet);
  featureCard(right, rows[1], width, height, "Catalog and merchandising", "Products made easy to discover", [
    "Categories, variants, sizes, colors and stock",
    "Pricing, discounts, images and size charts",
    "Homepage banners, featured items and promos",
  ], C.green);

  featureCard(left, rows[2], width, height, "AI-powered discovery", "AI search and chat that sells", [
    "Instant product search with relevant results",
    "Store-aware answers about products and stock",
    "Guidance for delivery, returns and navigation",
  ]);
  featureCard(right, rows[2], width, height, "Operations and access", "Know what needs attention", [
    "Customers, reports, CSV files and PDF invoices",
    "Admin, editor and read-only viewer roles",
    "Contact inbox, reviews and activity history",
  ], C.greenSoft);
}

function workflowStep(x, y, width, number, titleValue, body, accent = C.blue) {
  fill(C.surface2);
  doc.roundedRect(x, y, width, 42, 2, 2, "F");
  line(x + 6, y + 8, x + 14, y + 8, accent, 0.9);
  text(number, x + 6, y + 16, 7.5, accent, "bold", { family: "courier" });
  text(titleValue, x + 18, y + 16, 9.2, C.white, "bold");
  wrapped(body, x + 6, y + 28, width - 12, 7.4, C.muted, "normal", 1.25);
}

function drawWorkflow() {
  doc.addPage();
  drawBackground(4);
  eyebrow("From click to doorstep", 34);
  pageTitle("A workflow that", "keeps moving.");

  const gap = 6;
  const width = (pageWidth - margin * 2 - gap) / 2;
  workflowStep(
    margin,
    76,
    width,
    "01",
    "Customer places an order",
    "Guest checkout through Cash on Delivery or optional bKash.",
  );
  workflowStep(
    margin + width + gap,
    76,
    width,
    "02",
    "Stock and payment stay aligned",
    "Inventory is reserved safely and restored after failed payments.",
    C.green,
  );
  workflowStep(
    margin,
    124,
    width,
    "03",
    "Your team books delivery",
    "Approve the order and send it to the active local courier.",
    C.violet,
  );
  workflowStep(
    margin + width + gap,
    124,
    width,
    "04",
    "Everyone sees the latest status",
    "Courier events update the admin workflow and tracking page.",
    C.pink,
  );

  eyebrow("Client-owned environment", 184);
  text("Your store. Your data.", margin, 200, 21, C.white, "bold");
  text("Your control.", margin, 217, 21, C.dim, "bold");
  wrapped(
    "Your business receives a dedicated store environment. Customer, order, catalog and operational data are not mixed with another Reverb Commerce client.",
    margin,
    229,
    145,
    9.2,
    C.body,
    "normal",
    1.35,
  );

  const ownerGap = 4;
  const ownerWidth = (pageWidth - margin * 2 - ownerGap * 2) / 3;
  const owners = [
    ["01", "Your business identity", "Your domain, branding and store settings."],
    ["02", "Dedicated environment", "An isolated store and business data boundary."],
    ["03", "Operational control", "Your team manages daily work without code."],
  ];
  owners.forEach(([number, titleValue, body], index) => {
    const x = margin + index * (ownerWidth + ownerGap);
    card(x, 249, ownerWidth, 29, { fill: C.surface2, stroke: C.surface2, radius: 2 });
    text(number, x + 4, 257, 6.4, C.blueSoft, "bold");
    text(titleValue, x + 4, 264, 7.3, C.white, "bold");
    wrapped(body, x + 4, 271, ownerWidth - 8, 6.1, C.muted, "normal", 1.15);
  });
}

const plans = [
  {
    name: "Monthly",
    strapline: "Pay month to month",
    price: "BDT 1,500",
    period: "/ month",
    billing: "BDT 1,500 billed monthly",
    saving: null,
    featured: false,
  },
  {
    name: "6 months",
    strapline: "Commit for six months",
    price: "BDT 1,250",
    period: "/ month",
    billing: "BDT 7,500 billed every 6 months",
    saving: "SAVE BDT 1,500",
    featured: false,
  },
  {
    name: "1 year",
    strapline: "Best value for growing stores",
    price: "BDT 1,000",
    period: "/ month",
    billing: "BDT 12,000 billed yearly",
    saving: "SAVE BDT 6,000",
    featured: true,
  },
];

function pricingRow(plan, y) {
  const x = margin;
  const width = pageWidth - margin * 2;
  const height = 38;

  fill(plan.featured ? C.surface3 : C.surface2);
  doc.roundedRect(x, y, width, height, 2, 2, "F");
  if (plan.featured) {
    fill(C.blue);
    doc.rect(x, y, 1.4, height, "F");
    pill("BEST VALUE", x + 25, y + 5, {
      size: 5,
      height: 6,
      textY: 4.1,
      fill: C.blue,
      stroke: C.blue,
      color: C.paper,
      padding: 5,
    });
  }

  text(plan.name, x + 7, y + 12, 11, C.white, "bold");
  text(plan.strapline, x + 7, y + 24, 6.6, C.muted);

  text(plan.price, x + 55, y + 14, 13.5, plan.featured ? C.blueSoft : C.white, "bold");
  text(plan.period, x + 55, y + 25, 6.2, C.dim);

  wrapped(plan.billing, x + 100, y + 12, 38, 6.4, C.muted, "normal", 1.2);
  if (plan.saving) {
    pill(plan.saving, x + 100, y + 25, {
      size: 5.2,
      height: 6.5,
      textY: 4.4,
      fill: [229, 247, 240],
      stroke: [181, 226, 208],
      color: C.greenSoft,
      padding: 5,
    });
  } else {
    text("STANDARD RATE", x + 100, y + 29, 5.5, C.dim, "bold");
  }

  fill(plan.featured ? C.blue : C.paper);
  stroke(plan.featured ? C.blue : C.border);
  doc.roundedRect(x + width - 36, y + 13, 29, 12, 2, 2, "FD");
  text(
    "SELECT",
    x + width - 21.5,
    y + 20.7,
    6.2,
    plan.featured ? C.paper : C.body,
    "bold",
    { align: "center" },
  );
}

function drawPricing() {
  doc.addPage();
  drawBackground(5);
  eyebrow("Simple plans, more value over time", 34);
  text("Choose the plan", margin, 52, 25, C.white, "bold");
  text("that fits your business.", margin, 71, 25, C.dim, "bold");
  wrapped(
    "Every subscription includes the complete platform. Longer billing periods reduce the monthly cost without removing features.",
    margin,
    84,
    155,
    9.5,
    C.body,
  );

  const pricingWidth = pageWidth - margin * 2;
  text("PLAN", margin + 7, 103, 5.8, C.dim, "bold");
  text("MONTHLY RATE", margin + 55, 103, 5.8, C.dim, "bold");
  text("BILLING", margin + 100, 103, 5.8, C.dim, "bold");
  text("ACTION", margin + pricingWidth - 21.5, 103, 5.8, C.dim, "bold", {
    align: "center",
  });
  plans.forEach((plan, index) => pricingRow(plan, 109 + index * 42));

  wrapped(
    "Domain, payment gateway, courier, and other third-party usage fees are charged separately when applicable.",
    margin,
    240,
    pageWidth - margin * 2,
    6.3,
    C.dim,
    "normal",
    1.2,
  );

  card(margin, 249, pageWidth - margin * 2, 27, {
    fill: C.surface2,
    stroke: C.surface2,
    radius: 2,
  });
  fill(C.blue);
  doc.rect(margin, 249, 1.4, 27, "F");
  text("READY TO LAUNCH?", margin + 7, 259, 6.3, C.blueSoft, "bold");
  text("Start your store with Reverb Solution", margin + 7, 269, 10, C.white, "bold");
  text("contact@reverbsolution.com", pageWidth - margin - 7, 269, 7.5, C.greenSoft, "bold", {
    align: "right",
  });
}

drawHero();
drawExperience();
drawFeatures();
drawWorkflow();
drawPricing();

writeFileSync(outputPath, Buffer.from(doc.output("arraybuffer")));
console.log(`Generated ${outputPath} (${doc.getNumberOfPages()} pages)`);
