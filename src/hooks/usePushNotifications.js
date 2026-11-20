import { useCallback } from "react";
import savePushSubscription from "../api/savePushSubscription";

const urlBase64ToUint8Array = (base64String) => {
  if (!base64String || typeof base64String !== "string") {
    throw new Error("Invalid or empty VAPID key string");
  }

  // Clean any extraneous spaces or quotes
  const cleanStr = base64String.trim().replace(/^["']|["']$/g, "");
  const padding = "=".repeat((4 - (cleanStr.length % 4)) % 4);
  const base64 = (cleanStr + padding).replace(/-/g, "+").replace(/_/g, "/");

  try {
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i += 1) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  } catch (err) {
    throw new Error(`Failed to decode VAPID public key (${err.message})`);
  }
};

const isPushSupported = () =>
  typeof window !== "undefined" &&
  "Notification" in window &&
  "serviceWorker" in navigator &&
  "PushManager" in window;

const getPermission = async () => {
  if (!isPushSupported()) return "denied";
  const permission = await Notification.requestPermission();
  return permission;
};

export const usePushNotifications = () => {
  const ensureSubscription = useCallback(async ({ vapidKey, userId }) => {
    if (!isPushSupported()) return { supported: false, error: "Push is not supported on this browser" };
    if (!vapidKey) return { supported: true, error: "Missing VAPID public key in environment configuration" };

    let appServerKey;
    try {
      appServerKey = urlBase64ToUint8Array(vapidKey);
    } catch (err) {
      return { supported: true, error: err.message };
    }

    const permission = await getPermission();
    if (permission !== "granted") {
      return { supported: true, permission };
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        if (userId) await savePushSubscription(existing, userId).catch(() => {});
        return { supported: true, permission, subscription: existing };
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appServerKey,
      });

      if (userId) {
        await savePushSubscription(subscription, userId).catch(() => {});
      }
      return { supported: true, permission, subscription };
    } catch (err) {
      return { supported: true, permission, error: err.message || "Failed to register push subscription with browser service" };
    }
  }, []);

  const checkSubscriptionStatus = useCallback(async () => {
    if (!isPushSupported()) return { status: "not-supported" };

    try {
      const permission = Notification.permission;
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();

      return {
        status: existing ? "subscribed" : "not-subscribed",
        subscription: existing,
        permission,
      };
    } catch {
      return {
        status: "idle",
        permission: typeof Notification !== "undefined" ? Notification.permission : "default",
      };
    }
  }, []);

  return { ensureSubscription, isPushSupported, checkSubscriptionStatus };
};
