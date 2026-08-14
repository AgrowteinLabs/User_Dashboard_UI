// GET /api/v1/products/:uid/health — backend-computed farm health score.
// Returns { data } on success, { error, status? } on failure.
// Response data: { uid, score (0-100), status (excellent|warning|critical),
//                  factors: [{ sensor, unit, status, value, score, range?, direction? }],
//                  lastComputedAt }
export default async function fetchFarmHealth(uid) {
  if (!uid) return { error: "Missing farm uid" };
  const API_URL = import.meta.env.VITE_REACT_APP_API_URL;
  try {
    const res = await fetch(
      `${API_URL}/api/v1/products/${encodeURIComponent(uid)}/health`,
      {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      }
    );
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        error: body?.error?.message || "Failed to load farm health",
        status: res.status,
      };
    }
    return { data: body.data };
  } catch (err) {
    console.error("Error fetching farm health:", err);
    return { error: "Network error — could not load farm health" };
  }
}
