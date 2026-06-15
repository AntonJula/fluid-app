import fs from "fs";
import path from "path";
import webpush from "web-push";

const VAPID_FILE = path.join(process.cwd(), "vapid-keys.json");
const SUBSCRIPTIONS_FILE = path.join(process.cwd(), "push-subscriptions.json");
const DEFAULT_VAPID_SUBJECT = "mailto:dev@fluid.app";

export interface PushSubscriptionItem {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface VapidKeys {
  publicKey: string;
  privateKey: string;
}

function readLocalVapidKeys(): VapidKeys | null {
  if (!fs.existsSync(VAPID_FILE)) return null;

  try {
    const parsed = JSON.parse(fs.readFileSync(VAPID_FILE, "utf-8")) as Partial<VapidKeys>;
    if (parsed.publicKey && parsed.privateKey) {
      return { publicKey: parsed.publicKey, privateKey: parsed.privateKey };
    }
  } catch (error) {
    console.error("Failed to read local VAPID keys", error);
  }

  return null;
}

export function getVapidKeys(): VapidKeys | null {
  const publicKey = process.env.WEB_PUSH_PUBLIC_KEY;
  const privateKey = process.env.WEB_PUSH_PRIVATE_KEY;

  if (publicKey && privateKey) {
    return { publicKey, privateKey };
  }

  return readLocalVapidKeys();
}

export function getVapidPublicKey(): string | null {
  return getVapidKeys()?.publicKey ?? process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY ?? null;
}

export function configureWebPush(): boolean {
  const keys = getVapidKeys();

  if (!keys) return false;

  webpush.setVapidDetails(
    process.env.WEB_PUSH_SUBJECT ?? DEFAULT_VAPID_SUBJECT,
    keys.publicKey,
    keys.privateKey
  );
  return true;
}

function readSubscriptions(): PushSubscriptionItem[] {
  if (!fs.existsSync(SUBSCRIPTIONS_FILE)) return [];

  try {
    const parsed = JSON.parse(fs.readFileSync(SUBSCRIPTIONS_FILE, "utf-8")) as PushSubscriptionItem[];
    return Array.isArray(parsed) ? parsed.filter(isValidSubscription) : [];
  } catch (error) {
    console.error("Failed to read push subscriptions", error);
    return [];
  }
}

function writeSubscriptions(subscriptions: PushSubscriptionItem[]) {
  fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(subscriptions, null, 2), "utf-8");
}

export function isValidSubscription(value: unknown): value is PushSubscriptionItem {
  const candidate = value as Partial<PushSubscriptionItem> | null;

  return Boolean(
    candidate &&
      typeof candidate.endpoint === "string" &&
      candidate.endpoint.length > 0 &&
      candidate.keys &&
      typeof candidate.keys.p256dh === "string" &&
      typeof candidate.keys.auth === "string"
  );
}

export function getSubscriptions(): PushSubscriptionItem[] {
  return readSubscriptions();
}

export function saveSubscription(subscription: PushSubscriptionItem) {
  const subscriptions = readSubscriptions();
  const existingIndex = subscriptions.findIndex((item) => item.endpoint === subscription.endpoint);

  if (existingIndex >= 0) {
    subscriptions[existingIndex] = subscription;
  } else {
    subscriptions.push(subscription);
  }

  writeSubscriptions(subscriptions);
}

export function removeSubscription(endpoint: string) {
  writeSubscriptions(readSubscriptions().filter((subscription) => subscription.endpoint !== endpoint));
}
