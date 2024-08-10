// const userid = localStorage.getItem('userid');

const userid = "66ae21a94d390ac90b8834cf";


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