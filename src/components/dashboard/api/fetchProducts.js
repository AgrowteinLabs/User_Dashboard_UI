export default async function fetchProducts() {
    const userId = localStorage.getItem("userId");

    if (!userId) {
        // Return an error if userId is not found
        return { error: 'User id not found, try loggin in again' };
    }

    try {
        const API_URL = `/api/v1/user/product/${userId}`;
        
        const response = await fetch(API_URL);
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
