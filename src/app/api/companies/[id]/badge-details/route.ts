// File: D:\\Projects\\Logistics\\web\\backend-api\\src\\app\\api\\companies\\[id]\\badge-details\\route.ts

import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma'; // Adjust this path to your actual prisma client location

/**
 * GET /api/companies/[id]/badge-details
 * Fetches details for a specific company to display on a digital badge.
 */
export async function GET(
  request: Request,
  // Change 1: The 'params' object is now wrapped in a Promise.
  context: { params: Promise<{ id: string }> }
) {
  // Change 2: You must 'await' the params to access the 'id'.
  const { id: companyId } = await context.params;

  if (!companyId) {
    return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
  }

  try {
    const company = await prisma.company.findUnique({
      where: {
        id: companyId,
      },
      select: {
        id: true,
        memberId: true, // For the QR code data
        name: true, // Company Name
        memberType: true, // Could be used as a role/designation if applicable
        website: true, // Example of other details
        location: { // To get address/country
          select: {
            city: true,
            country: true,
          }
        },
        user: { // Assuming a user is linked to the company and holds personal details
          select: {
            name: true,
          }
        },
        media: {
          where: { type: 'LOGO' },
          select: { url: true },
          take: 1, // Get one logo
        }
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Format the response for the Flutter app
    const badgeDetails = {
      companyId: company.id,
      memberId: company.memberId,
      companyName: company.name,
      personName: company.user?.name || 'N/A', // Placeholder if no user or name
      designation: company.memberType || 'N/A', // Using memberType as placeholder for designation
      companyLogoUrl: company.media?.[0]?.url || null, // Assuming you have a logo for the company
      country: company.location?.country || null,
      city: company.location?.city || null,
      profileImageUrl: null, // Placeholder: You'd fetch this from your User model if it exists
    };

    return NextResponse.json(badgeDetails, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch badge details:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching badge details.' },
      { status: 500 }
    );
  }
}
