// src/api/fetchuser.js
const fetchUser = async () => {
    const userid = localStorage.getItem('userId');
    
    if (!userid) {
        return { error: 'User ID not found, try logging in again' };
    }

    try {
        const API_URL = `http://13.233.45.54:4500/api/v1/users/${userid}`;

        const response = await fetch(API_URL, {
            method: 'GET',
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error('Error fetching user:', error);
        return { error: 'Error fetching user' };
    }
};

export default fetchUser;  // Default export
