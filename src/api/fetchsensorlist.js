// Fetch sensors for a product with automatic V2 -> V1 -> Catalog fallback
// Supports both productId (Mongo ObjectId) and product UID (e.g. 'ogk001')

export async function fetchSensorList(uidOrId) {
  if (!uidOrId) return [];

  try {
    const urlBase = import.meta.env.VITE_REACT_APP_API_URL;
    let productId = null;
    let uid = null;

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(String(uidOrId).trim());

    if (isObjectId) {
      productId = String(uidOrId).trim();
      // Try to find corresponding UID from user's products for fallback
      const userId = localStorage.getItem("userId");
      if (userId) {
        try {
          const prodRes = await fetch(`${urlBase}/api/v1/user/product/${userId}`, { credentials: "include" });
          if (prodRes.ok) {
            const products = await prodRes.json().catch(() => []);
            const list = Array.isArray(products) ? products : (products?.data || []);
            const found = list.find((p) => (p.id || p._id) === productId);
            if (found && found.uid) {
              uid = found.uid;
            }
          }
        } catch {
          // ignore lookup failure
        }
      }
    } else {
      uid = String(uidOrId).trim();
      // Look up corresponding productId from user's products
      const userId = localStorage.getItem("userId");
      if (userId) {
        try {
          const prodRes = await fetch(`${urlBase}/api/v1/user/product/${userId}`, { credentials: "include" });
          if (prodRes.ok) {
            const products = await prodRes.json().catch(() => []);
            const list = Array.isArray(products) ? products : (products?.data || []);
            const found = list.find((p) => p.uid === uid);
            if (found) {
              productId = found.id || found._id;
            }
          }
        } catch {
          // ignore lookup failure
        }
      }
    }

    const normalizeSensors = (list) => {
      if (!Array.isArray(list)) return [];
      return list.map((s) => ({
        ...s,
        id: s.id || s._id,
        name: s.name || "",
      }));
    };

    // 1. Try V2 endpoint: GET /api/v1/products/:productId/sensors
    if (productId) {
      try {
        const response = await fetch(`${urlBase}/api/v1/products/${productId}/sensors`, { 
          method: 'GET', 
          credentials: 'include' 
        });

        if (response.ok) {
          const result = await response.json().catch(() => null);
          if (result && result.success && result.data && Array.isArray(result.data.sensors)) {
            return normalizeSensors(result.data.sensors);
          }
          if (Array.isArray(result)) {
            return normalizeSensors(result);
          }
        }
      } catch (err) {
        console.warn("[fetchSensorList] V2 endpoint failed, attempting fallback:", err.message);
      }
    }

    // 2. Fallback to V1 endpoint: GET /api/v1/sensors/uid/:uid
    if (uid) {
      try {
        const response = await fetch(`${urlBase}/api/v1/sensors/uid/${encodeURIComponent(uid)}`, {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const result = await response.json().catch(() => null);
          if (Array.isArray(result)) {
            return normalizeSensors(result);
          }
          if (result && Array.isArray(result.data)) {
            return normalizeSensors(result.data);
          }
        }
      } catch (err) {
        console.warn("[fetchSensorList] V1 uid endpoint failed:", err.message);
      }
    }

    // 3. Fallback to global sensor catalog: GET /api/v1/sensors
    try {
      const response = await fetch(`${urlBase}/api/v1/sensors`, {
        method: 'GET',
        credentials: 'include',
      });
      if (response.ok) {
        const result = await response.json().catch(() => null);
        if (Array.isArray(result)) {
          return normalizeSensors(result);
        }
      }
    } catch {
      // ignore
    }

    return [];
  } catch (error) {
    console.error('Error fetching sensor list:', error);
    return [];
  }
}
