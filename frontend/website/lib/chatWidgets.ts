export type ChatProvider = "none" | "whatsapp" | "messenger";

export interface ChatWidgets {
  /** Only one provider can be active at a time. */
  provider: ChatProvider;
  /** Digits with country code, e.g. 8801712345678 (no + or spaces required). */
  whatsappNumber: string;
  /**
   * Facebook Page ID or username for m.me (Meta retired the on-site Chat Plugin).
   * Examples: 378400148906020 or storeofficial
   */
  messengerPageId: string;
}

export const DEFAULT_CHAT_WIDGETS: ChatWidgets = {
  provider: "none",
  whatsappNumber: "",
  messengerPageId: "",
};

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** Strip m.me URLs / @ so we store a clean page id or username. */
export function normalizeMessengerTarget(raw: string): string {
  let s = raw.trim();
  s = s.replace(/^https?:\/\//i, "");
  s = s.replace(/^(www\.)?m\.me\//i, "");
  s = s.replace(/^@/, "");
  s = (s.split(/[/?#]/)[0] ?? "").trim();
  return s;
}

export function normalizeChatWidgets(raw: unknown): ChatWidgets {
  const base = { ...DEFAULT_CHAT_WIDGETS };
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;

  const legacyWhatsapp =
    typeof o.whatsappCode === "string" ? o.whatsappCode.trim() : "";
  const legacyMessenger =
    typeof o.messengerCode === "string" ? o.messengerCode.trim() : "";

  let provider: ChatProvider = "none";
  if (o.provider === "whatsapp" || o.provider === "messenger") {
    provider = o.provider;
  } else if (legacyWhatsapp && !legacyMessenger) {
    provider = "whatsapp";
  } else if (legacyMessenger && !legacyWhatsapp) {
    provider = "messenger";
  }

  return {
    provider,
    whatsappNumber:
      typeof o.whatsappNumber === "string"
        ? digitsOnly(o.whatsappNumber)
        : base.whatsappNumber,
    messengerPageId:
      typeof o.messengerPageId === "string"
        ? normalizeMessengerTarget(o.messengerPageId)
        : base.messengerPageId,
  };
}

export function chatWhatsappHref(number: string): string | null {
  const digits = digitsOnly(number);
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}`;
}

/** Opens Messenger via m.me (on-site Customer Chat Plugin was shut down by Meta). */
export function chatMessengerHref(pageIdOrUsername: string): string | null {
  const id = normalizeMessengerTarget(pageIdOrUsername);
  if (id.length < 2) return null;
  if (!/^[\w.]+$/.test(id)) return null;
  return `https://m.me/${id}`;
}

export function hasChatWidgets(
  widgets: ChatWidgets | null | undefined,
): boolean {
  if (!widgets || widgets.provider === "none") return false;
  if (widgets.provider === "whatsapp") {
    return Boolean(chatWhatsappHref(widgets.whatsappNumber));
  }
  return Boolean(chatMessengerHref(widgets.messengerPageId));
}
