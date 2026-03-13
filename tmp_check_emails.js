const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Checking for potentially invalid emails that could cause SES bounces...");
    const users = await prisma.user.findMany({ select: { email: true }});
    const locations = await prisma.location.findMany({ select: { email: true }});

    const allEmails = [
        ...users.map(u => u.email),
        ...locations.map(l => l.email)
    ].filter(e => e); // remove null/undefined

    const invalidOrDummy = allEmails.filter(e => {
        const lower = e.toLowerCase();
        return !lower.includes('@') || 
            lower.includes('test') || 
            lower.includes('example') || 
            lower.includes('fake') || 
            lower.includes('dummy') ||
            lower.includes('123') ||
            !lower.includes('.');
    });

    console.log(`Total emails found: ${allEmails.length}`);
    console.log(`Potentially invalid/dummy emails found: ${invalidOrDummy.length}`);
    console.log("Samples of invalid/dummy emails:", invalidOrDummy.slice(0, 10));

    // Group by domain to see if there are many dummy domains.
    const domains = {};
    for (const email of allEmails) {
        let domain = email.split('@')[1];
        if (domain) {
            domain = domain.toLowerCase();
            domains[domain] = (domains[domain] || 0) + 1;
        }
    }

    const sortedDomains = Object.entries(domains)
        .sort((a, b) => b[1] - a[1]) // Sort descending by count
        .slice(0, 15);
    
    console.log("\nTop 15 email domains:");
    for (const [domain, count] of sortedDomains) {
        console.log(`- ${domain}: ${count}`);
    }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
