async function test() {
    try {
        const res = await fetch('http://localhost:3000/api/past-events/cmkl93o270005gaak5o6luhq4');
        const data = await res.json();
        console.log('Status:', res.status);
        console.log('Data:', JSON.stringify(data).substring(0, 100));
    } catch (err) {
        console.error('Fetch error:', err);
    }
}
test();
