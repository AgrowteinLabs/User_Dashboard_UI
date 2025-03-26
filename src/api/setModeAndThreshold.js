export const setControls = async (payload) => {
    try {
      console.log("Sending Payload:", payload); // Log the payload for debugging
  
      // Make sure the payload is a plain object and not wrapped inside a string
      if (!payload || typeof payload !== 'object') {
        throw new Error("Invalid payload format");
      }
  
      const response = await fetch("https://apiv2.agrowtein.com/api/v1/command/controls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload), // Ensure the payload is in JSON format
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        console.error("API Error:", data);
        throw new Error(data.message || "Failed to update control mode");
      }
  
      console.log("Response:", data);
      return data; // Return response data if successful
    } catch (error) {
      console.error("Error in setControls:", error);
      throw error; // Rethrow error for handling upstream
    }
  };
  