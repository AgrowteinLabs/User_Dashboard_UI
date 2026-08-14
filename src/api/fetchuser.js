// src/api/fetchuser.js
const fetchUser = async () => {
    const userid = localStorage.getItem('userId');
    
    if (!userid) {
        return { error: 'User ID not found, try logging in again' };
    }

    try {
        // Use the environment variable for the API URL
        const API_URL = `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/user/profile`;

        const response = await fetch(API_URL, {
            method: 'GET',
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const result = await response.json();
        if (result && result.success && result.data) {
            return result.data;
        }
        return result;

    } catch (error) {
        console.error('Error fetching user:', error);
        return { error: 'Error fetching user' };
    }
};

export default fetchUser;  // Default export
