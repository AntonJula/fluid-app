import { NextResponse } from "next/server";
import webpush from "web-push";
import { configureWebPush, getSubscriptions, removeSubscription } from "@/lib/push";

export async function POST() {
  if (!configureWebPush()) {
    return NextResponse.json(
      { error: "Web Push keys are not configured yet." },
      { status: 503 }
    );
  }

  const subscriptions = getSubscriptions();

  if (subscriptions.length === 0) {
    return NextResponse.json(
      { error: "No saved devices yet. Enable notifications on this device first." },
      { status: 400 }
    );
  }

  const payload = JSON.stringify({
    title: "Hydration check",
    body: "A small sip now keeps the rhythm easy.",
    tag: "fluid-test-push",
    actionAmount: 250,
    data: { url: "/?quickAdd=250" },
  });

  const results = await Promise.allSettled(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(subscription, payload);
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;

        if (statusCode === 404 || statusCode === 410) {
          removeSubscription(subscription.endpoint);
        }

        throw error;
      }
    })
  );

  const sent = results.filter((result) => result.status === "fulfilled").length;

  return NextResponse.json({
    success: sent > 0,
    sent,
    failed: results.length - sent,
  });
}
