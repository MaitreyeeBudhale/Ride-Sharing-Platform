self.addEventListener("push", (event) => {
  let data = { title: "New Notification", body: "You have a new message." };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: "New Notification", body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: "/logo.png", // Or generic icon
    badge: "/logo.png",
    data: data.data || {},
    vibrate: [200, 100, 200],
    actions: [
      { action: "open", title: "View Request" }
    ],
    tag: "new-ride-request", // Group notifications if multiple come
    requireInteraction: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  // Focus or open the app window
  const urlToOpen = new URL("/dashboard", self.location.origin).href;

  const promiseChain = clients.matchAll({
    type: "window",
    includeUncontrolled: true
  }).then((windowClients) => {
    let matchingClient = null;

    for (let i = 0; i < windowClients.length; i++) {
      const windowClient = windowClients[i];
      if (windowClient.url === urlToOpen || windowClient.url.includes("/driver")) {
        matchingClient = windowClient;
        break;
      }
    }

    if (matchingClient) {
      return matchingClient.focus();
    } else {
      return clients.openWindow(urlToOpen);
    }
  });

  event.waitUntil(promiseChain);
});
