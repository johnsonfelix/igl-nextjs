
const fetch = require('node-fetch'); // Ensure node-fetch is available or use built-in fetch in newer node
// If node version is new enough, fetch is global. If not, this might fail.
// Let's try standard fetch Assuming Node 18+

async function test() {
    console.log("Testing API...");
    try {
        const res = await fetch("http://localhost:3000/api/auth/check-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "suhlaing@ecoasiapte.com" })
        });
        console.log("Status:", res.status);
        const text = await res.text();
        console.log("Body:", text);
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

test();
