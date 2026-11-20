// PUT /api/v1/products/:productId/location — save farm lat/lon/name.
// Returns { data } on success, { error } on failure.
export default async function saveFarmLocation(productId, { lat, lon, name }) {
  if (!productId) return { error: "Missing product id" };
  const API_URL = import.meta.env.VITE_REACT_APP_API_URL;
  try {
    const res = await fetch(`${API_URL}/api/v1/products/${productId}/location`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lon, name }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        error: body?.error?.message || "Failed to save location",
      };
    }
    return { data: body.data };
  } catch (err) {
    console.error("Error saving farm location:", err);
    return { error: "Network error — could not save location" };
  }
}
