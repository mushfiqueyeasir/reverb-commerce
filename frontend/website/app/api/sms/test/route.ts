import { NextRequest, NextResponse } from "next/server";
import { getSiteSettings } from "@/utility/getSettings";
import { getSmsSettings, isSmsReady } from "@/lib/sms/settings";
import { sendSms } from "@/lib/sms/khudebarta";
import { isValidBdPhone, normalizePhone } from "@/lib/sms/otp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";

    if (!isValidBdPhone(phone)) {
      return NextResponse.json(
        { error: "Please enter a valid Bangladeshi mobile number." },
        { status: 400 },
      );
    }

    const [sms, settings] = await Promise.all([
      getSmsSettings(),
      getSiteSettings(),
    ]);
    if (!sms.enabled || !isSmsReady(sms)) {
      return NextResponse.json(
        { error: "SMS gateway is not configured or not enabled." },
        { status: 400 },
      );
    }

    const storeName = settings.store_name || "Store";
    await sendSms({
      to: normalizePhone(phone),
      message: `${storeName}: This is a test SMS from your Khudebarta gateway. It works!`,
    });

    return NextResponse.json({
      success: true,
      message: "Test SMS sent.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to send the test SMS.",
      },
      { status: 500 },
    );
  }
}
