

import MembershipManager from './components/MembershipManager';
import prisma from '@/app/lib/prisma';
import { MembershipPlan } from '@prisma/client';


async function getMembershipPlans(): Promise<MembershipPlan[]> {
  try {
    
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


export default async function AdminMembershipPage() {
  
  const plans = await getMembershipPlans();

  return (
    <div className="container mx-auto p-8">
      {}
      {}
      <MembershipManager initialPlans={plans} />
    </div>
  );
}
