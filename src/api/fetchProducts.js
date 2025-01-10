export default async function fetchProducts() {
    const userId = localStorage.getItem("userId");

    if (!userId) {
        // Return an error if userId is not found
        return { error: 'User id not found, try logging in again' };
    }

    try {
        const API_URL = `http://13.233.45.54:4500/api/v1/user/product/${userId}`;
        
        // Add credentials: 'include' to send cookies
        const response = await fetch(API_URL, {
            method: 'GET',
            credentials: 'include', // Ensures cookies are sent with the request
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();

        // Check if no products are returned
        if (data.length === 0) {
            return { message: 'No products are there to display' };
        }

        return data;

    } catch (error) {
        console.error('Error fetching products:', error);
        return { error: 'Error fetching products' };
    }
}
