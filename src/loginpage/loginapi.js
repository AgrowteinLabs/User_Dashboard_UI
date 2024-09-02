// src/api.js
import axios from "axios";

// Function to handle the login API call
export const loginUser = async (email, password) => {
  try {
    const response = await axios.post(
      "/api/v1/auth/login",
      { email, password },
      { withCredentials: true }
    );
    
    // If login is successful, store the _id in local storage
    if (response.status === 200) {
      const userId = response.data.user._id;
      localStorage.setItem("userId", userId);
      
      return {
        success: true,
        message: response.data.message,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Login failed. Please check your email and password.",
    };
  }
};
