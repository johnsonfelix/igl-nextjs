// app/dashboard/page.tsx

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/app/lib/prisma";
import { DUMMY_COMPANY_NAMES } from '@/lib/constants';
import CompleteProfileButton from "@/app/components/CompleteProfileButton";
import OrdersTable from "@/app/dashboard/OrdersTable";
import MeetingRequestSection from "@/app/dashboard/MeetingRequestSection";
import { User, Building2, Package, Activity, AlertCircle, ShieldCheck, Tag, ShoppingBag } from "lucide-react";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) {
    redirect('/company/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="bg-red-50 text-red-600 p-6 rounded-lg text-center">
          Error: User not found. Please try logging in again.
        </div>
      </div>
    );
  }

  const company = await prisma.company.findFirst({
    where: { userId: user.id },
    include: { membershipPlan: true, location: true }
  });

  if (!company) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <h2 className="text-xl font-bold text-yellow-800 mb-2">Company Profile Missing</h2>
          <p className="text-yellow-700">It seems your account does not have a linked company profile.</p>
        </div>
      </div>
    )
  }

  // Fetch Orders
  const rawOrders = await prisma.purchaseOrder.findMany({
    where: { companyId: company.id },
    include: {
      items: true,
      event: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Attach the full ManualInvoice to each order (so dashboard invoice = admin invoice)
  const orders = await Promise.all(rawOrders.map(async (order) => {
    const details = order.additionalDetails as any;
    const invoiceId = details?.invoiceId;
    let manualInvoice = null;
    if (invoiceId) {
      manualInvoice = await prisma.manualInvoice.findUnique({
        where: { id: invoiceId },
        select: {
          invoiceNumber: true,
          date: true,
          currency: true,
          totalAmount: true,
          customerDetails: true,
          items: true,
        }
      });
    }
    return { ...order, manualInvoice: manualInvoice as any };
  }));

  // Determine if the company is eligible to send meeting requests
  // They are eligible if they have ANY completed purchase order OR if they are one of the dummy companies
  const dummyNames = DUMMY_COMPANY_NAMES;

  const isEligibleForMeetings =
    orders.some(o => o.status === 'COMPLETED') ||
    dummyNames.some(name => company.name.toLowerCase().includes(name.toLowerCase().trim()));

  const conferenceTickets: { eventId: string; eventName: string }[] = [];

  if (isEligibleForMeetings) {
    // Fetch all events that have meeting slots
    const eventsWithSlots = await prisma.event.findMany({
      where: {
        meetingSlots: { some: {} }
      },
      select: { id: true, name: true }
    });

    for (const e of eventsWithSlots) {
      conferenceTickets.push({ eventId: e.id, eventName: e.name });
    }

  }

  return (
    <main className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto px-4 py-8 lg:py-12">
        {/* Header Section */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-2 text-lg">Welcome back, <span className="text-[#004aad] font-semibold">{user.name || 'Partner'}</span></p>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border flex items-center gap-2 text-sm text-gray-600">
            <Building2 className="w-4 h-4 text-[#004aad]" />
            {company.name}
          </div>
        </div>

        {/* Action Required Banner */}
        {!user.isCompleted && (
          <div className="mb-8 p-6 bg-blue-50 border border-blue-100 rounded-xl shadow-sm flex flex-col md:flex-row items-start md:items-center gap-6 animate-fadeIn">
            <div className="p-3 bg-blue-100 rounded-full text-blue-600">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-blue-900 mb-1">
                Complete Your Profile
              </h3>
              <p className="text-blue-700">
                Unlock full access to the network by finalizing your company details.
              </p>
            </div>
            <div className="shrink-0">
              <CompleteProfileButton companyId={company.id} />
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Membership Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl bg-purple-50`}>
                <ShieldCheck className={`w-6 h-6 text-purple-600`} />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Current Plan</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {company.membershipPlan?.name || company.purchasedMembership || company.memberType || "Free Member"}
              </div>
              <div className="space-y-1 mt-2">
                {company.membershipPlan?.paymentProtection && (
                  <div className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded inline-block mr-1">
                    🛡️ {company.membershipPlan.paymentProtection}
                  </div>
                )}
                {(company.membershipPlan?.discountPercentage ?? 0) > 0 && (
                  <div className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded inline-block">
                    🏷️ {company.membershipPlan?.discountPercentage}% Off
                  </div>
                )}
              </div>
            </div>
          </div>

          {[
            { label: "Total Orders", value: orders.length.toString(), icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Pending Inquiries", value: "0", icon: Package, color: "text-orange-600", bg: "bg-orange-50" },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Overview</span>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Meeting Requests Section */}
        {conferenceTickets.length > 0 && (
          <div className="mb-12">
            <MeetingRequestSection companyId={company.id} conferenceTickets={conferenceTickets} />
          </div>
        )}

        {/* Orders Section */}
        <div className="mb-12">
          <OrdersTable
            orders={orders}
            companyName={company.name}
            companyEmail={user.email}
            companyAddress={[company?.location?.address, company?.location?.city, company?.location?.country].filter(Boolean).join(", ") || "Address not available"}
            designation={company.designation || company.location?.contactPersonDesignation || ""}
            memberId={company.memberId || ""}
            phoneNumber={company.location?.phone || ""}
            postalCode={company.location?.zipCode || ""}
          />
        </div>

        {/* Recent Activity / Placeholder Area */}
        {/* <div className="bg-white rounded-2xl shadow-sm border p-8 min-h-[400px]">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h3>
          <div className="flex flex-col items-center justify-center h-64 text-center text-gray-400">
            <div className="bg-gray-50 p-6 rounded-full mb-4">
              <Activity className="w-8 h-8 opacity-50" />
            </div>
            <p>No recent activity to show.</p>
            <p className="text-sm">Start by exploring the directory or updating your services.</p>
          </div>
        </div> */}
      </div>
    </main>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg>
  )
}
