// app/dashboard/page.tsx

import { cookies } from "next/headers";
import { redirect } from "next/navigation"; // Good practice for redirection
import prisma from "@/app/lib/prisma";
import CompleteProfileButton from "@/app/components/CompleteProfileButton";

export default async function DashboardPage() {
  // --- THIS IS THE FIX ---
  // Await the cookies() function to get the actual cookie store
  const cookieStore = await cookies();
  // --- END OF FIX ---
  
  const userId = cookieStore.get('userId')?.value;

  if (!userId) {
    // If no userId cookie, redirect to the login page
    redirect('/login');
  }

  // Fetch the full user model from the database using the userId
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    // This handles if the cookie is invalid or the user was deleted
    // You could also clear the cookie here before redirecting
    return <div>Error: User not found. Please try logging in again.</div>;
  }

  // Find the primary company associated with this user
  const company = await prisma.company.findFirst({
    where: { userId: user.id },
  });

  if (!company) {
    return <div>Error: Associated company data could not be loaded.</div>;
  }

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-2 text-lg">Welcome back!</p>
      
      {/* Conditionally render based on the 'isCompleted' flag */}
      {!user.isCompleted && (
        <div className="mt-6 p-4 border-l-4 border-blue-500 bg-blue-50">
          <div className="ml-3">
            <p className="text-md font-semibold text-blue-800">
              Your profile is almost ready!
            </p>
            <div className="mt-4">
              <CompleteProfileButton companyId={company.id} />
            </div>
          </div>
        </div>
      )}

      {/* ... Rest of your dashboard content ... */}
    </main>
  );
}
