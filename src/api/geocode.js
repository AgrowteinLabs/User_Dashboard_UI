// Place-name geocoding, proxied through the backend (GET /api/v1/geocode).
// The browser never talks to OSM directly — avoids CORS/network blocking and
// lets the server cache results and fall back between providers.
// Returns { results } on success, { error } on failure.
const API_URL = import.meta.env.VITE_REACT_APP_API_URL;

export const searchPlaces = async (query, { limit = 6 } = {}) => {
  const q = (query || "").trim();
  if (q.length < 3) return { results: [], error: null };

  try {
    const url = new URL(`${API_URL}/api/v1/geocode`);
    url.searchParams.set("q", q);
    url.searchParams.set("limit", String(limit));

    const res = await fetch(url, { credentials: "include" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        results: [],
        error:
          body?.error?.message || "Search failed — please try again later.",
      };
    }
    return { results: body?.data?.results || [], error: null };
  } catch (err) {
    console.error("Geocoding error:", err);
    return { results: [], error: "Search service is unreachable right now." };
  }
};
