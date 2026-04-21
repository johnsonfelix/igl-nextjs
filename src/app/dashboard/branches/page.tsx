import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/app/lib/prisma";
import BranchManager from "./BranchManager";
import { getBranches } from "./actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function BranchesPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) {
    redirect('/company/login');
  }

  let company = await prisma.company.findFirst({
    where: { userId },
  });

  // If no direct company found, check if user is a branch user
  if (!company) {
    const branch = await prisma.branch.findFirst({
      where: { userId },
      include: { company: true }
    });
    
    // Branch users cannot manage branches, so redirect them
    if (branch) {
      redirect('/dashboard');
    }
  }

  if (!company) {
    redirect('/dashboard');
  }

  const result = await getBranches(company.id);
  const initialBranches = result.success ? result.data : [];

  return (
    <main className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto px-4 py-8 lg:py-12">
        {/* Header Section */}
        <div className="mb-10">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-[#004aad] hover:underline mb-4 font-medium">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Manage Branches</h1>
              <p className="text-gray-500 mt-2 text-lg">Add and organize your company's regional offices and locations.</p>
            </div>
          </div>
        </div>

        <BranchManager companyId={company.id} initialBranches={initialBranches as any} />
      </div>
    </main>
  );
}
