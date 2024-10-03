export async function PowerButton(uid, power) {
    try {
        const API_URL = `https://agrowtein-5u7w.onrender.com/api/v1/command`;
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ command: power, uid: uid }),  // Construct the body with command and uid
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log(data);
        return data;
    } catch (error) {
        console.error('Error sending command:', error);
        return { error: 'Error sending command' };
    }
}
