self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const addActionMatch = typeof event.action === "string" ? event.action.match(/^add-(\d+)$/) : null;
  const actionPath = addActionMatch ? `/?quickAdd=${encodeURIComponent(addActionMatch[1])}` : "/";
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
