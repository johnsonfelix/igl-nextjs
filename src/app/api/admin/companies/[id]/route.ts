import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// GET single company for Admin (includes detailed info)
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const company = await prisma.company.findUnique({
            where: { id },
            include: {
                location: true,
                media: true,
                services: true,
            },
        });

        if (!company) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        return NextResponse.json(company);
    } catch (error) {
        console.error('Error fetching company:', error);
        return NextResponse.json({ error: 'Failed to fetch company' }, { status: 500 });
    }
}

// UPDATE company
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await request.json();
        const {
            name,
            memberId,
            memberType,
            website,
            logoUrl,
            established,
            about,
            location,
            status,
            isActive,
            isVerified,
            // New fields
            directors,
            designation,
            participationYears,
            newMedia, // Array of strings (URLs) to add
            deleteMediaIds, // Array of strings (IDs) to delete
            purchasedMembership, // <--- Added this
            memberFromYear,
            // New fields for capabilities
            scopeOfBusiness,
            servicesOffered,
        } = body;

        // Location upsert
        let locationUpdate = {};
        if (location) {
            locationUpdate = {
                location: {
                    upsert: {
                        create: {
                            address: location.address || '',
                            city: location.city || '',
                            state: location.state || '',
                            country: location.country || '',
                            zipCode: location.zipCode || '',
                            contactPerson: location.contactPerson || null,
                            mobile: location.mobile || null,
                            skype: location.skype || null,
                            wechat: location.wechat || null,
                            email: location.email || null,
                        },
                        update: {
                            address: location.address || '',
                            city: location.city || '',
                            state: location.state || '',
                            country: location.country || '',
                            zipCode: location.zipCode || '',
                            contactPerson: location.contactPerson || null,
                            mobile: location.mobile || null,
                            skype: location.skype || null,
                            wechat: location.wechat || null,
                            email: location.email || null,
                        }
                    }
                }
            };
        }

        // Media transactions (create new, delete old)
        // We can do this via nested writes or separate queries. 
        // Nested is cleaner but 'delete' requires knowing IDs.

        const mediaCreates = (newMedia && Array.isArray(newMedia) && newMedia.length > 0)
            ? newMedia.map((url: string) => ({ url, type: 'IMAGE' }))
            : [];

        const mediaDeletes = (deleteMediaIds && Array.isArray(deleteMediaIds) && deleteMediaIds.length > 0)
            ? { id: { in: deleteMediaIds } }
            : undefined;

        // Construct the update data
        const updateData: any = {
            name,
            memberId,
            memberType,
            website,
            logoUrl,
            established: established ? new Date(established) : undefined,
            about,
            status,
            isActive,
            isVerified,
            directors,
            designation,
            participationYears,
            purchasedMembership, // <--- Added this
            memberFromYear, // New Int field
            scopeOfBusiness,
            servicesOffered,
            ...locationUpdate,
            media: {
                create: mediaCreates,
            }
        };

        // Changing established to null if explicitly cleared? 
        // The previous implementation handles undefined.

        // If we have deletes, we might need a separate delete op or use 'deleteMany' in nested update if supported for collection relation
        // DeleteMany is supported for relations.

        if (mediaDeletes) {
            updateData.media.deleteMany = mediaDeletes;
        }

        const updatedCompany = await prisma.company.update({
            where: { id },
            data: updateData,
            include: {
                location: true,
                media: true
            }
        });

        return NextResponse.json(updatedCompany);
    } catch (error) {
        console.error('Error updating company:', error);
        return NextResponse.json({ error: 'Failed to update company' }, { status: 500 });
    }
}

// DELETE company
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        await prisma.company.delete({
            where: { id },
        });
        return NextResponse.json({ message: 'Company deleted successfully' });
    } catch (error) {
        console.error('Error deleting company:', error);
        return NextResponse.json({ error: 'Failed to delete company' }, { status: 500 });
    }
}
