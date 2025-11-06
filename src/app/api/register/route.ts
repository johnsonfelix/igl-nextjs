// app/api/register/route.ts
import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";

/**
 * Registration endpoint
 * - Validates input
 * - Creates user and company inside a transaction (atomic)
 * - Returns specific errors for common Prisma failures (unique constraint)
 */

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
      logoUrl,
    } = data;

    // --- Basic validation ---
    if (!fullName || !email || !password || !phone) {
      return NextResponse.json({ error: "Missing required user fields" }, { status: 400 });
    }

    if (!companyName || !sector || !city || !country) {
      return NextResponse.json({ error: "Missing required company fields" }, { status: 400 });
    }

    if (!agreeToTerms) {
      return NextResponse.json({ error: "You must agree to the terms." }, { status: 400 });
    }

    // basic email format check
    const emailTrim = String(email).trim();
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(emailTrim)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // basic phone check
    const phoneTrim = String(phone).trim();
    if (!/^[\d\+\-\s]{6,20}$/.test(phoneTrim)) {
      return NextResponse.json({ error: "Invalid phone format" }, { status: 400 });
    }

    // --- Check existing by email OR phone (avoid duplicate accounts) ---
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: emailTrim }, { phone: phoneTrim }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email or phone already exists." },
        { status: 409 }
      );
    }

    const hashedPassword = await hash(String(password), 10);

    // Use a transaction to ensure both user and company are created atomically.
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: emailTrim,
          password: hashedPassword,
          role: "USER",
          name: fullName,
          phone: phoneTrim,
        },
      });

      const company = await tx.company.create({
        data: {
          name: companyName,
          sector,
          memberId: `MEM-${Math.floor(100000 + Math.random() * 900000)}`,
          memberType: "FREE",
          memberSince: new Date(),
          userId: user.id,
          website: website || undefined,
          zipCode: zipcode || undefined,
          logoUrl: logoUrl || undefined,
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

      return { user, company };
    });

    return NextResponse.json({ success: true, userId: result.user.id, companyId: result.company.id }, { status: 201 });
  } catch (error: any) {
    // Better logging for debugging
    console.error("Register error detail:", {
      message: error?.message,
      stack: error?.stack,
      code: error?.code ?? null,
      meta: error?.meta ?? null,
    });

    // Prisma known errors (unique constraint, etc)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2002 is a unique constraint violation
      if (error.code === "P2002") {
        // meta.target is the field(s) that caused the issue
        const target = (error.meta as any)?.target ?? error.meta;
        return NextResponse.json(
          { error: `Unique constraint failed: ${JSON.stringify(target)}` },
          { status: 409 }
        );
      }
      // Other Prisma known errors
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 });
    }

    // Generic fallback
    return NextResponse.json({ error: "An error occurred during registration" }, { status: 500 });
  }
}
