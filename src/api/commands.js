export async function setControls(mode, bodyData) {
  try {
    const url = `${
      import.meta.env.VITE_REACT_APP_API_URL
    }/api/v1/command/controls?mode=${mode}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(bodyData),
    });

    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(`Error: ${response.status}, ${errorDetails}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error setting controls:", error);
    throw error;
  }
}

export async function setPower(uid, pin, controlId, value) {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/command`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ uid, pin, controlId, value }),
      }
    );

    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(`Error: ${response.status}, ${errorDetails}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error setting power:", error);
    throw error;
  }
}
