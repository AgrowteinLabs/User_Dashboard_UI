export async function fetchSensorList(uidOrId) {
  try {
    const urlBase = import.meta.env.VITE_REACT_APP_API_URL;
    let productId = uidOrId;

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(uidOrId);

    if (!isObjectId) {
      const userId = localStorage.getItem("userId");
      if (userId) {
        const prodRes = await fetch(`${urlBase}/api/v1/user/product/${userId}`, { credentials: "include" });
        if (prodRes.ok) {
          const products = await prodRes.json();
          const found = products.find((p) => p.uid === uidOrId);
          if (found) {
            productId = found.id || found._id;
          }
        }
      }
    }

    const response = await fetch(`${urlBase}/api/v1/products/${productId}/sensors`, { 
      method: 'GET', 
      credentials: 'include' 
    });

    if (!response.ok) {
      const errorDetail = await response.text();
      throw new Error(`Network response was not ok: ${response.status} - ${errorDetail}`);
    }

    const result = await response.json();
    if (result && result.success && result.data && result.data.sensors) {
      return result.data.sensors;
    }
    return result;
  } catch (error) {
    console.error('Error fetching sensor list:', error);
    throw error;
  }
}
