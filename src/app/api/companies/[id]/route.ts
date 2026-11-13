import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/app/lib/prisma";
import { cookies } from "next/headers";

function isPaidCompany(company: any): boolean {
  if (!company) return false;

  
  const planName = company.membershipPlan?.name?.trim().toLowerCase() || "";
  if (planName && !planName.includes("free") && planName !== "none") {
    return true;
  }

  
  const purchased = company.purchasedMembership?.trim().toLowerCase() || "";
  if (purchased && !purchased.includes("free") && purchased !== "none") {
    return true;
  }

  
  const mType = company.memberType?.trim().toLowerCase() || "";
  if (mType && mType !== "free" && mType !== "unpaid" && mType !== "none") {
    return true;
  }

  
  if (company.membershipExpiresAt) {
    const expires = new Date(company.membershipExpiresAt);
    if (!isNaN(expires.getTime()) && expires > new Date()) {
      return true;
    }
  }

  
  if (company.membershipPlanId) {
    return true;
  }

  return false;
}


export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const company = await prisma.company.findUnique({
      where: { id },
      include: { media: true, location: true, user: true, services: true, membershipPlan: true },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    let canView = false;

    if (userId) {
      
      const userObj = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true }
      });

      if (userObj?.role === 'ADMIN' || userObj?.role === 'MODERATOR') {
        canView = true;
      } else if (company.userId === userId) {
        canView = true;
      } else {
        
        let requestor = await prisma.company.findFirst({
          where: { userId },
          include: { membershipPlan: true }
        });

        if (!requestor) {
          const branch = await prisma.branch.findFirst({
            where: { userId },
            include: { company: { include: { membershipPlan: true } } }
          });
          if (branch?.company) {
            requestor = branch.company;
          }
        }

        if (requestor && isPaidCompany(requestor)) {
          canView = true;
        }
      }
    }

    if (!canView && company.location) {
      company.location.phone = null;
      company.location.fax = null;
      company.location.email = null;
      company.location.mobile = null;
      company.location.skype = null;
      company.location.wechat = null;
      company.location.contactPerson = null;
      company.location.contactPersonDesignation = null;
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error('Error fetching company:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: companyId } = await params;
  if (!companyId) {
    return NextResponse.json({ error: 'Missing company id' }, { status: 400 });
  }

  
  let userId: string | undefined;
  const cookieStore = await cookies();
  userId = cookieStore.get("userId")?.value;

  if (!userId) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const { verify } = require("jsonwebtoken");
        const secret = process.env.JWT_SECRET;
        if (secret) {
          const decoded: any = verify(token, secret);
          userId = decoded.userId;
        }
      } catch (err) {
        console.error("JWT verification failed in PUT /api/companies/[id]:", err);
      }
    }
  }

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  
  const owningCompany = await prisma.company.findFirst({
    where: { id: companyId, userId: userId }
  });

  if (!owningCompany) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body || typeof body.name !== 'string' || body.name.trim().length === 0) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const {
    name,
    website = null,
    established = null,
    size = null,
    about = null,
    location = null,
  } = body;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const updatedCompany = await tx.company.update({
        where: { id: companyId },
        data: {
          name,
          website: website || null,
          established: established || null,
          size: size || null,
          about: about || null,
        },
      });

      if (location) {
        const locAddress = location.address || "N/A";
        const locCity = location.city || "N/A";
        const locCountry = location.country || "N/A";

        if (location.id) {
          await tx.location.upsert({
            where: { id: location.id },
            create: {
              address: locAddress,
              city: locCity,
              state: location.state ?? null,
              country: locCountry,
              zipCode: location.zipCode ?? null,
              phone: location.phone ?? null,
              fax: location.fax ?? null,
              email: location.email ?? null,
              companyId: companyId,
            },
            update: {
              address: locAddress,
              city: locCity,
              state: location.state ?? null,
              country: locCountry,
              zipCode: location.zipCode ?? null,
              phone: location.phone ?? null,
              fax: location.fax ?? null,
              email: location.email ?? null,
            },
          });
        } else {
          const existing = await tx.location.findFirst({ where: { companyId } });
          if (existing) {
            await tx.location.update({
              where: { id: existing.id },
              data: {
                address: locAddress,
                city: locCity,
                state: location.state ?? null,
                country: locCountry,
                zipCode: location.zipCode ?? null,
                phone: location.phone ?? null,
                fax: location.fax ?? null,
                email: location.email ?? null,
              },
            });
          } else {
            await tx.location.create({
              data: {
                address: locAddress,
                city: locCity,
                state: location.state ?? null,
                country: locCountry,
                zipCode: location.zipCode ?? null,
                phone: location.phone ?? null,
                fax: location.fax ?? null,
                email: location.email ?? null,
                companyId: companyId,
              },
            });
          }
        }
      }

      const fresh = await tx.company.findUnique({
        where: { id: companyId },
        include: { location: true, media: true },
      });

      return fresh;
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('PUT /api/companies/[id] error:', err);
    if (err?.code === 'P2025') {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
