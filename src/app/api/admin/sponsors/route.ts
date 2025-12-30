// app/api/admin/sponsors/route.ts
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { uploadBufferToS3 } from "@/app/lib/s3";

/**
 * extractKeyFromUrl: try to extract the S3 key portion from a public URL or custom domain.
 */
function extractKeyFromUrl(urlStr?: string | null): string | null {
  if (!urlStr) return null;
  try {
    const u = new URL(urlStr);
    let path = u.pathname || "";
    if (path.startsWith("/")) path = path.slice(1);
    const BUCKET = process.env.NEXT_PUBLIC_S3_BUCKET;
    if (BUCKET && path.startsWith(`${BUCKET}/`)) path = path.slice(BUCKET.length + 1);
    if (path) return decodeURIComponent(path);
  } catch (_) {
    // continue to regex fallback
  }

  const regex = /(sponsors\/[\w\-+.%,()~!$'@=&;\/]+)$/;
  const m = urlStr.match(regex);
  if (m && m[1]) return decodeURIComponent(m[1]);
  return null;
}

// GET all sponsors
export async function GET() {
  try {
    const sponsors = await prisma.sponsorType.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json(sponsors);
  } catch (error) {
    console.error("Error fetching sponsors:", error);
    return NextResponse.json({ error: "Failed to fetch sponsors", details: String(error) }, { status: 500 });
  }
}

// POST create new sponsor
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let name: string | undefined;
    let description: string | undefined;
    let price: string | number | undefined;
    let imageUrl: string | undefined;
    let imageKey: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await (req as Request).formData();
      name = (formData.get("name") as string) ?? undefined;
      description = (formData.get("description") as string) ?? undefined;
      price = (formData.get("price") as string | number) ?? undefined;

      const file = formData.get("image") as File | null;
      if (file && file.size && typeof file.arrayBuffer === "function") {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const filename = (file as any).name || `upload-${Date.now()}.bin`;
        const contentType = (file as any).type || "application/octet-stream";

        const { key, publicUrl } = await uploadBufferToS3({
          buffer,
          filename,
          contentType,
        });
        imageUrl = publicUrl;
        imageKey = key;
      } else {
        const imageField = formData.get("imageUrl") as string | null;
        if (imageField) imageUrl = imageField;
        const imageKeyField = formData.get("imageKey") as string | null;
        if (imageKeyField) imageKey = imageKeyField;
      }
    } else {
      const body = await req.json();
      name = body.name;
      description = body.description;
      price = body.price;
      imageUrl = body.image ?? body.imageUrl ?? undefined;
      imageKey = body.imageKey ?? undefined;
    }

    if (!imageKey && imageUrl) {
      const extracted = extractKeyFromUrl(imageUrl);
      if (extracted) imageKey = extracted;
    }

    if (!name || !description || (price === undefined || price === null || price === "")) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const sponsor = await prisma.sponsorType.create({
      data: {
        name,
        description,
        price: parseFloat(String(price)) || 0,
        image: imageUrl || null,
        imageKey: imageKey || null,
      },
    });

    console.info("[SPONSOR_POST] created sponsor id=", sponsor.id, "imageKey=", sponsor.imageKey);
    return NextResponse.json(sponsor, { status: 201 });
  } catch (err) {
    console.error("Error creating sponsor:", err);
    return NextResponse.json({ error: "Failed to create sponsor", details: String(err) }, { status: 500 });
  }
}
