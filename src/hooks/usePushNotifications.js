import { useCallback } from "react";
import savePushSubscription from "../api/savePushSubscription";

const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
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
    if (!isPushSupported()) return { supported: false };
    if (!vapidKey) return { supported: true, error: "Missing VAPID key" };

    const permission = await getPermission();
    if (permission !== "granted") {
      return { supported: true, permission };
    }

    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      if (userId) await savePushSubscription(existing, userId).catch(() => {});
      return { supported: true, permission, subscription: existing };
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });

    if (userId)
      await savePushSubscription(subscription, userId).catch(() => {});
    return { supported: true, permission, subscription };
  }, []);

  const checkSubscriptionStatus = useCallback(async () => {
    if (!isPushSupported()) return { status: "not-supported" };
    
    const permission = Notification.permission;
    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    
    return { 
      status: existing ? "subscribed" : "not-subscribed", 
      subscription: existing,
      permission 
    };
  }, []);

  return { ensureSubscription, isPushSupported, checkSubscriptionStatus };
};
