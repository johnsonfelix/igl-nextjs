// app/api/register/route.ts
import prisma from "@/app/lib/prisma"
import { NextResponse } from "next/server"
import { hash } from "bcryptjs"

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const { name, sector, city, country, email, password, agreeToTerms } = data

    if (!email || !password || !name || !sector || !city || !country)
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })

    if (!agreeToTerms)
      return NextResponse.json({ error: "You must agree to the terms." }, { status: 400 })

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists." }, { status: 400 })
    }

    const hashedPassword = await hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: "USER"
      }
    })

    const company = await prisma.company.create({
      data: {
        name,
        sector,
        memberId: `MEM-${Math.floor(100000 + Math.random() * 900000)}`, // Custom memberId format
        memberType: "FREE",
        memberSince: new Date(),
        userId: user.id,
        location: {
          create: {
            city,
            country,
            address: "", // empty for now
          }
        }
      }
    })

    return NextResponse.json({ success: true, companyId: company.id })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "An error occurred" }, { status: 500 })
  }
}
