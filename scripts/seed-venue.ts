import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const eventId = "cmjn1f6ih0000gad4xa4j7dp3";

    console.log(`Updating event ${eventId}...`);

    // 1. Update Event Details (Dates, Description)
    const event = await prisma.event.update({
        where: { id: eventId },
        data: {
            startDate: new Date("2025-12-27"),
            endDate: new Date("2026-03-25"), // Note: The user request said "Mar 25, 2026 - Dec 27, 2025" which seems backwards or spanning 3 months?
            // Assuming start is Dec 2025 and end is Mar 2026.
            location: "Bangkok, Thailand",
            description: `
        Join us at the Radisson Suites Bangkok Sukhumvit for an unparalleled industry innovation conference. 
        Experience three days of cutting-edge insights, networking with global leaders, and exploring the future of logistics in the heart of Bangkok.
        
        This event brings together top professionals to discuss emerging trends, sustainability in supply chains, and digital transformation. 
        Don't miss this opportunity to connect, learn, and grow your business in one of Asia's most dynamic cities.
      `.trim(),
        }
    });

    console.log("Event updated:", event.name);

    // 2. Upsert Venue Details
    const venue = await prisma.venue.upsert({
        where: { eventId: eventId },
        create: {
            eventId: eventId,
            name: "RADISSON SUITES BANGKOK SUKHUMVIT",
            description: "An upscale hotel located in the bustling Sukhumvit area, offering spacious suites and world-class amenities.",
            location: "23/2-3 Sukhumvit 13, Khlong Toei Nuea, Watthana, Bangkok 10110, Thailand",
            imageUrls: [],
            closestAirport: "Suvarnabhumi Airport (BKK) - 28km (approx. 30-45 min by taxi). Don Mueang (DMK) - 20km.",
            publicTransport: "Free shuttle to BTS Nana Skytrain & Sukhumvit MRT station. Excellent connectivity to the city.",
            nearbyPlaces: "Terminal 21 Shopping Mall, Benjakitti Park, Sukhumvit Soi 11 Nightlife, Erawan Shrine.",
        },
        update: {
            name: "RADISSON SUITES BANGKOK SUKHUMVIT",
            description: "An upscale hotel located in the bustling Sukhumvit area, offering spacious suites and world-class amenities.",
            location: "23/2-3 Sukhumvit 13, Khlong Toei Nuea, Watthana, Bangkok 10110, Thailand",
            closestAirport: "Suvarnabhumi Airport (BKK) - 28km (approx. 30-45 min by taxi). Don Mueang (DMK) - 20km.",
            publicTransport: "Free shuttle to BTS Nana Skytrain & Sukhumvit MRT station. Excellent connectivity to the city.",
            nearbyPlaces: "Terminal 21 Shopping Mall, Benjakitti Park, Sukhumvit Soi 11 Nightlife, Erawan Shrine.",
        }
    });

    console.log("Venue updated:", venue.name);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
