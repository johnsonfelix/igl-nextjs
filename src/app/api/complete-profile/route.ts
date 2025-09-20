import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    // FIX: Await the cookies() function to resolve the Promise
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Destructure the 'name' field from the request body
    const { companyId, name, website, established, size, about, address } = await req.json();

    if (!companyId) {
      return NextResponse.json({ error: "Company ID is required." }, { status: 400 });
    }
    
    if (!name) {
        return NextResponse.json({ error: "User name is required." }, { status: 400 });
    }

    // Security Check: Verify ownership of the company profile
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        userId: userId, // Check against the userId from the cookie
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Forbidden. You do not own this company profile." }, { status: 403 });
    }

    // Use a transaction for atomic updates to both Company and User models
    const [updatedCompany, updatedUser] = await prisma.$transaction([
      // 1. Update the Company model
      prisma.company.update({
        where: { id: company.id },
        data: {
          website: website || null,
          established: established ? new Date(established) : null,
          size: size || null,
          about: about || null,
          location: { update: { address: address || "" } },
        },
      }),
      // 2. Update the User model with the new name and completion status
      prisma.user.update({
        where: { id: userId },
        data: {
          name: name, // Save the user's name
          isCompleted: true,
        },
      }),
    ]);

    return NextResponse.json({ success: true, company: updatedCompany, user: updatedUser });

  } catch (error) {
    console.error("Profile completion error:", error);
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }
}
