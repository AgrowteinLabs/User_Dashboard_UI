
export default async function fetchProducts() {
    const userId = "66ae21a94d390ac90b8834cf"; //dummy user id

    try {
        const API_URL = `/api/v1/products/user/${userId}`;
        
        const response = await fetch(API_URL);
        const data = await response.json();

        return data;

    } catch (error) {
        console.error('Error fetching products:', error);
        return null;
    }
}