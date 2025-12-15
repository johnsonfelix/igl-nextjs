import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const plans = [
    {
        name: 'Free',
        slug: 'free',
        price: 0,
        description: 'No Fee',
        features: [
            'Register and post inquiries on the IGLA platform'
        ]
    },
    {
        name: 'Silver',
        slug: 'silver',
        price: 900,
        description: 'USD 900 / year',
        features: [
            'Coverage up to USD 8,000',
            'Display company profile with certifications',
            'Full access to member and customer database',
            'Access to IGLA Website/App to post and receive inquiries/quotes',
            'One-to-one exclusive manual customer service',
            'Eligible to purchase & participate in IGLA official activities, advertising, and promotion services'
        ]
    },
    {
        name: 'Gold',
        slug: 'gold',
        price: 1500,
        description: 'USD 1,500 / year',
        features: [
            'Coverage up to USD 12,000',
            'All Silver features',
            '10% discount on: Promotional activities, Conference participation, Advertising and sponsorship',
            'Promote up to 2 posts/month',
            'Featured in newsletters and monthly articles'
        ]
    },
    {
        name: 'Platinum',
        slug: 'platinum',
        price: 2500,
        description: 'USD 2,500 / year',
        features: [
            'Coverage up to USD 15,000',
            'All Gold features',
            '20% discount on: Promotional activities, Conference participation, Advertising and sponsorship',
            'Promote up to 4 posts/month',
            'Ranked among top featured members'
        ]
    },
    {
        name: 'Diamond',
        slug: 'diamond',
        price: 10000,
        description: 'USD 10,000 (One-Time Fee)',
        features: [
            'Coverage up to USD 25,000',
            'All Platinum features',
            '30% lifetime discount on: Promotional activities, Conference participation, Advertising and sponsorship',
            'Promote up to 6 posts/month',
            'Lifetime Membership status',
            'Top-ranked and premium visibility among IGLA members'
        ]
    }
];

async function main() {
    console.log('Start upserting membership plans...');
    for (const plan of plans) {
        const upserted = await prisma.membershipPlan.upsert({
            where: { name: plan.name },
            update: {
                slug: plan.slug,
                price: plan.price,
                description: plan.description,
                features: plan.features,
            },
            create: {
                name: plan.name,
                slug: plan.slug,
                price: plan.price,
                description: plan.description,
                features: plan.features,
            },
        });
        console.log(`Upserted plan: ${upserted.name}`);
    }
    console.log('Done.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
