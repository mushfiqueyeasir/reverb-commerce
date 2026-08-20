import { NextRequest, NextResponse } from "next/server";
import { getSiteSettings } from "@/utility/getSettings";
import { getSmsSettings, isSmsReady } from "@/lib/sms/settings";
import { sendCheckoutOtp } from "@/lib/sms/otp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required." },
        { status: 400 },
      );
    }

    const [sms, settings] = await Promise.all([
      getSmsSettings(),
      getSiteSettings(),
    ]);
    if (!sms.enabled || !isSmsReady(sms)) {
      return NextResponse.json(
        { error: "SMS verification is not available right now." },
        { status: 400 },
      );
    }
    if (!sms.checkoutOtp) {
      return NextResponse.json(
        { error: "OTP verification is disabled." },
        { status: 400 },
      );
    }

    const storeName = settings.store_name || "Store";
    const message = `${storeName}: Your order verification code is {code}. It expires in 5 minutes. Do not share it.`;

    const result = await sendCheckoutOtp(phone, message);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Verification code sent.",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to send the verification code." },
      { status: 500 },
    );
  }
}
