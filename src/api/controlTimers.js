// API helpers for V2 Controls — Timer & Schedule (backend doc §11/§12).
// Endpoints: /api/v1/products/:productId/controls/:controlId/timer + /schedules
// All calls ride the httpOnly session cookie (credentials: "include").

const API_URL = import.meta.env.VITE_REACT_APP_API_URL;

async function request(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  // 404 on the single-timer GET simply means "no active timer" — handled by caller.
  if (!res.ok && res.status !== 404) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      message = body?.error?.message || body?.message || message;
    } catch {
      /* keep default */
    }
    throw new Error(message);
  }
  return res;
}

// ---------- Timers ----------

// GET /products/:productId/controls/:controlId/timer  → data | null (404)
export async function fetchActiveTimer(productId, controlId) {
  const res = await request(
    `${API_URL}/api/v1/products/${productId}/controls/${encodeURIComponent(controlId)}/timer`
  );
  if (res.status === 404) return null;
  const body = await res.json();
  return body.data || null;
}

// POST .../timer  { action: "ON"|"OFF", durationSeconds }
export async function startTimer(productId, controlId, { action, durationSeconds }) {
  const res = await request(
    `${API_URL}/api/v1/products/${productId}/controls/${encodeURIComponent(controlId)}/timer`,
    {
      method: "POST",
      body: JSON.stringify({ action, durationSeconds: Number(durationSeconds) }),
    }
  );
  const body = await res.json();
  return body.data || null;
}

// DELETE .../timer
export async function cancelTimer(productId, controlId) {
  const res = await request(
    `${API_URL}/api/v1/products/${productId}/controls/${encodeURIComponent(controlId)}/timer`,
    { method: "DELETE" }
  );
  if (res.status === 404) return null;
  return res.json();
}

// ---------- Schedules ----------

// GET .../schedules → array
export async function fetchSchedules(productId, controlId) {
  const res = await request(
    `${API_URL}/api/v1/products/${productId}/controls/${encodeURIComponent(controlId)}/schedules`
  );
  const body = await res.json();
  return body.data?.schedules || [];
}

// POST .../schedules
export async function createSchedule(productId, controlId, payload) {
  const res = await request(
    `${API_URL}/api/v1/products/${productId}/controls/${encodeURIComponent(controlId)}/schedules`,
    { method: "POST", body: JSON.stringify(payload) }
  );
  const body = await res.json();
  return body.data || null;
}

// PUT .../schedules/:scheduleId
export async function updateSchedule(productId, controlId, scheduleId, payload) {
  const res = await request(
    `${API_URL}/api/v1/products/${productId}/controls/${encodeURIComponent(controlId)}/schedules/${scheduleId}`,
    { method: "PUT", body: JSON.stringify(payload) }
  );
  const body = await res.json();
  return body.data || null;
}

// DELETE .../schedules/:scheduleId
export async function deleteSchedule(productId, controlId, scheduleId) {
  const res = await request(
    `${API_URL}/api/v1/products/${productId}/controls/${encodeURIComponent(controlId)}/schedules/${scheduleId}`,
    { method: "DELETE" }
  );
  return res.json();
}
