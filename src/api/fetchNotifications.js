const API_URL = import.meta.env.VITE_REACT_APP_API_URL;

/**
 * Backend-driven notification inbox helpers (v2 contract §4).
 * All calls ride the httpOnly session cookie via credentials: "include"
 * (the refresh layer in src/utils/api.js handles 401 → /auth/refresh).
 */

// GET /api/v1/notifications?limit&offset&uid&type&unreadOnly
export async function fetchNotifications({ limit = 20, offset = 0, uid, type, unreadOnly } = {}) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (uid) params.set("uid", uid);
  if (type) params.set("type", type);
  if (unreadOnly) params.set("unreadOnly", "true");

  const res = await fetch(`${API_URL}/api/v1/notifications?${params.toString()}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to fetch notifications (${res.status})`);
  const body = await res.json();
  return body.data; // { total, unreadCount, notifications: [] }
}

// POST /api/v1/notifications/:notificationId/read
export async function markNotificationRead(notificationId) {
  const res = await fetch(`${API_URL}/api/v1/notifications/${notificationId}/read`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to mark notification read (${res.status})`);
  return res.json();
}

// POST /api/v1/notifications/read-all
export async function markAllNotificationsRead() {
  const res = await fetch(`${API_URL}/api/v1/notifications/read-all`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to mark all read (${res.status})`);
  return res.json();
}
