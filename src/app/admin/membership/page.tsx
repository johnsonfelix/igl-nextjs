// app/admin/memberships/page.tsx

import MembershipManager from './components/MembershipManager';
import prisma from '@/app/lib/prisma';
import { MembershipPlan } from '@prisma/client';

// Fetch data directly from the database on the server
async function getMembershipPlans(): Promise<MembershipPlan[]> {
  try {
    // No fetch! This is faster and simpler.
    const plans = await prisma.membershipPlan.findMany({
      orderBy: {
        price: 'asc',
      },
    });
    return plans;
  } catch (error) {
    console.error("Failed to fetch plans from database:", error);
    return []; 
  }
}

// Your page component remains a Server Component
export default async function AdminMembershipPage() {
  // The data is fetched on the server before the page is sent to the client
  const plans = await getMembershipPlans();

  return (
    <div className="container mx-auto p-8">
      {/* <h1 className="text-3xl font-bold mb-6">Manage Membership Plans</h1> */}
      {/* The fetched data is passed as a prop to the client component */}
      <MembershipManager initialPlans={plans} />
    </div>
  );
}
