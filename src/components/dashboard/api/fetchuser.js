const userid = localStorage.getItem('userId');

export const fetchUser = async () => {
    if (!userid) {
        return { error: 'Userid not found, try logging in again ' };
    }

    try {
        const API_URL = `/api/v1/users/${userid}`;

        const response = await fetch(API_URL);
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
