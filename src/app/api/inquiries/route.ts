import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

// export async function POST(req: Request) {
//   try {
//     const {
//       name,
//       email,
//       phone,
//       placeFrom,
//       placeTo,
//       cargoType,
//       transportMode,
//       description,
//     } = await req.json();

//     if (!name || !email || !placeFrom || !placeTo || !cargoType || !transportMode || !description) {
//       return NextResponse.json({ error: "All fields except phone are required." }, { status: 400 });
//     }

//     const inquiry = await prisma.inquiry.create({
//       data: {
//         name,
//         email,
//         phone,
//         placeFrom,
//         placeTo,
//         cargoType,
//         transportMode,
//         description,
//       },
//     });

//     return NextResponse.json(inquiry);
//   } catch (error) {
//     console.error("Error creating inquiry:", error);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }
