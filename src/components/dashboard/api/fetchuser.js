const userid = localStorage.getItem('userId');

export const fetchUser = async () => {
    if (!userid) {
        return { error: 'User ID not found, try logging in again' };
    }

    try {
        const API_URL = `https://agrowtein-5u7w.onrender.com/api/v1/users/${userid}`;

        // Add credentials: 'include' to send cookies with the request
        const response = await fetch(API_URL, {
            method: 'GET',
            credentials: 'include', // Ensures cookies are sent with the request
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        console.log(data);
        return data;

    } catch (error) {
        console.error('Error fetching user:', error);
        return { error: 'Error fetching user' };
    }
};
