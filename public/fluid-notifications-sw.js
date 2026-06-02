self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
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
