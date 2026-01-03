/* eslint-disable no-undef */
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { clientsClaim } from "workbox-core";

self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

const DEFAULT_TITLE = "Agrowtrack Alert";
const DEFAULT_BODY = "You have a new notification.";

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || DEFAULT_TITLE;
  const options = {
    body: data.body || DEFAULT_BODY,
    icon: data.icon || "/icons/android-chrome-192x192.png",
    badge: data.badge || "/icons/android-chrome-192x192.png",
    data: data.data || {},
    tag: data.tag || "agrowtrack-alert",
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        const matchingClient = windowClients.find((client) =>
          client.url.includes(targetUrl)
        );
        if (matchingClient) {
          return matchingClient.focus();
        }
        return clients.openWindow(targetUrl);
      })
  );
});
