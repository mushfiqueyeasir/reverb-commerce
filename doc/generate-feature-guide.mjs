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
  ink: [22, 27, 36],
  body: [55, 65, 81],
  muted: [105, 116, 132],
  line: [218, 224, 232],
  blue: [22, 103, 247],
  blueSoft: [235, 242, 255],
  indigo: [98, 95, 255],
  white: [255, 255, 255],
};

const pages = [
  {
    eyebrow: "PRODUCT OVERVIEW",
    title: "Reverb Commerce",
    subtitle: "Complete Product Feature & Technology Documentation",
    intro:
      "Designed and developed by Reverb Solution, Reverb Commerce connects a modern customer storefront with the complete merchant workflow required to manage products, content, orders, customers, payments and growth.",
    columns: [
      [
        {
          title: "Platform at a glance",
          bullets: [
            "Responsive storefront for mobile, tablet and desktop.",
            "Full-screen catalog search plus an AI shopping assistant grounded in live inventory.",
            "Detailed product pages with images, sizes, stock and size charts.",
            "Persistent wishlist and shopping cart without customer registration.",
            "Guest checkout with promo codes and configurable delivery charges.",
            "Cash on Delivery and optional bKash Tokenized Checkout.",
            "Public order and courier tracking with branded email confirmations.",
          ],
        },
        {
          title: "Customer experience",
          bullets: [
            "Low-friction journey from product discovery to checkout.",
            "Clear pricing, discounts, availability and delivery totals.",
            "Mobile shopping navigation and touch-friendly controls.",
            "Human-style AI guidance plus WhatsApp or Messenger access for assistance.",
            "Brand content, reviews and promotions throughout the storefront.",
            "No account or password required to place an order.",
          ],
        },
      ],
      [
        {
          title: "Merchant experience",
          bullets: [
            "Central dashboard for orders, sales, customers and stock.",
            "Product, category, variant and inventory management.",
            "Quick approval plus Pathao, Steadfast and REDX fulfilment.",
            "Customer records, order history, reports and exports.",
            "Homepage, About, promotion, review and policy content tools.",
            "Brand, delivery, payment, courier, email and analytics settings.",
            "Staff roles, protected admin routes and detailed audit history.",
          ],
        },
        {
          title: "Business value",
          bullets: [
            "One connected system replaces separate catalog and order tools.",
            "Daily store operations can be completed without code changes.",
            "Local payment and Bangladesh courier workflows are built in.",
            "Campaign content and store appearance remain merchant-controlled.",
            "Commercial activity is visible through KPIs, charts and reports.",
            "Managed cloud services provide a practical path for growth.",
          ],
        },
      ],
    ],
  },
  {
    eyebrow: "CUSTOMER EXPERIENCE",
    title: "Storefront & Product Discovery",
    subtitle:
      "A responsive shopping experience designed to help customers find, understand and save the right products.",
    columns: [
      [
        {
          title: "Responsive storefront",
          bullets: [
            "Layouts optimized for phone, tablet and desktop.",
            "Dedicated mobile bar for Contact, Cart, Shop, Saved and Search.",
            "Live cart and wishlist counters in navigation.",
            "Dynamic desktop category menu.",
            "Touch-friendly filters, dialogs and shopping controls.",
            "Configurable color palette, motion and branded not-found page.",
          ],
        },
        {
          title: "Homepage merchandising",
          bullets: [
            "CMS-controlled section ordering and visibility.",
            "Auto-rotating banner carousel with manual controls.",
            "Separate desktop and mobile campaign artwork.",
            "Scheduled banner start and end dates.",
            "Category tiles and configurable featured products.",
            "Customer-review marquee and promotional strip.",
            "Session-aware promotion popup and rich-text brand sections.",
          ],
        },
        {
          title: "Catalog discovery",
          bullets: [
            "Full-screen discovery workspace for direct search and AI guidance.",
            "Case-insensitive title search with live visual product results.",
            "Search stays inside the workspace until a product is selected.",
            "Multi-category and stock-availability filtering.",
            "Minimum and maximum price filters.",
            "Price and alphabetical sorting.",
            "Live result counts, reset control and empty-result guidance.",
          ],
        },
      ],
      [
        {
          title: "Product cards & quick shopping",
          bullets: [
            "Main and hover imagery.",
            "Current price, original price and discount percentage.",
            "New, discounted and sold-out badges.",
            "Wishlist control and stock-aware quick actions.",
            "Quick Add dialog with size, quantity, Add to Cart and Buy Now.",
          ],
        },
        {
          title: "Product detail pages",
          bullets: [
            "Search-friendly URLs generated from product slugs.",
            "Multi-image gallery, thumbnails, counter and navigation.",
            "Current/original pricing and calculated discount.",
            "Stock-driven size selection with disabled unavailable options.",
            "Quantity selector and low-stock messaging.",
            "Rich descriptions with headings, lists and links.",
            "Product-specific chest and length size charts.",
            "Add to Cart, Buy Now and Add to Favorites.",
          ],
        },
        {
          title: "Wishlist, cart & customer content",
          bullets: [
            "Browser-persistent wishlist with individual and Clear All removal.",
            "Browser-persistent cart with separate entries by product and size.",
            "Quantity updates, line removal, line totals and subtotal.",
            "Dedicated published-reviews page with ratings and photos.",
            "CMS-driven About, Privacy, Terms and Refund pages.",
            "Contact form plus clickable store email and phone.",
          ],
        },
      ],
    ],
  },
  {
    eyebrow: "INTELLIGENT DISCOVERY",
    title: "Search & AI Shopping Assistant",
    subtitle:
      "A modern discovery workspace combines immediate catalog search with conversational, inventory-aware product guidance.",
    columns: [
      [
        {
          title: "Unified discovery workspace",
          bullets: [
            "Full-screen editorial interface aligned with the active store theme.",
            "Clear Search and Ask AI modes inside one customer journey.",
            "Oversized query surface with responsive desktop and mobile layouts.",
            "Live inventory connection indicator and focused product navigation.",
            "The underlying catalog page remains unchanged while customers explore.",
            "Selecting a result closes discovery and opens its product page.",
          ],
        },
        {
          title: "Live product search",
          bullets: [
            "Debounced case-insensitive product-title matching.",
            "Up to twelve active results returned from the current catalog.",
            "Editorial product cards with imagery, current price and original price.",
            "Dedicated loading, unavailable and no-result presentations.",
            "Search requests are isolated from storefront filters and page state.",
            "Special search characters are safely handled by the server.",
          ],
        },
        {
          title: "Guided starting points",
          bullets: [
            "One-tap prompts for personality matching, gifts and budget-led shopping.",
            "Customers may begin with a person, occasion, goal, style or feeling.",
            "Suggested replies make follow-up questions quick on mobile.",
            "Reset Brief starts a fresh recommendation conversation at any time.",
          ],
        },
      ],
      [
        {
          title: "Human-style sales guidance",
          bullets: [
            "Warm conversational guidance designed to feel like an attentive salesperson.",
            "Adapts to the customer's language, tone and level of formality.",
            "Asks only decision-critical questions and recommends without over-interviewing.",
            "Leads with a clear first choice when the catalog supports one.",
            "Connects product details to customer benefits, occasions and preferences.",
            "Explains useful tradeoffs and encourages a natural, low-pressure next step.",
          ],
        },
        {
          title: "Catalog-grounded recommendations",
          bullets: [
            "Considers personality, recipient, occasion, budget, style, color and size.",
            "Uses active product titles, descriptions, types, categories and variants.",
            "Out-of-stock products and unavailable variant options are excluded.",
            "One strong recommendation or up to three meaningful alternatives.",
            "Every returned product ID is revalidated against the live catalog.",
            "Prices, imagery and product links are attached by the store server.",
          ],
        },
        {
          title: "Reliable customer conversation",
          bullets: [
            "Structured OpenRouter responses with automatic response healing.",
            "Recovery for fenced JSON, text-wrapped JSON and provider content parts.",
            "Unusable responses become a natural follow-up question, not a technical error.",
            "Connection failures preserve the customer's last message for easy retry.",
            "Provider data-collection filtering is requested on every AI call.",
          ],
        },
      ],
    ],
  },
  {
    eyebrow: "COMMERCE JOURNEY",
    title: "Checkout, Payments & Order Tracking",
    subtitle:
      "A complete guest-purchase workflow with local payment options, delivery pricing and clear post-purchase communication.",
    columns: [
      [
        {
          title: "Guest checkout",
          bullets: [
            "No customer account required.",
            "Validated email, name, phone and delivery address.",
            "Optional postal code and delivery-note support.",
            "Optional local saving of delivery information.",
            "Responsive checkout with desktop order-summary panel.",
            "Product image, size, quantity and price summary.",
            "Subtotal, discount, delivery and final total calculation.",
          ],
        },
        {
          title: "Delivery & promo codes",
          bullets: [
            "Inside Dhaka and Outside Dhaka delivery zones.",
            "Separate merchant-configurable delivery charges.",
            "Promo codes normalized for consistent entry.",
            "Percentage discounts with active and date validation.",
            "Discount applied to merchandise subtotal only.",
            "Promo code revalidated when the order is submitted.",
          ],
        },
        {
          title: "Cash on Delivery",
          bullets: [
            "Always available as the default payment option.",
            "Immediate order placement and confirmation.",
            "Customer cart cleared after successful submission.",
            "Merchant and customer email workflow triggered after order creation.",
          ],
        },
      ],
      [
        {
          title: "bKash Tokenized Checkout",
          bullets: [
            "Optional integration when the store operates in BDT.",
            "Merchant-controlled enable, sandbox and live modes.",
            "Hosted bKash payment redirect.",
            "Payment execution and status-query fallback.",
            "Race-safe finalization with payment and transaction IDs.",
            "Failed payments removed immediately with stock restoration.",
            "Hourly-expired unpaid orders cleaned every 15 minutes.",
            "Automatic return to order tracking after successful payment.",
          ],
        },
        {
          title: "Order communication",
          bullets: [
            "Generated human-readable order numbers.",
            "Branded customer confirmation email.",
            "Separate owner notification with optional additional recipients.",
            "Emails include products, delivery information, discounts and totals.",
            "Store logo and active theme colors applied to messages.",
          ],
        },
        {
          title: "Customer order tracking",
          bullets: [
            "Public lookup using the order number.",
            "Progress through Pending, Confirmed, Processing, Shipped and Delivered.",
            "Separate cancelled-order presentation.",
            "Order date, delivery area and customer summary.",
            "Payment state, bKash transaction ID and courier tracking code.",
            "Courier status, update message and recent event history.",
            "Products, quantities, totals, discount and delivery charge.",
          ],
        },
      ],
    ],
  },
  {
    eyebrow: "MERCHANT OPERATIONS",
    title: "Dashboard, Catalog & Fulfilment",
    subtitle:
      "Operational tools give staff direct control over products, inventory, orders, customers and business documents.",
    columns: [
      [
        {
          title: "Merchant dashboard",
          bullets: [
            "Personalized live overview for the signed-in team member.",
            "Orders today and during the last seven days.",
            "Seven-day and all-time booked sales.",
            "New customers, low-stock variants and pending orders.",
            "Seven-day order-volume and sales charts.",
            "Recent orders with customer, status, date and total.",
            "Quick links to common operational tasks.",
          ],
        },
        {
          title: "Products & categories",
          bullets: [
            "Create, edit, search, reorder and permanently delete products.",
            "Active, draft and archived product states.",
            "Automatic URL slugs with manual override.",
            "Original/current prices, product type and rich description.",
            "Assignment to multiple categories.",
            "Create, edit, search, reorder and delete categories.",
            "Product count shown for each category.",
          ],
        },
        {
          title: "Product media & size charts",
          bullets: [
            "Maximum five product images at 4 MB each.",
            "Main-image selection for cards and gallery.",
            "Category images limited to 4 MB.",
            "Optional product-specific size, chest and length charts.",
            "One-click default tee size-chart template.",
          ],
        },
      ],
      [
        {
          title: "Variants & inventory",
          bullets: [
            "Optional sizing, size-free inventory, and automatic or manual SKUs.",
            "Stock quantity and low-stock threshold per variant.",
            "One-click default tee variants.",
            "Inventory sorted from lowest stock upward.",
            "Search by product, SKU, size or color.",
            "Low Stock Only filter and stock-status badges.",
            "Inline non-negative stock updates.",
          ],
        },
        {
          title: "Orders & fulfilment",
          bullets: [
            "Search by order number or customer and filter by status.",
            "Quick Approve and Send to Courier actions on order cards.",
            "Atomic Pathao, Steadfast or REDX shipment reservation.",
            "One active provider for new shipments; old shipments stay linked.",
            "Authenticated webhooks, manual refresh and event history.",
            "Safe automatic progress to Processing, Shipped and Delivered.",
            "Courier-linked orders cannot be cancelled, moved or deleted.",
          ],
        },
        {
          title: "Customers, reports & documents",
          bullets: [
            "Customer directory searchable by name, phone or email.",
            "Order count, lifetime ordered value and full order history.",
            "Bulk customer deletion controls.",
            "Summary totals for orders, sales, products and customers.",
            "Orders and products CSV exports.",
            "Individual branded PDF invoices.",
            "Bulk invoice ZIP downloads.",
          ],
        },
      ],
    ],
  },
  {
    eyebrow: "CONTENT & ADMINISTRATION",
    title: "CMS, Settings, Team & Security",
    subtitle:
      "The merchant can update storefront content, campaigns, branding and team access without modifying application code.",
    columns: [
      [
        {
          title: "Homepage & banner CMS",
          bullets: [
            "Predefined Banner, Categories, Featured, Reviews, Promo and Rich Text blocks.",
            "Drag-and-drop section ordering and visibility controls.",
            "Section headings, subtitles, CTA controls and item limits.",
            "Create, edit, activate, reorder and delete banner slides.",
            "Desktop/mobile banner images limited to 6 MB.",
            "Editable banner statistics and scrolling marquee.",
          ],
        },
        {
          title: "About & legal content",
          bullets: [
            "Structured Hero, Statistics, Story, Values, Craft and CTA sections.",
            "Section ordering and visible/hidden controls.",
            "Rich story content, value cards and craft specifications.",
            "About images limited to 6 MB.",
            "Rich-text Terms, Privacy and Refund page editing.",
          ],
        },
        {
          title: "Promotions, reviews & contact",
          bullets: [
            "Create, edit, search, activate and delete promotions.",
            "Promotion image, percentage, CTA and linked product.",
            "Promo codes with status, start date and expiry.",
            "Create, publish, hide and delete reviews with 1-5 star ratings.",
            "Promotion and review images limited to 4 MB.",
            "Contact inbox with unread count, search and read/unread state.",
          ],
        },
      ],
      [
        {
          title: "Brand, store & integration settings",
          bullets: [
            "Store name, logo, favicon, email, phone and address.",
            "Facebook, Instagram and X links.",
            "Five built-in themes plus full custom palette controls.",
            "Live theme preview and reset option.",
            "BDT, USD and INR display settings.",
            "Inside/Outside Dhaka delivery pricing.",
            "Gmail/custom SMTP with live login verification.",
            "Courier credentials, active provider and webhook setup.",
          ],
        },
        {
          title: "Staff access & audit",
          bullets: [
            "Supabase email/password authentication.",
            "Administrator, editor and viewer role assignment.",
            "Create, edit and delete staff accounts.",
            "Manage email, name, role and replacement password.",
            "Protected admin routes and Row Level Security.",
            "Append-only audit trail across key merchant operations.",
            "Audit search, action/entity filters and structured metadata.",
          ],
        },
        {
          title: "Media storage & maintenance",
          bullets: [
            "Six dedicated media libraries with staff-restricted writes.",
            "Drag-and-drop uploads, previews, crop and main-image selection.",
            "Storage used, remaining capacity, file count and warning levels.",
            "Daily unused-media scan with recent-file protection.",
            "Manual cleanup with dry-run mode.",
          ],
        },
      ],
    ],
  },
  {
    eyebrow: "TECHNOLOGY & GROWTH",
    title: "Technology Stack & Platform Capabilities",
    subtitle:
      "A modern full-stack architecture supports performance, discoverability, integrations and ongoing store operations.",
    columns: [
      [
        {
          title: "Core technology stack",
          bullets: [
            "Next.js 16 App Router and React 19.",
            "TypeScript 5.9 and Tailwind CSS 4.",
            "Supabase PostgreSQL, Authentication, RLS and Storage.",
            "Supabase browser, server and middleware clients.",
            "Radix UI primitives and Lucide icons.",
            "TipTap rich-text editor.",
            "Zustand persistent client state.",
            "Recharts dashboards and dnd-kit ordering.",
            "date-fns calendar and reporting utilities.",
            "jsPDF and JSZip document generation.",
            "Nodemailer email delivery.",
          ],
        },
        {
          title: "Architecture & integrations",
          bullets: [
            "Next.js server components, route handlers and server actions.",
            "Node.js runtime for payments, email and privileged operations.",
            "bKash Tokenized Checkout API.",
            "Pathao, Steadfast and REDX APIs with authenticated webhooks.",
            "Gmail/custom SMTP with live server-login validation.",
            "Google Analytics, Google Tag Manager and Meta Pixel.",
            "WhatsApp and Facebook Messenger links.",
            "OpenRouter structured-output integration for catalog-grounded AI guidance.",
            "CSV feeds and downloadable business exports.",
          ],
        },
      ],
      [
        {
          title: "SEO & discoverability",
          bullets: [
            "Page-level titles, descriptions, keywords and Open Graph images.",
            "Canonical URLs and social-sharing metadata.",
            "Dynamic product metadata from live catalog content.",
            "Schema.org Product structured data.",
            "Dynamic XML sitemap with active products.",
            "Robots rules for storefront and checkout pages.",
            "Live CSV product feed.",
            "Meta events for product view, cart, checkout and purchase.",
          ],
        },
        {
          title: "Performance & operations",
          bullets: [
            "Responsive image optimization and loading placeholders.",
            "Fresh uncached catalog, CMS and admin data.",
            "Parallel server-side data loading on key pages.",
            "Persistent cart, wishlist and optional delivery data.",
            "Database cleanup every 15 minutes for abandoned gateway orders.",
            "GitHub Actions daily storage maintenance.",
            "Standard Node/Vercel-compatible build and deployment workflow.",
          ],
        },
        {
          title: "Current platform scope",
          bullets: [
            "Guest-first shopping with browser-based cart and wishlist.",
            "One administrator-selected display currency at a time.",
            "Courier webhook/manual-refresh status, not live GPS tracking.",
            "Staff-curated reviews and storefront content.",
            "Cash on Delivery and bKash payment methods.",
            "Ideal for apparel, accessories and focused retail catalogs.",
          ],
        },
      ],
    ],
  },
];

const doc = new jsPDF({
  orientation: "portrait",
  unit: "mm",
  format: "a4",
  compress: true,
});

doc.setProperties({
  title: "Reverb Commerce Feature Documentation",
  subject: "Complete product feature and technology documentation",
  author: "Reverb Solution",
  creator: "Reverb Solution",
  keywords:
    "Reverb Commerce, Reverb Solution, ecommerce, AI shopping assistant, OpenRouter, product recommendations, Next.js, React, Supabase, bKash, Pathao, Steadfast, REDX, SMTP, pg_cron, admin panel",
});

const pageWidth = doc.internal.pageSize.getWidth();
const pageHeight = doc.internal.pageSize.getHeight();
const margin = 16;
const columnGap = 10;
const columnWidth = (pageWidth - margin * 2 - columnGap) / 2;

function fill(color) {
  doc.setFillColor(...color);
}

function stroke(color) {
  doc.setDrawColor(...color);
}

function textColor(color) {
  doc.setTextColor(...color);
}

function drawPageBase(page, pageNumber) {
  fill(C.white);
  doc.rect(0, 0, pageWidth, pageHeight, "F");
  fill(pageNumber === pages.length ? C.indigo : C.blue);
  doc.rect(0, 0, pageWidth, 3, "F");

  doc.addImage(logoData, "PNG", margin, 9, 11, 11 / (988 / 707));
  textColor(C.ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("REVERB SOLUTION", margin + 15, 15.2);

  textColor(C.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.text(
    "REVERB COMMERCE / FEATURE DOCUMENTATION",
    pageWidth - margin,
    15.2,
    {
      align: "right",
    },
  );

  stroke(C.line);
  doc.line(margin, 23, pageWidth - margin, 23);

  textColor(C.blue);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text(page.eyebrow, margin, 34);

  textColor(C.ink);
  doc.setFontSize(pageNumber === 1 ? 25 : 21);
  doc.text(page.title, margin, pageNumber === 1 ? 46 : 45);

  if (pageNumber === 1) {
    textColor(C.blue);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(page.subtitle, margin, 56);

    fill(C.blueSoft);
    doc.rect(margin, 65, pageWidth - margin * 2, 28, "F");
    textColor(C.body);
    doc.setFontSize(9.5);
    const lines = doc.splitTextToSize(page.intro, pageWidth - margin * 2 - 12);
    doc.text(lines, margin + 6, 74, { lineHeightFactor: 1.45 });
  } else {
    textColor(C.body);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    const lines = doc.splitTextToSize(page.subtitle, pageWidth - margin * 2);
    doc.text(lines, margin, 54, { lineHeightFactor: 1.35 });
  }
}

function drawSection(x, y, width, section) {
  textColor(C.blue);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(section.title, x, y);
  stroke(C.blue);
  doc.setLineWidth(0.6);
  doc.line(x, y + 2.5, x + width, y + 2.5);

  let cursor = y + 10;
  section.bullets.forEach((bullet) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.2);
    const lines = doc.splitTextToSize(bullet, width - 8);
    fill(C.blue);
    doc.circle(x + 1.8, cursor - 1.1, 0.75, "F");
    textColor(C.body);
    doc.text(lines, x + 6, cursor, { lineHeightFactor: 1.35 });
    cursor += lines.length * 4.3 + 1.4;
  });

  return cursor + 4;
}

function drawFooter(pageNumber) {
  stroke(C.line);
  doc.setLineWidth(0.3);
  doc.line(margin, 284, pageWidth - margin, 284);
  textColor(C.blue);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.3);
  doc.text("WWW.REVERBSOLUTION.COM", margin, 290);
  textColor(C.muted);
  doc.setFont("helvetica", "normal");
  doc.text("contact@reverbsolution.com", margin + 44, 290);
  doc.text(`${pageNumber} / ${pages.length}`, pageWidth - margin, 290, {
    align: "right",
  });
}

function renderPage(page, pageNumber) {
  if (pageNumber > 1) doc.addPage();
  drawPageBase(page, pageNumber);

  const startY = pageNumber === 1 ? 106 : 68;
  page.columns.forEach((sections, columnIndex) => {
    const x = margin + columnIndex * (columnWidth + columnGap);
    let y = startY;
    sections.forEach((section) => {
      y = drawSection(x, y, columnWidth, section);
    });
    if (y > 280) {
      throw new Error(
        `Page ${pageNumber}, column ${columnIndex + 1} exceeds layout at ${y.toFixed(1)} mm`,
      );
    }
  });

  drawFooter(pageNumber);
}

pages.forEach((page, index) => renderPage(page, index + 1));

writeFileSync(outputPath, Buffer.from(doc.output("arraybuffer")));
console.log(`Generated ${outputPath} (${doc.getNumberOfPages()} pages)`);
