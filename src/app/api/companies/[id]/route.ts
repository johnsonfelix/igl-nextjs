// app/api/companies/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
// Prefer a shared prisma instance via "@/app/lib/prisma" in real apps
const prisma = new PrismaClient();

// GET a single company by ID
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const company = await prisma.company.findUnique({
      where: { id },
      include: { media: true, location: true, user: true, services: true },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error('Error fetching company:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT (update) a company by ID
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: companyId } = await params;
  if (!companyId) {
    return NextResponse.json({ error: 'Missing company id' }, { status: 400 });
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
        if (location.id) {
          await tx.location.upsert({
            where: { id: location.id },
            create: {
              address: location.address ?? null,
              city: location.city ?? null,
              state: location.state ?? null,
              country: location.country ?? null,
              zipCode: location.zipCode ?? null,
              phone: location.phone ?? null,
              fax: location.fax ?? null,
              email: location.email ?? null,
              companyId: companyId,
            },
            update: {
              address: location.address ?? null,
              city: location.city ?? null,
              state: location.state ?? null,
              country: location.country ?? null,
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
                address: location.address ?? null,
                city: location.city ?? null,
                state: location.state ?? null,
                country: location.country ?? null,
                zipCode: location.zipCode ?? null,
                phone: location.phone ?? null,
                fax: location.fax ?? null,
                email: location.email ?? null,
              },
            });
          } else {
            await tx.location.create({
              data: {
                address: location.address ?? null,
                city: location.city ?? null,
                state: location.state ?? null,
                country: location.country ?? null,
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
