
const fetch = require('node-fetch');

async function checkSponsors() {
  const eventId = "cmjn1f6ih0000gad4xa4j7dp3";
  const url = `http://localhost:3000/api/events/${eventId}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    console.log("Event Name:", data.name);
    console.log("Event Sponsor Types:");
    data.eventSponsorTypes.forEach(est => {
      console.log(`- ${est.sponsorType.name} (Sort: ${est.sponsorType.sortOrder})`);
    });
    
    console.log("\nPurchase Orders with Sponsors:");
    data.purchaseOrders.forEach(po => {
      console.log(`PO ID: ${po.id}, Company: ${po.company.name}`);
      po.items.forEach(item => {
        console.log(`  - Item: ${item.name}`);
      });
    });

  } catch (error) {
    console.error("Error fetching event data:", error.message);
  }
}

checkSponsors();
