import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            name,
            memberId, // unique
            memberType,
            website,
            logoUrl,
            established, // string or date
            about,
            location, // { address, city, ... }
            status,
            // New fields
            directors,
            participationYears,
            scopeOfBusiness,
            servicesOffered,
            media, // Array of strings (URLs) for gallery
        } = body;

        // Basic validation
        if (!name || !memberId) {
            return NextResponse.json({ error: 'Name and Member ID are required' }, { status: 400 });
        }

        // Check if memberId exists
        const existing = await prisma.company.findUnique({
            where: { memberId },
        });
        if (existing) {
            return NextResponse.json({ error: 'Member ID already exists' }, { status: 409 });
        }

        // Handle Location creation if provided
        let locationData = {};
        if (location) {
            locationData = {
                location: {
                    create: {
                        address: location.address || '',
                        city: location.city || '',
                        state: location.state || '',
                        country: location.country || '',
                        zipCode: location.zipCode || '',
                        // New location fields
                        contactPerson: location.contactPerson || null,
                        contactPersonDesignation: location.designation || null,
                        email: location.email || null, // Mapping email from form to Location.email
                        mobile: location.mobile || null,
                        skype: location.skype || null,
                        wechat: location.wechat || null,
                    }
                }
            };
        }

        // Handle Media creation
        let mediaData = {};
        if (media && Array.isArray(media) && media.length > 0) {
            mediaData = {
                media: {
                    create: media.map((url: string) => ({
                        url,
                        type: 'IMAGE', // Default to IMAGE for now
                    }))
                }
            };
        }

        // Convert established to Date if provided
        const establishedDate = established ? new Date(established) : null;

        const newCompany = await prisma.company.create({
            data: {
                name,
                memberId,
                memberType,
                website,
                logoUrl,
                established: establishedDate,
                about,
                status: status || 'LIVE',
                isActive: true,
                directors,
                participationYears,
                scopeOfBusiness,
                servicesOffered,
                ...locationData,
                ...mediaData,
            },
            include: {
                location: true,
                media: true
            }
        });

        return NextResponse.json(newCompany, { status: 201 });
    } catch (error) {
        console.error('Error creating company:', error);
        return NextResponse.json({ error: 'Failed to create company' }, { status: 500 });
    }
}
