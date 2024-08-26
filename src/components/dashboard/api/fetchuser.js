// const userid = localStorage.getItem('userid');

const userid = "66cad0b3e4a44c6c27f6a980"; // temp userr for now


export const fetchUser = async () => {
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
        return null;
    }
};