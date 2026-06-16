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

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const addActionMatch = typeof event.action === "string" ? event.action.match(/^add-(\d+)(?:-([a-z-]+))?$/) : null;
  const fallbackPath = typeof event.notification.data?.url === "string" ? event.notification.data.url : "/";
  const actionPath = addActionMatch
    ? `/?quickAdd=${encodeURIComponent(addActionMatch[1])}${
        addActionMatch[2] ? `&quickAddNote=${encodeURIComponent(addActionMatch[2])}` : ""
      }`
    : fallbackPath;
  const actionUrl = new URL(actionPath, self.registration.scope).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clientList) => {
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
      : { url: actionAmount ? `/?quickAdd=${encodeURIComponent(actionAmount)}` : "/" };

  const options = {
    body: payload.body || "A few calm sips can help.",
    data,
    icon: "/fluid-icon-192.png",
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
