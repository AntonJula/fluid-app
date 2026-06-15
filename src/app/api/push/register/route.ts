import { NextRequest, NextResponse } from "next/server";
import { isValidSubscription, saveSubscription } from "@/lib/push";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!isValidSubscription(body)) {
      return NextResponse.json({ error: "Invalid push subscription." }, { status: 400 });
    }

    saveSubscription(body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Push subscription registration failed", error);
    return NextResponse.json(
      { error: "Could not save this device for background reminders." },
      { status: 500 }
    );
  }
}
