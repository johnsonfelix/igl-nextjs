const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Creating test company...');
    const company = await prisma.company.create({
        data: {
            name: 'DeleteTest_' + Date.now(),
            memberId: 'DEL_' + Date.now(),
            location: {
                create: {
                    address: '123 Test St',
                    city: 'Test City',
                    country: 'Test Country'
                }
            },
            inquiry: {
                create: {
                    from: 'A', to: 'B', commodity: 'C', shipmentMode: 'AIR', cargoType: 'D'
                }
            }
        }
    });
    console.log('Created company:', company.id);

    console.log('Deleting company...');
    try {
        await prisma.company.delete({
            where: { id: company.id }
        });
        console.log('Deleted successfully.');
    } catch (e) {
        console.error('Failed to delete:', e.message);
        process.exit(1);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
