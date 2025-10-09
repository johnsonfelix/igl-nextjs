// app/api/register/route.ts
import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";
import { hash } from "bcryptjs";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const {
      fullName,
      phone,
      email,
      password,
      companyName,
      sector,
      city,
      state,
      country,
      address = "",
      zipcode = "",
      website = "",
      agreeToTerms,
    } = data;

    // Basic validation
    if (!fullName || !email || !password || !phone) {
      return NextResponse.json({ error: "Missing required user fields" }, { status: 400 });
    }

    if (!companyName || !sector || !city || !country) {
      return NextResponse.json({ error: "Missing required company fields" }, { status: 400 });
    }

    if (!agreeToTerms) {
      return NextResponse.json({ error: "You must agree to the terms." }, { status: 400 });
    }

    // Check existing by email OR phone
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { phone: phone },
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json({ error: "User with this email or phone already exists." }, { status: 400 });
    }

    const hashedPassword = await hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: "USER",
        name: fullName,
        phone,
      },
    });

    // Create company and associate with user
    const company = await prisma.company.create({
      data: {
        name: companyName,
        sector,
        memberId: `MEM-${Math.floor(100000 + Math.random() * 900000)}`,
        memberType: "FREE",
        memberSince: new Date(),
        userId: user.id,
        website: website || undefined,
        zipCode: zipcode || undefined,
        location: {
          create: {
            city,
            state,
            country,
            address: address || "",
          },
        },
      },
    });

    return NextResponse.json({ success: true, userId: user.id, companyId: company.id }, { status: 201 });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "An error occurred during registration" }, { status: 500 });
  }
}
