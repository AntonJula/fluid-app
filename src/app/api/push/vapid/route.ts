import { NextResponse } from "next/server";
import { getVapidPublicKey } from "@/lib/push";

export function GET() {
  const publicKey = getVapidPublicKey();

  if (!publicKey) {
    return NextResponse.json(
      { error: "Web Push is not configured yet." },
      { status: 503 }
    );
  }

  return NextResponse.json({ publicKey });
}
