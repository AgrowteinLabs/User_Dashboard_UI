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

/**
 * Update global product mode (manual or automate)
 * Automatically handles controls based on their supportsAuto capability
 * @param {string} uid - Product UID
 * @param {string} mode - "manual" or "automate"
 * @returns {Promise} Response with updatedControls and skippedControls
 */
export async function setProductMode(uid, mode) {
  try {
    const url = `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/user/product/mode/${uid}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ mode }),
    });

    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(`Error: ${response.status}, ${errorDetails}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error setting product mode:", error);
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
      },
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

export async function sendTimerCommand({ uid, pin, timer_enabled, on_time, off_time }) {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/command/timer`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ uid, pin, timer_enabled, on_time, off_time }),
      }
    );

    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(`Error: ${response.status}, ${errorDetails}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error setting timer command:", error);
    throw error;
  }
}
