// app/become-member/page.tsx
import React from "react";
import BecomeMemberClient from "./BecomeMemberClient";
import prisma from "@/app/lib/prisma";

export default async function Page() {
  const plans = await prisma.membershipPlan.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      description: true,
      thumbnail: true,
      paymentProtection: true,
      discountPercentage: true,
      features: true,
    },
  });

  return (
    <main className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-extrabold mb-6">Become a Member</h1>
      <BecomeMemberClient plans={plans} />
    </main>
  );
}
