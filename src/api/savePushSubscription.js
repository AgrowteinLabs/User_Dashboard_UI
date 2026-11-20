const API_URL = import.meta.env.VITE_REACT_APP_API_URL;

const savePushSubscription = async (subscription, userId) => {
  if (!API_URL) throw new Error("Missing API URL");
  const body = {
    userId,
    subscription,
  };

  const res = await fetch(`${API_URL}/api/v1/notifications/subscribe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || "Failed to save push subscription");
  }

  return res.json();
};

export default savePushSubscription;
