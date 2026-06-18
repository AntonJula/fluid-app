self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(fetch(event.request));
});

const HYDRATION_ACTION_DB = "fluid-notification-actions";
const HYDRATION_ACTION_STORE = "pending-actions";

function openHydrationActionDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(HYDRATION_ACTION_DB, 1);

    request.onupgradeneeded = () => {
      request.result.createObjectStore(HYDRATION_ACTION_STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function queueHydrationAction(action) {
  const db = await openHydrationActionDb();

  await new Promise((resolve, reject) => {
    const transaction = db.transaction(HYDRATION_ACTION_STORE, "readwrite");
    transaction.objectStore(HYDRATION_ACTION_STORE).put(action);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });

  db.close();
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const addActionMatch = typeof event.action === "string" ? event.action.match(/^add-(\d+)(?:-([a-z-]+))?$/) : null;
  const fallbackPath = typeof event.notification.data?.url === "string" ? event.notification.data.url : "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clientList) => {
      if (addActionMatch) {
        const action = {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          amount: Number(addActionMatch[1]),
          note: addActionMatch[2] || "water",
          createdAt: Date.now(),
        };

        if (clientList.length > 0) {
          clientList.forEach((client) => {
            client.postMessage({ type: "fluid:add-drink", ...action });
          });
          return undefined;
        }

        await queueHydrationAction(action);
        return undefined;
      }

      const openUrl = new URL(fallbackPath, self.registration.scope);
      openUrl.searchParams.delete("quickAdd");
      openUrl.searchParams.delete("quickAddNote");
      const actionUrl = openUrl.href;

      for (const client of clientList) {
        if ("focus" in client) {
          if ("navigate" in client) {
            await client.navigate(actionUrl);
          }

          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(actionUrl);
      }

      return undefined;
    })
  );
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = {};

  try {
    payload = event.data.json();
  } catch {
    payload = { body: event.data.text() };
  }

  const actionAmount = Number(payload.actionAmount || 0);
  const actionNote = typeof payload.actionNote === "string" ? payload.actionNote : "";
  const actionSuffix = actionAmount && actionNote ? `-${actionNote}` : "";
  const data =
    payload.data && typeof payload.data === "object"
      ? payload.data
      : { url: "/" };

  const options = {
    badge: "/fluid-notification-badge.png",
    body: payload.body || "A few calm sips can help.",
    data,
    icon: "/fluid-notification-icon.png",
    tag: payload.tag || "fluid-push",
    renotify: true,
  };

  if (Array.isArray(payload.actions)) {
    options.actions = payload.actions;
  } else if (actionAmount > 0) {
    options.actions = [
      { action: `add-${actionAmount}${actionSuffix}`, title: `+${actionAmount} ml` },
      { action: "open", title: "Open" },
    ];
  }

  event.waitUntil(self.registration.showNotification(payload.title || "Fluid.", options));
});
