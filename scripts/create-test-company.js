const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const company = await prisma.company.create({
        data: {
            name: 'FeatureTest Corp',
            memberId: 'FTC-' + Date.now(),
            memberType: 'IGLA Elite',
            about: 'We offer comprehensive logistics services including Warehousing and Customs Brokerage.',
            established: new Date('2010-01-01'),
            memberSince: new Date('2020-01-01'),
            isVerified: true,
            directors: 'John Doe, Jane Smith',
            participationYears: '2022 / 2023 / 2024',
            size: '50-100',
            website: 'www.featuretest.com',
            location: {
                create: {
                    address: '123 Test Blvd',
                    city: 'Testville',
                    state: 'TS',
                    country: 'Testland',
                    zipCode: '12345',
                    contactPerson: 'Alice Manager',
                    mobile: '+1-555-0199',
                    email: 'alice@featuretest.com',
                    skype: 'alice.skype',
                    wechat: 'alice.wechat'
                }
            },
            services: {
                create: [
                    { type: 'Warehousing' },
                    { type: 'Customs Brokerage' }
                ]
            }
        }
    });
    console.log(company.id);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
